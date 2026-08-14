import React, { useState, useEffect, useCallback } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";

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
import { PrivacyPolicy } from "./components/legal/PrivacyPolicy";
import { TermsOfService } from "./components/legal/TermsOfService";
import { AuthModal } from "./components/auth/AuthModal";
import { TeacherOnboardingModal } from "./components/auth/TeacherOnboardingModal";
import { JalilahTourModal } from "./components/common/JalilahTourModal";

import { Student, Curriculum, SubjectType } from "./types";
import { AlertTriangle, Loader2, X } from "lucide-react";

const AppContent: React.FC = () => {
  const { teacher, isAuthenticated, loading, loginAsGuest } = useAuth();
  const { syncError, clearSyncError } = useData();

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
  const [authInitialMode, setAuthInitialMode] = useState<"options" | "signup" | "signin" | "verification_pending" | "forgot_password" | "reset_password">("options");
  const [oAuthError, setOAuthError] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setIsAuthOpen(false);
    }
  }, [isAuthenticated]);

  // Parse Google OAuth Errors or Password Reset from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
      const searchParams = new URLSearchParams(search);
      
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
      const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
      const type = hashParams.get('type') || searchParams.get('type');
      
      if (type === 'recovery' || hash.includes('reset-password')) {
        setAuthInitialMode('reset_password');
        setIsAuthOpen(true);
      } else if (error) {
        console.warn("[Auth] OAuth Error returned from provider:", { error, errorDescription, errorCode });
        
        const readableError = (errorDescription || error).replace(/\+/g, ' ');
        setOAuthError(`Google Login Error: ${readableError}`);
        setAuthInitialMode('options');
        setIsAuthOpen(true);
        
        // Clean up the URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  // Legal Pages URL Routing
  const [legalView, setLegalView] = useState<"privacy" | "terms" | null>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes("/privacy") || search.includes("privacy")) return "privacy";
      if (path.includes("/terms") || search.includes("terms")) return "terms";
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes("/privacy") || search.includes("privacy")) setLegalView("privacy");
      else if (path.includes("/terms") || search.includes("terms")) setLegalView("terms");
      else setLegalView(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Auto-launch tour on user's first time after onboarding completed
  useEffect(() => {
    if (isAuthenticated && teacher && teacher.onboardingCompleted && !teacher.tourCompleted) {
      setIsTourOpen(true);
    }
  }, [isAuthenticated, teacher]);

  // Navigation handlers
  const handleSelectSection = useCallback((section: NavSection) => {
    setCurrentSection(section);
    setSelectedStudentProfileId(null);
  }, []);

  const handleSelectStudentProfile = useCallback((studentId: string) => {
    setSelectedStudentProfileId(studentId);
    setCurrentSection("students");
  }, []);

  if (legalView === "privacy") {
    return <PrivacyPolicy onBack={() => setLegalView(null)} />;
  }

  if (legalView === "terms") {
    return <TermsOfService onBack={() => setLegalView(null)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFF3EF] dark:bg-[#121813] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="p-4 rounded-xl bg-white dark:bg-[#161D17] border border-[#D8E2D8] dark:border-[#2A352A] shadow-soft text-[#5A6B5A]">
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
          onOpenPrivacy={() => setLegalView("privacy")}
          onOpenTerms={() => setLegalView("terms")}
        />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialError={oAuthError} initialMode={authInitialMode} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF3EF] dark:bg-[#121813] text-stone-800 dark:text-stone-100 font-sans transition-colors flex">
      {/* Sidebar for Desktop & Tablet */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
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

        <main className={`flex-1 p-4 sm:p-6 xl:p-8 w-full mx-auto ${currentSection === "lessonStudio" ? "max-w-none" : "max-w-7xl"}`}>
          {syncError && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 leading-relaxed">{syncError}</p>
              <button type="button" onClick={clearSyncError} aria-label="Dismiss save error" className="rounded p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
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
                  onOpenAddStudent={() => {
                    setEditingStudent(null);
                    setIsAddStudentOpen(true);
                  }}
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
        onCreateCurriculum={() => {
          setIsAssignCurriculumOpen(false);
          setEditingCurriculum(null);
          setCurrentSection("curriculums");
          setIsCreateCurriculumOpen(true);
        }}
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

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialError={oAuthError} initialMode={authInitialMode} />
      <TeacherOnboardingModal
        isOpen={
          isAuthenticated &&
          !!teacher &&
          teacher.id !== "guest-ustadh-101" &&
          !teacher.isGuest &&
          (!teacher.profileCompleted ||
            !teacher.fullName ||
            !teacher.displayName ||
            !teacher.country ||
            !teacher.teachingLanguage)
        }
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
