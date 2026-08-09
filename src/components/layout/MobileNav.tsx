import React from "react";
import { NavSection } from "./Sidebar";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
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

interface MobileNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentSection, onSelectSection }) => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const navItems: { id: NavSection; labelKey: any; icon: React.ReactNode }[] = [
    { id: "dashboard", labelKey: "dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    ...(isAdmin
      ? [
          {
            id: "admin" as NavSection,
            labelKey: "adminMonitor",
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          },
        ]
      : []),
    { id: "students", labelKey: "students", icon: <Users className="w-5 h-5" /> },
    { id: "curriculums", labelKey: "curriculums", icon: <BookOpen className="w-5 h-5" /> },
    { id: "schedule", labelKey: "schedule", icon: <Calendar className="w-5 h-5 text-[#5A6B5A]" /> },
    { id: "lessonStudio", labelKey: "lessonStudio", icon: <Sparkles className="w-5 h-5 text-[#8B5A2B]" /> },
    { id: "quranDetective", labelKey: "quranDetective", icon: <SearchCheck className="w-5 h-5" /> },
    { id: "progressMap", labelKey: "progressMap", icon: <Network className="w-5 h-5" /> },
    { id: "settings", labelKey: "settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCFAF5]/95 dark:bg-[#161D17]/95 backdrop-blur-md border-t border-[#E8E5DB] dark:border-[#2A352A] px-2 py-1.5 shadow-soft">
      <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium min-w-[58px] transition-all cursor-pointer ${
                isActive
                  ? "text-[#3E4D3E] dark:text-[#E2E8E2] bg-[#E8E5DB] dark:bg-[#2A352A] font-semibold"
                  : "text-[#7A7D75] dark:text-stone-400 hover:text-[#3E4D3E]"
              }`}
            >
              <div className={isActive ? "scale-105 transition-transform text-[#5A6B5A]" : ""}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 whitespace-nowrap truncate max-w-[64px]">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

