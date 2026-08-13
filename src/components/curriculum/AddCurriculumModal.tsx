import React, { useState } from "react";
import { Curriculum, CurriculumLesson, LevelType, SubjectType } from "../../types";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { X, Plus, Trash2, MoveUp, MoveDown, BookOpen, Save } from "lucide-react";
import { SUBJECTS } from "../../lib/subjects";

interface AddCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCurriculum?: Curriculum | null;
}

export const AddCurriculumModal: React.FC<AddCurriculumModalProps> = ({
  isOpen,
  onClose,
  editCurriculum,
}) => {
  const { createCurriculum, updateCurriculum } = useData();
  const { t } = useLanguage();

  const [name, setName] = useState(editCurriculum?.name || "");
  const [subject, setSubject] = useState<SubjectType | "">(editCurriculum?.subject || "");
  const [level, setLevel] = useState<LevelType>(editCurriculum?.level || "Beginner");
  const [description, setDescription] = useState(editCurriculum?.description || "");
  const [lessons, setLessons] = useState<CurriculumLesson[]>(
    editCurriculum?.lessons || [
      { id: "les-1", order: 1, title: "Lesson 1: Introduction & Basics", durationMinutes: 45 },
    ]
  );

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonArabic, setNewLessonArabic] = useState("");

  if (!isOpen) return null;

  const handleAddLesson = () => {
    if (!newLessonTitle.trim()) return;
    const newLesson: CurriculumLesson = {
      id: `les-${Date.now()}`,
      order: lessons.length + 1,
      title: newLessonTitle,
      titleArabic: newLessonArabic || undefined,
      durationMinutes: 45,
    };
    setLessons([...lessons, newLesson]);
    setNewLessonTitle("");
    setNewLessonArabic("");
  };

  const handleRemoveLesson = (id: string) => {
    setLessons(lessons.filter((l) => l.id !== id).map((l, idx) => ({ ...l, order: idx + 1 })));
  };

  const handleMoveLesson = (index: number, direction: "up" | "down") => {
    const updated = [...lessons];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // reorder numbers
    setLessons(updated.map((l, idx) => ({ ...l, order: idx + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject) return;

    if (editCurriculum) {
      await updateCurriculum(editCurriculum.id, {
        name,
        subject,
        level,
        description,
        lessons,
      });
    } else {
      await createCurriculum({
        name,
        subject,
        level,
        description,
        lessons,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {editCurriculum ? "Edit Curriculum" : t("createCurriculum")}
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
          {/* Name */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("curriculumName")} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Juz 'Amma Memorization & Tajweed Program"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          {/* Subject & Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                {t("curriculumSubject")}
              </label>
                              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                {t("level")}
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelType)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("curriculumDescription")}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of goals and structure..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          {/* Lessons / Topics List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-[#E8E5DB] dark:border-[#2A352A] pt-3">
              <label className="font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] text-xs">
                {t("lessonsAndTopics")} ({lessons.length})
              </label>
            </div>

            {/* Quick Add Lesson Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="Lesson Title (e.g. Surah Al-Fatihah)"
                className="flex-1 px-3 py-2 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs focus:outline-none focus:border-[#5A6B5A]"
              />
              <input
                type="text"
                value={newLessonArabic}
                onChange={(e) => setNewLessonArabic(e.target.value)}
                placeholder="Arabic (Optional)"
                className="w-32 px-3 py-2 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-serif focus:outline-none focus:border-[#5A6B5A]"
              />
              <button
                type="button"
                onClick={handleAddLesson}
                className="px-3.5 py-2 rounded-lg bg-[#5A6B5A] text-white font-semibold text-xs hover:bg-[#495749] cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Lesson Rows */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-[#F2EFE6] dark:bg-[#161D17] text-[#5A6B5A] font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">
                        {lesson.title}
                      </span>
                      {lesson.titleArabic && (
                        <span className="text-[#7A7D75] font-serif ml-2">
                          ({lesson.titleArabic})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveLesson(index, "up")}
                      className="p-1 text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] disabled:opacity-30 cursor-pointer"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === lessons.length - 1}
                      onClick={() => handleMoveLesson(index, "down")}
                      className="p-1 text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] disabled:opacity-30 cursor-pointer"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveLesson(lesson.id)}
                      className="p-1 text-rose-700 hover:text-rose-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
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

