import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
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
  CircleDashed,
} from "lucide-react";

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  onStartLesson: (studentId: string) => void;
  onOpenAssignCurriculum: (student: any) => void;
}

const copy = {
  en: {
    notFound: "Student not found.",
    back: "Back to Students",
    changeCurriculum: "Change Curriculum",
    assignFirst: "Assign First Curriculum",
    noCurriculum: "No curriculum assigned",
    assignDescription: "Assign a curriculum to start building this student's learning journey.",
    noStrengths: "No strengths identified yet.",
    strengthsDescription: "Strengths will appear after enough lesson, assessment, quiz, or memory data has been recorded.",
    noGaps: "No learning gaps identified yet.",
    gapsDescription: "Areas needing attention will appear after sufficient assessment data is available.",
    noData: "No learning data yet",
    insightDescription: "Record a lesson, quiz, assessment, or memory test to unlock evidence-based AI observations.",
    memoryPreview: "Memory Map Preview",
    noMemory: "No memory data has been recorded for this student yet.",
    memoryDescription: "After you record memory tests and revision results, this map will show actual retention and mastery.",
    notTested: "Not tested",
    completed: "Completed",
    current: "In progress",
    upcoming: "Not started",
    noHistory: "No completed lesson sessions recorded yet.",
    noNotes: "No additional notes entered.",
    notProvided: "Not provided",
    noAttendance: "No attendance data yet",
    evidence: "Based on recorded learning evidence",
  },
  ar: {
    notFound: "لم يتم العثور على الطالب.",
    back: "العودة إلى الطلاب",
    changeCurriculum: "تغيير المنهج",
    assignFirst: "تعيين أول منهج",
    noCurriculum: "لم يتم تعيين منهج",
    assignDescription: "عيّن منهجًا لبدء بناء رحلة تعلم هذا الطالب.",
    noStrengths: "لم يتم تحديد نقاط قوة بعد.",
    strengthsDescription: "ستظهر نقاط القوة بعد تسجيل بيانات كافية من الدروس أو التقييمات أو الاختبارات أو الذاكرة.",
    noGaps: "لم يتم تحديد فجوات تعلم بعد.",
    gapsDescription: "ستظهر مجالات التركيز بعد توفر بيانات تقييم كافية.",
    noData: "لا توجد بيانات تعلم بعد",
    insightDescription: "سجّل درسًا أو اختبارًا أو تقييمًا أو اختبار ذاكرة لفتح ملاحظات ذكاء اصطناعي مبنية على الأدلة.",
    memoryPreview: "معاينة خريطة الذاكرة",
    noMemory: "لم يتم تسجيل بيانات ذاكرة لهذا الطالب بعد.",
    memoryDescription: "بعد تسجيل اختبارات الذاكرة ونتائج المراجعة، ستعرض الخريطة الاحتفاظ والإتقان الفعليين.",
    notTested: "لم يُختبر",
    completed: "مكتمل",
    current: "قيد التقدم",
    upcoming: "لم يبدأ",
    noHistory: "لم يتم تسجيل جلسات دروس مكتملة بعد.",
    noNotes: "لم تتم إضافة ملاحظات.",
    notProvided: "غير متوفر",
    noAttendance: "لا توجد بيانات حضور بعد",
    evidence: "بناءً على أدلة التعلم المسجلة",
  },
} as const;

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  onBack,
  onStartLesson,
  onOpenAssignCurriculum,
}) => {
  const { getStudentById, getStudentCurriculum, getStudentSessions, getStudentDetectiveResults } = useData();
  const { t, isRTL, language } = useLanguage();
  const text = copy[language];
  const [activeTab, setActiveTab] = useState<"overview" | "journey" | "history" | "insights" | "memory">("overview");

  const student = getStudentById(studentId);
  if (!student) {
    return (
      <div className="p-8 text-center space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        <p className="text-[#7A7D75]">{text.notFound}</p>
        <button onClick={onBack} className="px-4 py-2 bg-[#5A6B5A] text-white rounded-lg text-xs font-semibold">
          {text.back}
        </button>
      </div>
    );
  }

  const { curriculum, studentCurriculum } = getStudentCurriculum(student.id);
  const sessions = getStudentSessions(student.id);
  const detectiveResults = getStudentDetectiveResults(student.id);
  const totalSessions = sessions.length;
  const presentSessions = sessions.filter((s) => s.attendanceStatus === "Present").length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : null;
  const completedLessonIds = studentCurriculum?.completedLessonIds || [];
  const hasLearningEvidence = Boolean(
    sessions.length ||
      detectiveResults.length ||
      completedLessonIds.length ||
      sessions.some((session) => session.teacherNotes?.trim() || session.quizScore !== undefined || session.objectives?.length),
  );
  const memoryLessons = curriculum?.lessons || [];
  const currentLessonId = studentCurriculum?.currentLessonId;

  const statsLabel = useMemo(() => {
    if (attendanceRate === null) return text.noAttendance;
    return `${attendanceRate}%`;
  }, [attendanceRate, text.noAttendance]);

  return (
    <div className="space-y-6 animate-fade-in pb-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] text-[#2D332D] dark:text-[#E2E8E2] hover:text-[#5A6B5A] text-xs font-semibold shadow-soft transition-all cursor-pointer"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          <span>{t("students")}</span>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={() => onStartLesson(student.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t("startLesson")}</span>
          </button>
        </div>
      </div>

      <div id="student-profile-container" className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#5A6B5A] text-white font-serif font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-xs shrink-0">{student.name.charAt(0)}</div>
            <div className="space-y-1 font-sans">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{student.name}</h2>
                <span className="px-3 py-1 rounded bg-[#8B5A2B]/10 text-[#8B5A2B] text-xs font-bold">{student.level}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 flex flex-wrap items-center gap-2">
                <span>{t("age")} {student.age}</span>
                <span>•</span>
                <span>{student.nativeLanguage || text.notProvided}</span>
                {student.learningLanguage && <><span>•</span><span className="text-[#3E4D3E] dark:text-[#8BA888] font-semibold">{student.learningLanguage}</span></>}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {student.subjects.length ? student.subjects.map((subj) => <span key={subj} className="px-2.5 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-bold">{subj}</span>) : <span className="text-xs text-[#7A7D75]">{text.notProvided}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#E8E5DB] dark:border-[#2A352A]">
            <div className="text-center px-4 py-2 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] min-w-[90px]">
              <span className="text-2xl font-bold text-[#5A6B5A] dark:text-[#8BA888]">{studentCurriculum?.progressPercentage || 0}%</span>
              <span className="text-[10px] text-[#7A7D75] block font-semibold">{t("overallProgress")}</span>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] min-w-[90px]">
              <span className="text-lg font-bold text-[#8B5A2B]">{statsLabel}</span>
              <span className="text-[10px] text-[#7A7D75] block font-semibold">{t("attendanceRate")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-t border-[#E8E5DB] dark:border-[#2A352A] pt-4 no-scrollbar">
          {[
            { id: "overview", labelKey: "overview", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "journey", labelKey: "curriculumProgress", icon: <BookOpen className="w-4 h-4" /> },
            { id: "history", labelKey: "lessonHistory", icon: <History className="w-4 h-4" /> },
            { id: "insights", labelKey: "aiInsights", icon: <Sparkles className="w-4 h-4 text-[#8B5A2B]" /> },
            { id: "memory", labelKey: "memoryMap", icon: <Network className="w-4 h-4" /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-[#5A6B5A] text-white shadow-xs" : "text-[#7A7D75] dark:text-stone-300 hover:bg-[#F2EFE6] dark:hover:bg-[#232B23]"}`}>
              {tab.icon}<span>{t(tab.labelKey as any)}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#5A6B5A]" /><span>{t("currentCurriculum")}</span></h3>
                <button onClick={() => onOpenAssignCurriculum(student)} className="text-xs font-semibold text-[#5A6B5A] hover:underline cursor-pointer">{text.changeCurriculum}</button>
              </div>
              {curriculum ? (
                <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
                  <div className="flex items-center justify-between"><div><h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">{curriculum.name}</h4><p className="text-xs text-[#7A7D75] dark:text-stone-400">{curriculum.description || text.notProvided}</p></div><span className="px-2.5 py-1 rounded bg-[#5A6B5A] text-white text-xs font-semibold">{studentCurriculum?.progressPercentage || 0}%</span></div>
                  <div className="w-full bg-[#F2EFE6] dark:bg-stone-700 h-2.5 rounded-full overflow-hidden"><div className="bg-[#5A6B5A] h-full rounded-full transition-all duration-500" style={{ width: `${studentCurriculum?.progressPercentage || 0}%` }} /></div>
                  <p className="text-xs text-[#2D332D] dark:text-stone-300 font-medium">{text.current}: <span className="font-semibold text-[#3E4D3E] dark:text-[#8BA888]">{curriculum.lessons.find((l) => l.id === currentLessonId)?.title || text.notProvided}</span></p>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-dashed border-[#E8E5DB] dark:border-[#2A352A] space-y-3"><CircleDashed className="w-8 h-8 mx-auto text-[#7A7D75]" /><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{text.noCurriculum}</p><p className="text-xs text-[#7A7D75]">{text.assignDescription}</p><button onClick={() => onOpenAssignCurriculum(student)} className="px-4 py-2 rounded-lg bg-[#5A6B5A] text-white text-xs font-semibold cursor-pointer inline-block">{text.assignFirst}</button></div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2"><h4 className="text-xs font-bold text-[#3E4D3E] dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" /><span>{t("strengths")}</span></h4><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{text.noStrengths}</p><p className="text-xs text-[#7A7D75] leading-relaxed">{text.strengthsDescription}</p></div>
              <div className="p-5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2"><h4 className="text-xs font-bold text-[#8B5A2B] uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /><span>{t("areasNeedingAttention")}</span></h4><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{text.noGaps}</p><p className="text-xs text-[#7A7D75] leading-relaxed">{text.gapsDescription}</p></div>
            </div>
          </div>
          <div className="space-y-6"><div className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3"><h3 className="text-sm font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{language === "ar" ? "ملاحظات المعلم والملف الشخصي" : "Teacher Notes & Profile"}</h3><p className="text-xs text-[#2D332D] dark:text-stone-300 leading-relaxed bg-[#FCFAF5] dark:bg-[#232B23] p-3 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]">{student.notes || text.noNotes}</p><div className="pt-2 text-xs text-[#7A7D75] space-y-1"><p><strong className="text-[#3E4D3E] dark:text-stone-300">{language === "ar" ? "الجنسية:" : "Nationality:"}</strong> {student.nationality || text.notProvided}</p><p><strong className="text-[#3E4D3E] dark:text-stone-300">{language === "ar" ? "تاريخ الانضمام:" : "Joined:"}</strong> {new Date(student.createdAt).toLocaleDateString()}</p></div></div></div>
        </div>
      )}

      {activeTab === "journey" && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{t("curriculumProgress")}</h3><p className="text-xs text-[#7A7D75]">{student.name}</p></div>{curriculum && <span className="px-3 py-1 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold">{curriculum.name}</span>}</div>
          {curriculum && curriculum.lessons.length > 0 ? <div className="relative pl-6 rtl:pr-6 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 border-[#E8E5DB] dark:border-[#2A352A] space-y-6 my-6">{curriculum.lessons.map((lesson, idx) => { const isCompleted = completedLessonIds.includes(lesson.id); const isCurrent = currentLessonId === lesson.id; const status = isCompleted ? text.completed : isCurrent ? text.current : text.upcoming; return <div key={lesson.id} className="relative flex items-start gap-4"><div className={`absolute -left-[35px] rtl:-right-[35px] rtl:left-auto top-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${isCompleted ? "bg-[#5A6B5A] text-white" : isCurrent ? "bg-[#8B5A2B] text-white" : "bg-[#E8E5DB] dark:bg-stone-700 text-[#7A7D75]"}`}>{isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}</div><div className={`flex-1 p-4 rounded-lg border ${isCurrent ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#8B5A2B]" : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A]"}`}><div className="flex items-center justify-between gap-3"><div><h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">{lesson.title}</h4><p className="text-xs text-[#7A7D75]">{lesson.description || text.notProvided}</p><p className="text-[10px] text-[#7A7D75] mt-1">{lesson.durationMinutes || 0} {language === "ar" ? "دقيقة" : "min"}</p></div><span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-[#F2EFE6] dark:bg-stone-700 text-[#3E4D3E] dark:text-stone-300">{status}</span></div></div></div>; })}</div> : <div className="p-8 text-center rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-dashed border-[#E8E5DB] dark:border-[#2A352A] space-y-3"><BookOpen className="w-8 h-8 mx-auto text-[#7A7D75]" /><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{text.noCurriculum}</p><p className="text-xs text-[#7A7D75]">{text.assignDescription}</p><button onClick={() => onOpenAssignCurriculum(student)} className="px-4 py-2 rounded-lg bg-[#5A6B5A] text-white text-xs font-semibold cursor-pointer">{text.assignFirst}</button></div>}
        </div>
      )}

      {activeTab === "history" && <div className="space-y-4"><h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{t("lessonHistory")} ({sessions.length})</h3>{sessions.length === 0 ? <div className="p-8 text-center rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] text-xs text-[#7A7D75]">{text.noHistory}</div> : <div className="space-y-3">{sessions.map((sess) => <div key={sess.id} className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#5A6B5A]" /><span className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">{sess.lessonTitle}</span><span className="text-xs text-[#7A7D75]">({sess.date})</span></div><span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F2EFE6] text-[#3E4D3E]">{sess.attendanceStatus}</span></div>{sess.teacherNotes && <p className="text-xs text-[#2D332D] dark:text-stone-300 bg-[#FCFAF5] dark:bg-[#232B23] p-3 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]"><strong>{t("notes")}:</strong> {sess.teacherNotes}</p>}{sess.homework && <p className="text-xs text-[#8B5A2B] bg-[#FCFAF5] dark:bg-[#232B23] p-2.5 rounded-lg border border-[#E8E5DB]"><strong>{t("homework")}:</strong> {sess.homework}</p>}</div>)}</div>}</div>}

      {activeTab === "insights" && <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#8B5A2B] font-bold border border-[#E8E5DB]"><Sparkles className="w-6 h-6" /></div><div><h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{t("aiInsights")}</h3><p className="text-xs text-[#7A7D75]">{text.evidence}</p></div></div>{!hasLearningEvidence ? <div className="p-6 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-dashed border-[#E8E5DB] dark:border-[#2A352A] space-y-2"><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{text.noData}</p><p className="text-xs text-[#7A7D75]">{text.insightDescription}</p></div> : <div className="p-5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2 text-xs text-[#2D332D] dark:text-stone-300"><p>{text.evidence}.</p><p>{sessions.length} {t("lessonHistory").toLowerCase()} · {detectiveResults.length} {t("memoryMap").toLowerCase()} {language === "ar" ? "اختبار" : "tests"}.</p></div>}</div>}

      {activeTab === "memory" && <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{t("memoryMap")}</h3><p className="text-xs text-[#7A7D75]">{hasLearningEvidence ? text.evidence : text.memoryPreview}</p></div></div>{detectiveResults.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{detectiveResults.map((result) => <div key={result.id} className="p-4 rounded-lg border border-[#5A6B5A]/40 bg-[#FCFAF5] dark:bg-[#232B23]"><div className="flex items-center justify-between"><span className="text-xs font-semibold">{result.surahRange}</span><span className="text-lg font-bold text-[#5A6B5A]">{result.scorePercentage}%</span></div><p className="text-[10px] text-[#7A7D75] mt-2">{result.date}</p></div>)}</div> : memoryLessons.length > 0 ? <div className="space-y-2"><div className="p-4 rounded-lg border border-dashed border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23]"><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{text.memoryPreview}</p><p className="text-xs text-[#7A7D75] mt-1">{text.noMemory}</p><p className="text-xs text-[#7A7D75] mt-1">{text.memoryDescription}</p></div>{memoryLessons.slice(0, 6).map((lesson, idx) => <div key={lesson.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A]"><span className="text-xs font-semibold">{idx + 1}. {lesson.title}</span><span className="text-[10px] uppercase text-[#7A7D75]">{text.notTested}</span></div>)}</div> : <div className="p-8 text-center rounded-lg border border-dashed border-[#E8E5DB] dark:border-[#2A352A]"><Network className="w-8 h-8 mx-auto text-[#7A7D75]" /><p className="text-sm font-semibold mt-2">{text.memoryPreview}</p><p className="text-xs text-[#7A7D75] mt-1">{text.noMemory}</p></div>}</div>}
    </div>
  );
};
