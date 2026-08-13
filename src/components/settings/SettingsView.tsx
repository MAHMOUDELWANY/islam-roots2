import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";
import { Settings, User, Globe, Moon, Sun, RefreshCw, Save, Database } from "lucide-react";

export const SettingsView: React.FC = () => {
  const { teacher, isAdmin, isGuest, updateProfile, connectGoogleCalendar, connectGoogleDocs, connectGoogleSlides, connectGoogleTasks, connectGmail, connectGoogleForms, connectGooglePicker, googleTokens, logout } = useAuth();
  const { resetToDemoData, clearGuestData } = useData();
  const { language, setLanguage, theme, toggleTheme, t } = useLanguage();

  const [name, setName] = useState(teacher?.name || "");
  const [email, setEmail] = useState(teacher?.email || "");
  const [age, setAge] = useState(teacher?.age ? String(teacher.age) : "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    teacher?.yearsOfExperience ? String(teacher.yearsOfExperience) : ""
  );
  const [location, setLocation] = useState(teacher?.location || "");
  const [purpose, setPurpose] = useState(teacher?.purpose || "");
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, age, yearsOfExperience, location, purpose });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full space-y-5 sm:space-y-7 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#173326] dark:text-[#E2E8E2] flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#5A6B5A]" />
          <span>{t("settings")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#617267] dark:text-stone-400 mt-1 font-sans">
          {language === "ar" ? "نظّم مساحة العمل، واربط أدوات التعليم، وأدر تفضيلات المعلم." : "Shape your workspace, connect teaching tools, and manage educator preferences."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-7 items-start">
        {/* Left Column: Educator Profile & App Preferences */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {/* Teacher Profile Section */}
          <div className="p-6 rounded-2xl ir-surface space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <User className="w-5 h-5 text-[#5A6B5A]" />
              <span>{language === "ar" ? "ملف المعلم" : "Educator Profile"}</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ir-input w-full px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>

                {teacher?.username ? (
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                      {language === "ar" ? "اسم المستخدم" : "Username"}
                    </label>
                    <input
                      type="text"
                      value={teacher.username}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#f5f5f5] dark:bg-[#1f261f] text-[#7A7D75] dark:text-[#9EA89E] text-xs font-medium focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                      {language === "ar" ? "البريد الإلكتروني" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ir-input w-full px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                    {t("age")}
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t("agePlaceholder")}
                    className="ir-input w-full px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                    {language === "ar" ? "سنوات الخبرة" : t("yearsOfExperience")}
                  </label>
                  <input
                    type="text"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder={t("experiencePlaceholder")}
                    className="ir-input w-full px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                  {t("location")}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("locationPlaceholder")}
                  className="ir-input w-full px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                  {t("purpose")}
                </label>
                <textarea
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={t("purposePlaceholder")}
                  className="ir-input w-full px-3.5 py-2.5 text-xs font-medium focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {saved && (
                  <span className="text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888]">
                    ✓                     {language === "ar" ? "تم حفظ الملف الشخصي بنجاح" : "Profile saved successfully!"}
                  </span>
                )}
                <button
                  type="submit"
                  className="ir-button ir-button-primary ml-auto px-5 py-2.5 text-xs cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{t("save")}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Preferences Section */}
          <div className="p-6 rounded-2xl ir-surface space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#8B5A2B]" />
              <span>{language === "ar" ? "تفضيلات الواجهة" : "Language & Appearance"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language Switcher */}
              <div className="ir-inset p-4 space-y-2">
                <span className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] block">
                  {language === "ar" ? "اللغة" : t("language")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex-1 py-2 rounded-lg font-semibold cursor-pointer transition-all ${
                      language === "en"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "bg-white dark:bg-[#161D17] text-[#7A7D75] dark:text-stone-300 border border-[#E8E5DB] dark:border-[#2A352A]"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage("ar")}
                    className={`flex-1 py-2 rounded-lg font-semibold cursor-pointer transition-all ${
                      language === "ar"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "bg-white dark:bg-[#161D17] text-[#7A7D75] dark:text-stone-300 border border-[#E8E5DB] dark:border-[#2A352A]"
                    }`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              {/* Theme Switcher */}
              <div className="ir-inset p-4 space-y-2">
                <span className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] block">
                  {language === "ar" ? "مظهر الواجهة" : "Interface Theme"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => theme === "dark" && toggleTheme()}
                    className={`flex-1 py-2 rounded-lg font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      theme === "light"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "bg-white dark:bg-[#161D17] text-[#7A7D75] dark:text-stone-300 border border-[#E8E5DB] dark:border-[#2A352A]"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "فاتح" : "Light"}</span>
                  </button>
                  <button
                    onClick={() => theme === "light" && toggleTheme()}
                    className={`flex-1 py-2 rounded-lg font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      theme === "dark"
                        ? "bg-[#5A6B5A] text-white shadow-xs"
                        : "bg-white dark:bg-[#161D17] text-[#7A7D75] dark:text-stone-300 border border-[#E8E5DB] dark:border-[#2A352A]"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "داكن" : "Dark"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Integrations, Database Status & Actions */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6 lg:sticky lg:top-24 self-start">

      {/* Supabase Database & Authentication Status (Super Admin / Admin Only) */}
      {isAdmin && (
        <div className="p-6 rounded-2xl ir-surface space-y-4 text-xs">
          <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Database & Authentication</span>
          </h3>
          <p className="text-[#7A7D75] dark:text-stone-400">
            Supabase Postgres and Supabase Auth are integrated into IslamRoots to power live student progress tracking, cloud curriculum persistence, and secure teacher authentication.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="ir-inset p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Supabase Database</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Connected & Provisioned
                </span>
              </div>
              <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
                Postgres RLS Policies & Realtime Subscriptions Active.
              </p>
            </div>

            <div className="ir-inset p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Supabase Authentication</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
                Email/Password & OAuth Teacher Session Token Management active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Google Workspace Integrations */}
      <div className="p-6 rounded-2xl ir-surface space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#5A6B5A] dark:text-[#8BA888]" />
          <span>{language === "ar" ? "اتصالات Google Workspace" : "Google Workspace Connections"}</span>
        </h3>
        <p className="text-[#7A7D75] dark:text-stone-400">
          {language === "ar" ? "اربط تقويم Google وDocs وSlides وTasks وGmail وForms وDrive لمزامنة الجداول وتصدير خطط الدروس وإدارة مهامك التعليمية." : "Connect your Google Calendar, Google Docs, Google Slides, Google Tasks, Gmail, Google Forms, or Google Drive/Picker accounts to sync schedules, export lesson plans, manage tasks, and send student updates."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="ir-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Calendar</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.calendar ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.calendar ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              {language === "ar" ? "مزامنة مواعيد الطلاب مباشرة مع تقويم Google الأساسي." : "Sync student schedule entries directly to your primary Google Calendar."}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGoogleCalendar();
                  alert("Google Calendar connected successfully!");
                } catch (e: any) {
                  alert(e?.message || "Failed to connect Google Calendar");
                }
              }}
              className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
            >
              {googleTokens.calendar ? (language === "ar" ? "إعادة ربط التقويم" : "Reconnect Calendar") : (language === "ar" ? "ربط التقويم" : "Connect Calendar")}
            </button>
          </div>

          <div className="ir-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Docs</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.docs ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.docs ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              {language === "ar" ? "تصدير خطط دروس استوديو جليلة مباشرة إلى Google Docs." : "Export AI Jalilah lesson studio plans directly to Google Docs."}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGoogleDocs();
                  alert("Google Docs connected successfully!");
                } catch (e: any) {
                  alert(e?.message || "Failed to connect Google Docs");
                }
              }}
              className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
            >
              {googleTokens.docs ? (language === "ar" ? "إعادة ربط Docs" : "Reconnect Docs") : (language === "ar" ? "ربط Docs" : "Connect Docs")}
            </button>
          </div>

          <div className="ir-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Slides</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.slides ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.slides ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              {language === "ar" ? "تصدير خطط الدروس إلى عروض تقديمية في Google Slides." : "Export lesson plans into presentation decks in Google Slides."}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGoogleSlides();
                  alert("Google Slides connected successfully!");
                } catch (e: any) {
                  alert(e?.message || "Failed to connect Google Slides");
                }
              }}
              className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
            >
              {googleTokens.slides ? (language === "ar" ? "إعادة ربط Slides" : "Reconnect Slides") : (language === "ar" ? "ربط Slides" : "Connect Slides")}
            </button>
          </div>

          <div className="ir-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Tasks</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.tasks ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.tasks ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              {language === "ar" ? "مزامنة الواجبات وتذكيرات المهام مع Google Tasks." : "Sync homework and assignment reminders into Google Tasks."}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGoogleTasks();
                  alert("Google Tasks connected successfully!");
                } catch (e: any) {
                  alert(e?.message || "Failed to connect Google Tasks");
                }
              }}
              className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
            >
              {googleTokens.tasks ? (language === "ar" ? "إعادة ربط Tasks" : "Reconnect Tasks") : (language === "ar" ? "ربط Tasks" : "Connect Tasks")}
            </button>
          </div>

          <div className="ir-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Gmail</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.gmail ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.gmail ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              {language === "ar" ? "إرسال تقارير التقدم وتذكيرات الدروس عبر Gmail." : "Send progress reports and lesson reminders directly via Gmail."}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGmail();
                  alert("Gmail connected successfully!");
                } catch (e: any) {
                  alert(e?.message || "Failed to connect Gmail");
                }
              }}
              className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
            >
              {googleTokens.gmail ? (language === "ar" ? "إعادة ربط Gmail" : "Reconnect Gmail") : (language === "ar" ? "ربط Gmail" : "Connect Gmail")}
            </button>
          </div>

          {isAdmin && (
            <div className="ir-inset p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Forms</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.forms ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                  {googleTokens.forms ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
                </span>
              </div>
              <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
                Create student quizzes and feedback forms in Google Forms.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await connectGoogleForms();
                    alert("Google Forms connected successfully!");
                  } catch (e: any) {
                    alert(e?.message || "Failed to connect Google Forms");
                  }
                }}
                className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
              >
                {googleTokens.forms ? (language === "ar" ? "إعادة ربط Forms" : "Reconnect Forms") : (language === "ar" ? "ربط Forms" : "Connect Forms")}
              </button>
            </div>
          )}

          <div className="ir-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Drive & Picker</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.picker ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.picker ? (language === "ar" ? "متصل" : "Connected") : (language === "ar" ? "غير متصل" : "Not Connected")}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              {language === "ar" ? "اختيار الملفات والمستندات مباشرة من Google Drive." : "Pick files and documents directly from your Google Drive."}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGooglePicker();
                  alert("Google Drive & Picker connected successfully!");
                } catch (e: any) {
                  alert(e?.message || "Failed to connect Google Drive");
                }
              }}
              className="ir-button ir-button-primary w-full py-2 px-3 text-xs cursor-pointer text-center"
            >
              {googleTokens.picker ? (language === "ar" ? "إعادة ربط Drive" : "Reconnect Drive") : (language === "ar" ? "ربط Drive" : "Connect Drive")}
            </button>
          </div>
        </div>
      </div>

      {/* Legal & Public Links Section */}
      <div className="p-6 rounded-2xl ir-surface space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#8B5A2B]" />
          <span>{language === "ar" ? "الخصوصية والروابط القانونية" : "Legal & Privacy Links"}</span>
        </h3>
        <p className="text-[#7A7D75] dark:text-stone-400">
          {language === "ar" ? "روابط الامتثال العامة لوحدة تحكم Google Cloud والتحقق من بيانات OAuth." : "Public compliance links for Google Cloud Console and OAuth User Data verification."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="ir-button ir-button-secondary px-4 py-2.5 text-xs"
          >
            {language === "ar" ? "عرض سياسة الخصوصية" : "View Privacy Policy"}
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="ir-button ir-button-secondary px-4 py-2.5 text-xs"
          >
            {language === "ar" ? "عرض شروط الخدمة" : "View Terms of Service"}
          </a>
        </div>
      </div>

      {/* Demo Data Reset & Logout Section */}
      <div className="p-6 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-rose-700" />
          <span>{language === "ar" ? "الحساب وبيانات المعاينة" : "Account & Demo Controls"}</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">{language === "ar" ? "إعادة ضبط بيانات المعاينة" : "Reset Demo Data"}</p>
              <p className="text-[#7A7D75] dark:text-stone-400">{language === "ar" ? "استعادة الطلاب والمناهج التجريبية إلى حالتها الأولية." : "Restore sample students and curriculums to initial state."}</p>
          </div>
          <button
            onClick={resetToDemoData}
            className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
          >
              {language === "ar" ? "إعادة ضبط البيانات" : "Reset Demo Data"}
          </button>
        </div>

        {isGuest && (
          <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">{language === "ar" ? "مسح بيانات جلسة الضيف" : "Clear Guest Session Data"}</p>
              <p className="text-[#7A7D75] dark:text-stone-400">{language === "ar" ? "إزالة بيانات مساحة الضيف من جلسة المتصفح الحالية." : "Remove guest workspace data from this browser session and restore the sample workspace."}</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Clear all guest session data and restore the sample workspace?")) clearGuestData();
              }}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
            >
              {language === "ar" ? "مسح بيانات الضيف" : "Clear Guest Data"}
            </button>
          </div>
        )}

        <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">{language === "ar" ? "تسجيل الخروج" : "Sign Out"}</p>
              <p className="text-[#7A7D75] dark:text-stone-400">{language === "ar" ? "الخروج من حساب المعلم ومسح رمز الجلسة." : "Log out of your Ustadh account and clear session token."}</p>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white font-semibold cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
          >
            {language === "ar" ? "تسجيل الخروج" : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

