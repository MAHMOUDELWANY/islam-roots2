import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";
import { Teacher, Student, Curriculum, LessonSession, ScheduleEntry } from "../../types";
import {
  ShieldCheck,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  Award,
  Globe,
  FileText,
  UserCheck,
  X,
  ChevronRight,
  TrendingUp,
  GraduationCap,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { teacher, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allCurriculums, setAllCurriculums] = useState<Curriculum[]>([]);
  const [allSessions, setAllSessions] = useState<LessonSession[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "onboarded" | "pending" | "with_students">("all");

  // Inspector Modal state
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"profile" | "students" | "curriculums" | "sessions" | "schedule">("profile");

  useEffect(() => {
    setLoading(true);

    const fetchAllAdminData = async () => {
      try {
        const [
          { data: teachersRes },
          { data: studentsRes },
          { data: curriculumsRes },
          { data: sessionsRes },
          { data: schedulesRes },
        ] = await Promise.all([
          supabase.from("teachers").select("*"),
          supabase.from("students").select("*"),
          supabase.from("curriculums").select("*"),
          supabase.from("lesson_sessions").select("*"),
          supabase.from("schedules").select("*"),
        ]);

        if (teachersRes) {
          setTeachers(teachersRes.map((r: any) => ({
            id: r.id,
            username: r.username,
            name: r.display_name || r.full_name || r.name || "Ustadh",
            email: r.email,
            preferredLanguage: r.teaching_language || r.preferred_language || "en",
            fullName: r.full_name || r.name || "",
            displayName: r.display_name || r.name || "",
            arabicName: r.arabic_name || "",
            country: r.country || r.location || "",
            teachingLanguage: r.teaching_language || r.preferred_language || "en",
            gender: r.gender || "",
            yearsExperience: r.years_experience ?? r.years_of_experience,
            specializations: Array.isArray(r.specializations) ? r.specializations : [],
            bio: r.bio || r.purpose || "",
            profileCompleted: r.profile_completed ?? r.onboarding_completed ?? false,
            profileCompletedAt: r.profile_completed_at,
            age: r.age,
            yearsOfExperience: r.years_experience ?? r.years_of_experience,
            purpose: r.bio || r.purpose,
            location: r.country || r.location,
            onboardingCompleted: r.profile_completed ?? r.onboarding_completed ?? false,
            tourCompleted: r.tour_completed ?? false,
            timezone: r.timezone,
            reminderMinutes: r.reminder_minutes,
            reminderSoundEnabled: r.reminder_sound_enabled,
            reminderVibrationEnabled: r.reminder_vibration_enabled,
            createdAt: r.created_at,
          } as Teacher)));
        }

        if (studentsRes) {
          setAllStudents(studentsRes.map((r: any) => ({
            id: r.id,
            teacherId: r.teacher_id,
            name: r.name,
            email: r.email,
            age: r.age,
            nationality: r.nationality,
            nativeLanguage: r.native_language,
            learningLanguage: r.learning_language,
            level: r.level,
            subjects: r.subjects || [],
            notes: r.notes,
            status: r.status || "Active",
            createdAt: r.created_at,
          } as Student)));
        }

        if (curriculumsRes) {
          setAllCurriculums(curriculumsRes.map((r: any) => ({
            id: r.id,
            teacherId: r.teacher_id,
            name: r.name,
            subject: r.subject,
            description: r.description,
            level: r.level,
            lessons: r.lessons || [],
            createdAt: r.created_at,
          } as Curriculum)));
        }

        if (sessionsRes) {
          setAllSessions(sessionsRes.map((r: any) => ({
            id: r.id,
            teacherId: r.teacher_id,
            studentId: r.student_id,
            curriculumId: r.curriculum_id,
            lessonTitle: r.lesson_title,
            date: r.date,
            durationMinutes: r.duration_minutes,
            attendanceStatus: r.attendance_status,
            objectives: r.objectives || [],
            completedItems: r.completed_items || [],
            teacherNotes: r.teacher_notes,
            homework: r.homework,
            quizScore: r.quiz_score,
            createdAt: r.created_at,
          } as LessonSession)));
        }

        if (schedulesRes) {
          setAllSchedules(schedulesRes.map((r: any) => ({
            id: r.id,
            teacherId: r.teacher_id,
            studentId: r.student_id,
            curriculumId: r.curriculum_id,
            lessonId: r.lesson_id,
            subject: r.subject,
            title: r.title,
            startAt: r.start_at,
            durationMinutes: r.duration_minutes,
            recurrence: r.recurrence,
            reminderMinutes: r.reminder_minutes,
            reminderEnabled: r.reminder_enabled ?? true,
            status: r.status,
            notes: r.notes,
            createdAt: r.created_at,
          } as ScheduleEntry)));
        }
      } catch (err) {
        console.warn("Admin fetch warning:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAdminData();
  }, []);

  // Filter teachers list
  const filteredTeachers = teachers.filter((tItem) => {
    const matchesSearch =
      tItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tItem.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tItem.location && tItem.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tItem.purpose && tItem.purpose.toLowerCase().includes(searchQuery.toLowerCase()));

    const teacherStudents = allStudents.filter((s) => s.teacherId === tItem.id);

    if (statusFilter === "onboarded") return matchesSearch && tItem.onboardingCompleted;
    if (statusFilter === "pending") return matchesSearch && !tItem.onboardingCompleted;
    if (statusFilter === "with_students") return matchesSearch && teacherStudents.length > 0;

    return matchesSearch;
  });

  // Export report as CSV
  const handleExportCSV = () => {
    const headers = [
      "Teacher ID",
      "Full Name",
      "Email",
      "Onboarding Completed",
      "Age",
      "Location",
      "Years of Experience",
      "Teaching Goal / Purpose",
      "Students Count",
      "Curriculums Count",
      "Sessions Count",
      "Created At",
    ];

    const rows = teachers.map((tItem) => {
      const tStudents = allStudents.filter((s) => s.teacherId === tItem.id);
      const tCurriculums = allCurriculums.filter((c) => c.teacherId === tItem.id);
      const tSessions = allSessions.filter((s) => s.teacherId === tItem.id);

      return [
        `"${tItem.id}"`,
        `"${tItem.name || ""}"`,
        `"${tItem.email || ""}"`,
        `"${tItem.onboardingCompleted ? "Yes" : "No"}"`,
        `"${tItem.age || ""}"`,
        `"${tItem.location || ""}"`,
        `"${tItem.yearsOfExperience || ""}"`,
        `"${(tItem.purpose || "").replace(/"/g, '""')}"`,
        tStudents.length,
        tCurriculums.length,
        tSessions.length,
        `"${tItem.createdAt || ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IslamRoots_Teachers_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto mt-12 bg-white dark:bg-[#161D17] rounded-2xl border border-red-200 dark:border-red-900/50 shadow-soft">
        <ShieldCheck className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          {isRTL ? "منطقة خاصة بمدير النظام فقط" : "Super Admin Access Required"}
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          {isRTL
            ? "حسابك الحالي ليس لديه صلاحية الوصول إلى شاشة المراقب العام. يرجى تسجيل الدخول بالبريد الإلكتروني المعتمد: mhmwdlwany4222@gmail.com"
            : "Your current account is not authorized to view the Super Admin Monitor. Please sign in with the designated administrator account: mhmwdlwany4222@gmail.com"}
        </p>
      </div>
    );
  }

  // Selected teacher details
  const selectedTeacherStudents = selectedTeacher ? allStudents.filter((s) => s.teacherId === selectedTeacher.id) : [];
  const selectedTeacherCurriculums = selectedTeacher ? allCurriculums.filter((c) => c.teacherId === selectedTeacher.id) : [];
  const selectedTeacherSessions = selectedTeacher ? allSessions.filter((s) => s.teacherId === selectedTeacher.id) : [];
  const selectedTeacherSchedules = selectedTeacher ? allSchedules.filter((s) => s.teacherId === selectedTeacher.id) : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Super Admin Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#2A352A] via-[#1F261F] to-[#161D17] text-white shadow-soft border border-[#3E4D3E] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Verified</span>
              </span>
              <span className="text-xs text-stone-300 bg-white/10 px-2.5 py-0.5 rounded font-mono">
                mhmwdlwany4222@gmail.com
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              {isRTL ? "مركز مراقبة منصة جذور الإسلام" : "Islam Roots Platform Super Admin Monitor"}
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {isRTL
                ? "مرحباً بك يا مشرفنا القدير! من خلال هذه الشاشة يمكنك متابعة كافة المعلمين الملتزمين بالتعليم، والاطلاع على بياناتهم، وطلابهم، والمناهج التي ينشئونها، وسجل الجلسات التعليمية بشكل حي ومباشر."
                : "Welcome! Here you can monitor every teacher using Islam Roots, inspect their background information, track their real student rosters, custom curriculums, and live teaching activity in plain words."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isRTL ? "تصدير تقرير المعلمين (CSV)" : "Export Report (CSV)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Teachers */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-[#5A6B5A]">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23]">
              Teachers
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">
              {teachers.length}
            </div>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "إجمالي المعلمين المسجلين" : "Registered Teachers"}
            </p>
          </div>
        </div>

        {/* Onboarded Teachers */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">
              {teachers.filter((t) => t.onboardingCompleted).length}
            </div>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "أكملوا إعداد الحساب" : "Fully Onboarded"}
            </p>
          </div>
        </div>

        {/* Total Students */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-[#8B5A2B]">
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23]">
              Students
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">
              {allStudents.length}
            </div>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "إجمالي الطلاب المضافين" : "Total Real Students"}
            </p>
          </div>
        </div>

        {/* Total Curriculums */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
              Plans
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">
              {allCurriculums.length}
            </div>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "المناهج والخطط الدراسية" : "Curriculums Created"}
            </p>
          </div>
        </div>

        {/* Total Lesson Sessions */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
              Sessions
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">
              {allSessions.length}
            </div>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "جلسات الدروس المنفذة" : "Lesson Sessions Logged"}
            </p>
          </div>
        </div>

        {/* Scheduled Classes */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
              Calendar
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">
              {allSchedules.length}
            </div>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "مواعيد الدروس المجدولة" : "Scheduled Lessons"}
            </p>
          </div>
        </div>
      </div>

      {/* Simple Words Guide Box */}
      <div className="p-5 rounded-xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
        <div className="flex items-center gap-2 text-[#3E4D3E] dark:text-[#8BA888]">
          <FileText className="w-4 h-4" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
            {isRTL ? "دليل مراقبة المشرف ببساطة (Simple Admin Guide)" : "Simple Monitoring Guide for Admin"}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#2D332D] dark:text-stone-300 leading-relaxed font-sans">
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB]/70 dark:border-[#2A352A] space-y-1">
            <span className="font-semibold text-[#1F261F] dark:text-[#E2E8E2] block">
              1. {isRTL ? "معلومات المعلم" : "Teacher Profiles"}
            </span>
            <p>
              {isRTL
                ? "يظهر لك اسم كل معلم، وبريده الإلكتروني، ودولته، وسنوات خبرته، والهدف الذي كتبه عند التسجيل."
                : "View every teacher's full name, Google email, location, teaching experience, and stated goal for teaching."}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB]/70 dark:border-[#2A352A] space-y-1">
            <span className="font-semibold text-[#1F261F] dark:text-[#E2E8E2] block">
              2. {isRTL ? "نشاط الطلاب والمناهج" : "Student & Curriculum Roster"}
            </span>
            <p>
              {isRTL
                ? "يمكنك معرفة عدد الطلاب الحقيقيين لدى كل معلم، وأسمائهم، ومستوياتهم، والمناهج المخصصة لهم."
                : "Check how many real students each teacher is instructing, their skill levels, and customized lesson plans."}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#161D17] border border-[#E8E5DB]/70 dark:border-[#2A352A] space-y-1">
            <span className="font-semibold text-[#1F261F] dark:text-[#E2E8E2] block">
              3. {isRTL ? "سجل الدروس المباشرة" : "Live Session History"}
            </span>
            <p>
              {isRTL
                ? "زر 'فحص الحساب' يتيح لك قراءة الملاحظات والواجبات ونتائج الاختبارات القصيرة التي يسجلها المعلم مع كل طالب."
                : "Click 'Inspect Teacher' to read actual lesson feedback, assigned homework, and student quiz scores."}
            </p>
          </div>
        </div>
      </div>

      {/* Teachers Directory Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span>{isRTL ? "قائمة جميع المعلمين المسجلين" : "Registered Teachers Roster"}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888] text-xs font-sans font-bold">
                {filteredTeachers.length}
              </span>
            </h2>
            <p className="text-xs text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "تصفح وابحث في جميع الحسابات المسجلة في قاعدة البيانات" : "Search and inspect every teacher account in the database"}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7A7D75] absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? "بحث بالاسم، البريد، أو الدولة..." : "Search name, email, location..."}
                className="pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 text-xs rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A] w-48 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#161D17] text-[#1F261F] dark:text-[#E2E8E2] focus:outline-none focus:border-[#5A6B5A]"
            >
              <option value="all">{isRTL ? "جميع المعلمين" : "All Teachers"}</option>
              <option value="onboarded">{isRTL ? "مكتمل الإعداد" : "Fully Onboarded"}</option>
              <option value="pending">{isRTL ? "بانتظار التجهيز" : "Pending Onboarding"}</option>
              <option value="with_students">{isRTL ? "لديهم طلاب" : "With Active Students"}</option>
            </select>
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <Users className="w-10 h-10 text-[#7A7D75] mx-auto opacity-50" />
            <h3 className="text-sm font-semibold text-[#1F261F] dark:text-[#E2E8E2]">
              {isRTL ? "لم يتم العثور على معلمين مطابقين" : "No matching teachers found"}
            </h3>
            <p className="text-xs text-[#7A7D75] dark:text-stone-400">
              {isRTL ? "جرب تغيير كلمات البحث أو الفلتر أعلاه" : "Try adjusting your search criteria or filter options"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((tItem) => {
              const tStudents = allStudents.filter((s) => s.teacherId === tItem.id);
              const tCurriculums = allCurriculums.filter((c) => c.teacherId === tItem.id);
              const tSessions = allSessions.filter((s) => s.teacherId === tItem.id);

              return (
                <div
                  key={tItem.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft hover:border-[#5A6B5A] transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#5A6B5A] text-white font-serif font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                          {tItem.name ? tItem.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2] truncate">
                            {tItem.name || (isRTL ? "معلم جديد" : "New Ustadh")}
                          </h3>
                          <p className="text-xs text-[#7A7D75] dark:text-stone-400 truncate">
                            {tItem.email || "No email registered"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          tItem.onboardingCompleted
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {tItem.onboardingCompleted ? (isRTL ? "جاهز للتدريس" : "Onboarded") : (isRTL ? "قيد التجهيز" : "Pending")}
                      </span>
                    </div>

                    {/* Details Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#7A7D75] dark:text-stone-300">
                      {tItem.location && (
                        <span className="flex items-center gap-1 bg-[#F2EFE6] dark:bg-[#232B23] px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3 text-[#5A6B5A]" />
                          <span>{tItem.location}</span>
                        </span>
                      )}
                      {tItem.yearsOfExperience && (
                        <span className="flex items-center gap-1 bg-[#F2EFE6] dark:bg-[#232B23] px-2 py-0.5 rounded">
                          <Award className="w-3 h-3 text-[#8B5A2B]" />
                          <span>{tItem.yearsOfExperience} yrs exp</span>
                        </span>
                      )}
                      {tItem.age && (
                        <span className="bg-[#F2EFE6] dark:bg-[#232B23] px-2 py-0.5 rounded">
                          Age {tItem.age}
                        </span>
                      )}
                    </div>

                    {/* Purpose / Goal */}
                    {tItem.purpose && (
                      <p className="text-xs text-[#2D332D] dark:text-stone-300 line-clamp-2 italic bg-[#FCFAF5] dark:bg-[#1C251D] p-2.5 rounded-lg border border-[#E8E5DB]/60 dark:border-[#2A352A]">
                        « {tItem.purpose} »
                      </p>
                    )}

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-[#E8E5DB] dark:border-[#2A352A]">
                      <div className="p-1.5 rounded bg-[#FCFAF5] dark:bg-[#232B23]">
                        <span className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                          {tStudents.length}
                        </span>
                        <span className="text-[10px] text-[#7A7D75] dark:text-stone-400">
                          {isRTL ? "طلاب" : "Students"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-[#FCFAF5] dark:bg-[#232B23]">
                        <span className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                          {tCurriculums.length}
                        </span>
                        <span className="text-[10px] text-[#7A7D75] dark:text-stone-400">
                          {isRTL ? "مناهج" : "Curriculums"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-[#FCFAF5] dark:bg-[#232B23]">
                        <span className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                          {tSessions.length}
                        </span>
                        <span className="text-[10px] text-[#7A7D75] dark:text-stone-400">
                          {isRTL ? "جلسات" : "Sessions"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setSelectedTeacher(tItem);
                      setActiveInspectorTab("profile");
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#3E4D3E] hover:bg-[#2A352A] text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isRTL ? "فحص تفاصيل الحساب والنشاط" : "Inspect Teacher Activity"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Teacher Inspector Deep-Dive Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FCFAF5] dark:bg-[#161D17] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[#E8E5DB] dark:border-[#2A352A] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-[#1F261F] text-white flex items-center justify-between border-b border-[#3E4D3E]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#5A6B5A] text-white font-serif font-bold text-lg flex items-center justify-center border-2 border-white/20">
                  {selectedTeacher.name ? selectedTeacher.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-serif">{selectedTeacher.name || "Ustadh"}</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      ID: {selectedTeacher.id.slice(0, 8)}...
                    </span>
                  </div>
                  <p className="text-xs text-stone-300">{selectedTeacher.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-1 p-2 bg-[#F2EFE6] dark:bg-[#232B23] border-b border-[#E8E5DB] dark:border-[#2A352A] overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveInspectorTab("profile")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInspectorTab === "profile"
                    ? "bg-white dark:bg-[#161D17] text-[#3E4D3E] dark:text-[#E2E8E2] shadow-xs"
                    : "text-[#7A7D75] hover:text-[#3E4D3E]"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isRTL ? "الملف الشخصي" : "Teacher Profile"}</span>
              </button>

              <button
                onClick={() => setActiveInspectorTab("students")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInspectorTab === "students"
                    ? "bg-white dark:bg-[#161D17] text-[#3E4D3E] dark:text-[#E2E8E2] shadow-xs"
                    : "text-[#7A7D75] hover:text-[#3E4D3E]"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isRTL ? "الطلاب" : "Students"} ({selectedTeacherStudents.length})</span>
              </button>

              <button
                onClick={() => setActiveInspectorTab("curriculums")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInspectorTab === "curriculums"
                    ? "bg-white dark:bg-[#161D17] text-[#3E4D3E] dark:text-[#E2E8E2] shadow-xs"
                    : "text-[#7A7D75] hover:text-[#3E4D3E]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isRTL ? "المناهج" : "Curriculums"} ({selectedTeacherCurriculums.length})</span>
              </button>

              <button
                onClick={() => setActiveInspectorTab("sessions")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInspectorTab === "sessions"
                    ? "bg-white dark:bg-[#161D17] text-[#3E4D3E] dark:text-[#E2E8E2] shadow-xs"
                    : "text-[#7A7D75] hover:text-[#3E4D3E]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRTL ? "سجل الجلسات" : "Sessions"} ({selectedTeacherSessions.length})</span>
              </button>

              <button
                onClick={() => setActiveInspectorTab("schedule")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeInspectorTab === "schedule"
                    ? "bg-white dark:bg-[#161D17] text-[#3E4D3E] dark:text-[#E2E8E2] shadow-xs"
                    : "text-[#7A7D75] hover:text-[#3E4D3E]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isRTL ? "الجدول" : "Schedule"} ({selectedTeacherSchedules.length})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: Profile */}
              {activeInspectorTab === "profile" && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl flex items-center justify-between border ${
                    selectedTeacher.profileCompleted
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300"
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {isRTL ? "حالة إكمال الملف الشخصي:" : "Profile Completion Status:"}{" "}
                        {selectedTeacher.profileCompleted
                          ? (isRTL ? "مكتمل" : "Completed")
                          : (isRTL ? "غير مكتمل" : "Incomplete")}
                      </span>
                    </div>

                    {selectedTeacher.profileCompletedAt && (
                      <span className="text-[11px] font-mono opacity-80">
                        {isRTL ? "تاريخ الإكمال:" : "Completed at:"}{" "}
                        {new Date(selectedTeacher.profileCompletedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Full Name */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "الاسم الكامل" : "Full Name"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                        {selectedTeacher.fullName || selectedTeacher.name || "N/A"}
                      </p>
                    </div>

                    {/* Display Name */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "اسم العرض" : "Display Name"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                        {selectedTeacher.displayName || selectedTeacher.name || "N/A"}
                      </p>
                    </div>

                    {/* Arabic Name */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "الاسم باللغة العربية" : "Arabic Name"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]" dir="rtl">
                        {selectedTeacher.arabicName || "N/A"}
                      </p>
                    </div>

                    {/* Username */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "اسم المستخدم" : "Username"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2] font-mono">
                        {selectedTeacher.username || "N/A"}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "البريد الإلكتروني" : "Email Address"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2] font-mono truncate">
                        {selectedTeacher.email || "N/A"}
                      </p>
                    </div>

                    {/* Country */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "الدولة" : "Country"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                        {selectedTeacher.country || selectedTeacher.location || "N/A"}
                      </p>
                    </div>

                    {/* Primary Teaching Language */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "لغة التدريس الأساسية" : "Teaching Language"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                        {selectedTeacher.teachingLanguage || selectedTeacher.preferredLanguage || "N/A"}
                      </p>
                    </div>

                    {/* Timezone */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "المنطقة الزمنية" : "Time Zone"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2] font-mono">
                        {selectedTeacher.timezone || "N/A"}
                      </p>
                    </div>

                    {/* Gender */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "الجنس" : "Gender"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                        {selectedTeacher.gender || "N/A"}
                      </p>
                    </div>

                    {/* Years of Experience */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "سنوات الخبرة" : "Years of Experience"}
                      </span>
                      <p className="text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                        {selectedTeacher.yearsExperience || selectedTeacher.yearsOfExperience
                          ? `${selectedTeacher.yearsExperience || selectedTeacher.yearsOfExperience} yrs`
                          : "N/A"}
                      </p>
                    </div>

                    {/* Specializations */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1 col-span-1 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "التخصصات" : "Specializations"}
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {selectedTeacher.specializations && selectedTeacher.specializations.length > 0 ? (
                          selectedTeacher.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 rounded bg-[#5A6B5A]/10 text-[#3E4D3E] dark:text-[#8BA888] text-xs font-semibold"
                            >
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#7A7D75]">N/A</span>
                        )}
                      </div>
                    </div>

                    {/* Account Created At */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-1">
                      <span className="text-[11px] font-semibold text-[#7A7D75] dark:text-stone-400 block">
                        {isRTL ? "تاريخ إنشاء الحساب" : "Account Creation Date"}
                      </span>
                      <p className="text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2] font-mono">
                        {selectedTeacher.createdAt
                          ? new Date(selectedTeacher.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Bio / Teaching Purpose */}
                  <div className="p-5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3E4D3E] dark:text-[#8BA888]">
                      {isRTL ? "النبذة والهدف والغاية من التدريس" : "Teacher Bio / Purpose"}
                    </h4>
                    <p className="text-sm text-[#2D332D] dark:text-stone-300 leading-relaxed font-serif">
                      {selectedTeacher.bio || selectedTeacher.purpose || "No bio or purpose provided."}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Students */}
              {activeInspectorTab === "students" && (
                <div className="space-y-4">
                  {selectedTeacherStudents.length === 0 ? (
                    <p className="text-xs text-center text-[#7A7D75] p-8">
                      {isRTL ? "لم يقم هذا المعلم بإضافة طلاب بعد." : "This teacher has not added any real students yet."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTeacherStudents.map((std) => (
                        <div
                          key={std.id}
                          className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                                {std.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded bg-[#F2EFE6] dark:bg-[#232B23] text-[10px] text-[#7A7D75]">
                                Age {std.age}
                              </span>
                            </div>
                            <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                              Level: {std.level} • Native: {std.nativeLanguage || "N/A"} • Target: {std.learningLanguage}
                            </p>
                            <p className="text-xs text-[#5A6B5A] dark:text-[#8BA888]">
                              Subjects: {std.subjects.join(", ")}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold self-start sm:self-center">
                            {std.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Curriculums */}
              {activeInspectorTab === "curriculums" && (
                <div className="space-y-4">
                  {selectedTeacherCurriculums.length === 0 ? (
                    <p className="text-xs text-center text-[#7A7D75] p-8">
                      {isRTL ? "لم يقم هذا المعلم بإنشاء مناهج بعد." : "This teacher has not created any curriculums yet."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTeacherCurriculums.map((curr) => (
                        <div
                          key={curr.id}
                          className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                              {curr.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-[#5A6B5A]/10 text-[#5A6B5A] text-[10px] font-bold">
                              {curr.subject}
                            </span>
                          </div>
                          <p className="text-xs text-[#7A7D75] dark:text-stone-400">
                            {curr.description}
                          </p>
                          <p className="text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888]">
                            Lessons count: {curr.lessons?.length || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Sessions */}
              {activeInspectorTab === "sessions" && (
                <div className="space-y-4">
                  {selectedTeacherSessions.length === 0 ? (
                    <p className="text-xs text-center text-[#7A7D75] p-8">
                      {isRTL ? "لم يتم تسجيل أي جلسات دروس لهذا المعلم بعد." : "No lesson sessions logged for this teacher yet."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTeacherSessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#1F261F] dark:text-[#E2E8E2]">
                              {sess.lessonTitle}
                            </h4>
                            <span className="text-xs text-[#7A7D75]">
                              {sess.date} ({sess.durationMinutes} mins)
                            </span>
                          </div>
                          {sess.teacherNotes && (
                            <p className="text-xs text-[#2D332D] dark:text-stone-300 italic bg-[#FCFAF5] dark:bg-[#1C251D] p-2 rounded">
                              « {sess.teacherNotes} »
                            </p>
                          )}
                          {sess.quizScore !== undefined && (
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Quiz Score: {sess.quizScore}%
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Schedule */}
              {activeInspectorTab === "schedule" && (
                <div className="space-y-4">
                  {selectedTeacherSchedules.length === 0 ? (
                    <p className="text-xs text-center text-[#7A7D75] p-8">
                      {isRTL ? "لا توجد مواعيد مجدولة لهذا المعلم." : "No scheduled classes for this teacher."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTeacherSchedules.map((sch) => (
                        <div
                          key={sch.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-semibold text-xs text-[#1F261F] dark:text-[#E2E8E2]">
                              {sch.title} ({sch.subject})
                            </h4>
                            <p className="text-[11px] text-[#7A7D75]">
                              {new Date(sch.startAt).toLocaleString()} • {sch.durationMinutes} mins
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                            {sch.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
