import React, { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

import { Sidebar, NavSection } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { MobileNav } from "./components/layout/MobileNav";

import { DashboardView } from "./components/dashboard/DashboardView";
import { StudentsList } from "./components/students/StudentsList";
import { StudentProfileView } from "./components/students/StudentProfileView";
import { AddStudentModal } from "./components/students/AddStudentModal";
import { AssignCurriculumModal } from "./components/students/AssignCurriculumModal";

import { CurriculumList } from "./components/curriculum/CurriculumList";
import { AddCurriculumModal } from "./components/curriculum/AddCurriculumModal";

import { LessonSessionModal } from "./components/lesson/LessonSessionModal";
import { LessonStudioView } from "./components/studio/LessonStudioView";
import { QuizHomeworkModal } from "./components/studio/QuizHomeworkModal";

import { MemoryDetectiveView } from "./components/detective/MemoryDetectiveView";
import { MemoryMapView } from "./components/memory/MemoryMapView";
import { ScheduleView } from "./components/schedule/ScheduleView";
import { SettingsView } from "./components/settings/SettingsView";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthModal } from "./components/auth/AuthModal";
import { TeacherOnboardingModal } from "./components/auth/TeacherOnboardingModal";
import { JalilahTourModal } from "./components/common/JalilahTourModal";

import { Student, Curriculum, SubjectType } from "./types";
import { Loader2, LogIn, Sparkles, BookOpen } from "lucide-react";

const AppContent: React.FC = () => {
  const { teacher, isAuthenticated, loading, loginWithGoogle, loginAsGuest } = useAuth();
  const { t } = useLanguage();

  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string | null>(null);

  // Modal States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isAssignCurriculumOpen, setIsAssignCurriculumOpen] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);

  const [isCreateCurriculumOpen, setIsCreateCurriculumOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);

  const [isLessonSessionOpen, setIsLessonSessionOpen] = useState(false);
  const [lessonSessionStudentId, setLessonSessionStudentId] = useState<string | undefined>();

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizModalType, setQuizModalType] = useState<"quiz" | "homework">("quiz");
  const [quizModalTitle, setQuizModalTitle] = useState("");
  const [quizModalSubject, setQuizModalSubject] = useState<SubjectType>("Tajweed");

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Direct Google Login Trigger
  const handleDirectGoogleLogin = async () => {
    setLoginError(null);
    setGoogleSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Direct Google Auth Error:", err);
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user") {
        setLoginError("Sign-in popup was closed. Please try again.");
      } else if (code === "auth/popup-blocked") {
        setLoginError("Sign-in popup was blocked by browser. Please allow popups for this site.");
      } else {
        setLoginError(err?.message || "Google Authentication failed. Please try again or use Guest mode.");
      }
    } finally {
      setGoogleSigningIn(false);
    }
  };

  // Auto-launch tour on user's first time after onboarding completed
  useEffect(() => {
    if (isAuthenticated && teacher && teacher.onboardingCompleted && !teacher.tourCompleted) {
      const localCompleted = localStorage.getItem(`islamroots_tour_completed_${teacher.id}`);
      if (!localCompleted) {
        setIsTourOpen(true);
      }
    }
  }, [isAuthenticated, teacher?.id, teacher?.onboardingCompleted, teacher?.tourCompleted]);

  // Navigation handlers
  const handleSelectSection = (section: NavSection) => {
    setCurrentSection(section);
    setSelectedStudentProfileId(null);
  };

  const handleSelectStudentProfile = (studentId: string) => {
    setSelectedStudentProfileId(studentId);
    setCurrentSection("students");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3E9] dark:bg-[#131E18] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft text-[#5A6B5A]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="font-serif font-bold text-lg text-[#1F261F] dark:text-[#E2E8E2]">
          Loading Islam Roots Ustadh Workspace...
        </h3>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onOpenAuth={() => setIsAuthOpen(true)}
          onEnterAsGuest={() => loginAsGuest("Ustadh Guest")}
        />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3E9] dark:bg-[#131E18] text-slate-800 dark:text-slate-100 font-sans transition-colors flex">
      {/* Sidebar for Desktop & Tablet */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        isTourActive={isTourOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header
          onOpenAddStudent={() => {
            setEditingStudent(null);
            setIsAddStudentOpen(true);
          }}
          onOpenNewLesson={() => handleSelectSection("lessonStudio")}
          onOpenSchedule={() => handleSelectSection("schedule")}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenTour={() => setIsTourOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 xl:p-8 max-w-7xl w-full mx-auto">
          {/* Render Views depending on section & state */}
          {selectedStudentProfileId ? (
            <StudentProfileView
              studentId={selectedStudentProfileId}
              onBack={() => setSelectedStudentProfileId(null)}
              onStartLesson={(studentId) => {
                setLessonSessionStudentId(studentId);
                setIsLessonSessionOpen(true);
              }}
              onOpenAssignCurriculum={(student) => {
                setAssigningStudent(student);
                setIsAssignCurriculumOpen(true);
              }}
            />
          ) : (
            <>
              {currentSection === "dashboard" && (
                <DashboardView
                  onNavigate={handleSelectSection}
                  onOpenAddStudent={() => {
                    setEditingStudent(null);
                    setIsAddStudentOpen(true);
                  }}
                  onOpenStartLesson={(studentId) => {
                    setLessonSessionStudentId(studentId);
                    setIsLessonSessionOpen(true);
                  }}
                  onSelectStudentProfile={handleSelectStudentProfile}
                />
              )}

              {currentSection === "students" && (
                <StudentsList
                  onSelectProfile={handleSelectStudentProfile}
                  onOpenAddStudent={() => {
                    setEditingStudent(null);
                    setIsAddStudentOpen(true);
                  }}
                  onEditStudent={(student) => {
                    setEditingStudent(student);
                    setIsAddStudentOpen(true);
                  }}
                  onAssignCurriculum={(student) => {
                    setAssigningStudent(student);
                    setIsAssignCurriculumOpen(true);
                  }}
                  onStartLesson={(studentId) => {
                    setLessonSessionStudentId(studentId);
                    setIsLessonSessionOpen(true);
                  }}
                />
              )}

              {currentSection === "curriculums" && (
                <CurriculumList
                  onOpenCreateCurriculum={() => {
                    setEditingCurriculum(null);
                    setIsCreateCurriculumOpen(true);
                  }}
                  onEditCurriculum={(curr) => {
                    setEditingCurriculum(curr);
                    setIsCreateCurriculumOpen(true);
                  }}
                />
              )}

              {currentSection === "schedule" && (
                <ScheduleView
                  onStartLessonSession={(studentId) => {
                    setLessonSessionStudentId(studentId);
                    setIsLessonSessionOpen(true);
                  }}
                />
              )}

              {currentSection === "lessonStudio" && (
                <LessonStudioView
                  onOpenQuizModal={(type, title, subject) => {
                    setQuizModalType(type);
                    setQuizModalTitle(title);
                    setQuizModalSubject(subject);
                    setIsQuizModalOpen(true);
                  }}
                />
              )}

              {currentSection === "quranDetective" && <MemoryDetectiveView />}

              {currentSection === "progressMap" && <MemoryMapView />}

              {currentSection === "admin" && <AdminDashboard />}

              {currentSection === "settings" && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Navigation for Small Screens */}
      <MobileNav currentSection={currentSection} onSelectSection={handleSelectSection} />

      {/* Global Modals */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        editStudent={editingStudent}
      />

      <AssignCurriculumModal
        isOpen={isAssignCurriculumOpen}
        onClose={() => setIsAssignCurriculumOpen(false)}
        student={assigningStudent}
      />

      <AddCurriculumModal
        isOpen={isCreateCurriculumOpen}
        onClose={() => setIsCreateCurriculumOpen(false)}
        editCurriculum={editingCurriculum}
      />

      <LessonSessionModal
        isOpen={isLessonSessionOpen}
        onClose={() => setIsLessonSessionOpen(false)}
        preSelectedStudentId={lessonSessionStudentId}
      />

      <QuizHomeworkModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        type={quizModalType}
        initialLessonTitle={quizModalTitle}
        initialSubject={quizModalSubject}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <TeacherOnboardingModal
        isOpen={isAuthenticated && !!teacher && !teacher.onboardingCompleted}
        onCompleteOnboarding={() => setIsTourOpen(true)}
      />
      <JalilahTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectSection={handleSelectSection}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
