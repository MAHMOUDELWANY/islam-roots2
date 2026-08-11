import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { getSurahs, generateMemoryDetectiveQuestions } from "../../services/quran/quranService";
import { Surah } from "../../services/quran/quranTypes";
import {
  SearchCheck,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const MemoryDetectiveView: React.FC = () => {
  const { students, recordDetectiveResult } = useData();
  const { t } = useLanguage();

  const activeStudents = students.filter((s) => s.status === "Active");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || "");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(112); // Default Al-Ikhlas
  const [mode, setMode] = useState<string>("continue_ayah");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [recorded, setRecorded] = useState<boolean>(false);

  useEffect(() => {
    async function loadSurahs() {
      const data = await getSurahs();
      setSurahs(data);
    }
    loadSurahs();
  }, []);

  useEffect(() => {
    if (activeStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(activeStudents[0].id);
    }
  }, [activeStudents, selectedStudentId]);

  const loadDetectiveQuestions = async () => {
    setLoadingQuestions(true);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentIndex(0);
    setSessionScore(0);
    setRecorded(false);

    try {
      const generated = await generateMemoryDetectiveQuestions(
        selectedSurahId,
        5,
        [mode]
      );
      setQuestions(generated);
    } catch (err) {
      console.error("Error generating questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadDetectiveQuestions();
  }, [selectedSurahId, mode]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    setIsAnswered(true);

    if (option === currentQ.correctAnswer) {
      setSessionScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Save Session Result
      if (selectedStudentId && !recorded) {
        const scorePct = Math.round((sessionScore / questions.length) * 100);
        const curSurah = surahs.find((s) => s.id === selectedSurahId);
        recordDetectiveResult({
          studentId: selectedStudentId,
          surahRange: `${curSurah?.nameSimple || "Surah"} (${curSurah?.nameArabic || ""})`,
          scorePercentage: scorePct,
          date: new Date().toISOString().split("T")[0],
          notes: `Mode: ${mode}. Score: ${sessionScore}/${questions.length}`,
        });
        setRecorded(true);
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-[#2D332D] text-[#F7F5F0] shadow-soft space-y-2 border border-[#3E4D3E]">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-white/10">
            <SearchCheck className="w-5 h-5 text-[#8BA888]" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8BA888]">
            Interactive Recall Workshop
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold italic">
          {t("quranDetective")}
        </h2>
        <p className="text-xs sm:text-sm text-[#E2E8E2]/80 max-w-2xl">
          Test student Quran memorization through verified Quran API data with 5 recall modes & teacher grading.
        </p>
      </div>

      {/* Controls */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
            {t("selectStudent")}
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
          >
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.level})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
            Target Surah
          </label>
          <select
            value={selectedSurahId}
            onChange={(e) => setSelectedSurahId(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
          >
            {surahs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}. {s.nameSimple} ({s.nameArabic})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
            Recall Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
          >
            <option value="continue_ayah">1. Continue the Ayah</option>
            <option value="whats_next">2. What's Next?</option>
            <option value="fill_gap">3. Fill the Gap</option>
            <option value="identify">4. Identify the Surah</option>
            <option value="random_recall">5. Random Recall</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={loadDetectiveQuestions}
            disabled={loadingQuestions}
            className="w-full py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingQuestions ? "animate-spin" : ""}`} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Main Detective Challenge Stage */}
      <div className="p-6 sm:p-10 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-8">
        {loadingQuestions ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#5A6B5A] animate-spin mx-auto" />
            <p className="text-xs text-[#7A7D75]">Loading verified Quran verses from API...</p>
          </div>
        ) : currentQ ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8E5DB] dark:border-[#2A352A] pb-4">
              <span className="px-3 py-1 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold text-[#7A7D75]">
                Current Score: {sessionScore}/{currentIndex + (isAnswered ? 1 : 0)}
              </span>
            </div>

            {/* Prompt Box */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-4 text-center">
              <p className="text-xs font-bold text-[#8B5A2B] uppercase tracking-wider">
                {currentQ.promptText}
              </p>

              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] leading-loose dir-rtl py-2">
                {currentQ.promptTextArabic}
              </p>
            </div>

            {/* Multiple Choice Options */}
            {currentQ.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((opt: string, idx: number) => {
                  const isCorrectOpt = opt === currentQ.correctAnswer;
                  const isSelected = selectedAnswer === opt;

                  let cardStyle =
                    "bg-[#FCFAF5] dark:bg-[#232B23] border-[#E8E5DB] dark:border-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2] hover:bg-[#F2EFE6]";

                  if (isAnswered) {
                    if (isCorrectOpt) {
                      cardStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-[#5A6B5A] text-[#3E4D3E] dark:text-[#8BA888] font-semibold";
                    } else if (isSelected) {
                      cardStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-600 text-rose-800 dark:text-rose-200 font-semibold";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-4 rounded-lg border text-sm text-center font-serif dir-rtl transition-all cursor-pointer flex items-center justify-between ${cardStyle}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {isAnswered && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-[#5A6B5A] shrink-0 ml-2" />
                      )}
                      {isAnswered && isSelected && !isCorrectOpt && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation / Answer Feedback */}
            {isAnswered && (
              <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#5A6B5A] space-y-2 text-xs animate-fade-in">
                <p className="font-semibold text-[#3E4D3E] dark:text-[#8BA888]">
                  {selectedAnswer === currentQ.correctAnswer ? "✓ Correct!" : "✗ Needs Review"}
                </p>
                <p className="text-[#7A7D75] dark:text-stone-300">{currentQ.explanation}</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-end pt-4 border-t border-[#E8E5DB] dark:border-[#2A352A]">
              <button
                onClick={handleNext}
                disabled={!isAnswered && currentIndex < questions.length}
                className="px-6 py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <span>{currentIndex < questions.length - 1 ? "Next Question" : "Complete Session"}</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#7A7D75]">
            Select a Surah and click New Session to begin.
          </div>
        )}
      </div>
    </div>
  );
};
