import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { Student, SubjectType } from "../../types";
import {
  Users,
  Search,
  Plus,
  BookOpen,
  Play,
  ArrowRight,
  Edit2,
  Archive,
} from "lucide-react";

interface StudentsListProps {
  onSelectProfile: (studentId: string) => void;
  onOpenAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onAssignCurriculum: (student: Student) => void;
  onStartLesson: (studentId: string) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({
  onSelectProfile,
  onOpenAddStudent,
  onEditStudent,
  onAssignCurriculum,
  onStartLesson,
}) => {
  const { students, getStudentCurriculum, archiveStudent } = useData();
  const { t, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const activeStudents = students.filter((s) => s.status === "Active");

  const filteredStudents = activeStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nativeLanguage?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      subjectFilter === "all" || student.subjects.includes(subjectFilter as SubjectType);

    const matchesLevel = levelFilter === "all" || student.level === levelFilter;

    return matchesSearch && matchesSubject && matchesLevel;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#5A6B5A] dark:text-[#8BA888]" />
            <span>{t("students")}</span>
            <span className="px-2.5 py-0.5 rounded bg-[#E8E5DB] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold not-italic">
              {activeStudents.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 mt-1 font-sans">
            Manage your international students, curriculum progress, and class history.
          </p>
        </div>

        <button
          onClick={onOpenAddStudent}
          className="ir-button ir-button-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("addStudent")}</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="ir-surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-3 text-[#7A7D75]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search")}
            className="ir-input w-full pl-10 rtl:pr-10 rtl:pl-3.5 pr-3.5 py-2 text-xs focus:outline-none"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="ir-input w-full px-3.5 py-2 text-xs focus:outline-none"
        >
          <option value="all">{t("allSubjects")}</option>
          <option value="Quran">Quran</option>
          <option value="Tajweed">Tajweed</option>
          <option value="Islamic Studies">Islamic Studies</option>
          <option value="Arabic">Arabic</option>
        </select>

        {/* Level Filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="ir-input w-full px-3.5 py-2 text-xs focus:outline-none"
        >
          <option value="all">{t("allLevels")}</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="ir-surface p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-[#7A7D75] mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
            No students found
          </h3>
          <p className="text-xs text-[#7A7D75] max-w-sm mx-auto">
            Your students will appear here. Add your first student to get started.
          </p>
          <button
            onClick={onOpenAddStudent}
            className="px-4 py-2 rounded-lg bg-[#5A6B5A] text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addStudent")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => {
            const { curriculum, studentCurriculum } = getStudentCurriculum(student.id);
            const progressPct = studentCurriculum?.progressPercentage || 0;

            return (
              <div
                key={student.id}
                className="ir-surface ir-card-interactive p-5 flex flex-col justify-between gap-4"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#5A6B5A] text-white font-serif font-bold text-base flex items-center justify-center">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3
                          onClick={() => onSelectProfile(student.id)}
                          className="font-semibold text-base text-[#1F261F] dark:text-[#E2E8E2] hover:text-[#5A6B5A] cursor-pointer"
                        >
                          {student.name}
                        </h3>
                        <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                          Age {student.age} • {student.nativeLanguage || "English"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditStudent(student)}
                        className="p-1.5 rounded-md text-[#7A7D75] hover:text-[#3E4D3E] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] transition-colors cursor-pointer"
                        title="Edit Student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => archiveStudent(student.id)}
                        className="p-1.5 rounded-md text-[#7A7D75] hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subjects & Level Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-0.5 rounded bg-[#8B5A2B]/10 text-[#8B5A2B] text-[10px] font-bold">
                      {student.level}
                    </span>
                    {student.subjects.map((subj) => (
                      <span
                        key={subj}
                        className="px-2.5 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-bold"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>

                  {/* Current Curriculum & Progress Bar */}
                  <div className="p-3 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#3E4D3E] dark:text-stone-300 truncate max-w-[160px]">
                        {curriculum ? curriculum.name : "No Curriculum Assigned"}
                      </span>
                      <span className="text-[#5A6B5A] dark:text-[#8BA888] font-bold shrink-0">
                        {progressPct}%
                      </span>
                    </div>

                    <div className="w-full bg-[#F2EFE6] dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#5A6B5A] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onAssignCurriculum(student)}
                    className="p-2 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] text-[#3E4D3E] dark:text-stone-300 hover:border-[#5A6B5A] hover:text-[#5A6B5A] text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                    title={t("assignCurriculum")}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Curriculum</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartLesson(student.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] hover:bg-[#E8E5DB] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t("startLesson")}</span>
                    </button>

                    <button
                      onClick={() => onSelectProfile(student.id)}
                      className="ir-button ir-button-primary px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{t("viewProfile")}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

