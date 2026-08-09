import React from "react";
import { useLanguage } from "../../context/LanguageContext";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = "md", showSubtitle = false }) => {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const iconSize = size === "sm" ? 32 : size === "md" ? 40 : 52;
  const textSize = size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-3xl";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon SVG: Tree Root + Leaves + Crescent Moon in Natural Tones */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-[#5A6B5A] text-white shadow-soft shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Crescent Moon top */}
          <path
            d="M 50 12 A 10 10 0 1 0 60 22 A 8 8 0 1 1 50 12 Z"
            fill="#FCFAF5"
          />
          {/* Tree Trunk & Roots */}
          <path
            d="M 48 30 C 48 40 45 50 42 58 C 38 68 30 78 20 84 M 52 30 C 52 40 55 50 58 58 C 62 68 70 78 80 84 M 50 50 C 48 62 46 72 40 88 M 50 50 C 52 62 54 72 60 88"
            stroke="#DDE2D5"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Foliage / Canopy Leaves */}
          <path
            d="M 32 32 C 24 28 20 18 30 14 C 40 10 45 22 50 24 C 55 22 60 10 70 14 C 80 18 76 28 68 32 C 78 38 72 50 62 48 C 58 47 54 42 50 40 C 46 42 42 47 38 48 C 28 50 22 38 32 32 Z"
            fill="#8BA888"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        {isRTL ? (
          <div className={`font-serif font-bold tracking-tight ${textSize} text-[#3E4D3E] dark:text-[#E2E8E2] flex items-center gap-1.5`}>
            <span>جذور</span>
            <span className="text-[#8BA888] font-normal italic">الإسلام</span>
          </div>
        ) : (
          <div className={`font-serif font-bold tracking-tight ${textSize} text-[#3E4D3E] dark:text-[#E2E8E2] uppercase flex items-center gap-1.5`}>
            <span>ISLAM</span>
            <span className="text-[#8BA888] font-normal italic">ROOTS</span>
          </div>
        )}

        {showSubtitle && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A7D75] dark:text-stone-400 -mt-0.5">
            {isRTL ? "منصة معلمي القرآن" : "Teacher Edition"}
          </span>
        )}
      </div>
    </div>
  );
};


