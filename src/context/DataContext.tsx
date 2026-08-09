import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
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
  saveAIContent: (data: Omit<SavedAIContent, "id" | "teacherId" | "createdAt">) => Promise<SavedAIContent>;
  deleteSavedAIContent: (id: string) => Promise<void>;

  // Memory Map Actions
  updateMemoryMapNode: (nodeId: string, status: MemoryMapNode["status"], studentId?: string) => void;

  // Seed / Reset
  seedDemoDataIfEmpty: () => Promise<void>;
  resetToDemoData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Local Storage Keys for Guest Persistence
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

const getInitialLocal = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load local storage key:", key, e);
  }
  return fallback;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { teacher, firebaseUser } = useAuth();
  const teacherId = teacher?.id || "guest-ustadh-101";
  const isGuestMode = !firebaseUser || teacherId === "guest-ustadh-101" || teacherId === "anon";

  // State initialized with localStorage or DEMO data
  const [students, setStudents] = useState<Student[]>(() =>
    getInitialLocal(STORAGE_KEYS.students, DEMO_STUDENTS)
  );
  const [curriculums, setCurriculums] = useState<Curriculum[]>(() =>
    getInitialLocal(STORAGE_KEYS.curriculums, DEMO_CURRICULUMS)
  );
  const [studentCurriculums, setStudentCurriculums] = useState<StudentCurriculum[]>(() =>
    getInitialLocal(STORAGE_KEYS.studentCurriculums, DEMO_STUDENT_CURRICULUMS)
  );
  const [lessonSessions, setLessonSessions] = useState<LessonSession[]>(() =>
    getInitialLocal(STORAGE_KEYS.sessions, DEMO_LESSON_SESSIONS)
  );
  const [detectiveResults, setDetectiveResults] = useState<MemoryDetectiveResult[]>(() =>
    getInitialLocal(STORAGE_KEYS.detective, DEMO_MEMORY_DETECTIVE_RESULTS)
  );
  const [savedContents, setSavedContents] = useState<SavedAIContent[]>(() =>
    getInitialLocal(STORAGE_KEYS.savedAI, [])
  );
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(() =>
    getInitialLocal(STORAGE_KEYS.schedules, DEMO_SCHEDULES)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getInitialLocal(STORAGE_KEYS.notifications, DEMO_NOTIFICATIONS)
  );
  const [memoryMapNodes, setMemoryMapNodes] = useState<MemoryMapNode[]>(() =>
    getInitialLocal(STORAGE_KEYS.memoryMap, DEMO_MEMORY_MAP_NODES)
  );
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Sync Guest Data to localStorage whenever state changes in Guest mode
  useEffect(() => {
    if (isGuestMode) {
      localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
      localStorage.setItem(STORAGE_KEYS.curriculums, JSON.stringify(curriculums));
      localStorage.setItem(STORAGE_KEYS.studentCurriculums, JSON.stringify(studentCurriculums));
      localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(lessonSessions));
      localStorage.setItem(STORAGE_KEYS.detective, JSON.stringify(detectiveResults));
      localStorage.setItem(STORAGE_KEYS.savedAI, JSON.stringify(savedContents));
      localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(schedules));
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.memoryMap, JSON.stringify(memoryMapNodes));
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

  // Subscribe to Firestore ONLY when logged in as a real authenticated user
  useEffect(() => {
    if (isGuestMode || !firebaseUser) {
      setStudents(getInitialLocal(STORAGE_KEYS.students, DEMO_STUDENTS));
      setCurriculums(getInitialLocal(STORAGE_KEYS.curriculums, DEMO_CURRICULUMS));
      setStudentCurriculums(getInitialLocal(STORAGE_KEYS.studentCurriculums, DEMO_STUDENT_CURRICULUMS));
      setLessonSessions(getInitialLocal(STORAGE_KEYS.sessions, DEMO_LESSON_SESSIONS));
      setDetectiveResults(getInitialLocal(STORAGE_KEYS.detective, DEMO_MEMORY_DETECTIVE_RESULTS));
      setSavedContents(getInitialLocal(STORAGE_KEYS.savedAI, []));
      setSchedules(getInitialLocal(STORAGE_KEYS.schedules, DEMO_SCHEDULES));
      setNotifications(getInitialLocal(STORAGE_KEYS.notifications, DEMO_NOTIFICATIONS));
      setMemoryMapNodes(getInitialLocal(STORAGE_KEYS.memoryMap, DEMO_MEMORY_MAP_NODES));
      setLoadingData(false);
      return;
    }

    // Authenticated user: clear previous state first to prevent cross-account leak
    setStudents([]);
    setCurriculums([]);
    setStudentCurriculums([]);
    setLessonSessions([]);
    setDetectiveResults([]);
    setSavedContents([]);
    setSchedules([]);
    setNotifications([]);
    setLoadingData(true);

    const safetyTimer = setTimeout(() => {
      setLoadingData(false);
    }, 2000);

    const qStudents = query(collection(db, "students"), where("teacherId", "==", firebaseUser.uid));
    const qCurriculums = query(collection(db, "curriculums"), where("teacherId", "==", firebaseUser.uid));
    const qStudentCurriculums = query(collection(db, "studentCurriculums"), where("teacherId", "==", firebaseUser.uid));
    const qSessions = query(collection(db, "lessonSessions"), where("teacherId", "==", firebaseUser.uid));
    const qDetective = query(collection(db, "memoryDetectiveSessions"), where("teacherId", "==", firebaseUser.uid));
    const qSavedAI = query(collection(db, "savedAIContent"), where("teacherId", "==", firebaseUser.uid));
    const qSchedules = query(collection(db, "schedules"), where("teacherId", "==", firebaseUser.uid));
    const qNotifications = query(collection(db, "notifications"), where("teacherId", "==", firebaseUser.uid));

    const handleSnapshotError = (contextName: string, err: any) => {
      console.error(`Firestore snapshot error [${contextName}]:`, err);
      setLoadingData(false);
    };

    const unsubStudents = onSnapshot(
      qStudents,
      (snapshot) => {
        const items: Student[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(items);
      },
      (err) => handleSnapshotError("Students", err)
    );

    const unsubCurriculums = onSnapshot(
      qCurriculums,
      (snapshot) => {
        const items: Curriculum[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Curriculum));
        setCurriculums(items);
      },
      (err) => handleSnapshotError("Curriculums", err)
    );

    const unsubStudentCurriculums = onSnapshot(
      qStudentCurriculums,
      (snapshot) => {
        const items: StudentCurriculum[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StudentCurriculum));
        setStudentCurriculums(items);
      },
      (err) => handleSnapshotError("StudentCurriculums", err)
    );

    const unsubSessions = onSnapshot(
      qSessions,
      (snapshot) => {
        const items: LessonSession[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LessonSession));
        items.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
        setLessonSessions(items);
      },
      (err) => handleSnapshotError("Sessions", err)
    );

    const unsubDetective = onSnapshot(
      qDetective,
      (snapshot) => {
        const items: MemoryDetectiveResult[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MemoryDetectiveResult));
        setDetectiveResults(items);
      },
      (err) => handleSnapshotError("Detective", err)
    );

    const unsubSavedAI = onSnapshot(
      qSavedAI,
      (snapshot) => {
        const items: SavedAIContent[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedAIContent));
        setSavedContents(items);
        setLoadingData(false);
      },
      (err) => handleSnapshotError("SavedAI", err)
    );

    const unsubSchedules = onSnapshot(
      qSchedules,
      (snapshot) => {
        const items: ScheduleEntry[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ScheduleEntry));
        items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        setSchedules(items);
      },
      (err) => handleSnapshotError("Schedules", err)
    );

    const unsubNotifications = onSnapshot(
      qNotifications,
      (snapshot) => {
        const items: AppNotification[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AppNotification));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(items);
      },
      (err) => handleSnapshotError("Notifications", err)
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubStudents();
      unsubCurriculums();
      unsubStudentCurriculums();
      unsubSessions();
      unsubDetective();
      unsubSavedAI();
      unsubSchedules();
      unsubNotifications();
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
        await setDoc(doc(db, "students", s.id), { ...s, teacherId: uid });
      }
      for (const c of DEMO_CURRICULUMS) {
        await setDoc(doc(db, "curriculums", c.id), { ...c, teacherId: uid });
      }
      for (const sc of DEMO_STUDENT_CURRICULUMS) {
        await setDoc(doc(db, "studentCurriculums", sc.id), { ...sc, teacherId: uid });
      }
      for (const sess of DEMO_LESSON_SESSIONS) {
        await setDoc(doc(db, "lessonSessions", sess.id), { ...sess, teacherId: uid });
      }
      for (const det of DEMO_MEMORY_DETECTIVE_RESULTS) {
        await setDoc(doc(db, "memoryDetectiveSessions", det.id), { ...det, teacherId: uid });
      }
      for (const sched of DEMO_SCHEDULES) {
        await setDoc(doc(db, "schedules", sched.id), { ...sched, teacherId: uid });
      }
      for (const notif of DEMO_NOTIFICATIONS) {
        await setDoc(doc(db, "notifications", notif.id), { ...notif, teacherId: uid });
      }
    } catch (e) {
      console.error("Error seeding demo data to Firestore:", e);
    }
  };

  const resetToDemoData = async () => {
    await seedDemoDataIfEmpty();
  };

  // Student Actions
  const addStudent = async (data: Omit<Student, "id" | "teacherId" | "createdAt" | "status">): Promise<Student> => {
    const newId = `student-${Date.now()}`;
    const newStudent: Student = {
      ...data,
      id: newId,
      teacherId,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    setStudents((prev) => [newStudent, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "students", newId), newStudent);
    }
    return newStudent;
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (!isGuestMode && firebaseUser) {
      await updateDoc(doc(db, "students", id), data);
    }
  };

  const archiveStudent = async (id: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Archived" } : s)));
    if (!isGuestMode && firebaseUser) {
      await updateDoc(doc(db, "students", id), { status: "Archived" });
    }
  };

  const getStudentById = (id: string) => students.find((s) => s.id === id);

  // Curriculum Actions
  const createCurriculum = async (data: Omit<Curriculum, "id" | "teacherId" | "createdAt">): Promise<Curriculum> => {
    const newId = `curr-${Date.now()}`;
    const newCurriculum: Curriculum = {
      ...data,
      id: newId,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setCurriculums((prev) => [newCurriculum, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "curriculums", newId), newCurriculum);
    }
    return newCurriculum;
  };

  const updateCurriculum = async (id: string, data: Partial<Curriculum>) => {
    setCurriculums((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    if (!isGuestMode && firebaseUser) {
      await updateDoc(doc(db, "curriculums", id), data);
    }
  };

  const deleteCurriculum = async (id: string) => {
    setCurriculums((prev) => prev.filter((c) => c.id !== id));
    if (!isGuestMode && firebaseUser) {
      await deleteDoc(doc(db, "curriculums", id));
    }
  };

  const assignCurriculumToStudent = async (studentId: string, curriculumId: string): Promise<StudentCurriculum> => {
    const curriculum = curriculums.find((c) => c.id === curriculumId);
    const firstLessonId = curriculum?.lessons[0]?.id || "";
    const newId = `sc-${Date.now()}`;

    const newAssignment: StudentCurriculum = {
      id: newId,
      teacherId,
      studentId,
      curriculumId,
      progressPercentage: 0,
      currentLessonId: firstLessonId,
      completedLessonIds: [],
      startedAt: new Date().toISOString(),
    };

    setStudentCurriculums((prev) => [...prev, newAssignment]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "studentCurriculums", newId), newAssignment);
    }
    return newAssignment;
  };

  const getStudentCurriculum = (studentId: string) => {
    const studentCurriculum = studentCurriculums.find((sc) => sc.studentId === studentId);
    const curriculum = curriculums.find((c) => c.id === studentCurriculum?.curriculumId);
    return { curriculum, studentCurriculum };
  };

  // Schedule Actions
  const addSchedule = async (data: Omit<ScheduleEntry, "id" | "teacherId" | "createdAt">): Promise<ScheduleEntry> => {
    const newId = `sched-${Date.now()}`;
    const newSchedule: ScheduleEntry = {
      ...data,
      id: newId,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setSchedules((prev) => [newSchedule, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "schedules", newId), newSchedule);
    }

    const student = students.find((s) => s.id === data.studentId);
    if (student) {
      await addNotification({
        title: "Lesson Scheduled",
        message: `${student.name}'s ${data.subject} lesson is scheduled for ${new Date(data.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        type: "reminder",
        studentId: student.id,
        scheduleId: newId,
        scheduledTime: data.startAt,
      });
    }

    return newSchedule;
  };

  const updateSchedule = async (id: string, data: Partial<ScheduleEntry>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    if (!isGuestMode && firebaseUser) {
      await updateDoc(doc(db, "schedules", id), data);
    }
  };

  const deleteSchedule = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (!isGuestMode && firebaseUser) {
      await deleteDoc(doc(db, "schedules", id));
    }
  };

  // Notification Actions
  const addNotification = async (data: Omit<AppNotification, "id" | "teacherId" | "createdAt" | "read">): Promise<AppNotification> => {
    const newId = `notif-${Date.now()}`;
    const newNotif: AppNotification = {
      ...data,
      id: newId,
      teacherId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "notifications", newId), newNotif);
    }
    return newNotif;
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!isGuestMode && firebaseUser) {
      await updateDoc(doc(db, "notifications", id), { read: true });
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!isGuestMode && firebaseUser) {
      const unread = notifications.filter((n) => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    if (!isGuestMode && firebaseUser) {
      for (const n of notifications) {
        await deleteDoc(doc(db, "notifications", n.id));
      }
    }
  };

  // Lesson Session Actions
  const recordLessonSession = async (sessionData: Omit<LessonSession, "id" | "createdAt">): Promise<LessonSession> => {
    const newId = `sess-${Date.now()}`;
    const newSession: LessonSession = {
      ...sessionData,
      id: newId,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setLessonSessions((prev) => [newSession, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "lessonSessions", newId), newSession);
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
          await updateDoc(doc(db, "studentCurriculums", sc.id), {
            completedLessonIds: completedIds,
            progressPercentage: progressPct,
            currentLessonId: nextLessonId,
          });
        }
      }
    }

    return newSession;
  };

  const getStudentSessions = (studentId: string) => {
    return lessonSessions.filter((s) => s.studentId === studentId);
  };

  const recordDetectiveResult = async (resultData: Omit<MemoryDetectiveResult, "id">): Promise<MemoryDetectiveResult> => {
    const newId = `det-${Date.now()}`;
    const newResult: MemoryDetectiveResult = {
      ...resultData,
      id: newId,
      teacherId,
    };

    setDetectiveResults((prev) => [newResult, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "memoryDetectiveSessions", newId), newResult);
    }
    return newResult;
  };

  const getStudentDetectiveResults = (studentId: string) => {
    return detectiveResults.filter((r) => r.studentId === studentId);
  };

  // Saved AI Content Actions
  const saveAIContent = async (data: Omit<SavedAIContent, "id" | "teacherId" | "createdAt">): Promise<SavedAIContent> => {
    const newId = `saved-${Date.now()}`;
    const newItem: SavedAIContent = {
      ...data,
      id: newId,
      teacherId,
      createdAt: new Date().toISOString(),
    };

    setSavedContents((prev) => [newItem, ...prev]);

    if (!isGuestMode && firebaseUser) {
      await setDoc(doc(db, "savedAIContent", newId), newItem);
    }
    return newItem;
  };

  const deleteSavedAIContent = async (id: string) => {
    setSavedContents((prev) => prev.filter((item) => item.id !== id));
    if (!isGuestMode && firebaseUser) {
      await deleteDoc(doc(db, "savedAIContent", id));
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
          updateDoc(doc(db, "studentCurriculums", sc.id), {
            completedLessonIds: completedIds,
            progressPercentage: progressPct,
          }).catch(console.error);
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
