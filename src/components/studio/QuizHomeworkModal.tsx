import { supabase } from "../../lib/supabase";
import React, { useState } from "react";
import { SubjectType, LevelType } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { useData } from "../../context/DataContext";
import { X, FileQuestion, Sparkles, Loader2, CheckCircle2, Copy, Check, Bookmark } from "lucide-react";

interface QuizHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "quiz" | "homework";
  initialLessonTitle: string;
  initialSubject: SubjectType;
}

export const QuizHomeworkModal: React.FC<QuizHomeworkModalProps> = ({
  isOpen,
  onClose,
  type,
  initialLessonTitle,
  initialSubject,
}) => {
  const { t } = useLanguage();
  const { saveAIContent } = useData();

  const [lessonTitle, setLessonTitle] = useState(initialLessonTitle || "Rule of Noon Sakinah & Tanween");
  const [subject] = useState<SubjectType>(initialSubject || "Tajweed");
  const [level, setLevel] = useState<LevelType>("Beginner");
  const [questionCount] = useState(4);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || loading) return;

    setLoading(true);
    setSaved(false);
    setError(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 35000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("AUTH_ERROR");

      const endpoint = type === "quiz" ? "/api/gemini/quiz" : "/api/gemini/homework";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          topic: lessonTitle,
          level,
          count: questionCount,
          difficulty: level,
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

      const output = resJson.data || resJson.quiz || resJson.homework;
      if (output) {
        setGeneratedData(output);
      } else {
        throw new Error("INVALID_RESPONSE");
      }
    } catch (err: any) {
      console.error("Error generating quiz/homework:", err);
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        setError(t("timeoutError") || "Generation is taking longer than expected. Please try again.");
      } else if (err.message === "AUTH_ERROR") {
        setError("Your session has expired. Please sign in again.");
      } else if (err.message === "RATE_LIMITED") {
        setError("Jaleela is temporarily busy. Please wait a moment and try again.");
      } else if (err.message === "INVALID_RESPONSE") {
        setError("Jaleela couldn't generate the content right now. Please try again.");
      } else if (err.message === "TIMEOUT_ERROR") {
        setError("The request timed out. Please try again.");
      } else if (err.message === "VERCEL_SERVER_ERROR") {
        setError("A server error occurred (Vercel Timeout or Crash).");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!generatedData) return;
    let text = `${generatedData.title || lessonTitle}\nSubject: ${subject}\n\n`;
    if (generatedData.questions) {
      generatedData.questions.forEach((q: any, idx: number) => {
        text += `${idx + 1}. ${q.question}\n`;
        if (q.options) {
          q.options.forEach((opt: string, oIdx: number) => {
            text += `   [${String.fromCharCode(65 + oIdx)}] ${opt}\n`;
          });
        }
        text += `   Correct Answer: ${q.correctAnswer}\n   Explanation: ${q.explanation}\n\n`;
      });
    } else if (generatedData.tasks) {
      generatedData.tasks.forEach((t: any, idx: number) => {
        text += `${idx + 1}. ${t.instruction}\n   ${t.detail || ""}\n\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToFirestore = async () => {
    if (!generatedData) return;
    try {
      await saveAIContent({
        type: type === "quiz" ? "quiz" : "homework",
        title: generatedData.title || `${type.toUpperCase()} - ${lessonTitle}`,
        content: generatedData,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Failed to save AI content:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#8B5A2B] border border-[#E8E5DB]">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {type === "quiz" ? t("generateQuiz") : t("generateHomework")}
              </h3>
              <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                AI-powered assessment generator with answer key & explanations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("lessonTopic")}
            </label>
            <input
              type="text"
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("level")}
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as LevelType)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-medium focus:outline-none focus:border-[#5A6B5A]"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Questions Now</span>
                </>
              )}
            </button>
            
            {/* Error Message */}
            {error && (
              <div className="p-3 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs text-center font-medium animate-fade-in">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Output */}
        {generatedData && (
          <div className="space-y-4 pt-4 border-t border-[#E8E5DB] dark:border-[#2A352A] animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                {generatedData.title || lessonTitle}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToFirestore}
                  className="px-3 py-1.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] text-[#2D332D] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{saved ? "Saved!" : "Save"}</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] text-[#2D332D] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#5A6B5A]" /> : <Copy className="w-3.5 h-3.5 text-[#7A7D75]" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {generatedData.questions && (
              <div className="space-y-3 font-sans">
                {generatedData.questions.map((q: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] text-xs space-y-2"
                  >
                    <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">
                      {idx + 1}. {q.question}
                    </p>

                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-between ${
                                isCorrect
                                  ? "bg-white dark:bg-[#161D17] border-[#5A6B5A] text-[#3E4D3E] dark:text-[#8BA888] font-semibold"
                                  : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A] text-[#2D332D] dark:text-[#E2E8E2]"
                              }`}
                            >
                              <span>
                                [{String.fromCharCode(65 + oIdx)}] {opt}
                              </span>
                              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6B5A]" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-[11px] text-[#7A7D75] italic pt-1 border-t border-[#E8E5DB] dark:border-[#2A352A]">
                      Correct: {q.correctAnswer} — Explanation: {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {generatedData.tasks && (
              <div className="space-y-3 font-sans">
                {generatedData.tasks.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] text-xs space-y-1"
                  >
                    <p className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                      Task {t.taskNumber || idx + 1}: {t.instruction}
                    </p>
                    {t.detail && <p className="text-[#7A7D75] dark:text-stone-300">{t.detail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
