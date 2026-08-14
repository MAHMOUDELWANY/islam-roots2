import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { BrandLogo } from "../common/BrandLogo";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  SearchCheck,
  Network,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type NavSection =
  | "dashboard"
  | "students"
  | "curriculums"
  | "schedule"
  | "lessonStudio"
  | "quranDetective"
  | "progressMap"
  | "admin"
  | "settings";

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { t, language } = useLanguage();
  const { teacher, isAdmin } = useAuth();

  const navItems: { id: NavSection; labelKey: any; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "dashboard",
      labelKey: "dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    ...(isAdmin
      ? [
          {
            id: "admin" as NavSection,
            labelKey: "adminMonitor",
            icon: <ShieldCheck className="w-5 h-5 text-[var(--brand-olive)] dark:text-[var(--brand-sage)]" />,
            badge: "SUPER",
          },
        ]
      : []),
    {
      id: "students",
      labelKey: "students",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "curriculums",
      labelKey: "curriculums",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: "schedule",
      labelKey: "schedule",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: "lessonStudio",
      labelKey: "lessonStudio",
      icon: <Sparkles className="w-5 h-5" />,
      badge: "AI",
    },
    {
      id: "quranDetective",
      labelKey: "quranDetective",
      icon: <SearchCheck className="w-5 h-5" />,
    },
    {
      id: "progressMap",
      labelKey: "progressMap",
      icon: <Network className="w-5 h-5" />,
    },
    {
      id: "settings",
      labelKey: "settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      aria-label={language === "ar" ? "التنقل الرئيسي" : "Main navigation"}
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-64 xl:w-68 h-screen overflow-y-auto bg-[var(--brand-sand)] dark:bg-[#142019] border-r border-[var(--brand-line)] dark:border-[#294535] p-5 xl:p-6 transition-colors select-none"
    >
      {/* Brand Header */}
      <div className="mb-8 shrink-0">
        <BrandLogo size="md" showSubtitle={false} showWorkspaceBadge={false} />
        <p className="mt-2 ms-[58px] text-[10px] font-mono font-semibold tracking-wider uppercase text-[var(--brand-olive)] dark:text-[var(--brand-sage)]">
          {language === "ar" ? "مساحة العمل" : "Workspace"}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-3 my-2">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              id={`desktop-tour-nav-${item.id}`}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[var(--brand-olive)] text-white dark:bg-[#294A32] dark:text-[#D6E9D5] border-l-4 border-[var(--brand-olive-deep)] dark:border-[var(--brand-sage)] font-semibold shadow-xs"
                  : "text-[var(--brand-muted)] dark:text-stone-400 hover:text-[var(--brand-olive)] dark:hover:text-[#E2E8E2] hover:bg-[var(--brand-ivory)] dark:hover:bg-[#1D3024]"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`relative shrink-0 transition-colors ${isActive ? "text-white dark:text-[#D6E9D5]" : "text-[#7A7D75] dark:text-stone-400"}`}>
                  {item.icon}
                </span>
                <span className="max-w-[145px] whitespace-normal text-left leading-tight">{t(item.labelKey)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`ir-badge rounded-md uppercase tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-[var(--brand-sage)]/20 dark:text-[#D6E9D5]"
                        : "bg-[var(--brand-line)] text-[var(--brand-olive)] dark:bg-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Educator Footer Card */}
      <div className="ir-inset mt-auto p-4 dark:bg-[#1B2C21] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D4D1C5] dark:bg-stone-600 text-[#3E4D3E] dark:text-stone-200 flex items-center justify-center font-bold text-sm font-serif">
            {teacher?.name?.charAt(0) || "U"}
          </div>
          <div className="overflow-hidden text-left rtl:text-right">
            <p className="text-xs font-semibold text-[#3E4D3E] dark:text-[#E2E8E2] truncate">
              {teacher?.name || "Ustadh Mahmoud"}
            </p>
            <p className="text-[10px] text-[#617267] dark:text-stone-400">{t("workspace") || "Workspace"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};


