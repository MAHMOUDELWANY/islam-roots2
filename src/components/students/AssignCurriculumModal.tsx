import React, { useState } from "react";
import { Student } from "../../types";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { X, BookOpen, Check } from "lucide-react";

interface AssignCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const AssignCurriculumModal: React.FC<AssignCurriculumModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { curriculums, assignCurriculumToStudent, getStudentCurriculum } = useData();
  const { t } = useLanguage();

  const currentAssignment = student ? getStudentCurriculum(student.id) : null;
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>(
    currentAssignment?.curriculum?.id || ""
  );

  if (!isOpen || !student) return null;

  const handleAssign = () => {
    if (selectedCurriculumId) {
      assignCurriculumToStudent(student.id, selectedCurriculumId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {t("assignCurriculum")}
              </h3>
              <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                For {student.name} ({student.level})
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

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {curriculums.map((c) => {
            const isSelected = selectedCurriculumId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCurriculumId(c.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "border-[#5A6B5A] bg-[#FCFAF5] dark:bg-[#232B23]"
                    : "border-[#E8E5DB] dark:border-[#2A352A] hover:border-[#5A6B5A]/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xs text-[#1F261F] dark:text-[#E2E8E2]">
                      {c.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-semibold">
                      {c.subject}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7D75] dark:text-stone-400 line-clamp-1">
                    {c.description} • {c.lessons.length} Lessons
                  </p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? "bg-[#5A6B5A] text-white border-[#5A6B5A]"
                      : "border-[#E8E5DB] dark:border-stone-600"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E5DB] dark:border-[#2A352A]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] text-[#2D332D] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] text-xs font-semibold cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedCurriculumId}
            className="px-5 py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
};

