import React from "react";
import { useLanguage } from "../../context/LanguageContext";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  showWorkspaceBadge?: boolean;
  variant?: "inline" | "card";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
  showSubtitle = false,
  showWorkspaceBadge = true,
  variant = "inline"
}) => {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const iconDimensions = {
    sm: { container: 36, img: "p-1" },
    md: { container: 46, img: "p-1.5" },
    lg: { container: 58, img: "p-2" },
    xl: { container: 80, img: "p-2.5" }
  }[size];

  const textClasses = {
    sm: "text-base gap-1",
    md: "text-xl gap-1.5",
    lg: "text-2xl gap-2",
    xl: "text-3xl gap-2"
  }[size];

  if (variant === "card") {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-[#16211A] border border-[#2B3B2E] rounded-2xl shadow-md text-center max-w-sm mx-auto select-none ${className}`}>
        <div className="w-24 h-24 mb-4 relative flex items-center justify-center rounded-xl bg-[#111A14] border border-[#28382B] p-2 shadow-inner">
          <img
            src="/logo-transparent.svg"
            alt="ISLAM ROOTS"
            className="w-full h-full object-contain filter drop-shadow-xs"
          />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#E2ECE2] tracking-tight flex items-center justify-center gap-2">
          <span>ISLAM</span>
          <span className="text-[#8BA888] font-semibold">ROOTS</span>
        </h2>
        <p className="text-xs font-mono font-semibold text-[#8BA888] tracking-widest uppercase mt-1">
          {isRTL ? "منصة معلمي القرآن الكريم" : "Teacher Workspace"}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Deep Botanical Forest Green Container Card for Crisp Logo Separation */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-[#16211A] dark:bg-[#0E1610] shrink-0 border border-[#28382B] dark:border-[#202E23] shadow-xs transition-all duration-200 hover:border-[#3D5240]"
        style={{ width: iconDimensions.container, height: iconDimensions.container }}
      >
        <img
          src="/logo-transparent.svg"
          alt="ISLAM ROOTS Logo"
          className={`w-full h-full object-contain ${iconDimensions.img}`}
        />
      </div>

      <div className="flex flex-col justify-center">
        {isRTL ? (
          <div className={`font-serif font-bold tracking-tight ${textClasses} text-[#2A3B2C] dark:text-[#E2E8E2] flex items-center`}>
            <span>جذور</span>
            <span className="text-[#1F6F4A] dark:text-[#8BA888] font-semibold">الإسلام</span>
            {showWorkspaceBadge && (
              <span className="text-[10px] bg-[#16211A] text-[#8BA888] px-1.5 py-0.5 rounded font-mono font-normal border border-[#28382B]">
                {isRTL ? "مساحة العمل" : "workspace"}
              </span>
            )}
          </div>
        ) : (
          <div className={`font-serif font-bold tracking-tight ${textClasses} text-[#2A3B2C] dark:text-[#E2E8E2] uppercase flex items-center`}>
            <span>ISLAM</span>
            <span className="text-[#1F6F4A] dark:text-[#8BA888] font-semibold">ROOTS</span>
            {showWorkspaceBadge && (
              <span className="text-[10px] font-mono font-semibold tracking-normal text-[#8BA888] lowercase bg-[#16211A] px-1.5 py-0.5 rounded border border-[#28382B]">
                workspace
              </span>
            )}
          </div>
        )}

        {showSubtitle && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5C6D5E] dark:text-[#9AA89C] -mt-0.5">
            {isRTL ? "مساحة العمل" : "Workspace"}
          </span>
        )}
      </div>
    </div>
  );
};
