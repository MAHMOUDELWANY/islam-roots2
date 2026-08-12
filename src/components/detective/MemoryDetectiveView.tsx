import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { getSurahs, generateMemoryDetectiveQuestions, ScopeOptions } from "../../services/quran/quranService";
import { Surah } from "../../services/quran/quranTypes";
import {
  SearchCheck,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Search,
  Check,
  User,
  Sliders,
  Award,
  RotateCcw,
} from "lucide-react";

export const MemoryDetectiveView: React.FC = () => {
  const { students, recordDetectiveResult } = useData();
  const { t } = useLanguage();

  const activeStudents = students.filter((s) => s.status === "Active");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || "");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(67); // Default Surah Al-Mulk (67) or 112
  const [surahSearch, setSurahSearch] = useState<string>("");

  // Scope Selection State
  const [scopeType, setScopeType] = useState<"entire" | "page" | "ayah_range">("entire");
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(30);
  const [pageNumber, setPageNumber] = useState<number>(1);

  // Recall Mode & Question Count
  const [mode, setMode] = useState<string>("continue_ayah");
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Quiz Execution State
  const [hasStartedQuiz, setHasStartedQuiz] = useState<boolean>(false);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [recorded, setRecorded] = useState<boolean>(false);

  useEffect(() => {
    async function loadSurahsData() {
      const data = await getSurahs();
      setSurahs(data);
    }
    loadSurahsData();
  }, []);

  useEffect(() => {
    if (activeStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(activeStudents[0].id);
    }
  }, [activeStudents, selectedStudentId]);

  const selectedSurah = surahs.find((s) => s.id === selectedSurahId) || {
    id: 67,
    nameSimple: "Al-Mulk",
    nameArabic: "الملك",
    versesCount: 30,
  };

  // Keep endAyah within surah verses bounds when surah changes
  useEffect(() => {
    if (selectedSurah) {
      setStartAyah(1);
      setEndAyah(selectedSurah.versesCount || 30);
    }
  }, [selectedSurahId]);

  const handleGenerateQuiz = async () => {
    setHasStartedQuiz(true);
    setLoadingQuestions(true);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentIndex(0);
    setSessionScore(0);
    setRecorded(false);

    const scopeObj: ScopeOptions = {
      scopeType,
      startAyah: Math.max(1, startAyah),
      endAyah: Math.min(selectedSurah.versesCount || 300, endAyah),
    };

    const modesList = mode === "random_recall" 
      ? ["continue_ayah", "whats_next", "fill_gap", "identify"]
      : [mode];

    try {
      const generated = await generateMemoryDetectiveQuestions(
        selectedSurahId,
        questionCount,
        modesList,
        scopeObj
      );
      setQuestions(generated);
    } catch (err) {
      console.error("Error generating Quran detective questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

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
      // Record Session Result automatically if student selected
      if (selectedStudentId && !recorded) {
        const scorePct = Math.round((sessionScore / questions.length) * 100);
        recordDetectiveResult({
          studentId: selectedStudentId,
          surahRange: `Surah ${selectedSurah.nameSimple} (${selectedSurah.nameArabic}) • ${
            scopeType === "entire" ? "Full Surah" : `Ayahs ${startAyah}-${endAyah}`
          }`,
          scorePercentage: scorePct,
          date: new Date().toISOString().split("T")[0],
          notes: `Mode: ${mode}. Score: ${sessionScore}/${questions.length}`,
        });
        setRecorded(true);
      }
    }
  };

  const filteredSurahs = surahs.filter(
    (s) =>
      s.nameSimple.toLowerCase().includes(surahSearch.toLowerCase()) ||
      s.nameArabic.includes(surahSearch) ||
      s.id.toString() === surahSearch
  );

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-[#2D332D] text-[#F7F5F0] shadow-soft space-y-2 border border-[#3E4D3E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-white/10">
              <SearchCheck className="w-5 h-5 text-[#8BA888]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8BA888]">
              Interactive Recall Workshop
            </span>
          </div>
          {hasStartedQuiz && (
            <button
              onClick={() => setHasStartedQuiz(false)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Setup</span>
            </button>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold italic">
          {t("quranDetective")}
        </h2>
        <p className="text-xs sm:text-sm text-[#E2E8E2]/80 max-w-3xl">
          Define custom Surah testing scopes, select recall challenge modes, and generate live verified Quran memorization quizzes for student assessment.
        </p>
      </div>

      {/* SETUP WORKSPACE (When quiz is not currently running) */}
      {!hasStartedQuiz ? (
        <div className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Column: Target Surah Selection */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#5A6B5A]" />
                    <span>1. Select Target Surah</span>
                  </h3>
                  <span className="text-xs font-semibold text-[#5A6B5A] bg-[#5A6B5A]/10 px-2.5 py-1 rounded-full">
                    {selectedSurah.nameSimple} ({selectedSurah.nameArabic}) • {selectedSurah.versesCount} Ayahs
                  </span>
                </div>

                {/* Surah Search Filter */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#7A7D75] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={surahSearch}
                    onChange={(e) => setSurahSearch(e.target.value)}
                    placeholder="Search Surah by name or number (e.g. Al-Mulk, 67, Yasin)..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
                  />
                </div>

                {/* Surah Grid / List */}
                <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {filteredSurahs.map((s) => {
                    const isSelected = s.id === selectedSurahId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSurahId(s.id)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-[#5A6B5A] text-white border-[#5A6B5A] shadow-xs"
                            : "bg-[#FCFAF5] dark:bg-[#232B23] border-[#E8E5DB] dark:border-[#2A352A] hover:bg-[#F2EFE6] dark:hover:bg-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? "bg-white/20 text-white" : "bg-[#5A6B5A]/10 text-[#5A6B5A]"
                            }`}
                          >
                            {s.id}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold truncate">{s.nameSimple}</p>
                            <p className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#7A7D75]"}`}>
                              {s.versesCount} verses
                            </p>
                          </div>
                        </div>
                        <span className="font-serif font-bold text-sm dir-rtl ml-2 shrink-0">
                          {s.nameArabic}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope Selection Card */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
                <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#8B5A2B]" />
                  <span>2. Define Test Scope Range</span>
                </h3>

                {/* Scope Type Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] text-xs">
                  <button
                    onClick={() => setScopeType("entire")}
                    className={`py-2 px-3 rounded-md font-semibold transition-all cursor-pointer ${
                      scopeType === "entire"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "text-[#7A7D75] hover:text-[#1F261F]"
                    }`}
                  >
                    Entire Surah
                  </button>
                  <button
                    onClick={() => setScopeType("ayah_range")}
                    className={`py-2 px-3 rounded-md font-semibold transition-all cursor-pointer ${
                      scopeType === "ayah_range"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "text-[#7A7D75] hover:text-[#1F261F]"
                    }`}
                  >
                    Verse Range
                  </button>
                  <button
                    onClick={() => setScopeType("page")}
                    className={`py-2 px-3 rounded-md font-semibold transition-all cursor-pointer ${
                      scopeType === "page"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "text-[#7A7D75] hover:text-[#1F261F]"
                    }`}
                  >
                    Specific Page
                  </button>
                </div>

                {/* Scope Details Inputs */}
                {scopeType === "entire" && (
                  <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] text-xs text-[#7A7D75]">
                    <p className="font-medium">
                      Testing all <strong className="text-[#1F261F] dark:text-[#E2E8E2]">{selectedSurah.versesCount}</strong> Ayahs of Surah {selectedSurah.nameSimple} ({selectedSurah.nameArabic}).
                    </p>
                  </div>
                )}

                {scopeType === "ayah_range" && (
                  <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                        Start Ayah (1 - {selectedSurah.versesCount})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedSurah.versesCount}
                        value={startAyah}
                        onChange={(e) => setStartAyah(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-semibold focus:outline-none focus:border-[#5A6B5A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                        End Ayah (1 - {selectedSurah.versesCount})
                      </label>
                      <input
                        type="number"
                        min={startAyah}
                        max={selectedSurah.versesCount}
                        value={endAyah}
                        onChange={(e) => setEndAyah(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-semibold focus:outline-none focus:border-[#5A6B5A]"
                      />
                    </div>
                  </div>
                )}

                {scopeType === "page" && (
                  <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2 text-xs">
                    <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                      Quran Mushaf Page Number (1 - 604)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={604}
                      value={pageNumber}
                      onChange={(e) => setPageNumber(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-semibold focus:outline-none focus:border-[#5A6B5A]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recall Mode, Student & Review Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Challenge Recall Mode Selection */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
                <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#5A6B5A]" />
                  <span>3. Select Challenge Mode</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { id: "continue_ayah", label: "Continue the Ayah", desc: "Select which verse comes directly next" },
                    { id: "whats_next", label: "What's Next Sequence", desc: "Identify subsequent verse sequence" },
                    { id: "fill_gap", label: "Fill the Gap", desc: "Supply the missing word in the verse text" },
                    { id: "identify", label: "Identify Surah & Ayah", desc: "Detect the Surah title containing the verse" },
                    { id: "random_recall", label: "Random Mixed Recall", desc: "Mix all recall challenge types together" },
                  ].map((m) => {
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-[#5A6B5A] text-white border-[#5A6B5A] shadow-xs"
                            : "bg-[#FCFAF5] dark:bg-[#232B23] border-[#E8E5DB] dark:border-[#2A352A] hover:bg-[#F2EFE6] text-[#1F261F] dark:text-[#E2E8E2]"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{m.label}</p>
                          <p className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#7A7D75]"}`}>
                            {m.desc}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student & Question Length Selection */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#5A6B5A]" />
                    <span>Target Student Profile</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-medium focus:outline-none focus:border-[#5A6B5A]"
                  >
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-lg font-bold border cursor-pointer transition-all ${
                          questionCount === cnt
                            ? "bg-[#5A6B5A] text-white border-[#5A6B5A]"
                            : "bg-[#FCFAF5] dark:bg-[#232B23] border-[#E8E5DB] dark:border-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2]"
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pre-Generation Review Card & Generate Action */}
              <div className="p-6 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D2DDD2] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
                <h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#8B5A2B]" />
                  <span>Ready to Launch Session</span>
                </h4>

                <div className="space-y-1.5 text-[#5A6B5A] dark:text-[#8BA888] font-medium bg-white dark:bg-[#161D17] p-3 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]">
                  <p>• <strong>Surah:</strong> {selectedSurah.nameSimple} ({selectedSurah.nameArabic})</p>
                  <p>• <strong>Scope:</strong> {scopeType === "entire" ? "Full Surah" : `Ayahs ${startAyah} to ${endAyah}`}</p>
                  <p>• <strong>Mode:</strong> {mode.replace("_", " ").toUpperCase()}</p>
                  <p>• <strong>Questions:</strong> {questionCount} Items</p>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  className="w-full py-3.5 rounded-xl bg-[#5A6B5A] hover:bg-[#495749] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Quizzes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* QUIZ EXECUTION & RESULTS STAGE */
        <div className="p-6 sm:p-10 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-8">
          {loadingQuestions ? (
            <div className="py-20 text-center space-y-4">
              <Sparkles className="w-10 h-10 text-[#5A6B5A] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#1F261F] dark:text-[#E2E8E2]">
                Generating custom Quran recall quiz for Surah {selectedSurah.nameSimple}...
              </p>
              <p className="text-xs text-[#7A7D75]">Retrieving verified Uthmani Quran verses from API...</p>
            </div>
          ) : currentQ ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8E5DB] dark:border-[#2A352A] pb-4">
                <span className="px-3 py-1 rounded-full bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888] text-xs font-bold">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold text-[#7A7D75]">
                  Score: {sessionScore} / {currentIndex + (isAnswered ? 1 : 0)}
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
            /* SESSION COMPLETE BREAKDOWN */
            <div className="py-12 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#5A6B5A]/10 text-[#5A6B5A] flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                  Recall Session Complete!
                </h3>
                <p className="text-xs text-[#7A7D75] mt-1">
                  Surah {selectedSurah.nameSimple} ({selectedSurah.nameArabic})
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                <p className="text-3xl font-bold text-[#5A6B5A]">
                  {Math.round((sessionScore / Math.max(1, questions.length)) * 100)}%
                </p>
                <p className="text-xs text-[#7A7D75]">
                  Score: {sessionScore} / {questions.length} Correct Answers
                </p>
                {recorded && (
                  <p className="text-xs text-emerald-700 font-semibold pt-2">
                    ✓ Score recorded to student progress history!
                  </p>
                )}
              </div>

              <button
                onClick={() => setHasStartedQuiz(false)}
                className="w-full py-3 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Configure New Test</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
