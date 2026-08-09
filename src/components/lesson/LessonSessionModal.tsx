import React, { useState } from "react";
import { Student, AttendanceStatus } from "../../types";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { X, Play, Save, CheckCircle2, Clock, XCircle } from "lucide-react";

interface LessonSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedStudentId?: string;
}

export const LessonSessionModal: React.FC<LessonSessionModalProps> = ({
  isOpen,
  onClose,
  preSelectedStudentId,
}) => {
  const { students, curriculums, studentCurriculums, recordLessonSession } = useData();
  const { t } = useLanguage();

  const activeStudents = students.filter((s) => s.status === "Active");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preSelectedStudentId || activeStudents[0]?.id || ""
  );

  const studentSC = studentCurriculums.find((sc) => sc.studentId === selectedStudentId);
  const studentCurr = curriculums.find((c) => c.id === studentSC?.curriculumId);

  const defaultTopic =
    studentCurr?.lessons.find((l) => l.id === studentSC?.currentLessonId)?.title ||
    studentCurr?.lessons[0]?.title ||
    "Surah Al-Fatihah & Basmalah";

  const [lessonTitle, setLessonTitle] = useState(defaultTopic);
  const [attendance, setAttendance] = useState<AttendanceStatus>("Present");
  const [recitationRating, setRecitationRating] = useState<"Excellent" | "Good" | "Needs Revision">("Good");
  const [versesCovered, setVersesCovered] = useState("Verses 1 - 7");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [homework, setHomework] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !lessonTitle.trim()) return;

    recordLessonSession({
      studentId: selectedStudentId,
      curriculumId: studentCurr?.id,
      lessonTitle,
      date: new Date().toISOString().split("T")[0],
      attendanceStatus: attendance,
      teacherNotes,
      homework,
      memorizationScore: recitationRating === "Excellent" ? 95 : recitationRating === "Good" ? 80 : 60,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB]">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {t("startLesson")}
              </h3>
              <p className="text-xs text-[#7A7D75] dark:text-stone-400">Record session details & update progress.</p>
            </div>
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
          {/* Select Student */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("selectStudent")} *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const newSC = studentCurriculums.find((sc) => sc.studentId === e.target.value);
                const newCurr = curriculums.find((c) => c.id === newSC?.curriculumId);
                if (newCurr) {
                  const topic =
                    newCurr.lessons.find((l) => l.id === newSC?.currentLessonId)?.title ||
                    newCurr.lessons[0]?.title ||
                    "Lesson Topic";
                  setLessonTitle(topic);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.level})
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Selection */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] block">
              {t("attendance")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "Present", label: t("present"), icon: <CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" /> },
                { type: "Late", label: t("late"), icon: <Clock className="w-4 h-4 text-[#8B5A2B]" /> },
                { type: "Absent", label: t("absent"), icon: <XCircle className="w-4 h-4 text-rose-700" /> },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setAttendance(item.type as AttendanceStatus)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                    attendance === item.type
                      ? "border-[#5A6B5A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888]"
                      : "border-[#E8E5DB] dark:border-[#2A352A] text-[#7A7D75] dark:text-stone-300 hover:bg-[#F2EFE6]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lesson Title / Topic */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("lessonTopic")} *
            </label>
            <input
              type="text"
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g. Surah Al-Fatihah & Tajweed Rules"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          {/* Recitation / Recitation Mastery */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                Performance Rating
              </label>
              <select
                value={recitationRating}
                onChange={(e) => setRecitationRating(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
              >
                <option value="Excellent">Excellent (95%)</option>
                <option value="Good">Good (80%)</option>
                <option value="Needs Revision">Needs Revision (60%)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                Verses / Pages Range
              </label>
              <input
                type="text"
                value={versesCovered}
                onChange={(e) => setVersesCovered(e.target.value)}
                placeholder="e.g. Ayah 1 - 7"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
              />
            </div>
          </div>

          {/* Teacher Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("teacherNotes")}
            </label>
            <textarea
              rows={2}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="e.g. Recitation was smooth, focus on Madd Asli next time..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          {/* Homework Assignment */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
              {t("homework")}
            </label>
            <input
              type="text"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="e.g. Repeat Surah Al-Fatihah 5 times with audio recording"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
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
              <span>Record & Advance Progress</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

