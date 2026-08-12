import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { captureAndDownloadScreenshot } from "../../lib/screenshot";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Network,
  History,
  TrendingUp,
  AlertCircle,
  Play,
  Calendar,
  Camera,
} from "lucide-react";

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  onStartLesson: (studentId: string) => void;
  onOpenAssignCurriculum: (student: any) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  onBack,
  onStartLesson,
  onOpenAssignCurriculum,
}) => {
  const { getStudentById, getStudentCurriculum, getStudentSessions, memoryMapNodes } = useData();
  const { t, isRTL } = useLanguage();

  const [activeTab, setActiveTab] = useState<"overview" | "journey" | "history" | "insights" | "memory">("overview");

  const student = getStudentById(studentId);
  if (!student) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-[#7A7D75]">Student not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-[#5A6B5A] text-white rounded-lg text-xs font-semibold">
          Back to Students
        </button>
      </div>
    );
  }

  const { curriculum, studentCurriculum } = getStudentCurriculum(student.id);
  const sessions = getStudentSessions(student.id);

  // Attendance rate
  const totalSessions = sessions.length;
  const presentSessions = sessions.filter((s) => s.attendanceStatus === "Present").length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

  // Filter Memory Map nodes for this student's subjects
  const studentMemoryNodes = memoryMapNodes.filter((n) =>
    student.subjects.some((subj) => n.category === subj)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] text-[#2D332D] dark:text-[#E2E8E2] hover:text-[#5A6B5A] text-xs font-semibold shadow-soft transition-all cursor-pointer"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          <span>{t("students")}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              captureAndDownloadScreenshot("student-profile-container", {
                filename: `IslamRoots_StudentProfile_${student.name.replace(/\s+/g, "_")}.png`,
                watermarkText: `IslamRoots Student Report: ${student.name} • https://islamroots.app`,
              })
            }
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Save Student Profile Screenshot (PNG)"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Screenshot Report</span>
          </button>

          <button
            onClick={() => onStartLesson(student.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t("startLesson")}</span>
          </button>
        </div>
      </div>

      {/* Student Profile Banner */}
      <div id="student-profile-container" className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#5A6B5A] text-white font-serif font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-xs shrink-0">
              {student.name.charAt(0)}
            </div>

            <div className="space-y-1 font-sans">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                  {student.name}
                </h2>
                <span className="px-3 py-1 rounded bg-[#8B5A2B]/10 text-[#8B5A2B] text-xs font-bold">
                  {student.level}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 flex flex-wrap items-center gap-2">
                <span>Age {student.age}</span> • <span>{student.nativeLanguage || "English"}</span> •{" "}
                <span className="text-[#3E4D3E] dark:text-[#8BA888] font-semibold">
                  {student.learningLanguage}
                </span>
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {student.subjects.map((subj) => (
                  <span
                    key={subj}
                    className="px-2.5 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-bold"
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#E8E5DB] dark:border-[#2A352A]">
            <div className="text-center px-4 py-2 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] min-w-[90px]">
              <span className="text-2xl font-bold text-[#5A6B5A] dark:text-[#8BA888]">
                {studentCurriculum?.progressPercentage || 0}%
              </span>
              <span className="text-[10px] text-[#7A7D75] block font-semibold">
                {t("overallProgress")}
              </span>
            </div>

            <div className="text-center px-4 py-2 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] min-w-[90px]">
              <span className="text-2xl font-bold text-[#8B5A2B]">
                {attendanceRate}%
              </span>
              <span className="text-[10px] text-[#7A7D75] block font-semibold">
                {t("attendanceRate")}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-[#E8E5DB] dark:border-[#2A352A] pt-4 no-scrollbar">
          {[
            { id: "overview", labelKey: "overview", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "journey", labelKey: "curriculumProgress", icon: <BookOpen className="w-4 h-4" /> },
            { id: "history", labelKey: "lessonHistory", icon: <History className="w-4 h-4" /> },
            { id: "insights", labelKey: "aiInsights", icon: <Sparkles className="w-4 h-4 text-[#8B5A2B]" /> },
            { id: "memory", labelKey: "memoryMap", icon: <Network className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#5A6B5A] text-white shadow-xs"
                    : "text-[#7A7D75] dark:text-stone-300 hover:bg-[#F2EFE6] dark:hover:bg-[#232B23]"
                }`}
              >
                {tab.icon}
                <span>{t(tab.labelKey as any)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Current Curriculum Card */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#5A6B5A]" />
                  <span>{t("currentCurriculum")}</span>
                </h3>
                <button
                  onClick={() => onOpenAssignCurriculum(student)}
                  className="text-xs font-semibold text-[#5A6B5A] hover:underline cursor-pointer"
                >
                  Change Curriculum
                </button>
              </div>

              {curriculum ? (
                <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                        {curriculum.name}
                      </h4>
                      <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                        {curriculum.description}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#5A6B5A] text-white text-xs font-semibold">
                      {studentCurriculum?.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-[#F2EFE6] dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5A6B5A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${studentCurriculum?.progressPercentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-[#2D332D] dark:text-stone-300 font-medium">
                    Current Topic:{" "}
                    <span className="font-semibold text-[#3E4D3E] dark:text-[#8BA888]">
                      {curriculum.lessons.find((l) => l.id === studentCurriculum?.currentLessonId)?.title ||
                        curriculum.lessons[0]?.title ||
                        "Lesson 1"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-dashed border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                  <p className="text-xs text-[#7A7D75]">No curriculum assigned to this student yet.</p>
                  <button
                    onClick={() => onOpenAssignCurriculum(student)}
                    className="px-4 py-2 rounded-lg bg-[#5A6B5A] text-white text-xs font-semibold cursor-pointer inline-block"
                  >
                    Assign First Curriculum
                  </button>
                </div>
              )}
            </div>

            {/* Strengths & Areas Needing Attention */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                <h4 className="text-xs font-bold text-[#3E4D3E] dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" />
                  <span>{t("strengths")}</span>
                </h4>
                <ul className="text-xs text-[#2D332D] dark:text-stone-300 space-y-1.5 list-disc list-inside font-medium">
                  <li>Strong memorization & recall on short Surahs</li>
                  <li>Fast grasp of Arabic vowel sounds (Harakat)</li>
                  <li>High enthusiasm during Seerah discussions</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                <h4 className="text-xs font-bold text-[#8B5A2B] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t("areasNeedingAttention")}</span>
                </h4>
                <ul className="text-xs text-[#2D332D] dark:text-stone-300 space-y-1.5 list-disc list-inside font-medium">
                  <li>Requires practice on Qalqalah Kubra at verse ends</li>
                  <li>Needs reminder on Ghunnah nasal duration (2 counts)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Side Info Column */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <h3 className="text-sm font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                Teacher Notes & Profile
              </h3>
              <p className="text-xs text-[#2D332D] dark:text-stone-300 leading-relaxed bg-[#FCFAF5] dark:bg-[#232B23] p-3 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]">
                {student.notes || "No additional notes entered."}
              </p>

              <div className="pt-2 text-xs text-[#7A7D75] space-y-1">
                <p>
                  <strong className="text-[#3E4D3E] dark:text-stone-300">Nationality:</strong>{" "}
                  {student.nationality || "International"}
                </p>
                <p>
                  <strong className="text-[#3E4D3E] dark:text-stone-300">Joined:</strong>{" "}
                  {new Date(student.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Curriculum Learning Journey Path */}
      {activeTab === "journey" && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                Visual Learning Journey
              </h3>
              <p className="text-xs text-[#7A7D75]">
                Interactive step-by-step progress path for {student.name}.
              </p>
            </div>
            {curriculum && (
              <span className="px-3 py-1 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold">
                {curriculum.name}
              </span>
            )}
          </div>

          {curriculum && curriculum.lessons.length > 0 ? (
            <div className="relative pl-6 rtl:pr-6 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 border-[#E8E5DB] dark:border-[#2A352A] space-y-8 my-6">
              {curriculum.lessons.map((lesson, idx) => {
                const isCompleted = studentCurriculum?.completedLessonIds.includes(lesson.id);
                const isCurrent = studentCurriculum?.currentLessonId === lesson.id;

                return (
                  <div key={lesson.id} className="relative flex items-start gap-4 group">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-[35px] rtl:-right-[35px] rtl:left-auto top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                        isCompleted
                          ? "bg-[#5A6B5A] text-white"
                          : isCurrent
                          ? "bg-[#8B5A2B] text-white scale-110"
                          : "bg-[#E8E5DB] dark:bg-stone-700 text-[#7A7D75]"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>

                    {/* Lesson Content Card */}
                    <div
                      className={`flex-1 p-4 sm:p-5 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#8B5A2B] shadow-xs"
                          : isCompleted
                          ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#E8E5DB] dark:border-[#2A352A]"
                          : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A] opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                            <span>{lesson.title}</span>
                            {lesson.titleArabic && (
                              <span className="text-[#5A6B5A] dark:text-[#8BA888] font-serif text-xs">
                                ({lesson.titleArabic})
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                            {lesson.description || "Standard curriculum topic"}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                            isCompleted
                              ? "bg-[#5A6B5A] text-white"
                              : isCurrent
                              ? "bg-[#8B5A2B] text-white"
                              : "bg-[#E8E5DB] dark:bg-stone-700 text-[#7A7D75] dark:text-stone-300"
                          }`}
                        >
                          {isCompleted ? "Completed" : isCurrent ? "Current Target" : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-[#7A7D75] text-xs">
              No curriculum steps available. Please assign a curriculum.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Lesson History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
            Completed Lesson Sessions ({sessions.length})
          </h3>

          {sessions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] text-xs text-[#7A7D75]">
              No completed sessions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5A6B5A]" />
                      <span className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                        {sess.lessonTitle}
                      </span>
                      <span className="text-xs text-[#7A7D75]">({sess.date})</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        sess.attendanceStatus === "Present"
                          ? "bg-[#F2EFE6] text-[#3E4D3E]"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sess.attendanceStatus}
                    </span>
                  </div>

                  {sess.teacherNotes && (
                    <p className="text-xs text-[#2D332D] dark:text-stone-300 bg-[#FCFAF5] dark:bg-[#232B23] p-3 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]">
                      <strong>Notes:</strong> {sess.teacherNotes}
                    </p>
                  )}

                  {sess.homework && (
                    <p className="text-xs text-[#8B5A2B] bg-[#FCFAF5] dark:bg-[#232B23] p-2.5 rounded-lg border border-[#E8E5DB]">
                      <strong>Homework:</strong> {sess.homework}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Insights */}
      {activeTab === "insights" && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#8B5A2B] font-bold border border-[#E8E5DB]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                AI Progress Observation
              </h3>
              <p className="text-xs text-[#7A7D75]">
                Generated from session notes, quiz accuracy, and memory tests.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3 text-xs text-[#2D332D] dark:text-stone-300">
            <p className="leading-relaxed">
              « {student.name} demonstrates a 90% accuracy rate in direct ayah continuation exercises. His Tajweed pronunciation of letter 'Ayn and Qaf has improved dramatically over the past two sessions. »
            </p>
            <p className="font-semibold text-[#8B5A2B]">
              Recommended Next Step: Proceed with Surah An-Nas and initiate brief daily Qalqalah drills.
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: Memory Map */}
      {activeTab === "memory" && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              Student Memory & Mastery Matrix
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {studentMemoryNodes.map((node) => (
              <div
                key={node.id}
                className={`p-3.5 rounded-lg border text-xs space-y-1 transition-all ${
                  node.status === "completed"
                    ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#5A6B5A] text-[#3E4D3E] dark:text-[#8BA888]"
                    : node.status === "current"
                    ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#8B5A2B] text-[#8B5A2B]"
                    : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A] text-[#7A7D75]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">{node.title}</span>
                  {node.status === "completed" && <CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" />}
                </div>
                {node.titleArabic && (
                  <p className="font-serif text-xs text-right font-bold">{node.titleArabic}</p>
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">
                  {node.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

