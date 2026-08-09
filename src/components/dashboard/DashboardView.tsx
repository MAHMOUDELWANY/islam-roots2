import React from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Plus,
  SearchCheck,
  BookOpen,
  ArrowRight,
  Play,
} from "lucide-react";
import { NavSection } from "../layout/Sidebar";

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
  onOpenAddStudent: () => void;
  onOpenStartLesson: (studentId?: string) => void;
  onSelectStudentProfile: (studentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddStudent,
  onOpenStartLesson,
  onSelectStudentProfile,
}) => {
  const { students, lessonSessions, studentCurriculums, curriculums } = useData();
  const { t, isRTL } = useLanguage();

  // Calculate Metrics
  const activeStudents = students.filter((s) => s.status === "Active");
  
  // Avg Progress
  const totalProgress = studentCurriculums.reduce((acc, sc) => acc + sc.progressPercentage, 0);
  const avgProgress = studentCurriculums.length > 0 ? Math.round(totalProgress / studentCurriculums.length) : 0;

  // Today's lessons or recent sessions
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = lessonSessions.filter((s) => s.date === todayStr);
  const presentToday = todaySessions.filter((s) => s.attendanceStatus === "Present").length;
  const lateToday = todaySessions.filter((s) => s.attendanceStatus === "Late").length;

  // Students needing attention
  const studentsNeedingAttention = activeStudents.filter((s) => {
    const sc = studentCurriculums.find((item) => item.studentId === s.id);
    return (sc && sc.progressPercentage < 50) || s.level === "Beginner";
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Welcome Banner & Quick Action Bar in Natural Tones */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-[#3E4D3E] text-white shadow-soft relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-md bg-[#5A6B5A] text-xs font-semibold tracking-wider text-[#DDE2D5]">
            Ustadh Teaching Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight text-[#FCFAF5]">
            Welcome to Islam Roots Workspace
          </h2>
          <p className="text-xs sm:text-sm text-[#DDE2D5] leading-relaxed">
            Streamline your teaching, track student progress across Quran & Tajweed, and generate AI-powered lesson plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto z-10 shrink-0">
          <button
            onClick={onOpenAddStudent}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#FCFAF5] text-[#3E4D3E] hover:bg-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#5A6B5A]" />
            <span>{t("addStudent")}</span>
          </button>
          <button
            onClick={() => onNavigate("lessonStudio")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#8B5A2B] hover:bg-[#724822] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("lessonStudio")}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Students */}
        <div
          onClick={() => onNavigate("students")}
          className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A7D75] dark:text-stone-400">
              {t("activeStudents")}
            </span>
            <div className="p-2 rounded-lg bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {activeStudents.length}
            </span>
            <span className="text-[11px] text-[#5A6B5A] dark:text-[#8BA888] font-medium block mt-0.5">
              Active Learners
            </span>
          </div>
        </div>

        {/* Today's Lessons & Attendance */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A7D75] dark:text-stone-400">
              {t("todayLessons")}
            </span>
            <div className="p-2 rounded-lg bg-[#F2EFE6] dark:bg-[#232B23] text-[#8B5A2B]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {todaySessions.length > 0 ? todaySessions.length : activeStudents.length}
            </span>
            <span className="text-[11px] text-[#7A7D75] dark:text-stone-400 block mt-0.5">
              {presentToday} {t("presentCount")} • {lateToday} {t("lateCount")}
            </span>
          </div>
        </div>

        {/* Average Progress */}
        <div
          onClick={() => onNavigate("progressMap")}
          className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A7D75] dark:text-stone-400">
              {t("averageProgress")}
            </span>
            <div className="p-2 rounded-lg bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {avgProgress}%
            </span>
            <div className="w-full bg-[#F2EFE6] dark:bg-[#232B23] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#5A6B5A] h-full rounded-full transition-all duration-500"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A7D75] dark:text-stone-400">
              {t("needsAttention")}
            </span>
            <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-amber-800 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {studentsNeedingAttention.length}
            </span>
            <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block mt-0.5">
              Requires Tajweed/Revision
            </span>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-[#5A6B5A] text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                <span>{t("aiInsightTitle")}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#E8E5DB] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-bold">
                  Observation
                </span>
              </h3>
            </div>
            {activeStudents.length > 0 ? (
              <>
                <p className="text-xs sm:text-sm text-[#2D332D] dark:text-stone-300 leading-relaxed font-sans">
                  « {activeStudents[0].name} is active in {activeStudents[0].subjects.join(", ") || "Quran"}. Regular Tajweed drills and revision sessions are recommended before upcoming lessons. »
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => onSelectStudentProfile(activeStudents[0].id)}
                    className="text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Review {activeStudents[0].name}'s Profile</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-[#2D332D] dark:text-stone-300 leading-relaxed font-sans">
                Welcome to your Ustadh Workspace! As you add your real students and log lesson sessions, personalized AI teaching observations and Tajweed recommendations will appear here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Lessons & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Lessons / Upcoming List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] italic">
              {t("upcomingLessons")}
            </h3>
            <button
              onClick={() => onOpenStartLesson()}
              className="text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("startLesson")}</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeStudents.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
                <Users className="w-10 h-10 text-[#7A7D75] mx-auto" />
                <h4 className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                  No students added yet
                </h4>
                <p className="text-xs text-[#7A7D75] dark:text-stone-400 max-w-sm mx-auto">
                  Click 'Add Student' above to start adding your real students and building your teaching roster.
                </p>
                <button
                  onClick={onOpenAddStudent}
                  className="px-4 py-2 rounded-lg bg-[#5A6B5A] text-white text-xs font-semibold hover:bg-[#495749] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("addStudent")}</span>
                </button>
              </div>
            ) : (
              activeStudents.slice(0, 4).map((student) => {
                const sc = studentCurriculums.find((item) => item.studentId === student.id);
                const curr = curriculums.find((c) => c.id === sc?.curriculumId);

                return (
                  <div
                    key={student.id}
                    className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#5A6B5A] text-white font-serif font-bold text-sm flex items-center justify-center shrink-0">
                        {student.name.charAt(0)}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => onSelectStudentProfile(student.id)}
                            className="font-semibold text-[#1F261F] dark:text-[#E2E8E2] text-sm hover:text-[#5A6B5A] cursor-pointer"
                          >
                            {student.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#7A7D75] dark:text-stone-300 text-[10px] font-medium">
                            Age {student.age}
                          </span>
                        </div>

                        <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                          {curr ? curr.name : student.subjects.join(" • ")} • {student.level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E8E5DB] dark:border-[#2A352A]">
                      <div className="text-right rtl:text-left">
                        <span className="text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888]">
                          {sc ? `${sc.progressPercentage}% Progress` : "New Student"}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenStartLesson(student.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t("startLesson")}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Tools & Shortcuts (1 col) */}
        <div className="space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] italic">
            {t("quickActions")}
          </h3>

          <div className="space-y-3">
            {/* AI Lesson Studio card */}
            <div
              onClick={() => onNavigate("lessonStudio")}
              className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#8B5A2B] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#8B5A2B] text-white font-bold group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                    {t("aiLessonStudio")}
                  </h4>
                  <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                    Instant structured lesson plans & vocabulary
                  </p>
                </div>
              </div>
            </div>

            {/* Quran Memory Detective */}
            <div
              onClick={() => onNavigate("quranDetective")}
              className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] group-hover:scale-105 transition-transform">
                  <SearchCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                    {t("quranDetective")}
                  </h4>
                  <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                    Test Quran memorization & continuation
                  </p>
                </div>
              </div>
            </div>

            {/* Curriculum Builder */}
            <div
              onClick={() => onNavigate("curriculums")}
              className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                    {t("curriculums")}
                  </h4>
                  <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                    Define custom programs & reorder topics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

