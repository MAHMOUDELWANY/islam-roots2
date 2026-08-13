import React, { useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { NavSection } from "../layout/Sidebar";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface JalilahTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: NavSection) => void;
}

export const JalilahTourModal: React.FC<JalilahTourModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
}) => {
  const { language, theme } = useLanguage();
  const { teacher, updateProfile } = useAuth();
  const driverRef = useRef<any>(null);

  const isAr = language === "ar";

  useEffect(() => {
    if (!isOpen) {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      return;
    }

    const handleCloseAndComplete = () => {
      if (!teacher?.tourCompleted) {
        updateProfile({ tourCompleted: true });
      }
      onClose();
    };

    const getNavTarget = (id: string) => {
      return window.innerWidth >= 1024 ? `#desktop-tour-nav-${id}` : `#mobile-tour-nav-${id}`;
    };

    const TOTAL_STEPS = 11;

    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      waitForElement: 2000,
      overlayColor: theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(22, 29, 23, 0.6)", 
      nextBtnText: isAr ? "التالي" : "Next",
      prevBtnText: isAr ? "السابق" : "Previous",
      doneBtnText: isAr ? "إنهاء الجولة" : "Start Exploring",
      popoverClass: "islamroots-tour-theme",
      onDestroyStarted: () => {
        if (!driverRef.current?.hasNextStep()) {
          handleCloseAndComplete();
        } else {
          driverRef.current.destroy();
          onClose();
        }
      },
      onPopoverRender: (popover, { state }) => {
        // Custom animated dots progress indicator replacing the default text
        if (popover.progress) {
          popover.progress.innerHTML = "";
          popover.progress.style.display = "flex";
          popover.progress.style.gap = "6px";
          popover.progress.style.alignItems = "center";
          popover.progress.style.justifyContent = "center";
          
          for (let i = 0; i < TOTAL_STEPS; i++) {
            const dot = document.createElement("div");
            dot.style.width = i === state.activeIndex ? "18px" : "6px";
            dot.style.height = "6px";
            dot.style.borderRadius = "4px";
            dot.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
            
            if (theme === "dark") {
              dot.style.backgroundColor = i === state.activeIndex ? "#2F8F5B" : "rgba(47, 143, 91, 0.2)";
            } else {
              dot.style.backgroundColor = i === state.activeIndex ? "#1F6F4A" : "rgba(31, 111, 74, 0.2)";
            }
            popover.progress.appendChild(dot);
          }
        }
      },
      steps: [
        {
          element: '#tour-jalilah-guide',
          popover: {
            title: isAr ? `أهلاً بك يا ${teacher?.name || "أستاذنا"}!` : `Ahlan ${teacher?.name || "Ustadh"}!`,
            description: isAr 
              ? "أنا جليلة، مرشدتك ومساعدتك الذكية. هذا الزر سيبقى معك لطلب المساعدة في أي وقت. دعنا نأخذ جولة سريعة في مساحة عملك!"
              : "I am Jalilah, your AI assistant. This button is always here if you need help. Let's take a quick tour of your workspace!",
            side: "bottom",
            align: "end"
          },
          onHighlightStarted: () => onSelectSection("dashboard"),
        },
        {
          element: getNavTarget("dashboard"),
          popover: {
            title: isAr ? "لوحة التحكم الرئيسية" : "Educator Dashboard",
            description: isAr
              ? "متابعة شاملة لجميع الطلاب، الجدول اليومي، وأزرار الإجراءات السريعة. كل ما تحتاجه في مكان واحد."
              : "Overview of your students, today's schedule, and quick action buttons. Everything at a glance.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("dashboard"),
        },
        {
          element: getNavTarget("students"),
          popover: {
            title: isAr ? "سجل الطلاب" : "Student Roster",
            description: isAr
              ? "هنا يمكنك إضافة الطلاب الجدد، تدوين ملاحظات التجويد، وتقييم الأداء بعد كل حصة."
              : "Add new students, record lessons, and track Tajweed progress systematically.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("students"),
        },
        {
          element: getNavTarget("curriculums"),
          popover: {
            title: isAr ? "المناهج التعليمية" : "Curriculums",
            description: isAr
              ? "استعرض مناهج التجويد والعلوم الإسلامية الجاهزة، أو قم ببناء وتخصيص خطة منهجك الخاص خطوة بخطوة."
              : "Access built-in Tajweed and Islamic modules, or create your own custom curriculum outlines.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("curriculums"),
        },
        {
          element: getNavTarget("schedule"),
          popover: {
            title: isAr ? "جدول المواعيد" : "Teaching Schedule",
            description: isAr
              ? "رتب حصصك واحصل على تنبيهات صوتية ذكية قبل كل موعد لتضمن الانتظام والالتزام."
              : "Schedule recurring sessions and receive automated sound alerts before your classes begin.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("schedule"),
        },
        {
          element: getNavTarget("lessonStudio"),
          popover: {
            title: isAr ? "استوديو جليلة الذكي" : "Jalilah AI Studio",
            description: isAr
              ? "استعن بالذكاء الاصطناعي لتوليد خطط التحضير، أوراق العمل، واختبارات الاستدعاء بنقرة زر واحدة."
              : "Generate structured lesson plans, interactive worksheets, and homework instantly with AI.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("lessonStudio"),
        },
        {
          element: getNavTarget("quranDetective"),
          popover: {
            title: isAr ? "مكتشف القرآن" : "Quran Detective",
            description: isAr
              ? "أدوات تقييم تفاعلية متطورة لحفظ الطلاب، مع خريطة مرئية لمتابعة قوة الذاكرة لكل سورة وموضع."
              : "Interactive quizzes and visual memory maps to verify your students' solid recall.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("quranDetective"),
        },
        {
          element: getNavTarget("progressMap"),
          popover: {
            title: isAr ? "خريطة التقدم والذاكرة" : "Progress & Memory Map",
            description: isAr ? "راجع التقدم المسجل ونتائج الذاكرة فقط؛ المعاينات لا تُحسب كإتقان." : "Review recorded progress and memory evidence. Preview content never counts as mastery.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("progressMap"),
        },
        {
          element: getNavTarget("settings"),
          popover: {
            title: isAr ? "الإعدادات" : "Settings",
            description: isAr ? "نظم ملف المعلم، اللغة، المظهر، الخصوصية، وخيارات الحساب من مساحة واحدة." : "Organize your educator profile, language, appearance, privacy, and account controls.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("settings"),
        },
        {
          element: getNavTarget("settings"),
          popover: {
            title: isAr ? "اتصالات Google والتصدير" : "Google Connections & Exports",
            description: isAr ? "من الإعدادات، اربط التقويم والمستندات والعروض والمهام وDrive عندما تحتاج إلى مزامنة عملك." : "Use Settings to connect Calendar, Docs, Slides, Tasks, Gmail, Forms, and Drive for teaching workflows.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("settings"),
        },
        {
          element: getNavTarget("lessonStudio"),
          popover: {
            title: isAr ? "المكتبة وإعادة الفتح" : "Library & Reopening Work",
            description: isAr ? "يتم حفظ خطط الدروس تلقائيًا في مكتبتك مع سياق الطالب والمادة والتركيز." : "Lesson Studio autosaves generated work so you can reopen, refine, and export it later.",
            side: "right",
            align: "start"
          },
          onHighlightStarted: () => onSelectSection("lessonStudio"),
        },
      ]
    });

    driverRef.current.drive();

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [isOpen, isAr, theme, teacher?.name, onSelectSection]);

  if (!isOpen) return null;

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* ISLAM ROOTS Premium Tour Styling for driver.js */
        .islamroots-tour-theme {
        font-family: inherit !important;
        direction: ${isAr ? "rtl" : "ltr"} !important;
        padding: 24px !important;
        border-radius: 16px !important;
        background-color: #F7F3E9 !important;
        border: 1px solid rgba(31, 111, 74, 0.18) !important;
        box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04) !important;
        max-width: 360px !important;
      }
      .dark .islamroots-tour-theme {
        background-color: #161D17 !important;
        border-color: rgba(139, 168, 136, 0.2) !important;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2) !important;
      }
      .islamroots-tour-theme .driver-popover-title {
        font-size: 17px !important;
        font-weight: 700 !important;
        color: #1F261F !important;
        margin-bottom: 10px !important;
        letter-spacing: -0.01em !important;
      }
      .dark .islamroots-tour-theme .driver-popover-title {
        color: #E2E8E2 !important;
      }
      .islamroots-tour-theme .driver-popover-description {
        font-size: 13.5px !important;
        line-height: 1.6 !important;
        color: #5A6B5A !important;
        font-weight: 500 !important;
        margin-bottom: 24px !important;
      }
      .dark .islamroots-tour-theme .driver-popover-description {
        color: #8BA888 !important;
      }
      .islamroots-tour-theme .driver-popover-footer {
        margin-top: 16px !important;
        align-items: center !important;
      }
      
      /* Buttons */
      .islamroots-tour-theme .driver-popover-next-btn, 
      .islamroots-tour-theme .driver-popover-prev-btn {
        padding: 8px 16px !important;
        border-radius: 8px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        text-shadow: none !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
      }
      .islamroots-tour-theme .driver-popover-next-btn {
        background-color: #5A6B5A !important;
        color: #ffffff !important;
        border: none !important;
      }
      .islamroots-tour-theme .driver-popover-next-btn:hover {
        background-color: #495749 !important;
        transform: translateY(-1px) !important;
      }
      .islamroots-tour-theme .driver-popover-prev-btn {
        background-color: transparent !important;
        color: #3E4D3E !important;
        border: 1px solid #D4D1C5 !important;
      }
      .dark .islamroots-tour-theme .driver-popover-prev-btn {
        color: #E2E8E2 !important;
        border-color: #2A352A !important;
      }
      .islamroots-tour-theme .driver-popover-prev-btn:hover {
        background-color: #F2EFE6 !important;
      }
      .dark .islamroots-tour-theme .driver-popover-prev-btn:hover {
        background-color: #232B23 !important;
      }
      
      .islamroots-tour-theme .driver-popover-close-btn {
        color: #7A7D75 !important;
        top: 16px !important;
        right: 16px !important;
      }
      html[dir="rtl"] .islamroots-tour-theme .driver-popover-close-btn {
        right: auto !important;
        left: 16px !important;
      }
      .dark .islamroots-tour-theme .driver-popover-close-btn {
        color: #8BA888 !important;
      }
      
      /* Spotlight specific */
      div#driver-highlighted-element-stage {
        border-radius: 12px !important;
        border: 2px solid rgba(90, 107, 90, 0.3) !important;
        box-shadow: 0 0 0 4px rgba(255,255,255,0.2) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .dark div#driver-highlighted-element-stage {
        border-color: rgba(139, 168, 136, 0.4) !important;
        box-shadow: 0 0 0 4px rgba(0,0,0,0.2) !important;
      }
    `}} />
  );
};
