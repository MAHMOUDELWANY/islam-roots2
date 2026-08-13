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
  const { t } = useLanguage();
  const { teacher, isAdmin } = useAuth();

  const navItems: { id: NavSection; labelKey: any; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "dashboard",
      labelKey: "dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: "admin" as NavSection,
            labelKey: "adminMonitor",
            icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            badge: "SUPER",
          },
        ]
      : []),
    {
      id: "students",
      labelKey: "students",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "curriculums",
      labelKey: "curriculums",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "schedule",
      labelKey: "schedule",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "lessonStudio",
      labelKey: "lessonStudio",
      icon: <Sparkles className="w-4 h-4" />,
      badge: "AI",
    },
    {
      id: "quranDetective",
      labelKey: "quranDetective",
      icon: <SearchCheck className="w-4 h-4" />,
    },
    {
      id: "progressMap",
      labelKey: "progressMap",
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: "settings",
      labelKey: "settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-68 bg-[#F7F3E9] dark:bg-[#142019] border-r border-[#D9E3D9] dark:border-[#294535] min-h-screen p-5 xl:p-6 transition-colors select-none">
      {/* Brand Header */}
      <div className="mb-8">
        <BrandLogo size="md" showSubtitle={false} />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2.5 my-2">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              id={`desktop-tour-nav-${item.id}`}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#E5EFE7] dark:bg-[#20382A] text-[#1F6F4A] dark:text-[#B9D7BF] border-l-4 border-[#1F6F4A] font-semibold shadow-xs"
                  : "text-[#617267] dark:text-stone-400 hover:text-[#1F6F4A] dark:hover:text-[#E2E8E2] hover:bg-[#EEF4EE] dark:hover:bg-[#1D3024]"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`relative shrink-0 ${isActive ? "text-[#5A6B5A] dark:text-[#8BA888]" : "text-[#7A7D75] dark:text-stone-400"}`}>
                  {item.icon}
                </span>
                <span className="max-w-[145px] whitespace-normal text-left leading-tight">{t(item.labelKey)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-[#5A6B5A] text-white"
                        : "bg-[#E8E5DB] text-[#3E4D3E] dark:bg-stone-700 dark:text-stone-300"
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
      <div className="mt-auto p-4 bg-[#F3F0E6] dark:bg-[#1B2C21] rounded-xl border border-[#D9E3D9] dark:border-[#294535]">
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


