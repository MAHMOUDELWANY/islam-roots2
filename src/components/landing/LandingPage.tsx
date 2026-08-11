import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { BrandLogo } from "../common/BrandLogo";
import {
  Sparkles,
  BookOpen,
  Search,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  LogIn,
  Sun,
  Moon,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: () => void;
  onEnterAsGuest: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onEnterAsGuest, onOpenPrivacy, onOpenTerms }) => {
  const { loginAsGuest } = useAuth();
  const { language, setLanguage, theme, toggleTheme } = useLanguage();
  const isRTL = language === "ar";

  const [activeTab, setActiveTab] = useState<"dashboard" | "aiStudio" | "detective" | "memory">("dashboard");

  const handleQuickGuest = () => {
    loginAsGuest(isRTL ? "أستاذ محمود" : "Ustadh Mahmoud");
    onEnterAsGuest();
  };

  return (
    <div className="min-h-screen bg-[#FCFAF5] dark:bg-[#121812] text-[#1F261F] dark:text-[#E2E8E2] selection:bg-[#8BA888] selection:text-white font-sans transition-colors duration-300">
      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 w-full bg-[#FCFAF5]/90 dark:bg-[#121812]/90 backdrop-blur-md border-b border-[#E8E5DB] dark:border-[#2A352A] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo beside Brand Name */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" showSubtitle={true} />
          </div>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#3E4D3E] dark:text-stone-300">
            <a href="#about" className="hover:text-[#8BA888] transition-colors">
              {isRTL ? "عن المنصة" : "About"}
            </a>
            <a href="#who-its-for" className="hover:text-[#8BA888] transition-colors">
              {isRTL ? "من المعني؟" : "Who It's For"}
            </a>
            <a href="#features" className="hover:text-[#8BA888] transition-colors">
              {isRTL ? "المزايا والأدوات" : "Features"}
            </a>
            <a href="#preview" className="hover:text-[#8BA888] transition-colors">
              {isRTL ? "معاينة المنصة" : "App Preview"}
            </a>
          </div>

          {/* Right Action Controls (Sign In Button situated prominently) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#E8E5DB] dark:bg-[#232B23] p-1 rounded-lg border border-[#D4D1C5]/60 dark:border-[#2A352A] text-xs">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white dark:bg-[#3E4D3E] text-[#3E4D3E] dark:text-white shadow-xs"
                    : "text-[#7A7D75] dark:text-stone-300 hover:text-[#3E4D3E]"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  language === "ar"
                    ? "bg-white dark:bg-[#3E4D3E] text-[#3E4D3E] dark:text-white shadow-xs"
                    : "text-[#7A7D75] dark:text-stone-300 hover:text-[#3E4D3E]"
                }`}
              >
                عربي
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#E8E5DB]/70 dark:bg-[#232B23] border border-[#D4D1C5]/60 dark:border-[#2A352A] text-[#3E4D3E] dark:text-stone-200 hover:bg-[#E8E5DB] transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#3E4D3E]" />}
            </button>

            {/* Guest Quick Enter */}
            <button
              onClick={handleQuickGuest}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E5DB] dark:bg-[#232B23] hover:bg-[#D4D1C5] dark:hover:bg-[#2A352A] text-[#3E4D3E] dark:text-stone-200 text-xs font-semibold border border-[#D4D1C5] dark:border-[#2A352A] transition-all cursor-pointer"
            >
              <span>{isRTL ? "دخول سريع كزائر" : "Guest Mode"}</span>
            </button>

            {/* PROMINENT SIGN IN BUTTON */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3E4D3E] hover:bg-[#2A352A] text-white text-xs sm:text-sm font-semibold shadow-soft hover:shadow-md transition-all active:scale-95 cursor-pointer border border-[#5A6B5A]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isRTL ? "تسجيل الدخول" : "Sign In"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-8">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 dark:bg-emerald-900/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 dark:bg-amber-900/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3E4D3E]/10 dark:bg-[#8BA888]/15 border border-[#3E4D3E]/20 dark:border-[#8BA888]/30 text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold tracking-wide shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8B5A2B] dark:text-[#C49A6C] animate-pulse" />
            <span>
              {isRTL
                ? "المنصة الرقمية الأولى المخصصة لمعلمي القرآن الكريم والعلوم الشرعية"
                : "The Premier Digital Sanctuary for Quran & Islamic Studies Educators"}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#1F261F] dark:text-[#E2E8E2] leading-[1.15] max-w-4xl mx-auto"
          >
            {isRTL ? (
              <>
                ارتقِ برحلتك التعليمية في تدريس <span className="text-[#3E4D3E] dark:text-[#8BA888] italic">القرآن والعلوم الشرعية</span>
              </>
            ) : (
              <>
                Elevate Your <span className="text-[#3E4D3E] dark:text-[#8BA888] italic">Quran & Islamic Teaching</span> Experience
              </>
            )}
          </motion.h1>

          {/* Subtitle / Comprehensive Introduction */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base lg:text-lg text-[#5A615A] dark:text-stone-300 max-w-3xl mx-auto leading-relaxed font-sans"
          >
            {isRTL
              ? "منصة «جذور الإسلام» (Islam Roots) صُممت خصيصاً لمساعدة أساتذة المعاهد الكبرى، والكتاتيب، والمعلمين الخصوصيين. تمكنك من تنظيم قائمة طلابك، وبناء المناهج المخصصة، وتوليد خطط الدروس التفاعلية بمساعدة الذكاء الاصطناعي (جليلة)، مع تتبع دقيق لخريطة ذاكرة وحفظ كل طالب سورة بسورة وآية بآية."
              : "Islam Roots provides international Ustadhs, Islamic institutes, and private tutors with an integrated workspace. Organize student rosters, structure Hifz & Tajweed curriculums, generate instant AI lesson plans with assistant Jalilah, and track every student's Quran memorization with precision."}
          </motion.p>

          {/* Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#3E4D3E] hover:bg-[#2A352A] text-white font-bold text-sm sm:text-base shadow-soft hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-3 border border-[#5A6B5A]"
            >
              <LogIn className="w-5 h-5" />
              <span>{isRTL ? "ابدأ التدريس مجاناً الان" : "Get Started Free"}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              onClick={handleQuickGuest}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white dark:bg-[#161D17] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] text-[#3E4D3E] dark:text-stone-200 font-semibold text-sm sm:text-base border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-[#8B5A2B] dark:text-[#C49A6C]" />
              <span>{isRTL ? "تجربة فورية كمعلم زائر" : "Try Guest Ustadh Demo"}</span>
            </button>
          </motion.div>

          {/* Trust Highlights Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#7A7D75] dark:text-stone-400 font-medium"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? "بدون إعلانات ومجانية للمعلمين" : "100% Educator Focused"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? "حفظ سحابي آمن مع خيار الزائر" : "Cloud Sync & Offline Support"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isRTL ? "دعم كامل للغتين العربية والإنجليزية" : "Full English & Arabic Interface"}</span>
            </div>
          </motion.div>

          {/* GOOGLE VERIFICATION & APP PURPOSE SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-left p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#161D17]/90 backdrop-blur-md border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft max-w-4xl mx-auto space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E5DB] dark:border-[#2A352A] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8B5A2B] dark:text-[#C49A6C]" />
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                  Islam Roots Workspace <span className="text-xs font-mono font-normal text-[#5A615A] dark:text-stone-400">(islam-roots-workspace)</span>
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <a
                  href="/privacy"
                  onClick={(e) => {
                    if (onOpenPrivacy) {
                      e.preventDefault();
                      onOpenPrivacy();
                    }
                  }}
                  className="text-[#3E4D3E] dark:text-[#8BA888] underline hover:text-[#2A352A] font-semibold cursor-pointer"
                >
                  Privacy Policy
                </a>
                <span>•</span>
                <a
                  href="/terms"
                  onClick={(e) => {
                    if (onOpenTerms) {
                      e.preventDefault();
                      onOpenTerms();
                    }
                  }}
                  className="text-[#3E4D3E] dark:text-[#8BA888] underline hover:text-[#2A352A] font-semibold cursor-pointer"
                >
                  Terms of Service
                </a>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#3E4D3E] dark:text-stone-300 leading-relaxed font-sans">
              <strong>Application Purpose:</strong> Islam Roots Workspace is an all-in-one educational platform designed for Quran teachers, Tajweed scholars, Hifz academies, and Islamic studies educators. The application enables teachers to manage student progress records, create structured curriculums, generate AI-assisted lesson plans, and streamline educational administration.
            </p>

            <div className="space-y-1.5 text-xs text-[#5A615A] dark:text-stone-400 font-sans">
              <p className="font-semibold text-[#1F261F] dark:text-[#E2E8E2]">Google Workspace API Integrations:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <li className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB]/70 dark:border-[#2A352A]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BA888] shrink-0 mt-0.5" />
                  <span><strong>Google Calendar:</strong> Sync class schedules and Hifz revision sessions directly to teacher calendars.</span>
                </li>
                <li className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB]/70 dark:border-[#2A352A]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BA888] shrink-0 mt-0.5" />
                  <span><strong>Google Docs & Slides:</strong> Export generated Tajweed lesson plans and study presentations to Google Drive.</span>
                </li>
                <li className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB]/70 dark:border-[#2A352A]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BA888] shrink-0 mt-0.5" />
                  <span><strong>Google Tasks:</strong> Create and track teacher preparation tasks and student assignment reminders.</span>
                </li>
                <li className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB]/70 dark:border-[#2A352A]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BA888] shrink-0 mt-0.5" />
                  <span><strong>Gmail & Forms:</strong> Send student progress reports to parents and distribute Tajweed assessment quizzes.</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* App Interactive Showcase Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-8 max-w-5xl mx-auto"
          >
            <div className="p-3 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#161D17]/80 backdrop-blur-xl border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4">
              {/* Simulated App Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DB] dark:border-[#2A352A]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="text-[11px] font-mono text-[#7A7D75] dark:text-stone-400 ml-2">
                    islamroots.app/ustadh-dashboard
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  LIVE WORKSPACE DEMO
                </span>
              </div>

              {/* Simulated Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left rtl:text-right">
                {/* Card 1: Jalilah AI Prompt */}
                <div className="p-4 rounded-2xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                  <div className="flex items-center gap-2 text-[#8B5A2B] dark:text-[#C49A6C]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isRTL ? "استوديو جليلة الذكي" : "Jalilah AI Studio"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#1F261F] dark:text-[#E2E8E2]">
                    {isRTL ? "توليد خطة درس التجويد (أحكام النون الساكنة)" : "Generate Tajweed Lesson: Rules of Noon Sakinah"}
                  </p>
                  <p className="text-[11px] text-[#7A7D75] dark:text-stone-400 italic">
                    « Done! Generated 4 key rules, 6 practice questions, and non-native pronunciation tips. »
                  </p>
                </div>

                {/* Card 2: Student Hifz Progress */}
                <div className="p-4 rounded-2xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                  <div className="flex items-center justify-between text-[#3E4D3E] dark:text-[#8BA888]">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isRTL ? "متابعة حفظ الطلاب" : "Student Memory Map"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      94% Strong
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium text-[#2D332D] dark:text-stone-300">
                      <span>Juz Amma (Juz 30)</span>
                      <span>37 / 37 Surahs</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E8E5DB] dark:bg-[#2A352A] overflow-hidden">
                      <div className="h-full bg-[#5A6B5A] rounded-full w-[94%]" />
                    </div>
                  </div>
                </div>

                {/* Card 3: Memory Detective Quiz */}
                <div className="p-4 rounded-2xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Search className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isRTL ? "مكتشف حفظ القرآن" : "Memory Detective"}
                    </span>
                  </div>
                  <p className="text-xs text-[#2D332D] dark:text-stone-300">
                    Q: Complete Ayah: «وَٱﻟﺸَّﻤْﺲِ وَﺿُﺤَﻯٰﻫَﺎ ...»
                  </p>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    Correct: «وَٱﻟْﻘَﻤَرِ إِذَا ﺗَﻠَﻯٰﻫَﺎ»
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1: WHOM THIS WEBSITE IS MADE FOR */}
      <section id="who-its-for" className="py-16 sm:py-24 bg-[#F2EFE6]/60 dark:bg-[#161D17]/50 border-y border-[#E8E5DB] dark:border-[#2A352A] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B5A2B] dark:text-[#C49A6C]">
              {isRTL ? "الفئات المستهدفة" : "Target Educators"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {isRTL ? "من المعني باستخدام منصة «جذور الإسلام»؟" : "Whom is Islam Roots Made For?"}
            </h2>
            <p className="text-xs sm:text-sm text-[#5A615A] dark:text-stone-400 leading-relaxed">
              {isRTL
                ? "صُممت المنصة لتلبي احتياجات كل معلم ومربٍّ يسعى لتعليم كتاب الله والعلوم الشرعية بأعلى درجات الكفاءة والتنظيم."
                : "Tailored to empower every educator dedicated to passing down authentic Islamic knowledge and Quranic memorization."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Target 1 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 hover:border-[#5A6B5A] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888] flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "1. معلمو القرآن الكريم والتجويد" : "1. Quran & Tajweed Ustadhs"}
              </h3>
              <p className="text-xs sm:text-sm text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "سواء كنت تشرف على حلقات تحفيظ في المسجد أو تعلّم عن بُعد، تتيح لك المنصة متابعة الحفظ والمراجعة والمتشابهات وتثبيت التلاوة لكل طالب بسهولة."
                  : "Whether leading Mosque Halaqas or teaching globally via video calls, easily log student Hifz, revision (Muraja'ah), Tajweed rules, and weak verse recall."}
              </p>
            </div>

            {/* Target 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 hover:border-[#5A6B5A] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#8B5A2B]/10 text-[#8B5A2B] dark:text-[#C49A6C] flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "2. أساتذة العلوم الشرعية واللغة العربية" : "2. Islamic Studies & Arabic Tutors"}
              </h3>
              <p className="text-xs sm:text-sm text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "لأساتذة الفقه، والحديث، والعقيدة، واللغة العربية للناطقين بغيرها. تساعدك المنصة في بناء مناهج متدرجة وتوليد خطط دروس مبسطة."
                  : "For tutors instructing Hadith, Fiqh, Seerah, and Arabic grammar. Construct multi-level roadmaps and generate simplified explanations for non-native learners."}
              </p>
            </div>

            {/* Target 3 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-4 hover:border-[#5A6B5A] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "3. المراكز التعليمية والمعلمون الخصوصيون" : "3. Academies & Private Tutors"}
              </h3>
              <p className="text-xs sm:text-sm text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "تساعد المعلم الذي يدرّس عشرات الطلاب على تنظيم المواعيد، وإرسال الملاحظات لأولياء الأمور، وإدراج سجلات الحضور بانتظام."
                  : "Ideal for busy educators managing multiple student groups. Schedule lessons with auto-reminders, log attendance, and export student performance summaries."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT IT HELPS YOU IN (CORE FEATURES) */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#5A6B5A] dark:text-[#8BA888]">
              {isRTL ? "الأدوات والمميزات" : "Core Capabilities"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {isRTL ? "كيف تعينك المنصة في عملك اليومي؟" : "What Islam Roots Helps You Achieve"}
            </h2>
            <p className="text-xs sm:text-sm text-[#5A615A] dark:text-stone-400 leading-relaxed">
              {isRTL
                ? "مجموعة متكاملة من الأدوات الذكية والمصممة بعناية فائقة لتسهيل تحضير الدروس، واختبار الحفظ، وإدارة الطلاب."
                : "A suite of intelligent, educator-crafted tools designed to automate lesson prep, evaluate recall, and track student growth."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <div className="p-3 rounded-xl bg-[#8B5A2B]/10 text-[#8B5A2B] dark:text-[#C49A6C] w-fit">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "استوديو جليلة الذكي (Jalilah AI)" : "Jalilah AI Studio Assistant"}
              </h3>
              <p className="text-xs text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "مساعدة الذكاء الاصطناعي لإعداد خطط الدروس، توليد الأسئلة، صياغة نصائح الشرح، والتعاريف المبسطة بلمسة زر."
                  : "Your dedicated Islamic Educator AI. Instantly build lesson structures, generate Tajweed quizzes, and craft vocabulary guides."}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "مكتشف حفظ القرآن (Memory Detective)" : "Quran Memory Detective"}
              </h3>
              <p className="text-xs text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "أداة تفاعلية تشخص الآيات الضعيفة لدى الطالب، وتولّد أسئلة إكمال الآية والسورة التالية لقياس قوة الحفظ."
                  : "Diagnostic AI engine that tests verse continuation, next-Ayah recall, and gap filling to strengthen student retention."}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "خريطة الذاكرة البصرية (Visual Map)" : "Visual Progress & Memory Map"}
              </h3>
              <p className="text-xs text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "عرض بصري ملون لحالة كل سورة ومادة (مكتمل، قيد الدراسة، يحتاج مراجعة) لضمان عدم نسيان المحتوى السابق."
                  : "Color-coded visual progress indicators mapping out every student's mastery across Quran Surahs and Islamic subjects."}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <div className="p-3 rounded-xl bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888] w-fit">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "منشئ المناهج المخصصة" : "Custom Curriculum Builder"}
              </h3>
              <p className="text-xs text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "تصميم خطط دراسية متدرجة بالأسابيع والموضوعات وتحديد المواد المستهدفة وتخصيصها لكل طالب حسب مستواه."
                  : "Design structured, week-by-week learning paths for different student levels, assign subjects, and track topic completion."}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "جدول الحصص والتذكيرات" : "Smart Class Schedule"}
              </h3>
              <p className="text-xs text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "تنظيم مواعيد الدروس الأسبوعية واليومية وتلقي تذكيرات آلية قبل بدء الحصة لضمان الالتزام بالجدول."
                  : "Plan recurring classes, view daily agendas, and receive browser notification alerts before scheduled student sessions."}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F261F] dark:text-[#E2E8E2]">
                {isRTL ? "حفظ آمن ومراقبة عامة" : "Cloud Security & Super Admin"}
              </h3>
              <p className="text-xs text-[#5A615A] dark:text-stone-300 leading-relaxed">
                {isRTL
                  ? "ربط آمن مع قاعدة بيانات Supabase Postgres مع لوحة مراقبة شاملة للمشرف العام لمتابعة النشاط التعليمي."
                  : "Robust Supabase Postgres cloud persistence guaranteeing that your student records and lesson notes are safely stored."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE FEATURE PREVIEW TAB SWITCHER */}
      <section id="preview" className="py-16 sm:py-24 bg-[#F2EFE6]/60 dark:bg-[#161D17]/50 border-t border-[#E8E5DB] dark:border-[#2A352A] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B5A2B] dark:text-[#C49A6C]">
              {isRTL ? "نظرة داخل المنصة" : "Live Feature Preview"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              {isRTL ? "استكشف الواجهة التفاعلية" : "Explore Your Teaching Workspace"}
            </h2>
          </div>

          {/* Tabs Selector */}
          <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-x-auto max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#3E4D3E] text-white shadow-xs"
                  : "text-[#7A7D75] hover:text-[#1F261F] dark:hover:text-[#E2E8E2]"
              }`}
            >
              {isRTL ? "لوحة التحكم" : "Dashboard"}
            </button>

            <button
              onClick={() => setActiveTab("aiStudio")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "aiStudio"
                  ? "bg-[#3E4D3E] text-white shadow-xs"
                  : "text-[#7A7D75] hover:text-[#1F261F] dark:hover:text-[#E2E8E2]"
              }`}
            >
              {isRTL ? "استوديو جليلة AI" : "Jalilah AI"}
            </button>

            <button
              onClick={() => setActiveTab("detective")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "detective"
                  ? "bg-[#3E4D3E] text-white shadow-xs"
                  : "text-[#7A7D75] hover:text-[#1F261F] dark:hover:text-[#E2E8E2]"
              }`}
            >
              {isRTL ? "مكتشف الحفظ" : "Memory Detective"}
            </button>

            <button
              onClick={() => setActiveTab("memory")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "memory"
                  ? "bg-[#3E4D3E] text-white shadow-xs"
                  : "text-[#7A7D75] hover:text-[#1F261F] dark:hover:text-[#E2E8E2]"
              }`}
            >
              {isRTL ? "خريطة الذاكرة" : "Progress Map"}
            </button>
          </div>

          {/* Tab Display Area */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
                      {isRTL ? "نظرة عامة على جدول التدريس اليوم" : "Today's Ustadh Overview"}
                    </h4>
                    <span className="text-xs text-[#5A6B5A] dark:text-[#8BA888] font-bold">
                      {isRTL ? "3 حصص مجدولة اليوم" : "3 Classes Scheduled Today"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A]">
                      <span className="text-[10px] uppercase font-bold text-[#7A7D75]">Active Students</span>
                      <p className="text-xl font-bold font-serif text-[#1F261F] dark:text-[#E2E8E2]">12 Students</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A]">
                      <span className="text-[10px] uppercase font-bold text-[#7A7D75]">Average Hifz Score</span>
                      <p className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400">92%</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A]">
                      <span className="text-[10px] uppercase font-bold text-[#7A7D75]">AI Plans Crafted</span>
                      <p className="text-xl font-bold font-serif text-[#8B5A2B] dark:text-[#C49A6C]">28 Plans</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "aiStudio" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-4 text-left rtl:text-right"
                >
                  <div className="flex items-center gap-2 text-[#8B5A2B] dark:text-[#C49A6C]">
                    <Sparkles className="w-5 h-5" />
                    <h4 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
                      {isRTL ? "مساعدتك الذكية جليلة (Jalilah)" : "Jalilah AI Educator Assistant"}
                    </h4>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
                    <p className="text-xs font-bold text-[#3E4D3E] dark:text-[#8BA888]">
                      Generated Warm-up for Tajweed Lesson:
                    </p>
                    <p className="text-xs text-[#2D332D] dark:text-stone-300 italic">
                      « Today we explore the rules of Izhar Halqi. Remember to clarify the throat letters: (ء، هـ، ع، ح، غ، خ) with clear pronunciation without nasalization (Ghunnah). »
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "detective" && (
                <motion.div
                  key="det"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-4 text-left rtl:text-right"
                >
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Search className="w-5 h-5" />
                    <h4 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
                      {isRTL ? "مكتشف الحفظ التفاعلي" : "Quran Memory Detective Challenge"}
                    </h4>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-2">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Surah Al-Mulk (Aya 1 to 5 Test)
                    </p>
                    <p className="text-xs text-stone-700 dark:text-stone-300">
                      Prompt: «ٱﻟَّﺬِﻯ ﺧَﻠَﻖَ ٱﻟْﻤَﻮْتَ وَٱﻟْﺤَﻴَﻮٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ ...»
                    </p>
                    <span className="inline-block px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-bold">
                      Correct Answer: «أَحْسَنُ عَمَلًا»
                    </span>
                  </div>
                </motion.div>
              )}

              {activeTab === "memory" && (
                <motion.div
                  key="mem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-4 text-left rtl:text-right"
                >
                  <h4 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
                    {isRTL ? "خريطة الذاكرة للسور والدروس" : "Student Memory Progress Indicators"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Surah Al-Fatiha</span>
                      <p className="text-[10px] text-emerald-600 font-semibold">100% Mastered</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Juz 30 (Amma)</span>
                      <p className="text-[10px] text-emerald-600 font-semibold">95% Strong</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Juz 29 (Tabarak)</span>
                      <p className="text-[10px] text-amber-600 font-semibold">Needs Revision</p>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Juz 28 (Qad Samia)</span>
                      <p className="text-[10px] text-stone-500 font-semibold">Upcoming</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-[#2A352A] via-[#1F261F] to-[#161D17] text-white p-8 sm:p-12 text-center space-y-6 shadow-2xl border border-[#3E4D3E] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <BrandLogo size="lg" showSubtitle={true} className="justify-center" />

          <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
            {isRTL ? "انضم الآن وابدأ بتنظيم حلقاتك التعليمية" : "Start Empowering Your Students Today"}
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
            {isRTL
              ? "انضم إلى المئات من أساتذة القرآن الكريم والعلوم الشرعية واستفد من أحدث التقنيات الرقمية المخصصة للتعليم الإسلامي."
              : "Join educators worldwide and transform your teaching with structured curriculums, AI assistance, and precise memory tracking."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#1F261F] hover:bg-[#FCFAF5] font-bold text-sm shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#3E4D3E]" />
              <span>{isRTL ? "تسجيل الدخول / إنشاء حساب" : "Sign In or Register"}</span>
            </button>

            <button
              onClick={handleQuickGuest}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all cursor-pointer"
            >
              <span>{isRTL ? "دخول كمعلم زائر" : "Continue as Guest"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E8E5DB] dark:border-[#2A352A] py-8 px-4 sm:px-8 bg-white dark:bg-[#121812]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A7D75] dark:text-stone-400">
          <BrandLogo size="sm" showSubtitle={false} />
          <p>© {new Date().getFullYear()} Islam Roots (جذور الإسلام). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="/privacy"
              onClick={(e) => {
                if (onOpenPrivacy) {
                  e.preventDefault();
                  onOpenPrivacy();
                }
              }}
              className="hover:text-[#3E4D3E] dark:hover:text-[#E2E8E2] underline font-medium transition-colors cursor-pointer"
            >
              {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
            </a>
            <span>•</span>
            <a
              href="/terms"
              onClick={(e) => {
                if (onOpenTerms) {
                  e.preventDefault();
                  onOpenTerms();
                }
              }}
              className="hover:text-[#3E4D3E] dark:hover:text-[#E2E8E2] underline font-medium transition-colors cursor-pointer"
            >
              {isRTL ? "شروط الخدمة" : "Terms of Service"}
            </a>
            <span>•</span>
            <button onClick={onOpenAuth} className="hover:text-[#3E4D3E] dark:hover:text-[#E2E8E2] transition-colors cursor-pointer">
              {isRTL ? "تسجيل الدخول" : "Sign In"}
            </button>
            <span>•</span>
            <button onClick={handleQuickGuest} className="hover:text-[#3E4D3E] dark:hover:text-[#E2E8E2] transition-colors cursor-pointer">
              {isRTL ? "معلم زائر" : "Guest Mode"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
