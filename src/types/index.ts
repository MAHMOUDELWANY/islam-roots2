export type SubjectType = "Quran" | "Tajweed" | "Islamic Studies" | "Arabic";

export type LevelType = "Beginner" | "Intermediate" | "Advanced";

export type TeachingStyle = "Simple" | "Interactive" | "Conversational" | "Academic" | "Story-based" | "Practical";

export type AttendanceStatus = "Present" | "Late" | "Absent";

export type LanguageCode = "en" | "ar";

export interface Teacher {
  id: string;
  username?: string;
  name: string;
  email: string;
  preferredLanguage: LanguageCode;

  // Onboarding Profile Fields
  fullName?: string;
  displayName?: string;
  arabicName?: string;
  country?: string;
  teachingLanguage?: string;
  gender?: string;
  yearsExperience?: number | string;
  specializations?: string[];
  bio?: string;
  profileCompleted?: boolean;
  profileCompletedAt?: string;

  // Legacy/compatibility fields
  age?: number | string;
  yearsOfExperience?: number | string;
  purpose?: string;
  location?: string;
  onboardingCompleted?: boolean;
  tourCompleted?: boolean;
  timezone?: string;
  reminderMinutes?: number;
  reminderSoundEnabled?: boolean;
  reminderVibrationEnabled?: boolean;
  isSuperAdmin?: boolean;
  isGuest?: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  teacherId: string;
  name: string;
  email?: string;
  age: number;
  nationality?: string;
  nativeLanguage?: string;
  learningLanguage: string;
  level: LevelType;
  subjects: SubjectType[];
  notes?: string;
  status: "Active" | "Archived";
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  teacherId: string;
  studentId: string;
  curriculumId?: string;
  lessonId?: string;
  subject: SubjectType;
  title: string;
  startAt: string; // ISO String e.g. 2026-08-08T18:00:00
  durationMinutes: number;
  recurrence?: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  recurrenceDays?: number[];
  recurrenceEndDate?: string;
  reminderMinutes?: number;
  reminderEnabled?: boolean;
  status: "upcoming" | "completed" | "cancelled" | "missed";
  notes?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  teacherId: string;
  title: string;
  message: string;
  type: "reminder" | "session" | "system";
  read: boolean;
  scheduledTime?: string;
  studentId?: string;
  scheduleId?: string;
  createdAt: string;
}

export interface CurriculumLesson {
  id: string;
  order: number;
  title: string;
  titleArabic?: string;
  description?: string;
  durationMinutes?: number;
}

export interface Curriculum {
  id: string;
  teacherId: string;
  name: string;
  subject: SubjectType;
  description: string;
  level: LevelType;
  lessons: CurriculumLesson[];
  createdAt: string;
}

export interface StudentCurriculum {
  id: string;
  teacherId?: string;
  studentId: string;
  curriculumId: string;
  progressPercentage: number;
  currentLessonId: string;
  completedLessonIds: string[];
  startedAt: string;
}

export interface LessonSession {
  id: string;
  teacherId?: string;
  studentId: string;
  curriculumId?: string;
  lessonTitle: string;
  date: string;
  durationMinutes: number;
  attendanceStatus: AttendanceStatus;
  objectives: { id: string; text: string; completed: boolean }[];
  completedItems: string[];
  teacherNotes: string;
  homework?: string;
  quizScore?: number;
  createdAt: string;
}

export interface ProgressRecord {
  id: string;
  teacherId?: string;
  studentId: string;
  curriculumId: string;
  lessonId: string;
  completed: boolean;
  progressPercentage: number;
  notes?: string;
  date: string;
}

export interface MemoryDetectiveQuestion {
  id: string;
  type: "continue_ayah" | "whats_next" | "fill_gap" | "identify" | "random_recall";
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  promptText: string;
  promptTextArabic: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface MemoryDetectiveResult {
  id: string;
  teacherId?: string;
  studentId: string;
  date: string;
  surahRange: string;
  totalQuestions?: number;
  correctAnswers?: number;
  scorePercentage: number;
  strongAreas?: string[];
  needsPractice?: string[];
  notes?: string;
}

export interface MemoryMapNode {
  id: string;
  title: string;
  titleArabic?: string;
  status: "completed" | "current" | "needs_revision" | "locked";
  subItemsCount?: number;
  completedSubItems?: number;
  category?: string;
  notes?: string;
}

export interface AILessonPlan {
  lessonGoal: string;
  warmup: {
    durationMinutes: number;
    instructions: string;
    questions: string[];
  };
  keyPoints: string[];
  vocabulary: {
    arabic: string;
    english: string;
    explanation: string;
    pronunciation?: string;
  }[];
  questionsToAsk: {
    easy: string[];
    medium: string[];
    challenge: string[];
  };
  examples: string[];
  miniActivity: string;
  quickQuiz: {
    question: string;
    options?: string[];
    correctAnswer: string;
  }[];
  homework: string[];
  teachingTips: {
    whatToEmphasize: string;
    commonConfusion: string;
    howToSimplify: string;
  };
}

export interface AIQuiz {
  title: string;
  questions: {
    id: string;
    type: string;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface AIHomework {
  title: string;
  estimatedMinutes: number;
  tasks: {
    taskNumber: number;
    instruction: string;
    detail?: string;
  }[];
  teacherNote?: string;
}

export interface AIStudentInsight {
  overallAssessment: string;
  strengths: string[];
  areasToFocus: string[];
  actionableTip: string;
}

export interface SavedAIContent {
  id: string;
  teacherId: string;
  studentId?: string;
  type: "lesson_plan" | "quiz" | "homework";
  title: string;
  subject?: SubjectType;
  level?: LevelType;
  durationMinutes?: number;
  focus?: string;
  content: any;
  createdAt: string;
  updatedAt?: string;
  saveStatus?: "saving" | "saved" | "error";
  exportStatus?: "not_exported" | "exported";
}

