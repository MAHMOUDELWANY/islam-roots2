import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Curriculum } from "../../types";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  FileText,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  createGoogleDoc,
  exportLessonToGoogleDoc,
  fetchUserGoogleDocs,
  deleteGoogleDoc,
  GoogleDocFile,
} from "../../lib/googleDocs";

interface CurriculumListProps {
  onOpenCreateCurriculum: () => void;
  onEditCurriculum: (curriculum: Curriculum) => void;
}

export const CurriculumList: React.FC<CurriculumListProps> = ({
  onOpenCreateCurriculum,
  onEditCurriculum,
}) => {
  const { curriculums, deleteCurriculum } = useData();
  const { t, language } = useLanguage();
  const { googleTokens, connectGoogleDocs } = useAuth();

  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Google Docs Management State
  const [googleDocs, setGoogleDocs] = useState<GoogleDocFile[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [exportingCurrId, setExportingCurrId] = useState<string | null>(null);
  const [docStatusMsg, setDocStatusMsg] = useState<string>("");
  const [lastCreatedLink, setLastCreatedLink] = useState<string | null>(null);

  // New Doc Dialog
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  useEffect(() => {
    if (googleTokens.docs) {
      loadDocs(googleTokens.docs);
    }
  }, [googleTokens.docs]);

  const loadDocs = async (token: string) => {
    setIsLoadingDocs(true);
    try {
      const files = await fetchUserGoogleDocs(token);
      setGoogleDocs(files);
    } catch (err) {
      console.error("Failed to load Google Docs:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleConnectDocs = async () => {
    try {
      setDocStatusMsg("");
      const token = await connectGoogleDocs();
      if (token) {
        setDocStatusMsg(
          language === "ar"
            ? "تم الاتصال بـ Google Docs بنجاح!"
            : "Connected to Google Docs successfully!"
        );
        loadDocs(token);
      }
    } catch (err) {
      setDocStatusMsg(
        language === "ar"
          ? "فشل الاتصال بـ Google Docs"
          : "Failed to connect to Google Docs."
      );
    }
  };

  const handleExportCurriculumToDoc = async (curr: Curriculum) => {
    setExportingCurrId(curr.id);
    setDocStatusMsg("");
    setLastCreatedLink(null);

    try {
      let token = googleTokens.docs;
      if (!token) {
        token = await connectGoogleDocs();
      }

      if (token) {
        const lessonListFormatted = curr.lessons
          .map((l, i) => `${i + 1}. ${l.title} ${l.titleArabic ? `(${l.titleArabic})` : ""}\n   Overview: ${l.description || 'N/A'}`)
          .join("\n\n");

        const result = await exportLessonToGoogleDoc(token, {
          title: `Curriculum Outline: ${curr.name}`,
          subject: curr.subject,
          description: curr.description,
          notes: lessonListFormatted,
          homework: `Target Audience: ${curr.level} Level Students`,
        });

        setLastCreatedLink(result.webViewLink);
        setDocStatusMsg(
          language === "ar"
            ? `تم تصدير منهاج "${curr.name}" إلى Google Docs!`
            : `Successfully exported curriculum "${curr.name}" to Google Docs!`
        );

        loadDocs(token);
      }
    } catch (err) {
      console.error("Error exporting curriculum to doc:", err);
      setDocStatusMsg(
        language === "ar"
          ? "فشل التصدير إلى Google Docs."
          : "Failed to export curriculum to Google Docs."
      );
    } finally {
      setExportingCurrId(null);
    }
  };

  const handleCreateNewBlankDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    setIsCreatingDoc(true);
    setDocStatusMsg("");
    try {
      let token = googleTokens.docs;
      if (!token) {
        token = await connectGoogleDocs();
      }

      if (token) {
        const res = await createGoogleDoc(token, newDocTitle.trim(), newDocContent.trim());
        setLastCreatedLink(res.webViewLink);
        setDocStatusMsg(
          language === "ar"
            ? `تم إنشاء المستند "${res.title}" بنجاح!`
            : `Document "${res.title}" created successfully!`
        );
        setIsNewDocModalOpen(false);
        setNewDocTitle("");
        setNewDocContent("");
        loadDocs(token);
      }
    } catch (err) {
      console.error("Error creating new doc:", err);
      setDocStatusMsg(
        language === "ar"
          ? "فشل إنشاء المستند"
          : "Failed to create Google Doc."
      );
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleDeleteDocFile = async (fileId: string, fileName: string) => {
    if (!googleTokens.docs) return;
    try {
      await deleteGoogleDoc(googleTokens.docs, fileId);
      setGoogleDocs((prev) => prev.filter((f) => f.id !== fileId));
      setDocStatusMsg(
        language === "ar"
          ? `تم حذف المستند "${fileName}"`
          : `Document "${fileName}" deleted.`
      );
    } catch (err) {
      console.error("Failed to delete doc:", err);
    }
  };

  const filteredCurriculums = curriculums.filter((c) =>
    subjectFilter === "all" ? true : c.subject === subjectFilter
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161D17] p-6 rounded-2xl border border-[#E8E5DB] dark:border-[#2A352A] shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] italic flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#5A6B5A] dark:text-[#8BA888]" />
            <span>{t("curriculums")}</span>
            <span className="px-2.5 py-0.5 rounded bg-[#E8E5DB] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold not-italic">
              {curriculums.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 mt-1 font-sans">
            Build, reuse, export, and customize program outlines for your students.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleConnectDocs}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              googleTokens.docs
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                : "bg-white dark:bg-[#232B23] border-[#D4D1C5] dark:border-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2] hover:bg-[#FCFAF5]"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              {googleTokens.docs
                ? language === "ar"
                  ? "متصل بـ Google Docs"
                  : "Google Docs Connected"
                : language === "ar"
                ? "ربط Google Docs"
                : "Connect Google Docs"}
            </span>
          </button>

          <button
            onClick={onOpenCreateCurriculum}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("createCurriculum")}</span>
          </button>
        </div>
      </div>

      {/* Google Docs Banner / Alert */}
      {docStatusMsg && (
        <div className="p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{docStatusMsg}</span>
          </div>
          {lastCreatedLink && (
            <a
              href={lastCreatedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
            >
              <span>{language === "ar" ? "فتح المستند" : "Open Google Doc"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Subject Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["all", "Quran", "Tajweed", "Islamic Studies", "Arabic"].map((subj) => {
          const isActive = subjectFilter === subj;
          return (
            <button
              key={subj}
              onClick={() => setSubjectFilter(subj)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#5A6B5A] text-white shadow-xs"
                  : "bg-white dark:bg-[#161D17] text-[#7A7D75] dark:text-stone-300 hover:bg-[#F2EFE6] border border-[#E8E5DB] dark:border-[#2A352A]"
              }`}
            >
              {subj === "all" ? t("allSubjects") : subj}
            </button>
          );
        })}
      </div>

      {/* Curriculum Cards Grid */}
      {filteredCurriculums.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
          <BookOpen className="w-12 h-12 text-[#7A7D75] mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
            No curriculums found
          </h3>
          <p className="text-xs text-[#7A7D75] max-w-sm mx-auto">
            Create your first custom teaching curriculum or export your lesson plans to Google Docs.
          </p>
          <button
            onClick={onOpenCreateCurriculum}
            className="px-4 py-2 rounded-xl bg-[#5A6B5A] text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t("createCurriculum")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCurriculums.map((curr) => (
            <div
              key={curr.id}
              className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] text-[10px] font-bold">
                        {curr.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#8B5A2B]/10 text-[#8B5A2B] text-[10px] font-bold">
                        {curr.level}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                      {curr.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCurriculum(curr)}
                      className="p-1.5 rounded-md text-[#7A7D75] hover:text-[#3E4D3E] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCurriculum(curr.id)}
                      className="p-1.5 rounded-md text-[#7A7D75] hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#2D332D] dark:text-stone-300 leading-relaxed font-sans">
                  {curr.description}
                </p>

                {/* Topics Preview List */}
                <div className="p-3.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#3E4D3E] dark:text-stone-300">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#5A6B5A]" />
                      <span>{t("lessonsAndTopics")}</span>
                    </span>
                    <span className="text-xs font-bold text-[#5A6B5A]">
                      {curr.lessons.length} Topics
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {curr.lessons.slice(0, 4).map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 text-xs text-[#2D332D] dark:text-stone-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                        <span className="font-medium truncate">{lesson.title}</span>
                        {lesson.titleArabic && (
                          <span className="text-[11px] font-serif text-[#5A6B5A]">
                            ({lesson.titleArabic})
                          </span>
                        )}
                      </div>
                    ))}
                    {curr.lessons.length > 4 && (
                      <p className="text-[10px] text-[#7A7D75] font-medium italic pl-5">
                        +{curr.lessons.length - 4} more topics
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-3 border-t border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handleExportCurriculumToDoc(curr)}
                  disabled={exportingCurrId === curr.id}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {exportingCurrId === curr.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>{language === "ar" ? "تصدير إلى Docs" : "Export to Docs"}</span>
                </button>

                <span className="text-[#7A7D75] text-[11px]">
                  Created {new Date(curr.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google Docs Workspace Documents Manager Section */}
      <div className="bg-white dark:bg-[#161D17] p-6 rounded-2xl border border-[#E8E5DB] dark:border-[#2A352A] space-y-4 shadow-xs mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E5DB] dark:border-[#2A352A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {language === "ar" ? "مستندات Google Docs الخاصة بك" : "Your Google Docs Documents"}
              </h3>
              <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                {language === "ar"
                  ? "استعرض وأنشئ خطط الدروس والكراسات مباشرة من Google Drive."
                  : "View and create lesson plans and workbooks directly in Google Drive."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleTokens.docs && (
              <button
                onClick={() => loadDocs(googleTokens.docs)}
                disabled={isLoadingDocs}
                className="px-3 py-2 rounded-xl bg-[#E8E5DB] dark:bg-[#2A352A] text-xs font-semibold text-[#3E4D3E] dark:text-stone-200 hover:bg-[#D4D1C5] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? "animate-spin" : ""}`} />
                <span>{language === "ar" ? "تحديث" : "Refresh"}</span>
              </button>
            )}

            <button
              onClick={() => setIsNewDocModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === "ar" ? "مستند جديد" : "New Document"}</span>
            </button>
          </div>
        </div>

        {!googleTokens.docs ? (
          <div className="p-8 text-center bg-[#FCFAF5] dark:bg-[#161D17] rounded-xl border border-dashed border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <FileText className="w-10 h-10 text-blue-600 mx-auto opacity-80" />
            <p className="text-xs text-[#7A7D75] dark:text-stone-400 max-w-md mx-auto">
              {language === "ar"
                ? "قم بربط حساب Google الخاص بك لاستعراض وتصدير مستندات Google Docs."
                : "Connect your Google account to view and create Google Docs directly from IslamRoots."}
            </p>
            <button
              onClick={handleConnectDocs}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>{language === "ar" ? "ربط Google Docs الآن" : "Connect Google Docs Now"}</span>
            </button>
          </div>
        ) : isLoadingDocs ? (
          <div className="p-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-[#7A7D75] dark:text-stone-400">
              {language === "ar" ? "جاري تحميل المستندات..." : "Loading Google Docs..."}
            </p>
          </div>
        ) : googleDocs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7A7D75] dark:text-stone-400">
            {language === "ar" ? "لم يتم العثور على مستندات Google Docs." : "No Google Docs documents found in your Drive."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {googleDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between gap-2 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-xs text-[#1F261F] dark:text-[#E2E8E2] truncate">
                      {doc.name}
                    </p>
                    {doc.modifiedTime && (
                      <p className="text-[10px] text-[#7A7D75]">
                        {new Date(doc.modifiedTime).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {doc.webViewLink && (
                    <a
                      href={doc.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                      title="Open in Google Docs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteDocFile(doc.id, doc.name)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Blank Doc Modal */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#1C221C] border border-[#E8E5DB] dark:border-[#2A352A] w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{language === "ar" ? "إنشاء مستند Google Docs جديد" : "Create New Google Doc"}</span>
              </h3>
            </div>

            <form onSubmit={handleCreateNewBlankDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                  {language === "ar" ? "عنوان المستند" : "Document Title"} *
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Surah Al-Mulk Study Guide & Vocabulary"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                  {language === "ar" ? "المحتوى الأولي (اختياري)" : "Initial Content (Optional)"}
                </label>
                <textarea
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  rows={4}
                  placeholder="Type initial notes, verses, or student guidelines..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7A7D75] hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] font-semibold transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDoc}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isCreatingDoc && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === "ar" ? "إنشاء" : "Create Doc"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
