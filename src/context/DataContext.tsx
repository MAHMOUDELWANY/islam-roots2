import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import {
  Student,
  Curriculum,
  StudentCurriculum,
  LessonSession,
  MemoryDetectiveResult,
  MemoryMapNode,
  SavedAIContent,
  ScheduleEntry,
  AppNotification,
} from "../types";
import {
  DEMO_STUDENTS,
  DEMO_CURRICULUMS,
  DEMO_STUDENT_CURRICULUMS,
  DEMO_LESSON_SESSIONS,
  DEMO_MEMORY_DETECTIVE_RESULTS,
  DEMO_MEMORY_MAP_NODES,
  DEMO_SCHEDULES,
  DEMO_NOTIFICATIONS,
} from "../data/demoData";

interface DataContextType {
  students: Student[];
  curriculums: Curriculum[];
  studentCurriculums: StudentCurriculum[];
  lessonSessions: LessonSession[];
  detectiveResults: MemoryDetectiveResult[];
  savedContents: SavedAIContent[];
  memoryMapNodes: MemoryMapNode[];
  schedules: ScheduleEntry[];
  notifications: AppNotification[];
  loadingData: boolean;
  syncError: string | null;
  clearSyncError: () => void;

  // Student Actions
  addStudent: (data: Omit<Student, "id" | "teacherId" | "createdAt" | "status">) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  archiveStudent: (id: string) => Promise<void>;
  getStudentById: (id: string) => Student | undefined;

  // Curriculum Actions
  createCurriculum: (data: Omit<Curriculum, "id" | "teacherId" | "createdAt">) => Promise<Curriculum>;
  updateCurriculum: (id: string, data: Partial<Curriculum>) => Promise<void>;
  deleteCurriculum: (id: string) => Promise<void>;
  assignCurriculumToStudent: (studentId: string, curriculumId: string) => Promise<StudentCurriculum>;
  getStudentCurriculum: (studentId: string) => { curriculum?: Curriculum; studentCurriculum?: StudentCurriculum };

  // Schedule Actions
  addSchedule: (data: Omit<ScheduleEntry, "id" | "teacherId" | "createdAt">) => Promise<ScheduleEntry>;
  updateSchedule: (id: string, data: Partial<ScheduleEntry>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Notification Actions
  addNotification: (data: Omit<AppNotification, "id" | "teacherId" | "createdAt" | "read">) => Promise<AppNotification>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Lesson Session Actions
  recordLessonSession: (sessionData: Omit<LessonSession, "id" | "createdAt">) => Promise<LessonSession>;
  getStudentSessions: (studentId: string) => LessonSession[];

  // Memory Detective Actions
  recordDetectiveResult: (resultData: Omit<MemoryDetectiveResult, "id">) => Promise<MemoryDetectiveResult>;
  getStudentDetectiveResults: (studentId: string) => MemoryDetectiveResult[];

  // Saved AI Content Actions
  saveAIContent: (data: Omit<SavedAIContent, "teacherId" | "createdAt"> & { id?: string; createdAt?: string }) => Promise<SavedAIContent>;
  deleteSavedAIContent: (id: string) => Promise<void>;

  // Memory Map Actions
  updateMemoryMapNode: (nodeId: string, status: MemoryMapNode["status"], studentId?: string) => void;

  // Seed / Reset
  seedDemoDataIfEmpty: () => Promise<void>;
  resetToDemoData: () => Promise<void>;
  clearGuestData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Session Storage Keys for Guest Persistence
const STORAGE_KEYS = {
  students: "ir_guest_students_v1",
  curriculums: "ir_guest_curriculums_v1",
  studentCurriculums: "ir_guest_sc_v1",
  sessions: "ir_guest_sessions_v1",
  detective: "ir_guest_detective_v1",
  savedAI: "ir_guest_saved_ai_v1",
  schedules: "ir_guest_schedules_v1",
  notifications: "ir_guest_notifications_v1",
  memoryMap: "ir_guest_memorymap_v1",
};

const getInitialGuestData = <T,>(key: string, fallback: T): T => {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load guest session data:", key, e);
  }
  return fallback;
};

// Data Mapper Helpers (Supabase snake_case <-> App camelCase)
const mapStudentFromDb = (row: any): Student => ({
  id: row.id,
  teacherId: row.teacher_id,
  name: row.name,
  email: row.email || undefined,
  age: row.age || undefined,
  nationality: row.nationality || undefined,
  nativeLanguage: row.native_language || undefined,
  learningLanguage: row.learning_language || undefined,
  level: row.level || undefined,
  subjects: row.subjects || [],
  notes: row.notes || undefined,
  status: row.status || "Active",
  createdAt: row.created_at,
});

const mapStudentToDb = (s: Partial<Student>) => {
  const dbRow: any = {};
  if (s.id !== undefined) dbRow.id = s.id;
  if (s.teacherId !== undefined) dbRow.teacher_id = s.teacherId;
  if (s.name !== undefined) dbRow.name = s.name;
  if (s.email !== undefined) dbRow.email = s.email;
  if (s.age !== undefined) dbRow.age = s.age;
  if (s.nationality !== undefined) dbRow.nationality = s.nationality;
  if (s.nativeLanguage !== undefined) dbRow.native_language = s.nativeLanguage;
  if (s.learningLanguage !== undefined) dbRow.learning_language = s.learningLanguage;
  if (s.level !== undefined) dbRow.level = s.level;
  if (s.subjects !== undefined) dbRow.subjects = s.subjects;
  if (s.notes !== undefined) dbRow.notes = s.notes;
  if (s.status !== undefined) dbRow.status = s.status;
  if (s.createdAt !== undefined) dbRow.created_at = s.createdAt;
  return dbRow;
};

const mapCurriculumFromDb = (row: any): Curriculum => ({
  id: row.id,
  teacherId: row.teacher_id,
  name: row.name,
  subject: row.subject || "",
  description: row.description || "",
  level: row.level || "",
  lessons: row.lessons || [],
  createdAt: row.created_at,
});

const mapCurriculumToDb = (c: Partial<Curriculum>) => {
  const dbRow: any = {};
  if (c.id !== undefined) dbRow.id = c.id;
  if (c.teacherId !== undefined) dbRow.teacher_id = c.teacherId;
  if (c.name !== undefined) dbRow.name = c.name;
  if (c.subject !== undefined) dbRow.subject = c.subject;
  if (c.description !== undefined) dbRow.description = c.description;
  if (c.level !== undefined) dbRow.level = c.level;
  if (c.lessons !== undefined) dbRow.lessons = c.lessons;
  if (c.createdAt !== undefined) dbRow.created_at = c.createdAt;
  return dbRow;
};

const mapStudentCurriculumFromDb = (row: any): StudentCurriculum => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentId: row.student_id,
  curriculumId: row.curriculum_id,
  progressPercentage: row.progress_percentage || 0,
  currentLessonId: row.current_lesson_id || "",
  completedLessonIds: row.completed_lesson_ids || [],
  startedAt: row.started_at,
});

const mapStudentCurriculumToDb = (sc: Partial<StudentCurriculum>) => {
  const dbRow: any = {};
  if (sc.id !== undefined) dbRow.id = sc.id;
  if (sc.teacherId !== undefined) dbRow.teacher_id = sc.teacherId;
  if (sc.studentId !== undefined) dbRow.student_id = sc.studentId;
  if (sc.curriculumId !== undefined) dbRow.curriculum_id = sc.curriculumId;
  if (sc.progressPercentage !== undefined) dbRow.progress_percentage = sc.progressPercentage;
  if (sc.currentLessonId !== undefined) dbRow.current_lesson_id = sc.currentLessonId;
  if (sc.completedLessonIds !== undefined) dbRow.completed_lesson_ids = sc.completedLessonIds;
  if (sc.startedAt !== undefined) dbRow.started_at = sc.startedAt;
  return dbRow;
};

const mapLessonSessionFromDb = (row: any): LessonSession => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentId: row.student_id,
  curriculumId: row.curriculum_id || undefined,
  lessonTitle: row.lesson_title,
  date: row.date,
  durationMinutes: row.duration_minutes,
  attendanceStatus: row.attendance_status,
  objectives: row.objectives || [],
  completedItems: row.completed_items || [],
  teacherNotes: row.teacher_notes || undefined,
  homework: row.homework || undefined,
  quizScore: row.quiz_score !== null ? row.quiz_score : undefined,
  createdAt: row.created_at,
});

const mapLessonSessionToDb = (ls: Partial<LessonSession>) => {
  const dbRow: any = {};
  if (ls.id !== undefined) dbRow.id = ls.id;
  if (ls.teacherId !== undefined) dbRow.teacher_id = ls.teacherId;
  if (ls.studentId !== undefined) dbRow.student_id = ls.studentId;
  if (ls.curriculumId !== undefined) dbRow.curriculum_id = ls.curriculumId;
  if (ls.lessonTitle !== undefined) dbRow.lesson_title = ls.lessonTitle;
  if (ls.date !== undefined) dbRow.date = ls.date;
  if (ls.durationMinutes !== undefined) dbRow.duration_minutes = ls.durationMinutes;
  if (ls.attendanceStatus !== undefined) dbRow.attendance_status = ls.attendanceStatus;
  if (ls.objectives !== undefined) dbRow.objectives = ls.objectives;
  if (ls.completedItems !== undefined) dbRow.completed_items = ls.completedItems;
  if (ls.teacherNotes !== undefined) dbRow.teacher_notes = ls.teacherNotes;
  if (ls.homework !== undefined) dbRow.homework = ls.homework;
  if (ls.quizScore !== undefined) dbRow.quiz_score = ls.quizScore;
  if (ls.createdAt !== undefined) dbRow.created_at = ls.createdAt;
  return dbRow;
};

const mapDetectiveResultFromDb = (row: any): MemoryDetectiveResult => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentId: row.student_id,
  date: row.date,
  surahRange: row.surah_range,
  totalQuestions: row.total_questions,
  correctAnswers: row.correct_answers,
  scorePercentage: row.score_percentage ? Number(row.score_percentage) : 0,
  strongAreas: row.strong_areas || [],
  needsPractice: row.needs_practice || [],
  notes: row.notes || undefined,
});

const mapDetectiveResultToDb = (dr: Partial<MemoryDetectiveResult>) => {
  const dbRow: any = {};
  if (dr.id !== undefined) dbRow.id = dr.id;
  if (dr.teacherId !== undefined) dbRow.teacher_id = dr.teacherId;
  if (dr.studentId !== undefined) dbRow.student_id = dr.studentId;
  if (dr.date !== undefined) dbRow.date = dr.date;
  if (dr.surahRange !== undefined) dbRow.surah_range = dr.surahRange;
  if (dr.totalQuestions !== undefined) dbRow.total_questions = dr.totalQuestions;
  if (dr.correctAnswers !== undefined) dbRow.correct_answers = dr.correctAnswers;
  if (dr.scorePercentage !== undefined) dbRow.score_percentage = dr.scorePercentage;
  if (dr.strongAreas !== undefined) dbRow.strong_areas = dr.strongAreas;
  if (dr.needsPractice !== undefined) dbRow.needs_practice = dr.needsPractice;
  if (dr.notes !== undefined) dbRow.notes = dr.notes;
  return dbRow;
};

const SAVED_CONTENT_META_KEY = "__islamRootsMeta";

const mapSavedAIFromDb = (row: any): SavedAIContent => {
  const stored = row.content && typeof row.content === "object" && !Array.isArray(row.content) ? row.content : {};
  const meta = stored[SAVED_CONTENT_META_KEY] || {};
  const { [SAVED_CONTENT_META_KEY]: _ignored, ...content } = stored;
  return {
    id: row.id,
    teacherId: row.teacher_id,
    studentId: row.student_id || meta.studentId || undefined,
    type: row.type,
    title: row.title,
    subject: meta.subject,
    level: meta.level,
    durationMinutes: meta.durationMinutes,
    focus: meta.focus,
    content,
    createdAt: row.created_at,
    updatedAt: meta.updatedAt || row.created_at,
    saveStatus: "saved",
    exportStatus: meta.exportStatus || "not_exported",
  };
};

const mapSavedAIToDb = (sa: Partial<SavedAIContent>) => {
  const dbRow: any = {};
  if (sa.id !== undefined) dbRow.id = sa.id;
  if (sa.teacherId !== undefined) dbRow.teacher_id = sa.teacherId;
  if (sa.studentId !== undefined) dbRow.student_id = sa.studentId;
  if (sa.type !== undefined) dbRow.type = sa.type;
  if (sa.title !== undefined) dbRow.title = sa.title;
  if (sa.content !== undefined) {
    dbRow.content = {
      ...(sa.content && typeof sa.content === "object" && !Array.isArray(sa.content) ? sa.content : {}),
      [SAVED_CONTENT_META_KEY]: {
        studentId: sa.studentId,
        subject: sa.subject,
        level: sa.level,
        durationMinutes: sa.durationMinutes,
        focus: sa.focus,
        updatedAt: sa.updatedAt || new Date().toISOString(),
        exportStatus: sa.exportStatus || "not_exported",
      },
    };
  }
  if (sa.createdAt !== undefined) dbRow.created_at = sa.createdAt;
  return dbRow;
};

const mapScheduleFromDb = (row: any): ScheduleEntry => ({
  id: row.id,
  teacherId: row.teacher_id,
  studentId: row.student_id,
  curriculumId: row.curriculum_id || undefined,
  lessonId: row.lesson_id || undefined,
  subject: row.subject,
  title: row.title,
  startAt: row.start_at,
  durationMinutes: row.duration_minutes,
  recurrence: row.recurrence,
  recurrenceDays: row.recurrence_days || undefined,
  recurrenceEndDate: row.recurrence_end_date || undefined,
  reminderMinutes: row.reminder_minutes,
  reminderEnabled: row.reminder_enabled ?? true,
  status: row.status,
  notes: row.notes || undefined,
  createdAt: row.created_at,
});

const mapScheduleToDb = (sc: Partial<ScheduleEntry>) => {
  const dbRow: any = {};
  if (sc.id !== undefined) dbRow.id = sc.id;
  if (sc.teacherId !== undefined) dbRow.teacher_id = sc.teacherId;
  if (sc.studentId !== undefined) dbRow.student_id = sc.studentId;
  if (sc.curriculumId !== undefined) dbRow.curriculum_id = sc.curriculumId;
  if (sc.lessonId !== undefined) dbRow.lesson_id = sc.lessonId;
  if (sc.subject !== undefined) dbRow.subject = sc.subject;
  if (sc.title !== undefined) dbRow.title = sc.title;
  if (sc.startAt !== undefined) dbRow.start_at = sc.startAt;
  if (sc.durationMinutes !== undefined) dbRow.duration_minutes = sc.durationMinutes;
  if (sc.recurrence !== undefined) dbRow.recurrence = sc.recurrence;
  if (sc.recurrenceDays !== undefined) dbRow.recurrence_days = sc.recurrenceDays;
  if (sc.recurrenceEndDate !== undefined) dbRow.recurrence_end_date = sc.recurrenceEndDate;
  if (sc.reminderMinutes !== undefined) dbRow.reminder_minutes = sc.reminderMinutes;
  if (sc.reminderEnabled !== undefined) dbRow.reminder_enabled = sc.reminderEnabled;
  if (sc.status !== undefined) dbRow.status = sc.status;
  if (sc.notes !== undefined) dbRow.notes = sc.notes;
  if (sc.createdAt !== undefined) dbRow.created_at = sc.createdAt;
  return dbRow;
};

const mapNotificationFromDb = (row: any): AppNotification => ({
  id: row.id,
  teacherId: row.teacher_id,
  title: row.title,
  message: row.message,
  type: row.type,
  read: row.read ?? false,
  scheduledTime: row.scheduled_time || undefined,
  studentId: row.student_id || undefined,
  scheduleId: row.schedule_id || undefined,
  createdAt: row.created_at,
});

const mapNotificationToDb = (n: Partial<AppNotification>) => {
  const dbRow: any = {};
  if (n.id !== undefined) dbRow.id = n.id;
  if (n.teacherId !== undefined) dbRow.teacher_id = n.teacherId;
  if (n.title !== undefined) dbRow.title = n.title;
  if (n.message !== undefined) dbRow.message = n.message;
  if (n.type !== undefined) dbRow.type = n.type;
  if (n.read !== undefined) dbRow.read = n.read;
  if (n.scheduledTime !== undefined) dbRow.scheduled_time = n.scheduledTime;
  if (n.studentId !== undefined) dbRow.student_id = n.studentId;
  if (n.scheduleId !== undefined) dbRow.schedule_id = n.scheduleId;
  if (n.createdAt !== undefined) dbRow.created_at = n.createdAt;
  return dbRow;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { teacher, firebaseUser, isGuest } = useAuth();
  const teacherId = teacher?.id || "guest-ustadh-101";
  const isGuestMode = isGuest;

  // State initialized with session-only guest data or demo data
  const [students, setStudents] = useState<Student[]>(() =>
    getInitialGuestData(STORAGE_KEYS.students, [])
  );
  const [curriculums, setCurriculums] = useState<Curriculum[]>(() =>
    getInitialGuestData(STORAGE_KEYS.curriculums, [])
  );
  const [studentCurriculums, setStudentCurriculums] = useState<StudentCurriculum[]>(() =>
    getInitialGuestData(STORAGE_KEYS.studentCurriculums, [])
  );
  const [lessonSessions, setLessonSessions] = useState<LessonSession[]>(() =>
    getInitialGuestData(STORAGE_KEYS.sessions, [])
  );
  const [detectiveResults, setDetectiveResults] = useState<MemoryDetectiveResult[]>(() =>
    getInitialGuestData(STORAGE_KEYS.detective, [])
  );
  const [savedContents, setSavedContents] = useState<SavedAIContent[]>(() =>
    getInitialGuestData(STORAGE_KEYS.savedAI, [])
  );
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(() =>
    getInitialGuestData(STORAGE_KEYS.schedules, [])
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getInitialGuestData(STORAGE_KEYS.notifications, [])
  );
  const [memoryMapNodes, setMemoryMapNodes] = useState<MemoryMapNode[]>(() =>
    getInitialGuestData(STORAGE_KEYS.memoryMap, [])
  );
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const reportSyncError = (operation: string, error: unknown) => {
    console.error(`[DataContext] ${operation} failed.`, error);
    setSyncError(`Your latest ${operation.toLowerCase()} could not be saved. Check your connection and try again.`);
  };

  const runMutation = async <T extends { error: unknown }>(operation: string, mutation: PromiseLike<T>): Promise<T> => {
    const result = await mutation;
    if (result.error) {
      reportSyncError(operation, result.error);
      throw result.error;
    }
    return result;
  };

  // Remove legacy persistent guest records after the session-storage privacy migration.
  useEffect(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("islamroots_guest_teacher");
  }, []);

  // Sync guest data to sessionStorage whenever state changes in Guest mode
  useEffect(() => {
    if (isGuestMode) {
      sessionStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
      sessionStorage.setItem(STORAGE_KEYS.curriculums, JSON.stringify(curriculums));
      sessionStorage.setItem(STORAGE_KEYS.studentCurriculums, JSON.stringify(studentCurriculums));
      sessionStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(lessonSessions));
      sessionStorage.setItem(STORAGE_KEYS.detective, JSON.stringify(detectiveResults));
      sessionStorage.setItem(STORAGE_KEYS.savedAI, JSON.stringify(savedContents));
      sessionStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(schedules));
      sessionStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
      sessionStorage.setItem(STORAGE_KEYS.memoryMap, JSON.stringify(memoryMapNodes));
    }
  }, [
    isGuestMode,
    students,
    curriculums,
    studentCurriculums,
    lessonSessions,
    detectiveResults,
    savedContents,
    schedules,
    notifications,
    memoryMapNodes,
  ]);

  // Load from Supabase when logged in as an authenticated user
  useEffect(() => {
    if (isGuestMode || !firebaseUser) {
      setStudents(getInitialGuestData<Student[]>(STORAGE_KEYS.students, []));
      setCurriculums(getInitialGuestData<Curriculum[]>(STORAGE_KEYS.curriculums, []));
      setStudentCurriculums(getInitialGuestData<StudentCurriculum[]>(STORAGE_KEYS.studentCurriculums, []));
      setLessonSessions(getInitialGuestData<LessonSession[]>(STORAGE_KEYS.sessions, []));
      setDetectiveResults(getInitialGuestData<MemoryDetectiveResult[]>(STORAGE_KEYS.detective, []));
      setSavedContents(getInitialGuestData(STORAGE_KEYS.savedAI, []));
      setSchedules(getInitialGuestData<ScheduleEntry[]>(STORAGE_KEYS.schedules, []));
      setNotifications(getInitialGuestData<AppNotification[]>(STORAGE_KEYS.notifications, []));
      setMemoryMapNodes(getInitialGuestData<MemoryMapNode[]>(STORAGE_KEYS.memoryMap, []));
      setLoadingData(false);
      return;
    }

    setStudents([]);
    setCurriculums([]);
    setStudentCurriculums([]);
    setLessonSessions([]);
    setDetectiveResults([]);
    setSavedContents([]);
    setSchedules([]);
    setNotifications([]);
    setLoadingData(true);

    const uid = firebaseUser.uid;

    const fetchAllData = async () => {
      try {
        const results = await Promise.all([
          supabase.from("students").select("*").eq("teacher_id", uid),
          supabase.from("curriculums").select("*").eq("teacher_id", uid),
          supabase.from("student_curriculums").select("*").eq("teacher_id", uid),
          supabase.from("lesson_sessions").select("*").eq("teacher_id", uid),
          supabase.from("memory_detective_sessions").select("*").eq("teacher_id", uid),
          supabase.from("saved_ai_content").select("*").eq("teacher_id", uid),
          supabase.from("schedules").select("*").eq("teacher_id", uid),
          supabase.from("notifications").select("*").eq("teacher_id", uid),
        ]);
        const firstError = results.find((result) => result.error)?.error;
        if (firstError) {
          reportSyncError("workspace data load", firstError);
          return;
        }

        const [stData, currData, scData, sessData, detData, aiData, schedData, notifData] = results.map((result) => result.data);
        if (stData) setStudents(stData.map(mapStudentFromDb));
        if (currData) setCurriculums(currData.map(mapCurriculumFromDb));
        if (scData) setStudentCurriculums(scData.map(mapStudentCurriculumFromDb));
        if (sessData) {
          const mapped = sessData.map(mapLessonSessionFromDb);
          mapped.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setLessonSessions(mapped);
        }
        if (detData) setDetectiveResults(detData.map(mapDetectiveResultFromDb));
        if (aiData) setSavedContents(aiData.map(mapSavedAIFromDb));
        if (schedData) {
          const mapped = schedData.map(mapScheduleFromDb);
          mapped.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          setSchedules(mapped);
        }
        if (notifData) {
          const mapped = notifData.map(mapNotificationFromDb);
          mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("[DataContext] Error fetching data from Supabase:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();

    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => { void fetchAllData(); }, 250);
    };

    // Subscribe to realtime changes for all relevant tables and coalesce bursts.
    const channel = supabase
      .channel("data_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "students", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "curriculums", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_curriculums", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_sessions", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "memory_detective_sessions", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "saved_ai_content", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "schedules", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `teacher_id=eq.${uid}` }, scheduleReload)
      .subscribe();

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, [firebaseUser, isGuestMode]);

  // Seed / Reset Methods
  const seedDemoDataIfEmpty = async () => {
    if (isGuestMode) {
      setStudents(DEMO_STUDENTS);
      setCurriculums(DEMO_CURRICULUMS);
      setStudentCurriculums(DEMO_STUDENT_CURRICULUMS);
      setLessonSessions(DEMO_LESSON_SESSIONS);
      setDetectiveResults(DEMO_MEMORY_DETECTIVE_RESULTS);
      setSchedules(DEMO_SCHEDULES);
      setNotifications(DEMO_NOTIFICATIONS);
      setMemoryMapNodes(DEMO_MEMORY_MAP_NODES);
      return;
    }

    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      for (const s of DEMO_STUDENTS) {
        await supabase.from("students").upsert(mapStudentToDb({ ...s, teacherId: uid }));
      }
      for (const c of DEMO_CURRICULUMS) {
        await supabase.from("curriculums").upsert(mapCurriculumToDb({ ...c, teacherId: uid }));
      }
      for (const sc of DEMO_STUDENT_CURRICULUMS) {
        await supabase.from("student_curriculums").upsert(mapStudentCurriculumToDb({ ...sc, teacherId: uid }));
      }
      for (const sess of DEMO_LESSON_SESSIONS) {
        await supabase.from("lesson_sessions").upsert(mapLessonSessionToDb({ ...sess, teacherId: uid }));
      }
      for (const det of DEMO_MEMORY_DETECTIVE_RESULTS) {
        await supabase.from("memory_detective_sessions").upsert(mapDetectiveResultToDb({ ...det, teacherId: uid }));
      }
      for (const sched of DEMO_SCHEDULES) {
        await supabase.from("schedules").upsert(mapScheduleToDb({ ...sched, teacherId: uid }));
      }
      for (const notif of DEMO_NOTIFICATIONS) {
        await supabase.from("notifications").upsert(mapNotificationToDb({ ...notif, teacherId: uid }));
      }
    } catch (e) {
      console.error("Error seeding demo data to Supabase:", e);
    }
  };

  const resetToDemoData = async () => {
    await seedDemoDataIfEmpty();
  };

  const clearGuestData = () => {
    Object.values(STORAGE_KEYS).forEach((key) => sessionStorage.removeItem(key));
    setStudents([]);
    setCurriculums([]);
    setStudentCurriculums([]);
    setLessonSessions([]);
    setDetectiveResults([]);
    setSavedContents([]);
    setSchedules([]);
    setNotifications([]);
    setMemoryMapNodes([]);
  };

  // Student Actions
  const addStudent = async (data: Omit<Student, "id" | "teacherId" | "createdAt" | "status">): Promise<Student> => {
    const newStudent: Student = {
      ...data,
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `student-${Date.now()}`,
      teacherId,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    setStudents((prev) => [newStudent, ...prev]);

    if (!isGuestMode && firebaseUser) {
      const { data: inserted } = await runMutation(
        "student creation",
        supabase.from("students").insert(mapStudentToDb(newStudent)).select().single(),
      );
      if (inserted) {
        const mapped = mapStudentFromDb(inserted);
        setStudents((prev) => prev.map((s) => (s.id === newStudent.id ? mapped : s)));
        return mapped;
      }
    }
    return newStudent;
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (!isGuestMode && firebaseUser) {
      await runMutation("student update", supabase.from("students").update(mapStudentToDb(data)).eq("id", id));
    }
  };

  const archiveStudent = async (id: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Archived" } : s)));
    if (!isGuestMode && firebaseUser) {
      await runMutation("student archive", supabase.from("students").update({ status: "Archived" }).eq("id", id));
    }
  };

  const getStudentById = (id: string) => students.find((s) => s.id === id);

  // Curriculum Actions
  const createCurriculum = async (data: Omit<Curriculum, "id" | "teacherId" | "createdAt">): Promise<Curriculum> => {
    const newCurriculum: Curriculum = {
      ...data,
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `curr-${Date.now()}`,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setCurriculums((prev) => [newCurriculum, ...prev]);

    if (!isGuestMode && firebaseUser) {
      const { data: inserted } = await runMutation(
        "curriculum creation",
        supabase.from("curriculums").insert(mapCurriculumToDb(newCurriculum)).select().single(),
      );
      if (inserted) {
        const mapped = mapCurriculumFromDb(inserted);
        setCurriculums((prev) => prev.map((c) => (c.id === newCurriculum.id ? mapped : c)));
        return mapped;
      }
    }
    return newCurriculum;
  };

  const updateCurriculum = async (id: string, data: Partial<Curriculum>) => {
    setCurriculums((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    if (!isGuestMode && firebaseUser) {
      await runMutation("curriculum update", supabase.from("curriculums").update(mapCurriculumToDb(data)).eq("id", id));
    }
  };

  const deleteCurriculum = async (id: string) => {
    setCurriculums((prev) => prev.filter((c) => c.id !== id));
    if (!isGuestMode && firebaseUser) {
      await runMutation("curriculum deletion", supabase.from("curriculums").delete().eq("id", id));
    }
  };

  const assignCurriculumToStudent = async (studentId: string, curriculumId: string): Promise<StudentCurriculum> => {
    const curriculum = curriculums.find((c) => c.id === curriculumId);
    if (!curriculum) throw new Error("Curriculum not found");

    const existing = studentCurriculums.find((sc) => sc.studentId === studentId);
    const curriculumChanged = existing?.curriculumId !== curriculumId;
    const nextAssignment: StudentCurriculum = existing
      ? {
          ...existing,
          curriculumId,
          progressPercentage: curriculumChanged ? 0 : existing.progressPercentage,
          currentLessonId: curriculumChanged ? (curriculum.lessons[0]?.id || "") : existing.currentLessonId,
          completedLessonIds: curriculumChanged ? [] : existing.completedLessonIds,
          startedAt: curriculumChanged ? new Date().toISOString() : existing.startedAt,
        }
      : {
          id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `sc-${Date.now()}`,
          teacherId,
          studentId,
          curriculumId,
          progressPercentage: 0,
          currentLessonId: curriculum.lessons[0]?.id || "",
          completedLessonIds: [],
          startedAt: new Date().toISOString(),
        };

    setStudentCurriculums((prev) => {
      const withoutStudent = prev.filter((sc) => sc.studentId !== studentId || sc.id === nextAssignment.id);
      const alreadyPresent = withoutStudent.some((sc) => sc.id === nextAssignment.id);
      return alreadyPresent ? withoutStudent.map((sc) => (sc.id === nextAssignment.id ? nextAssignment : sc)) : [...withoutStudent, nextAssignment];
    });

    if (!isGuestMode && firebaseUser) {
      const query = existing
        ? supabase.from("student_curriculums").update(mapStudentCurriculumToDb(nextAssignment)).eq("id", nextAssignment.id).select().single()
        : supabase.from("student_curriculums").insert(mapStudentCurriculumToDb(nextAssignment)).select().single();
      const { data: saved } = await runMutation("curriculum assignment", query);
      if (saved) {
        const mapped = mapStudentCurriculumFromDb(saved);
        setStudentCurriculums((prev) => prev.map((sc) => (sc.id === nextAssignment.id ? mapped : sc)));
        return mapped;
      }
    }
    return nextAssignment;
  };

  const getStudentCurriculum = (studentId: string) => {
    const studentCurriculum = studentCurriculums
      .filter((sc) => sc.studentId === studentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    const curriculum = curriculums.find((c) => c.id === studentCurriculum?.curriculumId);
    return { curriculum, studentCurriculum };
  };

  // Schedule Actions
  const addSchedule = async (data: Omit<ScheduleEntry, "id" | "teacherId" | "createdAt">): Promise<ScheduleEntry> => {
    const newSchedule: ScheduleEntry = {
      ...data,
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `sched-${Date.now()}`,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setSchedules((prev) => [newSchedule, ...prev]);

    let finalSchedule = newSchedule;
    if (!isGuestMode && firebaseUser) {
      const { data: inserted } = await runMutation(
        "schedule creation",
        supabase.from("schedules").insert(mapScheduleToDb(newSchedule)).select().single(),
      );
      if (inserted) {
        finalSchedule = mapScheduleFromDb(inserted);
        setSchedules((prev) => prev.map((s) => (s.id === newSchedule.id ? finalSchedule : s)));
      }
    }

    const student = students.find((s) => s.id === data.studentId);
    if (student) {
      await addNotification({
        title: "Lesson Scheduled",
        message: `${student.name}'s ${data.subject} lesson is scheduled for ${new Date(data.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        type: "reminder",
        studentId: student.id,
        scheduleId: finalSchedule.id,
        scheduledTime: data.startAt,
      });
    }

    return finalSchedule;
  };

  const updateSchedule = async (id: string, data: Partial<ScheduleEntry>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (!isGuestMode && firebaseUser) {
      await runMutation("schedule update", supabase.from("schedules").update(mapScheduleToDb(data)).eq("id", id));
    }
  };

  const deleteSchedule = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (!isGuestMode && firebaseUser) {
      await runMutation("schedule deletion", supabase.from("schedules").delete().eq("id", id));
    }
  };

  // Notification Actions
  const addNotification = async (data: Omit<AppNotification, "id" | "teacherId" | "createdAt" | "read">): Promise<AppNotification> => {
    const newNotif: AppNotification = {
      ...data,
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `notif-${Date.now()}`,
      teacherId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (!isGuestMode && firebaseUser) {
      const { data: inserted } = await runMutation(
        "notification creation",
        supabase.from("notifications").insert(mapNotificationToDb(newNotif)).select().single(),
      );
      if (inserted) {
        const mapped = mapNotificationFromDb(inserted);
        setNotifications((prev) => prev.map((n) => (n.id === newNotif.id ? mapped : n)));
        return mapped;
      }
    }
    return newNotif;
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!isGuestMode && firebaseUser) {
      await runMutation("notification update", supabase.from("notifications").update({ read: true }).eq("id", id));
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!isGuestMode && firebaseUser) {
      await runMutation("notification update", supabase.from("notifications").update({ read: true }).eq("teacher_id", teacherId));
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    if (!isGuestMode && firebaseUser) {
      await runMutation("notification deletion", supabase.from("notifications").delete().eq("teacher_id", teacherId));
    }
  };

  // Lesson Session Actions
  const recordLessonSession = async (sessionData: Omit<LessonSession, "id" | "createdAt">): Promise<LessonSession> => {
    const newSession: LessonSession = {
      ...sessionData,
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `sess-${Date.now()}`,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setLessonSessions((prev) => [newSession, ...prev]);

    let finalSession = newSession;
    if (!isGuestMode && firebaseUser) {
      const { data: inserted } = await runMutation(
        "lesson session creation",
        supabase.from("lesson_sessions").insert(mapLessonSessionToDb(newSession)).select().single(),
      );
      if (inserted) {
        finalSession = mapLessonSessionFromDb(inserted);
        setLessonSessions((prev) => prev.map((s) => (s.id === newSession.id ? finalSession : s)));
      }
    }

    // Update student curriculum progress
    if (sessionData.curriculumId) {
      const sc = studentCurriculums.find((item) => item.studentId === sessionData.studentId && item.curriculumId === sessionData.curriculumId);
      const curr = curriculums.find((c) => c.id === sessionData.curriculumId);

      if (sc && curr && curr.lessons.length > 0) {
        const completedLesson = curr.lessons.find((l) => l.title === sessionData.lessonTitle || l.id === sessionData.lessonTitle);
        const matchId = completedLesson?.id || curr.lessons[0].id;
        const completedIds = Array.from(new Set([...sc.completedLessonIds, matchId]));
        const progressPct = Math.round((completedIds.length / curr.lessons.length) * 100);

        const nextIndex = curr.lessons.findIndex((l) => l.id === matchId) + 1;
        const nextLessonId = nextIndex < curr.lessons.length ? curr.lessons[nextIndex].id : matchId;

        setStudentCurriculums((prev) =>
          prev.map((item) =>
            item.id === sc.id ? { ...item, completedLessonIds: completedIds, progressPercentage: progressPct, currentLessonId: nextLessonId } : item
          )
        );

        if (!isGuestMode && firebaseUser) {
          await runMutation(
            "curriculum progress update",
            supabase.from("student_curriculums").update({
              completed_lesson_ids: completedIds,
              progress_percentage: progressPct,
              current_lesson_id: nextLessonId,
            }).eq("id", sc.id),
          );
        }
      }
    }

    return finalSession;
  };

  const getStudentSessions = (studentId: string) => {
    return lessonSessions.filter((s) => s.studentId === studentId);
  };

  const recordDetectiveResult = async (resultData: Omit<MemoryDetectiveResult, "id">): Promise<MemoryDetectiveResult> => {
    const newResult: MemoryDetectiveResult = {
      ...resultData,
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `det-${Date.now()}`,
      teacherId,
    };

    setDetectiveResults((prev) => [newResult, ...prev]);

    if (!isGuestMode && firebaseUser) {
      const { data: inserted } = await runMutation(
        "memory detective result creation",
        supabase.from("memory_detective_sessions").insert(mapDetectiveResultToDb(newResult)).select().single(),
      );
      if (inserted) {
        const mapped = mapDetectiveResultFromDb(inserted);
        setDetectiveResults((prev) => prev.map((r) => (r.id === newResult.id ? mapped : r)));
        return mapped;
      }
    }
    return newResult;
  };

  const getStudentDetectiveResults = (studentId: string) => {
    return detectiveResults.filter((r) => r.studentId === studentId);
  };

  // Saved AI Content Actions
  const saveAIContent = async (data: Omit<SavedAIContent, "teacherId" | "createdAt"> & { id?: string; createdAt?: string }): Promise<SavedAIContent> => {
    const now = new Date().toISOString();
    const existing = data.id ? savedContents.find((item) => item.id === data.id) : undefined;
    const item: SavedAIContent = {
      ...existing,
      ...data,
      id: data.id || window.crypto?.randomUUID ? (data.id || window.crypto.randomUUID()) : `saved-${Date.now()}`,
      teacherId,
      createdAt: existing?.createdAt || data.createdAt || now,
      updatedAt: now,
      saveStatus: "saving",
      exportStatus: data.exportStatus || existing?.exportStatus || "not_exported",
    };

    setSavedContents((prev) => {
      const withoutCurrent = prev.filter((saved) => saved.id !== item.id);
      return [item, ...withoutCurrent];
    });

    if (!isGuestMode && firebaseUser) {
      const query = existing
        ? supabase.from("saved_ai_content").update(mapSavedAIToDb(item)).eq("id", item.id).select().single()
        : supabase.from("saved_ai_content").insert(mapSavedAIToDb(item)).select().single();
      const { data: saved } = await runMutation(existing ? "saved AI content update" : "saved AI content creation", query);
      if (saved) {
        const mapped = mapSavedAIFromDb(saved);
        setSavedContents((prev) => prev.map((savedItem) => (savedItem.id === item.id ? mapped : savedItem)));
        return mapped;
      }
    }

    const savedItem = { ...item, saveStatus: "saved" as const };
    setSavedContents((prev) => prev.map((saved) => (saved.id === item.id ? savedItem : saved)));
    return savedItem;
  };

  const deleteSavedAIContent = async (id: string) => {
    setSavedContents((prev) => prev.filter((item) => item.id !== id));
    if (!isGuestMode && firebaseUser) {
      await runMutation("saved content deletion", supabase.from("saved_ai_content").delete().eq("id", id));
    }
  };

  // Memory Map Actions
  const updateMemoryMapNode = (nodeId: string, status: MemoryMapNode["status"], studentId?: string) => {
    setMemoryMapNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, status } : n)));

    if (studentId) {
      const sc = studentCurriculums.find((item) => item.studentId === studentId);
      const curr = curriculums.find((c) => c.id === sc?.curriculumId);
      if (sc && curr) {
        let completedIds = [...sc.completedLessonIds];
        if (status === "completed") {
          if (!completedIds.includes(nodeId)) completedIds.push(nodeId);
        } else {
          completedIds = completedIds.filter((id) => id !== nodeId);
        }
        const progressPct = curr.lessons.length > 0 ? Math.round((completedIds.length / curr.lessons.length) * 100) : 0;

        setStudentCurriculums((prev) =>
          prev.map((item) =>
            item.id === sc.id ? { ...item, completedLessonIds: completedIds, progressPercentage: progressPct } : item
          )
        );

        if (!isGuestMode && firebaseUser) {
          void runMutation(
            "curriculum progress update",
            supabase.from("student_curriculums").update({
              completed_lesson_ids: completedIds,
              progress_percentage: progressPct,
            }).eq("id", sc.id),
          ).catch(() => undefined);
        }
      }
    }
  };

  return (
    <DataContext.Provider
      value={{
        students,
        curriculums,
        studentCurriculums,
        lessonSessions,
        detectiveResults,
        savedContents,
        memoryMapNodes,
        schedules,
        notifications,
        loadingData,
        syncError,
        clearSyncError: () => setSyncError(null),
        addStudent,
        updateStudent,
        archiveStudent,
        getStudentById,
        createCurriculum,
        updateCurriculum,
        deleteCurriculum,
        assignCurriculumToStudent,
        getStudentCurriculum,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        recordLessonSession,
        getStudentSessions,
        recordDetectiveResult,
        getStudentDetectiveResults,
        saveAIContent,
        deleteSavedAIContent,
        updateMemoryMapNode,
        seedDemoDataIfEmpty,
        resetToDemoData,
        clearGuestData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
