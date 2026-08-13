import React, { useEffect, useMemo, useState } from "react";
import { Student, SubjectType } from "../../types";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { SUBJECTS } from "../../lib/subjects";
import { X, BookOpen, Check, Plus, Loader2 } from "lucide-react";

interface AssignCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onCreateCurriculum?: () => void;
}

export const AssignCurriculumModal: React.FC<AssignCurriculumModalProps> = ({ isOpen, onClose, student, onCreateCurriculum }) => {
  const { curriculums, assignCurriculumToStudent, getStudentCurriculum } = useData();
  const { t, language, isRTL } = useLanguage();
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<SubjectType | "all">("all");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student || !isOpen) return;
    setSelectedCurriculumId(getStudentCurriculum(student.id).curriculum?.id || "");
    setSubjectFilter("all");
    setError(null);
  }, [student, isOpen, getStudentCurriculum]);

  const availableCurriculums = useMemo(
    () => curriculums.filter((curriculum) => subjectFilter === "all" || curriculum.subject === subjectFilter),
    [curriculums, subjectFilter],
  );

  const handleAssign = async () => {
    if (!student || !selectedCurriculumId) return;
    setIsSaving(true);
    setError(null);
    try {
      await assignCurriculumToStudent(student.id, selectedCurriculumId);
      onClose();
    } catch {
      setError(language === "ar" ? "تعذر حفظ تعيين المنهج. حاول مرة أخرى." : "Unable to save the curriculum assignment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      <div role="dialog" aria-modal="true" aria-labelledby="assign-curriculum-title" className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5"><div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB]"><BookOpen className="w-5 h-5" /></div><div><h3 id="assign-curriculum-title" className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">{t("assignCurriculum")}</h3><p className="text-xs text-[#7A7D75] dark:text-stone-400">{language === "ar" ? `لـ ${student.name}` : `For ${student.name}`}</p></div></div>
          <button onClick={onClose} aria-label={t("close")} className="p-2 rounded-lg text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-2"><label htmlFor="assignment-subject-filter" className="text-xs font-semibold text-[#2D332D] dark:text-stone-200">{t("filterBySubject")}</label><select id="assignment-subject-filter" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value as SubjectType | "all")} className="w-full px-3 py-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium"><option value="all">{t("allSubjects")}</option>{SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></div>

        {error && <p role="alert" className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">{error}</p>}

        {availableCurriculums.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-[#E8E5DB] dark:border-[#2A352A] space-y-3"><BookOpen className="w-8 h-8 mx-auto text-[#7A7D75]" /><p className="text-sm font-semibold text-[#2D332D] dark:text-stone-200">{language === "ar" ? "لا توجد مناهج متاحة بعد." : "No curriculums available yet."}</p><p className="text-xs text-[#7A7D75]">{language === "ar" ? "أنشئ منهجًا أولًا ثم عيّنه لهذا الطالب." : "Create a curriculum first, then assign it to this student."}</p>{onCreateCurriculum && <button onClick={onCreateCurriculum} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5A6B5A] text-white text-xs font-semibold"><Plus className="w-4 h-4" />{t("createCurriculum")}</button>}</div>
        ) : (
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">{availableCurriculums.map((curriculum) => { const isSelected = selectedCurriculumId === curriculum.id; const isCurrent = getStudentCurriculum(student.id).curriculum?.id === curriculum.id; return <button key={curriculum.id} type="button" onClick={() => setSelectedCurriculumId(curriculum.id)} aria-pressed={isSelected} className={`w-full text-start p-4 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-4 ${isSelected ? "border-[#5A6B5A] bg-[#FCFAF5] dark:bg-[#232B23]" : "border-[#E8E5DB] dark:border-[#2A352A] hover:border-[#5A6B5A]/40"}`}><div className="space-y-1.5 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">{curriculum.name}</span><span className="px-2 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-semibold">{curriculum.subject}</span><span className="px-2 py-0.5 rounded border border-[#E8E5DB] text-[10px] text-[#7A7D75]">{curriculum.level}</span>{isCurrent && <span className="text-[10px] font-bold text-[#8B5A2B]">{language === "ar" ? "مُعيّن حاليًا" : "Currently assigned"}</span>}</div><p className="text-xs text-[#7A7D75] dark:text-stone-400 line-clamp-2">{curriculum.description || (language === "ar" ? "لا يوجد وصف." : "No description provided.")}</p><p className="text-[10px] text-[#7A7D75]">{curriculum.lessons.length} {language === "ar" ? "درسًا" : "lessons"} · {new Date(curriculum.createdAt).toLocaleDateString()}</p></div><span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? "bg-[#5A6B5A] text-white border-[#5A6B5A]" : "border-[#E8E5DB] dark:border-stone-600"}`}>{isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}</span></button>; })}</div>
        )}

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E5DB] dark:border-[#2A352A]"><button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] text-[#2D332D] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] text-xs font-semibold cursor-pointer">{t("cancel")}</button><button onClick={handleAssign} disabled={!selectedCurriculumId || isSaving || availableCurriculums.length === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer">{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}{isSaving ? (language === "ar" ? "جارٍ الحفظ..." : "Assigning...") : t("save")}</button></div>
      </div>
    </div>
  );
};
