import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { exportLessonToGoogleDoc } from "../../lib/googleDocs";
import { exportLessonToGoogleSlides } from "../../lib/googleSlides";
import { AiClientError, requestAuthenticatedAi } from "../../lib/aiClient";
import {
  GoogleWorkspaceError,
  googleWorkspaceUserMessage,
  isGoogleWorkspaceAuthError,
  toGoogleWorkspaceError,
} from "../../lib/googleWorkspace";
import { SubjectType, LevelType, AILessonPlan } from "../../types";
import { SUBJECTS, getSubjectLabel } from "../../lib/subjects";
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
  Search,
  Trash2,
  X,
  FolderHeart,
  Download,
  ChevronDown,
} from "lucide-react";

interface LessonStudioViewProps {
  onOpenQuizModal: (type: "quiz" | "homework", lessonTitle: string, subject: SubjectType) => void;
  onOpenAddStudent?: () => void;
}

type LearningGoalOption = { en: string; ar: string };

const LEARNING_GOALS: Record<SubjectType, LearningGoalOption[]> = {
  Quran: [
    { en: "New Memorization", ar: "حفظ جديد" },
    { en: "Memorization Revision", ar: "مراجعة الحفظ" },
    { en: "Ayah Continuation & Recall", ar: "متابعة الآيات والاسترجاع" },
    { en: "Surah Understanding", ar: "فهم السورة" },
    { en: "Tafsir & Meaning", ar: "التفسير والمعنى" },
    { en: "Connect Verses & Themes", ar: "ربط الآيات والموضوعات" },
    { en: "Improve Fluency", ar: "تحسين الطلاقة" },
    { en: "Prepare for Memorization Test", ar: "الاستعداد لاختبار الحفظ" },
  ],
  Tajweed: [
    { en: "Makharij Practice", ar: "تدريب مخارج الحروف" },
    { en: "Sifat of Letters", ar: "صفات الحروف" },
    { en: "Qalqalah", ar: "القلقلة" },
    { en: "Ghunnah", ar: "الغنة" },
    { en: "Madd Rules", ar: "أحكام المد" },
    { en: "Noon Sakinah & Tanween", ar: "النون الساكنة والتنوين" },
    { en: "Meem Sakinah", ar: "الميم الساكنة" },
    { en: "Tafkheem & Tarqeeq", ar: "التفخيم والترقيق" },
    { en: "Practical Recitation Correction", ar: "تصحيح التلاوة العملي" },
  ],
  "Islamic Studies": [
    { en: "Aqeedah Understanding", ar: "فهم العقيدة" },
    { en: "Seerah", ar: "السيرة" },
    { en: "Fiqh", ar: "الفقه" },
    { en: "Hadith", ar: "الحديث" },
    { en: "Islamic Manners & Character", ar: "الآداب والأخلاق الإسلامية" },
    { en: "Understanding Islamic Concepts", ar: "فهم المفاهيم الإسلامية" },
    { en: "Real-Life Application", ar: "التطبيق في الحياة" },
    { en: "Critical Thinking & Discussion", ar: "التفكير النقدي والنقاش" },
  ],
  Arabic: [
    { en: "Vocabulary", ar: "المفردات" },
    { en: "Speaking", ar: "المحادثة" },
    { en: "Listening", ar: "الاستماع" },
    { en: "Reading", ar: "القراءة" },
    { en: "Writing", ar: "الكتابة" },
    { en: "Grammar", ar: "القواعد" },
    { en: "Sentence Formation", ar: "تكوين الجمل" },
    { en: "Conversation Practice", ar: "تدريب المحادثة" },
    { en: "Pronunciation", ar: "النطق" },
    { en: "Real-Life Communication", ar: "التواصل في الحياة" },
  ],
};

function normalizeSavedLessonPlan(content: unknown): AILessonPlan {
  const value = (content && typeof content === "object" ? content : {}) as Partial<AILessonPlan>;
  return {
    ...value,
    learningObjectives: Array.isArray(value.learningObjectives) ? value.learningObjectives : [],
    teacherExplanation: typeof value.teacherExplanation === "string" ? value.teacherExplanation : "",
    guidedPractice: Array.isArray(value.guidedPractice) ? value.guidedPractice : [],
    studentPractice: Array.isArray(value.studentPractice) ? value.studentPractice : [],
    checkpointQuestions: Array.isArray(value.checkpointQuestions) ? value.checkpointQuestions : [],
    differentiatedActivities: value.differentiatedActivities || { beginner: "", intermediate: "", advanced: "" },
    assessment: Array.isArray(value.assessment) ? value.assessment : [],
    estimatedTiming: value.estimatedTiming || { warmupMinutes: 0, explanationMinutes: 0, guidedPracticeMinutes: 0, studentPracticeMinutes: 0, assessmentMinutes: 0, totalMinutes: 0 },
  } as AILessonPlan;
}

export const LessonStudioView: React.FC<LessonStudioViewProps> = ({ onOpenQuizModal, onOpenAddStudent }) => {
  const { t, language } = useLanguage();
  const { students, getStudentSessions, getStudentCurriculum, saveAIContent, savedContents, deleteSavedAIContent } = useData();
  const { teacher, googleTokens, connectGoogleDocs, connectGoogleSlides, clearGoogleToken, isGuest } = useAuth();

  // Generator inputs
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState<number | undefined>();
  const [teachingStyle, setTeachingStyle] = useState("Interactive");
  const [selectedLearningGoals, setSelectedLearningGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [showCustomGoal, setShowCustomGoal] = useState(false);
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
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [activeSavedItemId, setActiveSavedItemId] = useState<string | undefined>();

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

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const draftStorageKey = `ir_lesson_studio_draft_v2_${teacher?.id || (isGuest ? "guest" : "pending")}`;
  const latestDraftRef = useRef<Record<string, unknown> | null>(null);

  const isArabic = language === "ar";
  // Keep the latest persistence function without making the autosave effect reschedule on every provider rerender.
  const saveAIContentRef = useRef(saveAIContent);
  saveAIContentRef.current = saveAIContent;
  const availableStudents = students.filter((student) => student.status !== "Archived");
  const selectedStudent = availableStudents.find((student) => student.id === selectedStudentId);
  const filteredStudents = availableStudents.filter((student) => student.name.toLowerCase().includes(studentSearch.trim().toLowerCase()));
  const availableStudentSubjects = selectedStudent?.subjects?.filter((studentSubject) => SUBJECTS.includes(studentSubject)) || [];
  const selectedSubjectGoals = LEARNING_GOALS[subject];
  const subjectOptions = selectedStudent ? availableStudentSubjects : SUBJECTS;
  const learningGoal = [...selectedLearningGoals, ...(customGoal.trim() ? [customGoal.trim()] : [])].join(", ");
  const selectedStudentSessions = selectedStudent ? getStudentSessions(selectedStudent.id).slice(0, 8) : [];
  const selectedStudentAssignment = selectedStudent ? getStudentCurriculum(selectedStudent.id) : { curriculum: undefined, studentCurriculum: undefined };
  const runGoogleExportWithReconnect = async <T,>(
    service: "docs" | "slides",
    connect: () => Promise<string | null>,
    operation: (token: string) => Promise<T>,
  ): Promise<T> => {
    const existingToken = googleTokens[service];
    const token = existingToken || await connect();
    if (!token) {
      throw new GoogleWorkspaceError("Google authorization was not granted.", "AUTH_ERROR");
    }

    try {
      return await operation(token);
    } catch (exportError) {
      if (existingToken && isGoogleWorkspaceAuthError(exportError)) {
        clearGoogleToken(service);
        const refreshedToken = await connect();
        if (refreshedToken) return operation(refreshedToken);
      }
      throw exportError;
    }
  };

  const canGenerate = Boolean(
    selectedStudent &&
    selectedStudent.name.trim() &&
    typeof selectedStudent.age === "number" && selectedStudent.age >= 4 &&
    selectedStudent.level &&
    availableStudentSubjects.includes(subject) &&
    topic.trim() &&
    learningGoal.trim() &&
    !loading,
  );

  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem(draftStorageKey);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Record<string, any>;
        if (typeof draft.selectedStudentId === "string") setSelectedStudentId(draft.selectedStudentId);
        if (typeof draft.studentSearch === "string") setStudentSearch(draft.studentSearch);
        if (typeof draft.teachingStyle === "string") setTeachingStyle(draft.teachingStyle);
        if (Array.isArray(draft.selectedLearningGoals)) setSelectedLearningGoals(draft.selectedLearningGoals);
        if (typeof draft.customGoal === "string") setCustomGoal(draft.customGoal);
        if (typeof draft.showCustomGoal === "boolean") setShowCustomGoal(draft.showCustomGoal);
        if (typeof draft.subject === "string") setSubject(draft.subject as SubjectType);
        if (typeof draft.topic === "string") setTopic(draft.topic);
        if (typeof draft.level === "string") setLevel(draft.level as LevelType);
        if (typeof draft.durationMinutes === "number") setDurationMinutes(draft.durationMinutes);
        if (typeof draft.explanationLanguage === "string") setExplanationLanguage(draft.explanationLanguage);
        if (typeof draft.customInstructions === "string") setCustomInstructions(draft.customInstructions);
        if (draft.generatedPlan && typeof draft.generatedPlan === "object") setGeneratedPlan(draft.generatedPlan as AILessonPlan);
        if (typeof draft.activeSavedItemId === "string") setActiveSavedItemId(draft.activeSavedItemId);
      }
    } catch {
      // A damaged or unavailable session draft must never block the studio.
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftReady) return;
    const draft: Record<string, unknown> = {
      selectedStudentId,
      studentSearch,
      teachingStyle,
      selectedLearningGoals,
      customGoal,
      showCustomGoal,
      subject,
      topic,
      level,
      durationMinutes,
      explanationLanguage,
      customInstructions,
      generatedPlan,
      activeSavedItemId,
    };
    latestDraftRef.current = draft;
    try {
      sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch {
      // Session storage is a resilience layer; persistence failures do not interrupt teaching.
    }
  }, [draftReady, draftStorageKey, selectedStudentId, studentSearch, teachingStyle, selectedLearningGoals, customGoal, showCustomGoal, subject, topic, level, durationMinutes, explanationLanguage, customInstructions, generatedPlan, activeSavedItemId]);

  useEffect(() => {
    const persistDraft = () => {
      if (!latestDraftRef.current) return;
      try {
        sessionStorage.setItem(draftStorageKey, JSON.stringify(latestDraftRef.current));
      } catch {
        // Best-effort lifecycle persistence only.
      }
    };
    window.addEventListener("pagehide", persistDraft);
    document.addEventListener("visibilitychange", persistDraft);
    return () => {
      window.removeEventListener("pagehide", persistDraft);
      document.removeEventListener("visibilitychange", persistDraft);
    };
  }, [draftStorageKey]);

  useEffect(() => {
    if (!selectedStudent) return;
    setSelectedLearningGoals([]);
    setCustomGoal("");
    setShowCustomGoal(false);
    setStudentName(selectedStudent.name);
    setStudentAge(selectedStudent.age);
    if (selectedStudent.level) setLevel(selectedStudent.level);
    if (selectedStudent.learningLanguage) {
      setExplanationLanguage(selectedStudent.learningLanguage.toLowerCase().includes("arab") ? "Arabic" : "English");
    }
  }, [selectedStudent?.id]);

  useEffect(() => {
    if (!availableStudentSubjects.includes(subject) && availableStudentSubjects.length > 0) {
      setSubject(availableStudentSubjects[0]);
    }
  }, [selectedStudent?.id]);

  useEffect(() => {
    if (!generatedPlan) return;
    const timer = window.setTimeout(async () => {
      try {
        const savedItem = await saveAIContentRef.current({
          id: activeSavedItemId,
          type: "lesson_plan",
          title: topic,
          studentId: selectedStudent?.id,
          subject,
          level,
          durationMinutes,
          focus: [learningGoal, customInstructions].filter(Boolean).join(" — "),
          content: generatedPlan,
        });
        setActiveSavedItemId(savedItem.id);
      } catch (autosaveError) {
        console.error("[Lesson] Lesson autosave failed.", autosaveError);
        const message = language === "ar" ? "تم إنشاء الدرس، لكن تعذر حفظه في المكتبة." : "Lesson generated, but it could not be saved to the library.";
        setSaveToast(import.meta.env.DEV ? `${message} [SAVE_ERROR]` : message);
        window.setTimeout(() => setSaveToast(null), 5000);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [generatedPlan, topic, subject, level, durationMinutes, customInstructions, learningGoal, selectedStudent?.id]);

  const handleExportToGoogleSlides = async () => {
    if (!generatedPlan) return;
    setIsExportMenuOpen(false);
    setIsExportingSlides(true);
    setSlidesStatusMsg(language === "ar" ? "جارٍ بدء إنشاء العرض..." : "Starting presentation creation...");
    setCreatedSlidesLink(null);

    try {
      const result = await runGoogleExportWithReconnect("slides", connectGoogleSlides, (token) => {
        setSlidesStatusMsg(language === "ar" ? "جارٍ بناء العرض من خطة الدرس..." : "Building the presentation from your lesson plan...");
        return exportLessonToGoogleSlides(
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
          { onProgress: setSlidesStatusMsg },
        );
      });

      setCreatedSlidesLink(result.webViewLink);
      setSlidesStatusMsg(language === "ar" ? "تم إنشاء عرض Google Slides بنجاح." : "Google Slides presentation created successfully.");
    } catch (err: unknown) {
      const normalized = toGoogleWorkspaceError(err, "Google Slides export");
      console.error("[SLIDES_EXPORT_ERROR] Export failed.", { code: normalized.code, status: normalized.status, reason: normalized.reason });
      setSlidesStatusMsg(googleWorkspaceUserMessage(normalized, language === "ar" ? "ar" : "en"));
    } finally {
      setIsExportingSlides(false);
    }
  };

  const handleExportToGoogleDoc = async () => {
    if (!generatedPlan) return;
    setIsExportMenuOpen(false);
    setIsExportingDoc(true);
    setDocStatusMsg(language === "ar" ? "جارٍ إنشاء المستند..." : "Creating your Google Doc...");
    setCreatedDocLink(null);

    try {
      const result = await runGoogleExportWithReconnect("docs", connectGoogleDocs, (token) => exportLessonToGoogleDoc(token, {
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
      }));

      setCreatedDocLink(result.webViewLink);
      setDocStatusMsg(language === "ar" ? "تم إنشاء مستند Google Docs بنجاح." : "Google Doc created successfully.");
    } catch (err: unknown) {
      const normalized = toGoogleWorkspaceError(err, "Google Docs export");
      console.error("[DOCS_EXPORT_ERROR] Export failed.", { code: normalized.code, status: normalized.status, reason: normalized.reason });
      setDocStatusMsg(googleWorkspaceUserMessage(normalized, language === "ar" ? "ar" : "en"));
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!selectedStudent) {
      setError(language === "ar" ? "يرجى اختيار طالب قبل إنشاء الدرس." : "Please select a student before generating the lesson.");
      return;
    }
    if (!topic.trim()) {
      setError(language === "ar" ? "أدخل موضوع الدرس أولاً." : "Enter a lesson topic before generating.");
      return;
    }
    if (!learningGoal.trim()) {
      setError(language === "ar" ? "اختر هدفاً تعليمياً واحداً على الأقل." : "Select at least one learning goal before generating.");
      return;
    }
    if (!selectedStudent.age || selectedStudent.age < 4) {
      setError(language === "ar" ? "عمر الطالب غير متوفر. حدّث ملف الطالب أولاً." : "The student's age is not provided. Update the student profile first.");
      return;
    }
    if (!selectedStudent.level) {
      setError(language === "ar" ? "أكمل مستوى الطالب قبل إنشاء الدرس." : "Complete the student's level before generating the lesson.");
      return;
    }
    if (!selectedStudent.subjects.includes(subject)) {
      setError(language === "ar" ? "المادة المختارة غير مسندة إلى هذا الطالب." : "The selected subject is not assigned to this student.");
      return;
    }
    if (selectedStudentAssignment.curriculum && selectedStudentAssignment.curriculum.subject !== subject) {
      setError(language === "ar" ? "سياق المنهج المسند لا يطابق المادة المختارة." : "The assigned curriculum does not match the selected subject.");
      return;
    }

    setLoading(true);
    setActiveSavedItemId(undefined);
    setError(null);
    
    try {
      const plan = await requestAuthenticatedAi<AILessonPlan>("/api/gemini/lesson-plan", {
        subject,
        topic,
        studentId: selectedStudent.id,
        curriculumId: selectedStudentAssignment.studentCurriculum?.curriculumId || null,
        studentName: selectedStudent.name,
        studentAge: selectedStudent.age,
        studentLevel: selectedStudent.level,
        duration: durationMinutes,
        teachingStyle,
        language: explanationLanguage === "Arabic" ? "ar" : "en",
        learningGoal,
        learningGoals: selectedLearningGoals.length ? selectedLearningGoals : [customGoal.trim()],
        customInstructions,
        studentProfile: {
          id: selectedStudent.id,
          isGuest,
          name: selectedStudent.name,
          age: selectedStudent.age,
          nativeLanguage: selectedStudent.nativeLanguage,
          learningLanguage: selectedStudent.learningLanguage,
          level: selectedStudent.level,
          subjects: selectedStudent.subjects,
          teacherNotes: selectedStudent.notes || "",
        },
        learningHistory: {
          curriculum: selectedStudentAssignment.curriculum ? {
            name: selectedStudentAssignment.curriculum.name,
            subject: selectedStudentAssignment.curriculum.subject,
            progressPercentage: selectedStudentAssignment.studentCurriculum?.progressPercentage || 0,
          } : null,
          sessions: selectedStudentSessions.map((session) => ({
            lessonTitle: session.lessonTitle,
            date: session.date,
            attendanceStatus: session.attendanceStatus,
            teacherNotes: session.teacherNotes || "",
            quizScore: session.quizScore ?? null,
            completedItems: session.completedItems,
          })),
        },
        curriculumContext: selectedStudentAssignment.curriculum ? {
          name: selectedStudentAssignment.curriculum.name,
          subject: selectedStudentAssignment.curriculum.subject,
          level: selectedStudentAssignment.curriculum.level,
          progressPercentage: selectedStudentAssignment.studentCurriculum?.progressPercentage || 0,
          currentLessonId: selectedStudentAssignment.studentCurriculum?.currentLessonId || null,
        } : null,
      }, (response) => response.data || response.lessonPlan);
      setGeneratedPlan(plan);
    } catch (err: unknown) {
      console.error("Error generating lesson plan:", err);
      const code = err instanceof AiClientError ? err.code : "SERVER_ERROR";
      const messages: Record<string, { en: string; ar: string }> = {
        AUTH_ERROR: { en: "Your session has expired. Please sign in again.", ar: "انتهت صلاحية الجلسة الخاصة بك. يرجى تسجيل الدخول مرة أخرى." },
        RATE_LIMITED: { en: "Jaleela is temporarily busy. Please wait a moment, then try again.", ar: "جليلة مشغولة حالياً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى." },
        VALIDATION_ERROR: { en: "Complete the student, subject, level, topic, and curriculum details before generating.", ar: "أكمل بيانات الطالب والمادة والمستوى والموضوع والمنهج قبل إنشاء الدرس." },
        CONFIG_ERROR: { en: "Lesson generation is not configured on the server. Please contact the administrator.", ar: "لم يتم إعداد إنشاء الدروس على الخادم. تواصل مع المسؤول." },
        MODEL_ERROR: { en: "The configured AI model is unavailable. Please contact the administrator.", ar: "نموذج الذكاء الاصطناعي المكوّن غير متاح. تواصل مع المسؤول." },
        PROVIDER_ERROR: { en: "The AI provider is temporarily unavailable. Please try again.", ar: "مزود الذكاء الاصطناعي غير متاح مؤقتاً. حاول مرة أخرى." },
        DATABASE_ERROR: { en: "Student or curriculum data could not be verified. Please refresh and try again.", ar: "تعذر التحقق من بيانات الطالب أو المنهج. حدّث الصفحة وحاول مرة أخرى." },
        SCHEMA_ERROR: { en: "The AI returned an incomplete lesson structure. Please try again.", ar: "أعاد الذكاء الاصطناعي بنية درس غير مكتملة. حاول مرة أخرى." },
        INVALID_RESPONSE: { en: "The AI returned an invalid lesson structure. Please try again.", ar: "أعاد الذكاء الاصطناعي بنية درس غير صالحة. حاول مرة أخرى." },
        TIMEOUT_ERROR: { en: "The lesson request timed out. Please try again.", ar: "انتهت مهلة إنشاء الدرس. حاول مرة أخرى." },
        VERCEL_SERVER_ERROR: { en: "A server response could not be read. Please try again.", ar: "تعذر قراءة استجابة الخادم. حاول مرة أخرى." },
        SERVER_ERROR: { en: "Lesson generation failed. Please try again.", ar: "فشل إنشاء الدرس. حاول مرة أخرى." },
      };
      const message = messages[code] || messages.SERVER_ERROR;
      const localizedMessage = language === "ar" ? message.ar : message.en;
      setError(import.meta.env.DEV ? `${localizedMessage} [${code}]` : localizedMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlan = () => {
    if (!generatedPlan) return;
    setIsExportMenuOpen(false);
    const text = `Topic: ${topic}\nSubject: ${subject} | Level: ${level}\nGoal: ${generatedPlan.lessonGoal}\n\nKey Points:\n${generatedPlan.keyPoints?.map((k) => `• ${k}`).join("\n")}\n\nVocabulary:\n${generatedPlan.vocabulary?.map((v) => `${v.arabic} (${v.english}): ${v.explanation}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-none space-y-8 pb-16 font-sans animate-fade-in">
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
          <h2 className="text-xl sm:text-2xl font-serif font-bold">
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

      <div className="space-y-10">
        {/* Lesson specification: full-width upper section */}
        <section aria-labelledby="lesson-specification-heading" className="w-full ir-surface p-6 sm:p-8 lg:p-10 space-y-7">

            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                <BookOpen className="w-5 h-5 text-[#5A6B5A]" />
                <span id="lesson-specification-heading">Lesson Specification</span>
              </h3>
              <p className="max-w-md text-xs leading-5 text-[#677167] dark:text-stone-400">Choose the learner and lesson focus first. The remaining details will shape the generated plan.</p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6 text-sm font-sans">
              {/* Required Student Selector */}
              <div className="space-y-2">
                <label htmlFor="lesson-student" className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  {isArabic ? "الطالب" : "Student"} <span className="text-red-600">*</span>
                </label>
                {availableStudents.length === 0 ? (
                  <div className="ir-inset p-4 space-y-3 text-center">
                    <p className="font-semibold text-[#3E4D3E] dark:text-stone-300">{isArabic ? "لا يوجد طلاب. أضف طالباً أولاً." : "No students available. Add a student first."}</p>
                    {onOpenAddStudent && (
                      <button type="button" onClick={onOpenAddStudent} className="ir-button-primary px-4 py-2 text-xs">
                        {isArabic ? "إضافة طالب" : "Add Student"}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {availableStudents.length > 5 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7D75]" />
                        <input
                          type="search"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder={isArabic ? "ابحث عن طالب..." : "Search students..."}
                          aria-label={isArabic ? "البحث عن طالب" : "Search students"}
                          className="ir-input pl-9"
                        />
                      </div>
                    )}
                    <select
                      id="lesson-student"
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="ir-input w-full px-3.5 py-2.5 text-sm focus:outline-none"
                    >
                      <option value="">{isArabic ? "اختر طالباً مسجلاً" : "Select a registered student"}</option>
                      {filteredStudents.map((student) => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              {/* Auto-filled Student Profile */}
              {selectedStudent && (
                <div className="ir-inset p-4 space-y-3" aria-live="polite">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">{isArabic ? "ملف الطالب" : "Student Profile"}</h4>
                    <span className="ir-badge">{isArabic ? "سجل قاعدة البيانات" : "Database record"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <p><span className="text-[#7A7D75]">{isArabic ? "الاسم" : "Name"}</span><br /><strong>{selectedStudent.name}</strong></p>
                    <p><span className="text-[#7A7D75]">{isArabic ? "العمر" : "Age"}</span><br /><strong>{selectedStudent.age ? selectedStudent.age : (isArabic ? "غير متوفر" : "Not provided")}</strong></p>
                    <p><span className="text-[#7A7D75]">{isArabic ? "المستوى" : "Level"}</span><br /><strong>{selectedStudent.level || (isArabic ? "غير متوفر" : "Not provided")}</strong></p>
                    <p><span className="text-[#7A7D75]">{isArabic ? "اللغة" : "Language"}</span><br /><strong>{selectedStudent.learningLanguage || (isArabic ? "غير متوفر" : "Not provided")}</strong></p>
                    <p className="col-span-2"><span className="text-[#7A7D75]">{isArabic ? "المواد المسجلة" : "Enrolled subjects"}</span><br /><strong>{availableStudentSubjects.length ? availableStudentSubjects.map((item) => getSubjectLabel(item, language)).join(", ") : (isArabic ? "غير متوفر" : "Not provided")}</strong></p>
                    <p className="col-span-2"><span className="text-[#7A7D75]">{isArabic ? "المنهج" : "Curriculum"}</span><br /><strong>{selectedStudentAssignment.curriculum?.name || (isArabic ? "غير مسند" : "Not assigned")}</strong></p>
                  </div>
                </div>
              )}

              <div className="border-t border-[#E8E5DB] pt-6 dark:border-[#2A352A]">
                <p className="ir-section-label">Lesson focus</p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  {t("subject")} <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subjectOptions.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => { setSubject(subj); setSelectedLearningGoals([]); setCustomGoal(""); }}
                      className={`p-2.5 rounded-lg border font-semibold transition-all cursor-pointer text-xs ${
                        subject === subj
                          ? "border-[#5A6B5A] bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] shadow-xs"
                          : "border-[#E8E5DB] dark:border-[#2A352A] text-[#7A7D75] dark:text-stone-300 hover:bg-[#FCFAF5]"
                      }`}
                    >
                      {getSubjectLabel(subj, language)}
                    </button>
                  ))}
                </div>
                {selectedStudent && subjectOptions.length === 0 && (
                  <p className="text-[11px] text-[#8B5A2B]">No supported enrolled subjects are provided for this student.</p>
                )}
              </div>

              {/* Learning Goals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">{isArabic ? "الأهداف التعليمية" : "Learning Goals"} <span className="text-red-600">*</span></label>
                  <span className="text-[10px] text-[#7A7D75]">{isArabic ? "اختر هدفاً واحداً أو أكثر" : "Select one or more"}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {selectedSubjectGoals.map((goal) => {
                    const selected = selectedLearningGoals.includes(goal.en);
                    return (
                      <button
                        key={goal.en}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedLearningGoals((current) => selected ? current.filter((item) => item !== goal.en) : [...current, goal.en])}
                        className={`w-full rounded-xl border px-3 py-2.5 text-start text-xs font-semibold transition-colors ${selected ? "border-[#5A6B5A] bg-[#F2EFE6] text-[#3E4D3E]" : "border-[#E8E5DB] text-[#7A7D75] hover:border-[#5A6B5A]"}`}
                      >
                        {language === "ar" ? goal.ar : goal.en}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomGoal((current) => !current)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${showCustomGoal ? "border-[#8B5A2B] bg-[#8B5A2B]/10 text-[#6B3F1D]" : "border-dashed border-[#8B5A2B] text-[#8B5A2B]"}`}
                  >
                    {isArabic ? "+ هدف مخصص" : "+ Custom Goal"}
                  </button>
                </div>
                {showCustomGoal && (
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder={isArabic ? "اكتب هدفاً تعليمياً مخصصاً" : "Type a custom learning goal"}
                    className="ir-input w-full px-3.5 py-2.5 text-sm focus:outline-none"
                  />
                )}
              </div>

              <div className="border-t border-[#E8E5DB] pt-6 dark:border-[#2A352A]">
                <p className="ir-section-label">Teaching setup</p>
              </div>

              {/* Lesson Topic */}
              <div className="space-y-2">
                <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                  {isArabic ? "موضوع الدرس" : t("lessonTopic")} <span className="text-red-600">*</span>
                </label>
                <input type="text" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Surah An-Nasr or Rules of Ghunnah" className="ir-input w-full px-3.5 py-2.5 text-sm focus:outline-none" />
              </div>

              {/* Teacher Style and Duration */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">{isArabic ? "أسلوب التدريس" : "Teaching Style"}</label>
                  <input type="text" value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)} className="ir-input w-full px-3.5 py-2.5 text-sm focus:outline-none" placeholder="e.g. Interactive" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#3E4D3E] dark:text-stone-300">{isArabic ? "المدة (بالدقائق)" : "Duration (Minutes)"}</label>
                  <select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="ir-input w-full px-3.5 py-2.5 text-sm focus:outline-none">
                    <option value={30}>{isArabic ? "30 دقيقة" : "30 mins"}</option>
                    <option value={45}>{isArabic ? "45 دقيقة" : "45 mins"}</option>
                    <option value={60}>{isArabic ? "60 دقيقة" : "60 mins"}</option>
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
                disabled={!canGenerate}
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
        </section>

        {/* Generated content: full-width lower section */}
        <section aria-labelledby="generated-content-heading" className="min-w-0 w-full space-y-6 border-t border-[#D9DED7] pt-10 dark:border-[#2A352A]">
          <div className="flex items-center justify-between gap-4 px-1">
            <div>
              <p className="ir-section-label">Lesson output</p>
              <h3 id="generated-content-heading" className="mt-1 text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {language === "ar" ? "محتوى الدرس المُنشأ" : "Generated lesson content"}
              </h3>
            </div>
            {generatedPlan && <span className="text-xs font-medium text-[#7A7D75] dark:text-stone-400">{language === "ar" ? "راجع الخطة بعد الإنشاء" : "Review your plan below"}</span>}
          </div>
          <div className="min-w-0 space-y-6">
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
            <div id="lesson-plan-container" className="w-full ir-surface p-6 sm:p-10 space-y-8 animate-fade-in">
              {/* Header Bar */}
              <div className="flex flex-col gap-5 border-b border-[#E8E5DB] pb-6 dark:border-[#2A352A] sm:flex-row sm:items-start sm:justify-between">
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
                  <p className="text-xs text-[#7A7D75]">Goal: {generatedPlan.lessonGoal}</p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsExportMenuOpen((current) => !current)}
                      aria-expanded={isExportMenuOpen}
                      aria-haspopup="menu"
                      className="ir-button ir-button-secondary inline-flex items-center gap-2 px-3.5 text-xs"
                    >
                      <Download className="w-4 h-4 text-[#5A6B5A]" />
                      <span>{language === "ar" ? "تصدير" : "Export"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isExportMenuOpen && (
                      <div role="menu" className="absolute end-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-xl border border-[#E8E5DB] bg-white p-1.5 shadow-lg dark:border-[#2A352A] dark:bg-[#161D17]">
                        <button type="button" role="menuitem" onClick={handleExportToGoogleDoc} disabled={isExportingDoc} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs font-semibold text-[#3E4D3E] hover:bg-[#F2EFE6] disabled:opacity-60 dark:text-stone-200 dark:hover:bg-[#232B23]">
                          {isExportingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-[#5A6B5A]" />}
                          <span>{language === "ar" ? "تصدير إلى Google Docs" : "Export to Google Docs"}</span>
                        </button>
                        <button type="button" role="menuitem" onClick={handleExportToGoogleSlides} disabled={isExportingSlides} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs font-semibold text-[#3E4D3E] hover:bg-[#F2EFE6] disabled:opacity-60 dark:text-stone-200 dark:hover:bg-[#232B23]">
                          {isExportingSlides ? <Loader2 className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4 text-[#8B5A2B]" />}
                          <span>{language === "ar" ? "تصدير إلى Google Slides" : "Export to Google Slides"}</span>
                        </button>
                        <button type="button" role="menuitem" onClick={handleCopyPlan} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs font-semibold text-[#3E4D3E] hover:bg-[#F2EFE6] dark:text-stone-200 dark:hover:bg-[#232B23]">
                          {copied ? <Check className="h-4 w-4 text-[#5A6B5A]" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? (language === "ar" ? "تم النسخ" : "Copied") : (language === "ar" ? "نسخ الخطة" : "Copy plan")}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenQuizModal("quiz", topic, subject)}
                    className="ir-button inline-flex items-center gap-2 bg-[#8B5A2B] px-3.5 text-xs text-white hover:bg-[#734A23]"
                  >
                    <FileQuestion className="w-4 h-4" />
                    <span>{language === "ar" ? "إنشاء اختبار" : "Create quiz"}</span>
                  </button>

                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
                <div className="ir-inset p-5 sm:p-6 space-y-3 sm:col-span-2">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Learning Objectives</h4>
                  <ul className="list-disc rtl:list-[arabic-indic] pl-4 rtl:pr-4 rtl:pl-0 space-y-1 text-[#2D332D] dark:text-stone-300">
                    {generatedPlan.learningObjectives.map((objective, index) => <li key={index}>{objective}</li>)}
                  </ul>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3 sm:col-span-2">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Teacher Explanation</h4>
                  <p className="text-[#2D332D] dark:text-stone-300 leading-relaxed">{generatedPlan.teacherExplanation}</p>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Guided Practice</h4>
                  <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 space-y-1">{generatedPlan.guidedPractice.map((item, index) => <li key={index}>{item}</li>)}</ul>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Student Practice</h4>
                  <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 space-y-1">{generatedPlan.studentPractice.map((item, index) => <li key={index}>{item}</li>)}</ul>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Checkpoint Questions</h4>
                  <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 space-y-1">{generatedPlan.checkpointQuestions.map((item, index) => <li key={index}>{item}</li>)}</ul>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Assessment</h4>
                  <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 space-y-1">{generatedPlan.assessment.map((item, index) => <li key={index}>{item}</li>)}</ul>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3 sm:col-span-2">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Differentiated Activities</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <p><strong>Beginner:</strong> {generatedPlan.differentiatedActivities.beginner}</p>
                    <p><strong>Intermediate:</strong> {generatedPlan.differentiatedActivities.intermediate}</p>
                    <p><strong>Advanced:</strong> {generatedPlan.differentiatedActivities.advanced}</p>
                  </div>
                </div>
                <div className="ir-inset p-5 sm:p-6 space-y-3 sm:col-span-2">
                  <h4 className="font-bold text-[#3E4D3E] dark:text-stone-300">Estimated Timing</h4>
                  <p>{generatedPlan.estimatedTiming.warmupMinutes}m warm-up · {generatedPlan.estimatedTiming.explanationMinutes}m explanation · {generatedPlan.estimatedTiming.guidedPracticeMinutes}m guided practice · {generatedPlan.estimatedTiming.studentPracticeMinutes}m student practice · {generatedPlan.estimatedTiming.assessmentMinutes}m assessment · {generatedPlan.estimatedTiming.totalMinutes}m total</p>
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
        </section>
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
                              setGeneratedPlan(normalizeSavedLessonPlan(item.content));
                              setTopic(item.title);
                              setActiveSavedItemId(item.id);
                              if (item.studentId) {
                                const linkedStudent = students.find((student) => student.id === item.studentId);
                                setSelectedStudentId(item.studentId);
                                if (linkedStudent) {
                                  setStudentName(linkedStudent.name);
                                  setStudentAge(linkedStudent.age);
                                }
                              }
                              if (item.subject) setSubject(item.subject);
                              if (item.level) setLevel(item.level);
                              if (item.durationMinutes) setDurationMinutes(item.durationMinutes);
                              if (item.focus) {
                                setCustomGoal(item.focus);
                                setShowCustomGoal(true);
                              }
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
