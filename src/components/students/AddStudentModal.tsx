import React, { useState } from "react";
import { Student, LevelType, SubjectType } from "../../types";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { X, UserPlus, Save } from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editStudent?: Student | null;
  onStudentSaved?: (newStudent: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  editStudent,
  onStudentSaved,
}) => {
  const { addStudent, updateStudent } = useData();
  const { t } = useLanguage();

  const [name, setName] = useState(editStudent?.name || "");
  const [age, setAge] = useState(editStudent?.age || 10);
  const [email, setEmail] = useState(editStudent?.email || "");
  const [nativeLanguage, setNativeLanguage] = useState(editStudent?.nativeLanguage || "English");
  const [learningLanguage, setLearningLanguage] = useState(editStudent?.learningLanguage || "Arabic & Quran");
  const [level, setLevel] = useState<LevelType>(editStudent?.level || "Beginner");
  const [subjects, setSubjects] = useState<SubjectType[]>(editStudent?.subjects || ["Quran"]);
  const [notes, setNotes] = useState(editStudent?.notes || "");

  if (!isOpen) return null;

  const toggleSubject = (subj: SubjectType) => {
    if (subjects.includes(subj)) {
      if (subjects.length > 1) {
        setSubjects(subjects.filter((s) => s !== subj));
      }
    } else {
      setSubjects([...subjects, subj]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editStudent) {
      updateStudent(editStudent.id, {
        name,
        age: Number(age),
        email,
        nativeLanguage,
        learningLanguage,
        level,
        subjects,
        notes,
      });
      onClose();
    } else {
      const created = addStudent({
        name,
        age: Number(age),
        email,
        nativeLanguage,
        learningLanguage,
        level,
        subjects,
        notes,
      });
      if (onStudentSaved) onStudentSaved(created);
      onClose();
    }
  };

  const allSubjects: SubjectType[] = ["Quran", "Tajweed", "Islamic Studies", "Arabic"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB]">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {editStudent ? "Edit Student Profile" : t("addStudent")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Full Name & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                {t("fullName")} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student Name / اسم الطالب"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                {t("age")} *
              </label>
              <input
                type="number"
                required
                min={4}
                max={99}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] text-xs font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("emailOptional")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. parents@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] text-xs font-medium"
            />
          </div>

          {/* Languages */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                {t("nativeLanguage")}
              </label>
              <input
                type="text"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                placeholder="e.g. English, French, German"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                {t("level")}
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] text-xs font-medium"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Subjects Checkboxes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] block">
              {t("subjects")}
            </label>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map((subj) => {
                const isSelected = subjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "bg-[#F2EFE6] dark:bg-[#232B23] text-[#7A7D75] dark:text-stone-300 hover:bg-[#E8E5DB]"
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teacher Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("notes")}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on Tajweed pronunciation, learns visually..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] text-xs font-medium"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E5DB] dark:border-[#2A352A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] text-[#2D332D] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] text-xs font-semibold cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t("save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

