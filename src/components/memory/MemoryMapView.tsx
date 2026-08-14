import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { SubjectType } from "../../types";
import { Network, RefreshCw } from "lucide-react";

export const MemoryMapView: React.FC = () => {
  const { students, curriculums, studentCurriculums, getStudentDetectiveResults } = useData();
  const { t, language, isRTL } = useLanguage();
  const activeStudents = students.filter((s) => s.status === "Active");
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudents[0]?.id || "");
  const [activeCategory, setActiveCategory] = useState<SubjectType>("Quran");
  const studentCurriculum = studentCurriculums.find((assignment) => assignment.studentId === selectedStudentId);
  const assignedCurriculum = curriculums.find((item) => item.id === studentCurriculum?.curriculumId && item.subject === activeCategory);
  const memoryResults = selectedStudentId ? getStudentDetectiveResults(selectedStudentId) : [];
  const averageScore = memoryResults.length ? Math.round(memoryResults.reduce((sum, result) => sum + result.scorePercentage, 0) / memoryResults.length) : null;

  return (
    <div id="memory-map-container" className="space-y-6 animate-fade-in pb-12 font-sans p-2" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2.5"><Network className="w-6 h-6 text-[#5A6B5A]" /><span>{t("memoryMap")}</span></h2><p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 mt-1">{language === "ar" ? "اعرض نتائج الذاكرة المسجلة فقط، مع إبقاء المعاينات منفصلة عن إتقان الطالب." : "View recorded memory evidence only; previews never count as student mastery."}</p></div>
        <div className="flex flex-wrap items-center gap-3">
          {activeStudents.length > 0 && <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} aria-label={t("selectStudent")} className="px-3 py-1.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-xs font-medium">{activeStudents.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select>}
          <div className="px-4 py-2 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft flex items-center gap-3"><span className="text-xs font-semibold text-[#7A7D75]">{language === "ar" ? "متوسط الذاكرة:" : "Memory average:"}</span><span className="text-base font-bold text-[#5A6B5A] dark:text-[#8BA888]">{averageScore === null ? "—" : `${averageScore}%`}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">{(["Quran", "Tajweed", "Islamic Studies", "Arabic"] as SubjectType[]).map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeCategory === category ? "bg-[#5A6B5A] text-white shadow-xs" : "bg-white dark:bg-[#161D17] text-[#7A7D75] border border-[#E8E5DB] dark:border-[#2A352A]"}`}>{category}</button>)}</div>

      {memoryResults.length === 0 ? (
        <div className="space-y-4"><div className="p-6 rounded-xl border border-dashed border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#161D17]"><div className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-[#7A7D75]" /><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{language === "ar" ? "معاينة خريطة الذاكرة" : "Memory Map Preview"}</p></div><p className="text-xs text-[#7A7D75] mt-2">{language === "ar" ? "لم يتم تسجيل اختبار ذاكرة لهذا الطالب بعد. سجّل اختبارًا لإظهار الاحتفاظ والإتقان الفعليين." : "No memory test has been recorded for this student yet. Record one to show actual retention and mastery."}</p></div>{assignedCurriculum?.lessons?.length ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{assignedCurriculum.lessons.map((lesson, index) => <div key={lesson.id} className="p-4 rounded-xl border border-dashed border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] space-y-2"><span className="text-[10px] uppercase font-bold tracking-wider text-[#7A7D75]">{language === "ar" ? `درس ${index + 1}` : `Lesson ${index + 1}`}</span><h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">{lesson.title}</h4><span className="text-[10px] uppercase font-bold text-[#7A7D75]">{language === "ar" ? "لم يُختبر" : "Not tested"}</span></div>)}</div> : null}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{memoryResults.map((result) => <div key={result.id} className="p-5 rounded-xl border border-[#5A6B5A]/40 bg-[#FCFAF5] dark:bg-[#232B23] space-y-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{result.surahRange}</span><span className="text-2xl font-bold text-[#5A6B5A]">{result.scorePercentage}%</span></div><p className="text-[10px] text-[#7A7D75]">{result.date}</p>{result.strongAreas?.length ? <p className="text-xs text-[#3E4D3E] dark:text-[#8BA888]">{language === "ar" ? "نقاط قوية:" : "Strong areas:"} {result.strongAreas.join(", ")}</p> : null}{result.needsPractice?.length ? <p className="text-xs text-[#8B5A2B]">{language === "ar" ? "تحتاج ممارسة:" : "Needs practice:"} {result.needsPractice.join(", ")}</p> : null}</div>)}</div>
      )}
    </div>
  );
};
