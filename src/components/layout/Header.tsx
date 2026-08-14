import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { BrandLogo } from "../common/BrandLogo";
import { NotificationCenter } from "./NotificationCenter";
import { Moon, Sun, Sparkles, Plus, LogOut, ShieldCheck, Calendar } from "lucide-react";

interface HeaderProps {
  onOpenAddStudent?: () => void;
  onOpenNewLesson?: () => void;
  onOpenSchedule?: () => void;
  onOpenAuth?: () => void;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddStudent,
  onOpenNewLesson,
  onOpenSchedule,
  onOpenAuth,
  onOpenTour,
}) => {
  const { teacher, isAuthenticated, isGuest, logout } = useAuth();
  const { language, setLanguage, theme, toggleTheme, t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F7F3E9]/95 dark:bg-[#142019]/92 backdrop-blur-xl border-b border-[var(--brand-line)] dark:border-[#294535] px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Welcome Greeting */}
        <div className="flex items-center gap-3 sm:gap-4">
          <BrandLogo size="sm" showSubtitle={false} className="flex" />
          <div className="h-8 w-px bg-[#D2DDD2] dark:bg-[#2A352A] hidden sm:block" />
          <div className="flex flex-col">
            <h1 className="font-serif text-base sm:text-lg text-[#173326] dark:text-[#E2E8E2] font-semibold flex items-center gap-2 flex-wrap">
              <span>{t("welcomeBack")},</span>
              {teacher && (
                <span className="text-[#3E4D3E] dark:text-[#8BA888] font-bold not-italic">
                  {isGuest && language === "ar" ? "أستاذ ضيف" : teacher.name}
                </span>
              )}
              {isGuest && (
                <span className="px-2 py-0.5 rounded-md bg-[#F3F0E6] dark:bg-[#2C2A1F] text-[#6B3F1D] dark:text-[#E5C69B] border border-[#E5C99F] dark:border-[#6B3F1D] text-[10px] font-bold not-italic font-sans">
                  {language === "ar" ? "مساحة ضيف" : "Guest workspace"}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-[#7A7D75] dark:text-stone-400 hidden sm:block mt-0.5">
              {t("todayOverview")}
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Jalilah Guide Tour Button */}
          {onOpenTour && (
            <button
              id="tour-jalilah-guide"
              onClick={onOpenTour}
              className="ir-button ir-button-secondary flex items-center gap-1.5 px-3.5 py-1.5 text-xs cursor-pointer"
              title={t("jalilahGuideTitle")}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5A2B] dark:text-[#C49A6C]" />
              <span className="hidden sm:inline">{t("jalilahGuide")}</span>
            </button>
          )}

          {/* In-App Notifications Center */}
          <NotificationCenter onOpenSchedule={onOpenSchedule} />

          {/* Language Switcher */}
          <div className="flex items-center bg-[#E8E5DB] dark:bg-[#232B23] p-1 rounded-lg border border-[#D4D1C5]/60 dark:border-[#2A352A] text-xs">
            <button
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                language === "en"
                  ? "bg-[var(--brand-olive)] dark:bg-[#294A32] text-white dark:text-[#D6E9D5] shadow-xs"
                  : "text-[#7A7D75] dark:text-stone-300 hover:text-[var(--brand-olive)]"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("ar")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                language === "ar"
                  ? "bg-[var(--brand-olive)] dark:bg-[#294A32] text-white dark:text-[#D6E9D5] shadow-xs"
                  : "text-[#7A7D75] dark:text-stone-300 hover:text-[var(--brand-olive)]"
              }`}
            >
              العربية
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="ir-icon-button bg-[var(--brand-ivory)]/80 dark:bg-[#232B23] border border-[var(--brand-line)] text-[var(--brand-olive)] dark:text-stone-200 hover:bg-[var(--brand-line)] cursor-pointer"
            title={theme === "dark" ? t("lightMode") : t("darkMode")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#3E4D3E]" />}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="ir-icon-button flex items-center gap-2 p-1 bg-[var(--brand-ivory)] dark:bg-[#232B23] border border-[var(--brand-line)] hover:border-[var(--brand-olive-soft)] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#5A6B5A] text-white flex items-center justify-center font-bold text-xs shadow-xs font-serif">
                  {teacher?.name?.charAt(0) || "U"}
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="ir-button ir-button-primary px-3.5 py-1.5 text-xs cursor-pointer"
              >
                {t("login")}
              </button>
            )}

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-56 rounded-xl bg-[var(--brand-surface)] dark:bg-[#1C221C] border border-[var(--brand-line)] dark:border-[#2A352A] shadow-soft py-2 z-50 text-xs animate-fade-in">
                <div className="px-4 py-2 border-b border-[#E8E5DB] dark:border-[#2A352A]">
                  <p className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">{teacher?.name}</p>
                  <p className="text-[#7A7D75] dark:text-stone-400 truncate">{teacher?.username ? `@${teacher.username}` : teacher?.email}</p>
                </div>
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[#3E4D3E] dark:text-stone-300">
                    <ShieldCheck className="w-4 h-4 text-[#8BA888]" />
                    <span>Verified Educator</span>
                  </div>
                </div>
                <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] px-2 pt-1.5">
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left rtl:text-right font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

