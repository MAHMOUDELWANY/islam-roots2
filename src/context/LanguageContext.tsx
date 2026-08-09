import React, { createContext, useContext, useState, useEffect } from "react";
import { LanguageCode } from "../types";
import { translations, getTranslation } from "../lib/translations";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isRTL: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("islam_roots_lang");
    return (saved === "ar" || saved === "en") ? saved : "en";
  });

  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("islam_roots_theme");
    return saved === "dark" ? "dark" : "light";
  });

  const isRTL = language === "ar";

  useEffect(() => {
    localStorage.setItem("islam_roots_lang", language);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  useEffect(() => {
    localStorage.setItem("islam_roots_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const t = (key: keyof typeof translations.en) => getTranslation(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, theme, toggleTheme, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
