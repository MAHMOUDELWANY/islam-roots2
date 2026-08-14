import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Play,
  User,
  Filter,
  X,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { createGoogleCalendarEvent } from "../../lib/googleCalendar";

interface ScheduleViewProps {
  onStartLessonSession?: (studentId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onStartLessonSession }) => {
  const { students, curriculums, schedules, addSchedule, deleteSchedule, getStudentCurriculum } = useData();
  const { t, language } = useLanguage();
  const { googleTokens, connectGoogleCalendar } = useAuth();

  const [viewMode, setViewMode] = useState<"agenda" | "today">("agenda");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Google Calendar synchronization state. Islam Roots only writes schedules created here;
  // it never imports or deletes the educator's personal Google Calendar events.
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(true);
  const [gcalStatusMsg, setGcalStatusMsg] = useState<string>("");
  const [syncingScheduleId, setSyncingScheduleId] = useState<string | null>(null);

  // Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    scheduleId: string;
    title: string;
  }>({
    isOpen: false,
    scheduleId: "",
    title: "",
  });

  // Form State
  const [studentId, setStudentId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [subject, setSubject] = useState<"Quran" | "Tajweed" | "Islamic Studies" | "Arabic" | "">("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("16:00");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "biweekly" | "monthly">("weekly");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([new Date().getDay()]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleConnectGoogleCalendar = async () => {
    try {
      setGcalStatusMsg("");
      const token = await connectGoogleCalendar();
      if (token) {
        setGcalStatusMsg(
          language === "ar"
            ? "تم ربط تقويم Google لمزامنة دروسك فقط."
            : "Google Calendar is connected for Islam Roots schedule sync only."
        );
      }
    } catch {
      setGcalStatusMsg(
        language === "ar"
          ? "فشل ربط تقويم Google"
          : "Could not connect Google Calendar. Your schedule remains saved in Islam Roots."
      );
    }
  };

  const handleExportToGoogleCalendar = async (entry: any) => {
    setSyncingScheduleId(entry.id);
    setGcalStatusMsg("");
    try {
      const token = googleTokens.calendar || await connectGoogleCalendar();
      if (!token) throw new Error("Google Calendar authorization was not granted.");

      const studentName = getStudentName(entry.studentId);
      await createGoogleCalendarEvent(token, {
        title: `${entry.title} — ${studentName}`,
        description: `IslamRoots Lesson Session\nStudent: ${studentName}\nSubject: ${entry.subject}\nNotes: ${entry.notes || "N/A"}`,
        startTimeISO: entry.startAt,
        durationMinutes: entry.durationMinutes,
        studentName,
        subject: entry.subject,
        recurrence: entry.recurrence,
        recurrenceDays: entry.recurrenceDays,
        recurrenceEndDate: entry.recurrenceEndDate,
      });

      setGcalStatusMsg(
        language === "ar"
          ? `تمت مزامنة "${entry.title}" إلى تقويم Google.`
          : `"${entry.title}" was synchronized to Google Calendar.`
      );
    } catch {
      setGcalStatusMsg(
        language === "ar"
          ? "تم حفظ الحصة في جذور الإسلام، لكن تعذرت مزامنتها إلى Google Calendar."
          : "The lesson is saved in Islam Roots, but Google Calendar synchronization failed."
      );
    } finally {
      setSyncingScheduleId(null);
    }
  };

  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const student = students.find((s) => s.id === id);
    if (student && student.subjects && student.subjects.length > 0) {
      setSubject(student.subjects[0]);
      setCurriculumId(getStudentCurriculum(id).curriculum?.id || "");
    } else {
      setSubject("");
      setCurriculumId("");
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setErrorMsg(language === "ar" ? "رجاءً اختر الطالب" : "Please select a student");
      return;
    }
    if (!title.trim()) {
      setErrorMsg(language === "ar" ? "رجاءً اكتب عنوان الدرس" : "Please enter a lesson title");
      return;
    }
    if (!subject) {
      setErrorMsg(language === "ar" ? "اختر مادة مرتبطة بملف الطالب" : "Choose a subject linked to the student profile");
      return;
    }
    if ((recurrence === "weekly" || recurrence === "biweekly") && recurrenceDays.length === 0) {
      setErrorMsg(language === "ar" ? "اختر يومًا واحدًا على الأقل للتكرار" : "Choose at least one weekday for recurrence");
      return;
    }

    try {
      const startAtISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      await addSchedule({
        studentId,
        curriculumId: curriculumId || undefined,
        subject,
        title: title.trim(),
        startAt: startAtISO,
        durationMinutes,
        recurrence,
        recurrenceDays: recurrence === "weekly" || recurrence === "biweekly" ? recurrenceDays : undefined,
        recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate || undefined : undefined,
        reminderMinutes,
        reminderEnabled: true,
        status: "upcoming",
        notes: notes.trim() || undefined,
      });

      // Local persistence is authoritative. Google synchronization is explicit, awaited,
      // and never allowed to discard the schedule saved in Islam Roots.
      if (syncToGoogleCalendar) {
        try {
          const token = googleTokens.calendar || await connectGoogleCalendar();
          if (!token) throw new Error("Google Calendar authorization was not granted.");
          const studentName = getStudentName(studentId);
          await createGoogleCalendarEvent(token, {
            title: `${title.trim()} — ${studentName}`,
            description: `IslamRoots Lesson Session\nStudent: ${studentName}\nSubject: ${subject}\nNotes: ${notes.trim() || "N/A"}`,
            startTimeISO: startAtISO,
            durationMinutes,
            studentName,
            subject,
            recurrence,
            recurrenceDays,
            recurrenceEndDate: recurrenceEndDate || undefined,
          });
          setGcalStatusMsg(language === "ar" ? "تم حفظ الحصة ومزامنتها إلى Google Calendar." : "Lesson saved and synchronized to Google Calendar.");
        } catch {
          setGcalStatusMsg(language === "ar" ? "تم حفظ الحصة في جذور الإسلام، لكن تعذرت مزامنتها إلى Google Calendar." : "Lesson saved in Islam Roots, but Google Calendar synchronization failed.");
        }
      } else {
        setGcalStatusMsg(language === "ar" ? "تم حفظ الحصة في جذور الإسلام." : "Lesson saved in Islam Roots.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save schedule.");
    }
  };

  const confirmDeleteSchedule = (scheduleId: string, title: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      scheduleId,
      title,
    });
  };

  const handleExecuteDelete = async () => {
    if (deleteConfirmModal.scheduleId) {
      await deleteSchedule(deleteConfirmModal.scheduleId);
    }
    setDeleteConfirmModal({ isOpen: false, scheduleId: "", title: "" });
  };

  const resetForm = () => {
    setStudentId("");
    setCurriculumId("");
    setSubject("");
    setTitle("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setStartTime("16:00");
    setDurationMinutes(45);
    setRecurrence("weekly");
    setRecurrenceDays([new Date().getDay()]);
    setRecurrenceEndDate("");
    setReminderMinutes(15);
    setNotes("");
    setErrorMsg("");
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    if (selectedStudentFilter !== "all" && s.studentId !== selectedStudentFilter) return false;
    if (viewMode === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      const sDateStr = new Date(s.startAt).toISOString().split("T")[0];
      return todayStr === sDateStr;
    }
    return true;
  });

  const selectedStudent = students.find((student) => student.id === studentId);
  const subjectOptions = selectedStudent?.subjects || [];
  const weekdayLabels = language === "ar" ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getStudentName = (id: string) => {
    return students.find((s) => s.id === id)?.name || "Student";
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    } catch (e) {
      return isoString;
    }
  };

  const getCountdownText = (isoString: string) => {
    const diffMs = new Date(isoString).getTime() - Date.now();
    if (diffMs <= 0) return language === "ar" ? "الآن" : "NOW";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${t("startsIn")} ${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${t("startsIn")} ${hours}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1C221C] p-6 rounded-2xl border border-[#E8E5DB] dark:border-[#2A352A] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#5A6B5A] text-white shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {t("schedule")}
              </h2>
              <p className="text-xs text-[#7A7D75] dark:text-stone-400 mt-0.5">
                {t("scheduleSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Google Calendar Connect/Connected Button */}
          <button
            onClick={handleConnectGoogleCalendar}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              googleTokens.calendar
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-white dark:bg-[#232B23] border-[#D4D1C5] dark:border-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2] hover:bg-[#FCFAF5]"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>
              {googleTokens.calendar
                ? language === "ar"
                  ? "متصل بـ Google Calendar"
                  : "Google Calendar Connected"
                : language === "ar"
                ? "ربط تقويم Google"
                : "Sync Google Calendar"}
            </span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t("scheduleLesson")}</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Status Message */}
      {gcalStatusMsg && (
        <div className="p-3.5 rounded-xl bg-[#FCFAF5] dark:bg-[#161D17] border border-[#5A6B5A]/30 text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5A6B5A]" />
            <span>{gcalStatusMsg}</span>
          </div>
          <button onClick={() => setGcalStatusMsg("")} className="p-1 text-[#7A7D75] hover:text-[#1F261F]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls Bar: Filters & View Modes */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FCFAF5] dark:bg-[#161D17] p-3 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A]">
        {/* Student Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#7A7D75]" />
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-semibold text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:ring-1 focus:ring-[#5A6B5A]"
          >
            <option value="all">{language === "ar" ? "جميع الطلاب" : "All Students"}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-[#E8E5DB] dark:bg-[#232B23] p-1 rounded-lg border border-[#D4D1C5]/60 dark:border-[#2A352A] text-xs w-full sm:w-auto justify-center">
          <button
            onClick={() => setViewMode("agenda")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "agenda"
                ? "bg-white dark:bg-[#3E4D3E] text-[#3E4D3E] dark:text-white shadow-xs"
                : "text-[#7A7D75] dark:text-stone-300 hover:text-[#3E4D3E]"
            }`}
          >
            {t("viewAgenda")}
          </button>
          <button
            onClick={() => setViewMode("today")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "today"
                ? "bg-white dark:bg-[#3E4D3E] text-[#3E4D3E] dark:text-white shadow-xs"
                : "text-[#7A7D75] dark:text-stone-300 hover:text-[#3E4D3E]"
            }`}
          >
            {t("viewToday")}
          </button>
        </div>
      </div>

      {/* View Mode Content: website-owned student schedules only */}
      {filteredSchedules.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1C221C] rounded-2xl border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
          <CalendarIcon className="w-10 h-10 text-[#7A7D75] mx-auto opacity-50" />
          <p className="text-sm text-[#7A7D75] dark:text-stone-400 font-medium">
            {t("noSchedulesFound")}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8E5DB] dark:bg-[#2A352A] text-[#3E4D3E] dark:text-stone-200 text-xs font-semibold hover:bg-[#D4D1C5] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("scheduleLesson")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((entry) => {
            const countdown = getCountdownText(entry.startAt);

            return (
              <div
                key={entry.id}
                className="ir-surface ir-card-interactive p-5 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Badge Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-[#E8E5DB] dark:bg-[#2A352A] text-[#3E4D3E] dark:text-[#8BA888] font-bold text-[11px]">
                      {entry.subject}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                        countdown === "NOW" || countdown.includes("min")
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {countdown}
                    </span>
                  </div>

                  {/* Title & Student */}
                  <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2] group-hover:text-[#5A6B5A] transition-colors">
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#7A7D75] dark:text-stone-400 mt-2">
                    <User className="w-3.5 h-3.5 text-[#5A6B5A]" />
                    <span className="font-semibold text-[#3E4D3E] dark:text-stone-300">
                      {getStudentName(entry.studentId)}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-4 text-xs text-[#4A504A] dark:text-stone-300 mt-3 bg-[#FCFAF5] dark:bg-[#161D17] p-2.5 rounded-xl border border-[#E8E5DB]/70 dark:border-[#2A352A]">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#7A7D75]" />
                      <span>{formatDate(entry.startAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#7A7D75]" />
                      <span>{formatTime(entry.startAt)}</span>
                      <span className="text-[10px] text-[#7A7D75]">({entry.durationMinutes}m)</span>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-[#7A7D75] dark:text-stone-400 mt-3 bg-[#F2EFE6]/50 dark:bg-[#232B23]/50 p-2 rounded-lg">
                      "{entry.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onStartLessonSession && onStartLessonSession(entry.studentId)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t("startLesson")}</span>
                  </button>

                  <button
                    onClick={() => handleExportToGoogleCalendar(entry)}
                    disabled={syncingScheduleId === entry.id}
                    type="button"
                    title={language === "ar" ? "مزامنة هذه الحصة إلى Google Calendar" : "Synchronize this lesson to Google Calendar"}
                    aria-label={language === "ar" ? "مزامنة هذه الحصة إلى Google Calendar" : "Synchronize this lesson to Google Calendar"}
                    className="p-2 rounded-xl border border-[#D4D1C5] dark:border-[#2A352A] hover:bg-[#FCFAF5] dark:hover:bg-[#232B23] text-[#7A7D75] hover:text-[#5A6B5A] transition-colors cursor-pointer"
                  >
                    {syncingScheduleId === entry.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#5A6B5A]" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => confirmDeleteSchedule(entry.id, entry.title)}
                    className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#7A7D75] hover:text-rose-600 transition-colors cursor-pointer"
                    title={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1C221C] border border-[#E8E5DB] dark:border-[#2A352A] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FCFAF5] dark:bg-[#161D17] border-b border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#5A6B5A]" />
                <h3 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
                  {t("scheduleLesson")}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] text-[#7A7D75] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Student Picker */}
              <div>
                <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                  {t("selectStudent")} *
                </label>
                <select
                  value={studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:ring-1 focus:ring-[#5A6B5A]"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.learningLanguage || "English"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                    {t("curriculumSubject")}
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]"
                  >
                    <option value="">{language === "ar" ? "اختر مادة" : "Select subject"}</option>
                    {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              {/* Lesson Title */}
              <div>
                <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                  Lesson Title / Topic *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Surah Al-Falaq Recitation & Rules"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:ring-1 focus:ring-[#5A6B5A]"
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                    {t("selectDate")} *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                    {t("selectTime")} *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]"
                    required
                  />
                </div>
              </div>

              {/* Google Calendar Sync Option */}
              <div className="p-3 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#5A6B5A]" />
                  <span className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">
                    {language === "ar" ? "مزامنة مع Google Calendar" : "Sync with Google Calendar"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={syncToGoogleCalendar}
                  onChange={(e) => setSyncToGoogleCalendar(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5A6B5A] focus:ring-[#5A6B5A] cursor-pointer"
                />
              </div>

              {/* Recurrence & Reminder */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                    {t("recurrence")}
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]"
                  >
                    <option value="none">{t("recurrenceNone")}</option>
                    <option value="daily">{t("recurrenceDaily")}</option>
                    <option value="weekly">{t("recurrenceWeekly")}</option>
                    <option value="biweekly">{t("recurrenceBiweekly")}</option>
                    <option value="monthly">{language === "ar" ? "كل شهر" : "Every Month"}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                    {t("reminder")}
                  </label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]"
                  >
                    <option value={5}>{t("reminder5m")}</option>
                    <option value={15}>{t("reminder15m")}</option>
                    <option value={30}>{t("reminder30m")}</option>
                    <option value={60}>{t("reminder60m")}</option>
                  </select>
                </div>
              </div>

              {(recurrence === "weekly" || recurrence === "biweekly") && (
                <div className="space-y-2 p-3 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A]">
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200">{language === "ar" ? "أيام التكرار" : "Repeat on"}</label>
                  <div className="flex flex-wrap gap-2">{weekdayLabels.map((label, day) => { const selected = recurrenceDays.includes(day); return <button key={label} type="button" onClick={() => setRecurrenceDays((current) => selected ? current.filter((item) => item !== day) : [...current, day].sort())} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${selected ? "bg-[#5A6B5A] text-white border-[#5A6B5A]" : "bg-white dark:bg-[#161D17] text-[#7A7D75] border-[#D4D1C5]"}`}>{label}</button>; })}</div>
                  {recurrenceDays.length === 0 && <p className="text-[11px] text-rose-600">{language === "ar" ? "اختر يومًا واحدًا على الأقل." : "Select at least one weekday."}</p>}
                </div>
              )}

              {recurrence !== "none" && (
                <div>
                  <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">{language === "ar" ? "ينتهي التكرار (اختياري)" : "Recurrence end date (optional)"}</label>
                  <input type="date" value={recurrenceEndDate} min={startDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2]" />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-[#1F261F] dark:text-stone-200 mb-1">
                  Teacher Preparation Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Test Makharij rules for Ayn and Qaf first..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#D4D1C5] dark:border-[#2A352A] text-xs text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:ring-1 focus:ring-[#5A6B5A]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7A7D75] hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] font-semibold transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5A6B5A] hover:bg-[#495749] text-white font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#1C221C] border border-[#E8E5DB] dark:border-[#2A352A] w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
                {language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
              </h3>
            </div>
            <p className="text-xs text-[#7A7D75] dark:text-stone-300 leading-relaxed">
              {language === "ar"
                ? `هل أنت أكتأكد من رغبتك في حذف "${deleteConfirmModal.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteConfirmModal.title}"? This action cannot be undone.`}
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, scheduleId: "", title: "" })}
                className="px-4 py-2 rounded-xl text-[#7A7D75] hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] font-semibold text-xs transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
