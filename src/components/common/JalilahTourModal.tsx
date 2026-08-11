import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { NavSection } from "../layout/Sidebar";
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  LayoutDashboard,
  Users,
  Calendar,
  SearchCheck,
  Award,
  Lightbulb,
  Minimize2,
  Maximize2,
  MousePointerClick,
  SlidersHorizontal,
} from "lucide-react";

interface JalilahTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: NavSection) => void;
}

interface TourStep {
  id: number;
  section: NavSection;
  icon: React.ReactNode;
  tabLabelEn: string;
  tabLabelAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  notesEn: string[];
  notesAr: string[];
  buttonHighlightsEn: string[];
  buttonHighlightsAr: string[];
  highlightTipEn?: string;
  highlightTipAr?: string;
}

export const JalilahTourModal: React.FC<JalilahTourModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
}) => {
  const { language, t } = useLanguage();
  const { teacher, updateProfile } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const steps: TourStep[] = [
    {
      id: 1,
      section: "dashboard",
      icon: <Sparkles className="w-5 h-5 text-[#8B5A2B]" />,
      tabLabelEn: "Welcome",
      tabLabelAr: "مرحباً بك",
      titleEn: `Ahlan ${teacher?.name || "Ustadh"}! Meet Jalilah (جليلة)`,
      titleAr: `أهلاً بك يا ${teacher?.name || "أستاذنا"}! معك جليلة (Jalilah)`,
      subtitleEn: "Your personal Islamic Educator AI Guide & Teaching Assistant.",
      subtitleAr: "مرشدتك ومساعدتك الذكية الخاصة لتدريس القرآن والعلوم الإسلامية.",
      notesEn: [
        "Welcome to Islam Roots Educator Workspace!",
        "I am Jalilah (جليلة), your dedicated AI guide for Quran tutors and Islamic educators.",
        "As you navigate through the website, I will stay on your screen with floating widgets explaining every tab and button in real time.",
      ],
      notesAr: [
        "أهلاً ومرحباً بك في مساحة عمل إسلام رووتس للمعلمين!",
        "أنا جليلة (Jalilah)، المساعد الذكي المخصص لمعلمي القرآن الكريم والعلوم الشرعية.",
        "أثناء تصفحك للموقع، سأبقى معك بويدجت عائم ذكي يشير إلى كل زر وقسم تشاهده على شاشتك في الوقت الفعلي.",
      ],
      buttonHighlightsEn: ["✨ Jalilah Guide Button (Header)", "🌐 Language Toggle (AR/EN)", "👤 Educator Profile"],
      buttonHighlightsAr: ["✨ زر دليل جليلة (الأعلى)", "🌐 زر تغيير اللغة (عربي/إنجليزي)", "👤 ملف المعلم الشخصي"],
      highlightTipEn: "Tip: You can freely click any button or tab on your screen while I guide you!",
      highlightTipAr: "تنبيه: يمكنك الضغط والتفاعل مع أي زر في شاشتك بحرية أثناء الجولة!",
    },
    {
      id: 2,
      section: "dashboard",
      icon: <LayoutDashboard className="w-5 h-5 text-[#5A6B5A]" />,
      tabLabelEn: "Dashboard",
      tabLabelAr: "لوحة التحكم",
      titleEn: "1. Educator Command Center (Dashboard)",
      titleAr: "١. لوحة التحكم الرئيسية (Dashboard)",
      subtitleEn: "Overview of your active students, class schedules, and quick actions.",
      subtitleAr: "متابعة شاملة لجميع الطلاب، الجدول اليومي، والأزرار السريعة.",
      notesEn: [
        "Active Metrics: Track student attendance, average progress rates, and total active halaqas.",
        "Quick Action Buttons: Use the floating quick action buttons to log lessons or add students.",
        "Today's Schedule: Check today's classes with automated sound chime reminders.",
      ],
      notesAr: [
        "مؤشرات الإنجاز: متابعة عدد الطلاب، نسبة الحفظ الإجمالية، ونسب الحضور والغياب.",
        "أزرار الإجراءات السريعة: استعن بالأزرار العائمة العلوية لتسجيل درس أو إضافة طالب فوراً.",
        "جدول اليوم: استعراض حصص اليوم والتنبيهات الصوتية المباشرة.",
      ],
      buttonHighlightsEn: ["⚡ 'Record Lesson' Quick Button", "👥 'Add Student' Button", "✨ 'Jalilah AI Studio' Launch", "📅 'Today's Schedule' Widget"],
      buttonHighlightsAr: ["⚡ زر 'تسجيل درس' السريع", "👥 زر 'إضافة طالب جديد'", "✨ زر فتح 'استوديو جليلة'", "📅 ويدجت 'حصص اليوم'"],
      highlightTipEn: "Look at the Dashboard view behind this guide — all key stats and quick buttons are fully visible!",
      highlightTipAr: "شاهد لوحة التحكم خلف هذا المرشد — جميع الإحصائيات والأزرار البارزة معروضة أمامك تماماً!",
    },
    {
      id: 3,
      section: "students",
      icon: <Users className="w-5 h-5 text-[#3E4D3E]" />,
      tabLabelEn: "Students Roster",
      tabLabelAr: "سجل الطلاب",
      titleEn: "2. Student Roster & Memorization Logs",
      titleAr: "٢. سجل الطلاب ومتابعة الحفظ",
      subtitleEn: "Manage student profiles, Quran memorization, and Tajweed notes.",
      subtitleAr: "إدارة بيانات الطلاب، متابعة الحفظ والتجويد، وسجل الحصص.",
      notesEn: [
        "Student Cards: View detailed student profiles, native language, and assigned curriculum.",
        "Lesson Session Logger: Record attendance, Tajweed feedback, and homework assignments.",
        "Memorization Insight: Track strong recall surahs and areas needing practice.",
      ],
      notesAr: [
        "بطاقات الطلاب: استعراض سن الطالب، لغته الأم، المنهج المخصص، وتاريخ الانضمام.",
        "تدوين الحِصّة: تسجيل مدة الدرس، حالة الحضور، ملاحظات أحكام التجويد، والواجب.",
        "تحليلات جليلة الذكية: تقييم استدعاء وتثبيت الحفظ وتحديد السور للمراجعة.",
      ],
      buttonHighlightsEn: ["➕ 'Add Student' Modal Button", "📝 'Record Lesson' Card Button", "🔍 Search & Filter Bar", "📊 Progress Level Rating"],
      buttonHighlightsAr: ["➕ زر 'إضافة طالب'", "📝 زر 'تسجيل درس' في كل بطاقة", "🔍 شريط البحث والتصفية", "📊 تقييم مستوى الحفظ"],
      highlightTipEn: "Notice how Jalilah switched your screen directly to the Students view!",
      highlightTipAr: "لاحظ كيف أن جليلة قامت بنقلك مباشرة إلى شاشة سجل الطلاب في الخلفية!",
    },
    {
      id: 4,
      section: "curriculums",
      icon: <BookOpen className="w-5 h-5 text-[#8B5A2B]" />,
      tabLabelEn: "Curriculums",
      tabLabelAr: "المناهج التعليمية",
      titleEn: "3. Curriculums & Islamic Topics",
      titleAr: "٣. المناهج والدروس الشرعية",
      subtitleEn: "Built-in & custom curriculums for Tajweed, Islamic Studies, and Arabic.",
      subtitleAr: "مناهج جاهزة ومخصصة لعلوم التجويد، العقيدة والأخلاق، وجذور العربية.",
      notesEn: [
        "Built-in Curriculums: Structured modules (e.g. Noon Sakinah Rules, Pillars of Islam, Arabic Roots).",
        "Custom Builder: Build your custom step-by-step topic outlines for your halaqas.",
        "Assign to Students: Link specific curriculums to individual students to track progress.",
      ],
      notesAr: [
        "مناهج متكاملة: وصول مباشر لمناهج أحكام التجويد، السيرة والأخلاق، والمعاني.",
        "منشئ المناهج الخاص: تصميم وتنسيق خطة منهجك الخاص خطوة بخطوة.",
        "ربط المناهج: تخصيص منهج لكل طالب لمتابعة إنجازه درساً بدرجة.",
      ],
      buttonHighlightsEn: ["📚 'Create Curriculum' Button", "🎓 'Assign to Student' Button", "📖 'Tajweed & Islamic Modules' Cards"],
      buttonHighlightsAr: ["📚 زر 'إنشاء منهج مخصص'", "🎓 زر 'تخصيص منهج لطالب'", "📖 بطاقات 'وحدات التجويد والعلوم'"],
      highlightTipEn: "You can click 'Create Curriculum' anytime to organize custom lesson topics.",
      highlightTipAr: "يمكنك تجربة الضغط على 'إنشاء منهج' لتنظيم دروسك الخاصة وتوزيعها على الطلاب.",
    },
    {
      id: 5,
      section: "schedule",
      icon: <Calendar className="w-5 h-5 text-[#5A6B5A]" />,
      tabLabelEn: "Schedule",
      tabLabelAr: "جدول المواعيد",
      titleEn: "4. Teaching Schedule & Sound Reminders",
      titleAr: "٤. جدول المواعيد والتنبيهات الصوتية",
      subtitleEn: "Schedule recurring sessions and receive automated sound alerts.",
      subtitleAr: "جدولة الحصص المنتظمة وتفعيل جرس التنبيه الصوتي قبل الموعد.",
      notesEn: [
        "Calendar Views: Switch between Day, Week, Month, or Agenda views.",
        "Sound Reminders: Automatic chime alerts (5m, 15m, 30m, 60m before class).",
        "Recurring Halaqas: Easily set up weekly recurring student sessions.",
      ],
      notesAr: [
        "عرض مرن: خيارات استعراض الجدول برؤية يومية، أسبوعية، شهرية، أو أجندة تفصيلية.",
        "تنبيهات صوتية ذكية: جرس تنبيه صوتي ينبهك قبل الحِصّة لضمان الانتظام.",
        "حصص متكررة: ضبط الحصص بانتظام أسبوعي أو يومي بضغطة زر.",
      ],
      buttonHighlightsEn: ["📅 'Add New Session' Button", "🔔 'Sound Reminder Chime' Switch", "📆 'Day / Week / Month' Toggle Buttons"],
      buttonHighlightsAr: ["📅 زر 'إضافة موعد درس جديد'", "🔔 مفتاح 'تفعيل التنبيه الصوتي'", "📆 أزرار 'عرض اليوم / الأسبوع / الشهر'"],
      highlightTipEn: "Sound alerts trigger automatically in your browser when a session approaches.",
      highlightTipAr: "التنبيهات الصوتية تعمل في متصفحك مباشرة لإنذارك بموعد الحِصّة التالية.",
    },
    {
      id: 6,
      section: "lessonStudio",
      icon: <Sparkles className="w-5 h-5 text-[#8B5A2B]" />,
      tabLabelEn: "Jalilah AI Studio",
      tabLabelAr: "استوديو جليلة الذكي",
      titleEn: "5. Jalilah AI Studio (استوديو جليلة الذكي)",
      titleAr: "٥. استوديو جليلة للذكاء الاصطناعي",
      subtitleEn: "Generate structured lesson plans, quizzes, and vocabulary keys in seconds.",
      subtitleAr: "توليد خطط الدروس، مصطلحات المفردات، والاختبارات التفاعلية بنقرة زر.",
      notesEn: [
        "AI Plan Generator: Prompt me for any topic (e.g. Izhhar, Prophet's Character) to generate warm-ups and teaching tips.",
        "Non-Native Student Tips: Tailored advice for explaining concepts to English speakers.",
        "Quizzes & Homework: Instantly create printable worksheets for your students.",
      ],
      notesAr: [
        "تحضير الدروس الذكي: اطلب مني أي موضوع وسأبني لك تحضيراً كاملاً بالتمهيد والخطوات.",
        "إرشادات الطلاب الأجانب: توجيهات متخصصة لتبسيط المفاهيم للطلاب غير الناطقين بالعربية.",
        "توليد الواجبات والاختبارات: ضغطة زر لإعداد اختبارات قصيرة وأوراق عمل تفاعلية للطلاب.",
      ],
      buttonHighlightsEn: ["✍️ 'Lesson Topic Input' Box", "🧠 'Teaching Style' Selector", "✨ 'Generate Lesson Plan' Button", "📝 'Generate Quiz & Homework' Modal"],
      buttonHighlightsAr: ["✍️ مربع 'عنوان موضوع الدرس'", "🧠 قائمة 'أسلوب الشرح'", "✨ زر 'توليد تحضير الدرس'", "📝 زر 'إعداد اختبار وواجب'"],
      highlightTipEn: "You can copy generated plans or save them permanently to your workspace Firestore!",
      highlightTipAr: "يمكنك نسخ تحضير الدرس أو حفظه بشكل دائم في قاعدة بيانات مساحة عملك!",
    },
    {
      id: 7,
      section: "quranDetective",
      icon: <SearchCheck className="w-5 h-5 text-[#3E4D3E]" />,
      tabLabelEn: "Quran Detective",
      tabLabelAr: "مكتشف القرآن",
      titleEn: "6. Quran Memory Detective & Memory Map",
      titleAr: "٦. مكتشف حفظ القرآن وخريطة الذاكرة",
      subtitleEn: "Verify student recall with AI quizzes and visual progress maps.",
      subtitleAr: "تأكيد واستدعاء حفظ القرآن عبر اختبارات ذكية وخريطة بصرية للتقدم.",
      notesEn: [
        "Interactive Quizzes: Ayah completion, next Ayah recall, gap filling, and Surah identification.",
        "Visual Memory Map: Color-coded nodes showing solid recall, in-progress, and surahs needing revision.",
      ],
      notesAr: [
        "اختبارات تفاعلية: التثبت من الحفظ باختبارات إكمال الآيات، الآية التالية، وتحديد السورة.",
        "خريطة الذاكرة البصرية: إظهار دواير الحفظ باللون الأخضر والأصفر والأحمر لمتابعة تمكن الطالب.",
      ],
      buttonHighlightsEn: ["🔎 'Start Recall Quiz' Button", "🧩 'Gap Filling Test' Option", "🗺️ 'Visual Memory Map' Interactive Nodes"],
      buttonHighlightsAr: ["🔎 زر 'بدء اختبار استدعاء الحفظ'", "🧩 خيار 'اختبار ملء الفراغات'", "🗺️ عقد 'خريطة الذاكرة التفاعلية'"],
      highlightTipEn: "Save detective quiz results directly to the student's progress history.",
      highlightTipAr: "يمكنك حفظ نتائج اختبار الاستدعاء مباشرة في سجل تقدم الطالب الداخلي.",
    },
    {
      id: 8,
      section: "dashboard",
      icon: <Award className="w-5 h-5 text-[#5A6B5A]" />,
      tabLabelEn: "Complete",
      tabLabelAr: "مكتمل",
      titleEn: "Tour Complete! You are Ready to Teach",
      titleAr: "انتهت الجولة! أنت جاهز تماماً للتدريس مع جليلة",
      subtitleEn: "May Allah bless your noble educational mission!",
      subtitleAr: "بارك الله في جهودكم ونفع بكم وبسعيكم النبيل!",
      notesEn: [
        `Baraka Allahu Feek, ${teacher?.name || "Ustadh"}!`,
        "Your workspace is ready. Launch Jalilah AI Studio or click 'Jalilah Guide' in the header whenever you need assistance.",
        "Click below to finish the guide and enjoy teaching!",
      ],
      notesAr: [
        `بارك الله فيكم ونفع بكم يا ${teacher?.name || "أستاذنا الكريـم"}!`,
        "مساحة عملك جاهزة ومجهزة بالكامل. كلما احتجت لتحضير درس، يمكنك الاستعانة باستوديو جليلة الذكي.",
        "اضغط أدناه لإنهاء الجولة والبدء في إدارة دروسك الكريمة!",
      ],
      buttonHighlightsEn: ["✨ 'Jalilah Guide' Header Button (Always available for help)"],
      buttonHighlightsAr: ["✨ زر 'دليل جليلة' بأعلى الشاشة (متاح دائماً لإعادة الجولة)"],
      highlightTipEn: "Jalilah AI is always here to assist you in every step.",
      highlightTipAr: "جليلة دائماً بجانبك لمساعدتك في كل خطوة تعليمية.",
    },
  ];

  const currentStep = steps[currentStepIndex];

  // Switch workspace section on step change
  useEffect(() => {
    if (isOpen && currentStep) {
      onSelectSection(currentStep.section);
    }
  }, [currentStepIndex, isOpen]);

  // Mark tour completed when tour closes or finishes
  const handleCloseAndComplete = () => {
    updateProfile({ tourCompleted: true });
    if (teacher?.id) {
      localStorage.setItem(`islamroots_tour_completed_${teacher.id}`, "true");
    }
    onClose();
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleCloseAndComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const isAr = language === "ar";

  // Minimized Widget view
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 animate-bounce-subtle pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1C221C] text-white border border-[#8BA888]/40 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="p-1.5 rounded-xl bg-[#5A6B5A] text-white">
            <Sparkles className="w-4 h-4 text-amber-200 animate-spin-slow" />
          </div>
          <div className="text-start">
            <div className="flex items-center gap-1.5 text-[10px] text-[#8BA888] font-bold uppercase tracking-wider">
              <span>{t("jalilahGuide")}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-stone-100">
              {isAr ? currentStep.tabLabelAr : currentStep.tabLabelEn} ({currentStepIndex + 1}/{steps.length})
            </p>
          </div>
          <Maximize2 className="w-4 h-4 text-[#8BA888] group-hover:text-white transition-colors ms-1" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Floating Top Banner overlay highlighting the active target section on the live screen */}
      <div className="fixed top-16 sm:top-20 inset-x-0 z-40 pointer-events-none flex justify-center px-4">
        <div className="pointer-events-auto max-w-2xl w-full p-2.5 sm:p-3 rounded-2xl bg-[#1C221C]/90 text-white backdrop-blur-md border border-[#8BA888]/40 shadow-xl flex items-center justify-between gap-3 animate-fade-in font-sans">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#5A6B5A] text-amber-200 shrink-0">
              <MousePointerClick className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-[#8BA888] font-bold uppercase tracking-wider">
                <span>{t("jalilahPointingAt")}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#5A6B5A] text-white font-bold">
                  {isAr ? currentStep.tabLabelAr : currentStep.tabLabelEn}
                </span>
              </div>
              <p className="text-xs text-stone-200 font-medium truncate">
                {isAr ? currentStep.titleAr : currentStep.titleEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="hidden sm:inline text-[11px] text-[#8BA888] font-semibold">
              {currentStepIndex + 1}/{steps.length}
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t("minimizeGuide")}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Assistant Card in bottom-right corner (Non-blocking, live view visible) */}
      <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end items-end p-4 sm:p-6 font-sans">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white dark:bg-[#161D17] border-2 border-[#5A6B5A]/50 dark:border-[#8BA888]/40 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 animate-slide-up transition-all relative me-0 sm:me-2 mb-2">
          
          {/* Header Bar */}
          <div className="flex items-start justify-between border-b border-[#E8E5DB] dark:border-[#2A352A] pb-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] shadow-xs text-[#5A6B5A]">
                  {currentStep.icon}
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#161D17]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#5A6B5A]/15 text-[#3E4D3E] dark:text-[#8BA888] font-bold text-[10px] uppercase tracking-wider">
                    Jalilah AI Guide | جليلة
                  </span>
                  <span className="text-[11px] text-[#7A7D75] dark:text-stone-400 font-medium">
                    {isAr
                      ? `خطوة ${currentStepIndex + 1} من ${steps.length}`
                      : `Step ${currentStepIndex + 1} of ${steps.length}`}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1F261F] dark:text-[#E2E8E2] mt-0.5 tracking-tight">
                  {isAr ? currentStep.titleAr : currentStep.titleEn}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] transition-colors cursor-pointer"
                title={t("minimizeGuide")}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseAndComplete}
                className="p-1.5 rounded-lg text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] transition-colors cursor-pointer"
                title={t("closeGuide")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Buttons & Tools Highlighted in this view */}
          <div className="p-3 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3E4D3E] dark:text-[#E2E8E2]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5A2B]" />
              <span>{t("keyButtonsHighlighted")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(isAr ? currentStep.buttonHighlightsAr : currentStep.buttonHighlightsEn).map((btn, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#161D17] border border-[#D4D1C5] dark:border-[#2A352A] text-[11px] font-semibold text-[#3E4D3E] dark:text-[#8BA888] shadow-2xs flex items-center gap-1"
                >
                  <span>{btn}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Speech Notes */}
          <div className="space-y-2.5">
            <p className="text-xs text-[#5A6B5A] dark:text-[#8BA888] font-semibold leading-relaxed">
              {isAr ? currentStep.subtitleAr : currentStep.subtitleEn}
            </p>

            <ul className="space-y-2 text-xs text-[#2D332D] dark:text-[#E2E8E2] leading-relaxed">
              {(isAr ? currentStep.notesAr : currentStep.notesEn).map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A6B5A] dark:bg-[#8BA888] mt-1.5 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>

            {(currentStep.highlightTipEn || currentStep.highlightTipAr) && (
              <div className="p-2.5 rounded-xl bg-[#F2EFE6] dark:bg-[#1C221C] border border-[#D4D1C5] dark:border-[#2A352A] text-[11px] text-[#3E4D3E] dark:text-[#8BA888] flex items-center gap-2 font-medium">
                <Lightbulb className="w-4 h-4 text-[#8B5A2B] shrink-0" />
                <span>{isAr ? currentStep.highlightTipAr : currentStep.highlightTipEn}</span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DB] dark:border-[#2A352A]">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? "w-5 bg-[#5A6B5A] dark:bg-[#8BA888]"
                      : "w-1.5 bg-[#D4D1C5] dark:bg-[#2A352A] hover:bg-[#5A6B5A]/50"
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-lg border border-[#D4D1C5] dark:border-[#2A352A] text-xs font-semibold text-[#3E4D3E] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  <span>{t("prevStep")}</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg bg-[#5A6B5A] hover:bg-[#495749] text-white text-xs font-semibold shadow-soft transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>
                  {currentStepIndex === steps.length - 1 ? t("finishTour") : t("nextStep")}
                </span>
                {currentStepIndex === steps.length - 1 ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : isAr ? (
                  <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
