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
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#5A6B5A]" />
          <span>{t("settings")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 mt-1 font-sans">
          Manage teacher account preferences, workspace theme, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Educator Profile & App Preferences */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Teacher Profile Section */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <User className="w-5 h-5 text-[#5A6B5A]" />
              <span>Educator Profile</span>
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
                  />
                </div>

                {teacher?.username ? (
                  <div className="space-y-1">
                    <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                      Username
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                    {t("yearsOfExperience")}
                  </label>
                  <input
                    type="text"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder={t("experiencePlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {saved && (
                  <span className="text-xs font-semibold text-[#3E4D3E] dark:text-[#8BA888]">
                    ✓ Profile saved successfully!
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{t("save")}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Preferences Section */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#8B5A2B]" />
              <span>App Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language Switcher */}
              <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                <span className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] block">
                  {t("language")}
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
              <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                <span className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] block">
                  Interface Theme
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
                    <span>Light</span>
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
                    <span>Dark</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Integrations, Database Status & Actions */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">

      {/* Supabase Database & Authentication Status (Super Admin / Admin Only) */}
      {isAdmin && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
          <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Database & Authentication</span>
          </h3>
          <p className="text-[#7A7D75] dark:text-stone-400">
            Supabase Postgres and Supabase Auth are integrated into IslamRoots to power live student progress tracking, cloud curriculum persistence, and secure teacher authentication.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
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

            <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
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
      <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#5A6B5A] dark:text-[#8BA888]" />
          <span>Google Workspace Connections</span>
        </h3>
        <p className="text-[#7A7D75] dark:text-stone-400">
          Connect your Google Calendar, Google Docs, Google Slides, Google Tasks, Gmail, Google Forms, or Google Drive/Picker accounts to sync schedules, export lesson plans, manage tasks, and send student updates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Calendar</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.calendar ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.calendar ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              Sync student schedule entries directly to your primary Google Calendar.
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
              className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
            >
              {googleTokens.calendar ? "Reconnect Calendar" : "Connect Calendar"}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Docs</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.docs ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.docs ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              Export AI Jalilah lesson studio plans directly to Google Docs.
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
              className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
            >
              {googleTokens.docs ? "Reconnect Docs" : "Connect Docs"}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Slides</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.slides ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.slides ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              Export lesson plans into presentation decks in Google Slides.
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
              className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
            >
              {googleTokens.slides ? "Reconnect Slides" : "Connect Slides"}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Tasks</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.tasks ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.tasks ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              Sync homework and assignment reminders into Google Tasks.
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
              className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
            >
              {googleTokens.tasks ? "Reconnect Tasks" : "Connect Tasks"}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Gmail</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.gmail ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.gmail ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              Send progress reports and lesson reminders directly via Gmail.
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
              className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
            >
              {googleTokens.gmail ? "Reconnect Gmail" : "Connect Gmail"}
            </button>
          </div>

          {isAdmin && (
            <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Forms</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.forms ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                  {googleTokens.forms ? "Connected" : "Not Connected"}
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
                className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
              >
                {googleTokens.forms ? "Reconnect Forms" : "Connect Forms"}
              </button>
            </div>
          )}

          <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Drive & Picker</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${googleTokens.picker ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}>
                {googleTokens.picker ? "Connected" : "Not Connected"}
              </span>
            </div>
            <p className="text-[#7A7D75] dark:text-stone-400 text-[11px]">
              Pick files and documents directly from your Google Drive.
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
              className="w-full py-2 px-3 rounded-lg bg-[#3E4D3E] hover:bg-[#2D382D] text-white font-semibold cursor-pointer text-center"
            >
              {googleTokens.picker ? "Reconnect Drive" : "Connect Drive"}
            </button>
          </div>
        </div>
      </div>

      {/* Legal & Public Links Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#8B5A2B]" />
          <span>Legal & Privacy Links</span>
        </h3>
        <p className="text-[#7A7D75] dark:text-stone-400">
          Public compliance links for Google Cloud Console and OAuth User Data verification.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] font-bold text-[#3E4D3E] dark:text-[#8BA888] hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] transition-all"
          >
            📄 View Public Privacy Policy (/privacy)
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] font-bold text-[#3E4D3E] dark:text-[#8BA888] hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] transition-all"
          >
            📋 View Public Terms of Service (/terms)
          </a>
        </div>
      </div>

      {/* Demo Data Reset & Logout Section */}
      <div className="p-6 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 text-xs">
        <h3 className="text-base font-serif font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-rose-700" />
          <span>Account & Demo Controls</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">Reset Demo Data</p>
            <p className="text-[#7A7D75] dark:text-stone-400">Restore sample students and curriculums to initial state.</p>
          </div>
          <button
            onClick={resetToDemoData}
            className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
          >
            Reset Demo Data
          </button>
        </div>

        {isGuest && (
          <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">Clear Guest Session Data</p>
              <p className="text-[#7A7D75] dark:text-stone-400">Remove guest workspace data from this browser session and restore the sample workspace.</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Clear all guest session data and restore the sample workspace?")) clearGuestData();
              }}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
            >
              Clear Guest Data
            </button>
          </div>
        )}

        <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">Sign Out</p>
            <p className="text-[#7A7D75] dark:text-stone-400">Log out of your Ustadh account and clear session token.</p>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white font-semibold cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

