import { supabase } from "../../lib/supabase";
import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { exportLessonToGoogleDoc } from "../../lib/googleDocs";
import { exportLessonToGoogleSlides, createGoogleSlidesPresentation } from "../../lib/googleSlides";
import { captureAndDownloadScreenshot } from "../../lib/screenshot";
import { SubjectType, LevelType, AILessonPlan } from "../../types";
import {
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle2,
  FileQuestion,
  Copy,
  Check,
  Bookmark,
  FileText,
  Presentation,
  ExternalLink,
  Camera,
  Search,
  Trash2,
  X,
  FolderHeart,
} from "lucide-react";

interface LessonStudioViewProps {
  onOpenQuizModal: (type: "quiz" | "homework", lessonTitle: string, subject: SubjectType) => void;
}

export const LessonStudioView: React.FC<LessonStudioViewProps> = ({ onOpenQuizModal }) => {
  const { t, language } = useLanguage();
  const { saveAIContent, savedContents, deleteSavedAIContent } = useData();
  const { googleTokens, connectGoogleDocs, connectGoogleSlides } = useAuth();

  // Generator inputs
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState<number>(10);
  const [teachingStyle, setTeachingStyle] = useState("Interactive");
  const [learningGoal, setLearningGoal] = useState("");
  const [subject, setSubject] = useState<SubjectType>("Tajweed");
  const [topic, setTopic] = useState("Rule of Noon Sakinah & Tanween (Izhhar & Idgham)");
  const [level, setLevel] = useState<LevelType>("Beginner");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [explanationLanguage, setExplanationLanguage] = useState("English");
  const [customInstructions, setCustomInstructions] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<AILessonPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Saved Library Modal State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<"all" | "lesson_plan" | "quiz" | "homework">("all");
  const [librarySearch, setLibrarySearch] = useState("");

  // Google Docs & Slides export state
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [createdDocLink, setCreatedDocLink] = useState<string | null>(null);
  const [docStatusMsg, setDocStatusMsg] = useState<string>("");

  const [isExportingSlides, setIsExportingSlides] = useState(false);
  const [createdSlidesLink, setCreatedSlidesLink] = useState<string | null>(null);
  const [slidesStatusMsg, setSlidesStatusMsg] = useState<string>("");

  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotStatusMsg, setScreenshotStatusMsg] = useState<string>("");

  const handleTakeScreenshot = async () => {
    if (!generatedPlan) return;
    setIsCapturingScreenshot(true);
    setScreenshotStatusMsg(
      language === "ar" ? "جارٍ التقاط صورة الدرس..." : "Capturing lesson plan screenshot..."
    );

    try {
      await captureAndDownloadScreenshot("lesson-plan-container", {
        filename: `IslamRoots_Lesson_${topic.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_")}.png`,
        watermarkText: "IslamRoots AI Educator Network • https://islamroots.app",
        onSuccess: () => {
          setScreenshotStatusMsg(
            language === "ar" ? "تم تحميل صورة الدرس بنجاح!" : "Lesson screenshot downloaded successfully!"
          );
        },
        onError: () => {
          setScreenshotStatusMsg(
            language === "ar" ? "فشل التقاط الصورة. حاول مرة أخرى." : "Failed to capture screenshot."
          );
        },
      });
    } catch (e) {
      console.error("Screenshot error:", e);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleExportToGoogleSlides = async () => {
    if (!generatedPlan) return;
    setIsExportingSlides(true);
    setSlidesStatusMsg(
      language === "ar" ? "جارٍ بدء إنشاء العرض..." : "Starting presentation creation..."
    );
    setCreatedSlidesLink(null);

    try {
      let token = googleTokens.slides;
      if (!token) {
        token = await connectGoogleSlides();
      }

      if (token) {
        let aiSlides = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const fbToken = session?.access_token;
          if (fbToken) {
            setSlidesStatusMsg(
              language === "ar" ? "جارٍ بناء هيكل السلايدات..." : "Generating AI slide structure..."
            );
            const planRes = await fetch("/api/gemini/slides-plan", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${fbToken}`
              },
              body: JSON.stringify({
                subject,
                topic,
                level,
                duration: durationMinutes,
                language: explanationLanguage === "Arabic" ? "ar" : "en",
                customInstructions,
                lessonPlan: generatedPlan
              })
            });
            if (planRes.ok) {
              const planData = await planRes.json();
              if (planData.data && Array.isArray(planData.data.slides) && planData.data.slides.length > 0) {
                aiSlides = planData.data.slides;
                const presTitle = planData.data.title || `[IslamRoots Deck] ${subject} - ${topic}`;
                const result = await createGoogleSlidesPresentation(
                  token,
                  presTitle,
                  aiSlides,
                  {
                    onProgress: (msg) => setSlidesStatusMsg(msg)
                  }
                );
                setCreatedSlidesLink(result.webViewLink);
                setSlidesStatusMsg(
                  language === "ar"
                    ? "تم إنشاء عرض Google Slides بنجاح وتصدير جميع العناصر!"
                    : "Google Presentation created and populated successfully!"
                );
                setIsExportingSlides(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn("[SLIDES_EXPORT_ERROR] AI slide plan endpoint failed, falling back to full lesson normalizer:", e);
        }

        const result = await exportLessonToGoogleSlides(
          token,
          {
            title: topic,
            subject,
            level,
            lessonGoal: generatedPlan.lessonGoal,
            description: generatedPlan.lessonGoal,
            warmup: generatedPlan.warmup,
            keyPoints: generatedPlan.keyPoints,
            vocabulary: generatedPlan.vocabulary,
            questionsToAsk: generatedPlan.questionsToAsk,
            examples: generatedPlan.examples,
            miniActivity: generatedPlan.miniActivity,
            quickQuiz: generatedPlan.quickQuiz,
            homework: generatedPlan.homework,
            teachingTips: generatedPlan.teachingTips,
          },
          {
            onProgress: (msg) => setSlidesStatusMsg(msg)
          }
        );

        setCreatedSlidesLink(result.webViewLink);
        setSlidesStatusMsg(
          language === "ar"
            ? "تم إنشاء عرض Google Slides بنجاح وتصدير جميع العناصر!"
            : "Google Presentation created and populated successfully!"
        );
      }
    } catch (err: any) {
      console.error("[SLIDES_EXPORT_ERROR] Failed to export Google Slides:", err);
      setSlidesStatusMsg(
        language === "ar"
          ? "فشل إنشاء عرض Google Slides. حاول مرة أخرى."
          : "Failed to create Google Slides. Please try again."
      );
    } finally {
      setIsExportingSlides(false);
    }
  };

  const handleExportToGoogleDoc = async () => {
    if (!generatedPlan) return;
    setIsExportingDoc(true);
    setDocStatusMsg("");
    setCreatedDocLink(null);

    try {
      let token = googleTokens.docs;
      if (!token) {
        token = await connectGoogleDocs();
      }

      if (token) {
        const keyPointsText = generatedPlan.keyPoints?.map((kp) => `• ${kp}`).join("\n");
        const vocabText = generatedPlan.vocabulary
          ?.map((v) => `${v.arabic} (${v.english}): ${v.explanation}`)
          .join("\n");

        const result = await exportLessonToGoogleDoc(token, {
          title: topic,
          subject,
          level,
          lessonGoal: generatedPlan.lessonGoal,
          description: generatedPlan.lessonGoal,
          warmup: generatedPlan.warmup,
          keyPoints: generatedPlan.keyPoints,
          vocabulary: generatedPlan.vocabulary,
          questionsToAsk: generatedPlan.questionsToAsk,
          examples: generatedPlan.examples,
          miniActivity: generatedPlan.miniActivity,
          quickQuiz: generatedPlan.quickQuiz,
          homework: generatedPlan.homework,
          teachingTips: generatedPlan.teachingTips,
        });

        setCreatedDocLink(result.webViewLink);
        setDocStatusMsg(
          language === "ar"
            ? "تم إنشاء مستند Google Docs بنجاح!"
            : "Google Doc created successfully!"
        );
      }
    } catch (err: any) {
      console.error("Failed to export Google Doc:", err);
      setDocStatusMsg(
        language === "ar"
          ? "فشل إنشاء مستند Google Docs. حاول مرة أخرى."
          : "Failed to create Google Doc. Please try again."
      );
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setSaved(false);
    setError(null);
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 35000); // 35 second timeout

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("AUTH_ERROR");

      const response = await fetch("/api/gemini/lesson-plan", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          topic,
          level,
          duration: durationMinutes,
          language: explanationLanguage === "Arabic" ? "ar" : "en",
          customInstructions,
        }),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(text);
      } catch (e) {
        throw new Error(text.includes("504") ? "TIMEOUT_ERROR" : "VERCEL_SERVER_ERROR");
      }
      
      if (!response.ok) {
         if (response.status === 401 || response.status === 403) throw new Error("AUTH_ERROR");
         if (response.status === 429) throw new Error("RATE_LIMITED");
         throw new Error(resJson.error || "SERVER_ERROR");
      }

      const plan = resJson.data || resJson.lessonPlan;
      if (plan) {
        setGeneratedPlan(plan);
      } else {
        console.error("No plan returned:", resJson);
        throw new Error("INVALID_RESPONSE");
      }
    } catch (err: any) {
      console.error("Error generating lesson plan:", err);
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        setError(language === "ar" ? "استغرق إنشاء الدرس وقتاً أطول من المتوقع. يرجى المحاولة مرة أخرى." : "The lesson is taking longer than expected. Please try again.");
      } else if (err.message === "AUTH_ERROR") {
        setError(language === "ar" ? "انتهت صلاحية الجلسة الخاصة بك. يرجى تسجيل الدخول مرة أخرى." : "Your session has expired. Please sign in again.");
      } else if (err.message === "RATE_LIMITED") {
        setError(language === "ar" ? "جليلة مشغولة حالياً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى." : "Jaleela is temporarily busy. Please wait a moment and try again.");
      } else if (err.message === "INVALID_RESPONSE") {
        setError(language === "ar" ? "لم تتمكن جليلة من إنشاء الدرس الآن. يرجى المحاولة مرة أخرى." : "Jaleela couldn't generate the lesson right now. Please try again.");
      } else if (err.message === "TIMEOUT_ERROR") {
        setError(language === "ar" ? "استغرق إنشاء الدرس وقتاً أطول من المتوقع." : "The request timed out. Please try again.");
      } else if (err.message === "VERCEL_SERVER_ERROR") {
        setError(language === "ar" ? "حدث خطأ في الخادم (Vercel). يرجى التحقق من السجلات." : "A server error occurred (Vercel Timeout or Crash).");
      } else {
        setError((language === "ar" ? "خطأ: " : "Error: ") + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlan = () => {
    if (!generatedPlan) return;
    const text = `Topic: ${topic}\nSubject: ${subject} | Level: ${level}\nGoal: ${generatedPlan.lessonGoal}\n\nKey Points:\n${generatedPlan.keyPoints?.map((k) => `• ${k}`).join("\n")}\n\nVocabulary:\n${generatedPlan.vocabulary?.map((v) => `${v.arabic} (${v.english}): ${v.explanation}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToFirestore = async () => {
    if (!generatedPlan) return;
    try {
      await saveAIContent({
        type: "lesson_plan",
        title: topic,
        content: generatedPlan,
      });
      setSaved(true);
      setSaveToast("Saved to your Saved Library! Click 'Saved Library' at the top anytime to view, re-export, or manage.");
      setTimeout(() => setSaveToast(null), 5000);
    } catch (err) {
      console.error("Error saving lesson plan:", err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-[#2D332D] text-[#E2E8E2] shadow-soft space-y-3 border border-[#3E4D3E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-white/10 backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-[#8BA888]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8BA888]">
              Jalilah AI Assistant | المساعد الذكي جليلة
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif italic font-bold">
            {t("aiLessonStudio")}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-sans">
            {t("aiStudioSubtitle")}
          </p>
        </div>

        <button
          onClick={() => setIsLibraryOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#8BA888] hover:bg-[#789675] text-[#1C221C] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-center"
        >
          <FolderHeart className="w-4 h-4 text-[#1C221C]" />
          <span>Saved Library ({savedContents.length})</span>
        </button>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium text-center animate-fade-in flex items-center justify-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Controls Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#5A6B5A]" />
              <span>Lesson Specification</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs font-sans">
              {/* Subject */}
              <div className="space-y-1">
                <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  {t("subject")} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Quran", "Tajweed", "Islamic Studies", "Arabic"] as SubjectType[]).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSubject(subj)}
                      className={`p-2.5 rounded-lg border font-semibold transition-all cursor-pointer text-xs ${
                        subject === subj
                          ? "border-[#5A6B5A] bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] shadow-xs"
                          : "border-[#E8E5DB] dark:border-[#2A352A] text-[#7A7D75] dark:text-stone-300 hover:bg-[#FCFAF5]"
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-1">
                <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  {t("lessonTopic")} *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Surah An-Nasr or Rules of Ghunnah"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]"
                />
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">Student Name</label>
                  <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]" placeholder="e.g. Omar" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">Student Age</label>
                  <input type="number" value={studentAge} onChange={(e) => setStudentAge(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]" placeholder="e.g. 10" />
                </div>
              </div>

              {/* Teaching Style & Learning Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">Teaching Style</label>
                  <input type="text" value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]" placeholder="e.g. Interactive" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">Learning Goal</label>
                  <input type="text" value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]" placeholder="e.g. Master Tajweed rule" />
                </div>
              </div>

              {/* Level & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                    {t("level")}
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LevelType)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              {/* Explanation Language */}
              <div className="space-y-1">
                <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  Student Explanation Language
                </label>
                <select
                  value={explanationLanguage}
                  onChange={(e) => setExplanationLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]"
                >
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                </select>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-1">
                <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  Special Notes / Focus Areas
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on practical pronunciation drills"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-hidden focus:border-[#5A6B5A]"
                />
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white font-semibold text-xs shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Plan with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Generate AI Lesson Plan</span>
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="p-3 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs text-center font-medium animate-fade-in">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Lesson Display Output Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {!generatedPlan ? (
            <div className="h-full min-h-[400px] p-8 rounded-xl bg-white dark:bg-[#161D17] border border-dashed border-[#E8E5DB] dark:border-[#2A352A] flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-xl bg-[#F2EFE6] dark:bg-[#232B23] text-[#5A6B5A] dark:text-[#8BA888]">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                Ready to Generate Lesson Plan
              </h3>
              <p className="text-xs text-[#7A7D75] max-w-sm">
                Select your parameters on the left and click "Generate AI Lesson Plan" to create a structured outline with key points, vocabulary, and quizzes.
              </p>
            </div>
          ) : (
            <div id="lesson-plan-container" className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-6 animate-fade-in">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#F2EFE6] text-[#3E4D3E] text-[10px] font-bold">
                      {subject}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#8B5A2B]/10 text-[#8B5A2B] text-[10px] font-bold">
                      {level}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                    {topic}
                  </h3>
                  <p className="text-xs italic text-[#7A7D75]">Goal: {generatedPlan.lessonGoal}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTakeScreenshot}
                    disabled={isCapturingScreenshot}
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    title={language === "ar" ? "التقاط صورة للدرس (PNG)" : "Take Lesson Screenshot (PNG)"}
                  >
                    {isCapturingScreenshot ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span>{language === "ar" ? "حفظ كصورة" : "Screenshot"}</span>
                  </button>

                  <button
                    onClick={handleExportToGoogleDoc}
                    disabled={isExportingDoc}
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isExportingDoc ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5A6B5A]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[#5A6B5A] dark:text-[#8BA888]" />
                    )}
                    <span>{language === "ar" ? "تصدير إلى Docs" : "Export Doc"}</span>
                  </button>

                  <button
                    onClick={handleExportToGoogleSlides}
                    disabled={isExportingSlides}
                    className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isExportingSlides ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    ) : (
                      <Presentation className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                    <span>{language === "ar" ? "تصدير إلى Slides" : "Export Slides"}</span>
                  </button>

                  <button
                    onClick={handleSaveToFirestore}
                    className="p-2 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] text-[#3E4D3E] dark:text-stone-300 hover:border-[#5A6B5A] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#5A6B5A]" />
                    <span>{saved ? "Saved!" : "Save"}</span>
                  </button>

                  <button
                    onClick={handleCopyPlan}
                    className="p-2 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] text-[#3E4D3E] dark:text-stone-300 hover:border-[#5A6B5A] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#5A6B5A]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={() => onOpenQuizModal("quiz", topic, subject)}
                    className="px-3 py-2 rounded-lg bg-[#8B5A2B] hover:bg-[#734A23] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileQuestion className="w-3.5 h-3.5" />
                    <span>Create Quiz</span>
                  </button>
                </div>
              </div>

              {/* Google Docs Status Banner */}
              {docStatusMsg && (
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#5A6B5A] dark:text-[#8BA888]" />
                    <span>{docStatusMsg}</span>
                  </div>
                  {createdDocLink && (
                    <a
                      href={createdDocLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#5A6B5A] text-white text-[11px] font-bold hover:bg-[#495749] transition-all"
                    >
                      <span>{language === "ar" ? "فتح المستند" : "Open Google Doc"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Google Slides Status Banner */}
              {slidesStatusMsg && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{slidesStatusMsg}</span>
                  </div>
                  {createdSlidesLink && (
                    <a
                      href={createdSlidesLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 transition-all"
                    >
                      <span>{language === "ar" ? "فتح العرض" : "Open Presentation"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Screenshot Status Banner */}
              {screenshotStatusMsg && (
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{screenshotStatusMsg}</span>
                  </div>
                </div>
              )}

              {/* Key Points */}
              {generatedPlan.keyPoints && generatedPlan.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#3E4D3E] dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" />
                    <span>Key Teaching Points</span>
                  </h4>
                  <ul className="grid grid-cols-1 gap-2 text-xs text-[#2D332D] dark:text-stone-300">
                    {generatedPlan.keyPoints.map((kp, i) => (
                      <li
                        key={i}
                        className="p-3 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] font-medium"
                      >
                        • {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vocabulary Table */}
              {generatedPlan.vocabulary && generatedPlan.vocabulary.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#3E4D3E] dark:text-stone-300 uppercase tracking-wider">
                    Key Vocabulary & Terms
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]">
                    <table className="w-full text-left rtl:text-right text-xs">
                      <thead className="bg-[#F2EFE6] dark:bg-[#232B23] font-bold text-[#3E4D3E] dark:text-stone-300">
                        <tr>
                          <th className="p-2.5">Arabic Term</th>
                          <th className="p-2.5">English</th>
                          <th className="p-2.5">Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E5DB] dark:divide-[#2A352A] text-[#2D332D] dark:text-stone-300">
                        {generatedPlan.vocabulary.map((v, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] text-sm">
                              {v.arabic}
                            </td>
                            <td className="p-2.5 font-semibold text-[#5A6B5A] dark:text-[#8BA888]">
                              {v.english}
                            </td>
                            <td className="p-2.5">{v.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Teaching Tips */}
              {generatedPlan.teachingTips && (
                <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2 text-xs">
                  <p className="font-bold text-[#3E4D3E] dark:text-[#8BA888]">Teaching Tips:</p>
                  <p><strong>Emphasize:</strong> {generatedPlan.teachingTips.whatToEmphasize}</p>
                  <p><strong>Common Confusion:</strong> {generatedPlan.teachingTips.commonConfusion}</p>
                  <p><strong>Simplification:</strong> {generatedPlan.teachingTips.howToSimplify}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Saved Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 space-y-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB] dark:border-[#2A352A]">
                  <FolderHeart className="w-5 h-5 text-[#5A6B5A]" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                    Saved Library
                  </h3>
                  <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                    Your saved AI Lesson Plans, Quizzes, and Homework assessments ({savedContents.length} saved).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-2 rounded-lg text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] rounded-lg w-full sm:w-auto">
                {(["all", "lesson_plan", "quiz", "homework"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLibraryFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                      libraryFilter === f
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2]"
                    }`}
                  >
                    {f === "all" ? "All Items" : f.replace("_", " ")}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#7A7D75] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search saved items..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-xs text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A]"
                />
              </div>
            </div>

            {/* Saved Items List */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {savedContents.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] text-stone-500 space-y-2">
                  <Bookmark className="w-8 h-8 text-[#5A6B5A] mx-auto opacity-40" />
                  <p className="text-sm font-semibold text-[#1F261F] dark:text-[#E2E8E2]">No saved items yet</p>
                  <p className="text-xs text-[#7A7D75]">
                    Generate a lesson plan, quiz, or homework, then click "Save" to keep it in your library!
                  </p>
                </div>
              ) : (
                savedContents
                  .filter((item) => libraryFilter === "all" || item.type === libraryFilter)
                  .filter(
                    (item) =>
                      item.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
                      item.type.toLowerCase().includes(librarySearch.toLowerCase())
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#5A6B5A] transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#E8E5DB] dark:bg-[#2A352A] text-[10px] font-bold uppercase tracking-wider text-[#3E4D3E] dark:text-[#8BA888]">
                            {item.type.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-[#7A7D75]">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.type === "lesson_plan" && (
                          <button
                            onClick={() => {
                              setGeneratedPlan(item.content);
                              setTopic(item.title);
                              setIsLibraryOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Load Plan</span>
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete "${item.title}" from your library?`)) {
                              await deleteSavedAIContent(item.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                          title="Delete from Library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
