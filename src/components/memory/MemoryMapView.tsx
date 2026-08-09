import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { SubjectType, MemoryMapNode } from "../../types";
import { Network, CheckCircle2, Clock, AlertCircle, Lock } from "lucide-react";

export const MemoryMapView: React.FC = () => {
  const { students, curriculums, studentCurriculums, memoryMapNodes, updateMemoryMapNode } = useData();
  const { t } = useLanguage();

  const activeStudents = students.filter((s) => s.status === "Active");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || "");
  const [activeCategory, setActiveCategory] = useState<SubjectType>("Quran");

  // Find active student's curriculum for this category
  const activeStudent = students.find((s) => s.id === selectedStudentId);
  const studentCurr = studentCurriculums.find((sc) => sc.studentId === selectedStudentId);
  const assignedCurr = curriculums.find(
    (c) => c.id === studentCurr?.curriculumId && c.subject === activeCategory
  );

  // Derive dynamic nodes from curriculum if present, else fallback to category memory nodes
  let dynamicNodes: MemoryMapNode[] = [];
  if (assignedCurr && assignedCurr.lessons.length > 0) {
    const completedIds = studentCurr?.completedLessonIds || [];
    dynamicNodes = assignedCurr.lessons.map((lesson, idx) => {
      const isDone = completedIds.includes(lesson.id);
      const isCurrent = lesson.id === studentCurr?.currentLessonId || (!isDone && idx === 0);
      return {
        id: lesson.id,
        title: lesson.title,
        titleArabic: lesson.objectives?.[0] || "",
        category: activeCategory,
        status: isDone ? "completed" : isCurrent ? "current" : "locked",
        notes: lesson.description || "",
      };
    });
  } else {
    dynamicNodes = memoryMapNodes.filter((n) => n.category === activeCategory);
  }

  const completedCount = dynamicNodes.filter((n) => n.status === "completed").length;
  const progressPct = dynamicNodes.length > 0 ? Math.round((completedCount / dynamicNodes.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2.5">
            <Network className="w-6 h-6 text-[#5A6B5A]" />
            <span>{t("memoryMap")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 mt-1">
            Visual knowledge graph tracking student mastery across Quran, Tajweed, Islamic Studies, and Arabic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeStudents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A7D75]">Student:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none"
              >
                {activeStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="px-4 py-2 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft flex items-center gap-3">
            <span className="text-xs font-semibold text-[#7A7D75]">Mastery:</span>
            <span className="text-base font-bold text-[#5A6B5A] dark:text-[#8BA888]">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(["Quran", "Tajweed", "Islamic Studies", "Arabic"] as SubjectType[]).map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#5A6B5A] text-white shadow-xs"
                  : "bg-white dark:bg-[#161D17] text-[#7A7D75] dark:text-stone-300 hover:bg-[#F2EFE6] border border-[#E8E5DB] dark:border-[#2A352A]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] flex flex-wrap items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-[#3E4D3E] dark:text-[#8BA888]">
          <CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" />
          <span>Completed / Mastered</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#8B5A2B]">
          <Clock className="w-4 h-4" />
          <span>Current Target</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-700">
          <AlertCircle className="w-4 h-4" />
          <span>Needs Revision</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#7A7D75]">
          <Lock className="w-4 h-4" />
          <span>Upcoming</span>
        </div>
      </div>

      {/* Visual Nodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {dynamicNodes.map((node) => {
          const isCompleted = node.status === "completed";
          const isCurrent = node.status === "current";
          const needsRevision = node.status === "needs_revision";

          return (
            <div
              key={node.id}
              onClick={() => {
                const nextStatus =
                  node.status === "locked"
                    ? "current"
                    : node.status === "current"
                    ? "completed"
                    : node.status === "completed"
                    ? "needs_revision"
                    : "completed";
                updateMemoryMapNode(node.id, nextStatus, selectedStudentId);
              }}
              className={`p-4 rounded-xl border shadow-soft transition-all cursor-pointer space-y-2 flex flex-col justify-between hover:scale-[1.02] active:scale-98 ${
                isCompleted
                  ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#5A6B5A] text-[#3E4D3E] dark:text-[#8BA888]"
                  : isCurrent
                  ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#8B5A2B] text-[#8B5A2B]"
                  : needsRevision
                  ? "bg-[#FCFAF5] dark:bg-[#232B23] border-rose-700 text-rose-700"
                  : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A] text-[#7A7D75]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  Node #{node.id.split("-")[1] || "1"}
                </span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-[#5A6B5A]" />}
                {isCurrent && <Clock className="w-4 h-4 text-[#8B5A2B]" />}
                {needsRevision && <AlertCircle className="w-4 h-4 text-rose-700" />}
                {!isCompleted && !isCurrent && !needsRevision && <Lock className="w-4 h-4 text-[#7A7D75]" />}
              </div>

              <div className="space-y-0.5">
                <h4 className="font-serif font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                  {node.title}
                </h4>
                {node.titleArabic && (
                  <p className="font-serif font-bold text-sm text-right dir-rtl">
                    {node.titleArabic}
                  </p>
                )}
              </div>

              {node.notes && (
                <p className="text-[10px] italic opacity-80 pt-1 border-t border-[#E8E5DB] dark:border-[#2A352A]">
                  {node.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

