import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";

const SUBJECTS = ["Quran", "Tajweed", "Islamic Studies", "Arabic"] as const;
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const TEACHING_STYLES = ["Simple", "Interactive", "Conversational", "Academic", "Story-based", "Practical"] as const;
const LANGUAGES = ["en", "ar"] as const;
const MAX_TEXT_LENGTH = 2_000;
const MAX_INSTRUCTION_LENGTH = 4_000;
const MAX_MODEL_STRING_LENGTH = 8_000;
const MAX_MODEL_ARRAY_LENGTH = 50;
const MAX_MODEL_OBJECT_KEYS = 50;
const MAX_MODEL_DEPTH = 8;
const AI_REQUEST_LIMIT = 10;
const AI_REQUEST_WINDOW_MS = 15 * 60 * 1_000;

type RecordValue = Record<string, unknown>;
type AllowedSubject = (typeof SUBJECTS)[number];
type AllowedLevel = (typeof LEVELS)[number];
type AllowedLanguage = (typeof LANGUAGES)[number];
type AllowedTeachingStyle = (typeof TEACHING_STYLES)[number];

export interface LessonPlanInput {
  subject: AllowedSubject;
  topic: string;
  studentName: string;
  studentAge: number;
  studentLevel: AllowedLevel;
  duration: number;
  teachingStyle: AllowedTeachingStyle;
  language: AllowedLanguage;
  learningGoal: string;
  customInstructions: string;
}

export interface SlidesPlanInput extends LessonPlanInput {
  lessonPlan: RecordValue;
}

export interface QuizInput {
  subject: AllowedSubject;
  topic: string;
  level: AllowedLevel;
  count: number;
  difficulty: AllowedLevel;
  language: AllowedLanguage;
}

export interface HomeworkInput {
  subject: AllowedSubject;
  topic: string;
  level: AllowedLevel;
  age: number;
  language: AllowedLanguage;
}

export interface StudentInsightsInput {
  studentName: string;
  subject: AllowedSubject;
  level: AllowedLevel;
  attendanceRate: number;
  recentSessions: unknown[];
  quizScores: unknown[];
  language: AllowedLanguage;
}

interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

interface ValidationFailure {
  ok: false;
  error: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function valueOf<T>(result: ValidationResult<T>): T {
  if ("error" in result) {
    throw new Error(result.error);
  }
  return result.value;
}

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasValue = <T extends readonly string[]>(values: T, value: string): value is T[number] =>
  values.includes(value as T[number]);

function requiredString(
  value: unknown,
  fieldName: string,
  maxLength: number = MAX_TEXT_LENGTH,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} is required.` };
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    return { ok: false, error: `${fieldName} is invalid.` };
  }

  return { ok: true, value: normalized };
}

function optionalString(
  value: unknown,
  fallback: string,
  fieldName: string,
  maxLength: number = MAX_TEXT_LENGTH,
): ValidationResult<string> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: fallback };
  }

  return requiredString(value, fieldName, maxLength);
}

function boundedInteger(
  value: unknown,
  fallback: number,
  fieldName: string,
  min: number,
  max: number,
): ValidationResult<number> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: fallback };
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return { ok: false, error: `${fieldName} is invalid.` };
  }

  return { ok: true, value: parsed };
}

function allowedValue<T extends readonly string[]>(
  value: unknown,
  fallback: T[number],
  fieldName: string,
  values: T,
): ValidationResult<T[number]> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: fallback };
  }

  if (typeof value !== "string" || !hasValue(values, value)) {
    return { ok: false, error: `${fieldName} is invalid.` };
  }

  return { ok: true, value };
}

function buildLessonPlanInput(body: unknown): ValidationResult<LessonPlanInput> {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const subject = allowedValue(body.subject, "Tajweed", "subject", SUBJECTS);
  const topic = requiredString(body.topic, "topic");
  const studentName = optionalString(body.studentName, "Student", "studentName");
  const studentAge = boundedInteger(body.studentAge, 10, "studentAge", 4, 100);
  const studentLevel = allowedValue(body.studentLevel ?? body.level, "Beginner", "studentLevel", LEVELS);
  const duration = boundedInteger(body.duration, 45, "duration", 5, 240);
  const teachingStyle = allowedValue(body.teachingStyle, "Interactive", "teachingStyle", TEACHING_STYLES);
  const language = allowedValue(body.language, "en", "language", LANGUAGES);
  const learningGoal = optionalString(body.learningGoal, "", "learningGoal", MAX_INSTRUCTION_LENGTH);
  const customInstructions = optionalString(body.customInstructions, "", "customInstructions", MAX_INSTRUCTION_LENGTH);

  const values = [subject, topic, studentName, studentAge, studentLevel, duration, teachingStyle, language, learningGoal, customInstructions];
  const failure = values.find((result): result is ValidationFailure => "error" in result);
  if (failure) {
    return failure;
  }

  return {
    ok: true,
    value: {
      subject: valueOf(subject),
      topic: valueOf(topic),
      studentName: valueOf(studentName),
      studentAge: valueOf(studentAge),
      studentLevel: valueOf(studentLevel),
      duration: valueOf(duration),
      teachingStyle: valueOf(teachingStyle),
      language: valueOf(language),
      learningGoal: valueOf(learningGoal),
      customInstructions: valueOf(customInstructions),
    },
  };
}

export function validateLessonPlanInput(body: unknown): ValidationResult<LessonPlanInput> {
  return buildLessonPlanInput(body);
}

export function validateSlidesPlanInput(body: unknown): ValidationResult<SlidesPlanInput> {
  const lessonInput = buildLessonPlanInput(body);
  if ("error" in lessonInput) {
    return { ok: false, error: lessonInput.error };
  }

  const lessonPlan = isRecord(body) ? body.lessonPlan : undefined;
  if (!isRecord(lessonPlan) || !isBoundedModelValue(lessonPlan)) {
    return { ok: false, error: "lessonPlan is invalid." };
  }

  return { ok: true, value: { ...lessonInput.value, lessonPlan } };
}

export function validateQuizInput(body: unknown): ValidationResult<QuizInput> {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const subject = allowedValue(body.subject, "Tajweed", "subject", SUBJECTS);
  const topic = requiredString(body.topic, "topic");
  const level = allowedValue(body.level, "Beginner", "level", LEVELS);
  const count = boundedInteger(body.count, 10, "count", 1, 15);
  const difficulty = allowedValue(body.difficulty, level.ok ? level.value : "Beginner", "difficulty", LEVELS);
  const language = allowedValue(body.language, "en", "language", LANGUAGES);

  const values = [subject, topic, level, count, difficulty, language];
  const failure = values.find((result): result is ValidationFailure => "error" in result);
  if (failure) {
    return failure;
  }

  return {
    ok: true,
    value: {
      subject: valueOf(subject),
      topic: valueOf(topic),
      level: valueOf(level),
      count: valueOf(count),
      difficulty: valueOf(difficulty),
      language: valueOf(language),
    },
  };
}

export function validateHomeworkInput(body: unknown): ValidationResult<HomeworkInput> {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const subject = allowedValue(body.subject, "Tajweed", "subject", SUBJECTS);
  const topic = requiredString(body.topic, "topic");
  const level = allowedValue(body.level, "Beginner", "level", LEVELS);
  const age = boundedInteger(body.age, 10, "age", 4, 100);
  const language = allowedValue(body.language, "en", "language", LANGUAGES);

  const values = [subject, topic, level, age, language];
  const failure = values.find((result): result is ValidationFailure => "error" in result);
  if (failure) {
    return failure;
  }

  return { ok: true, value: { subject: valueOf(subject), topic: valueOf(topic), level: valueOf(level), age: valueOf(age), language: valueOf(language) } };
}

export function validateStudentInsightsInput(body: unknown): ValidationResult<StudentInsightsInput> {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const studentName = requiredString(body.studentName, "studentName");
  const subject = allowedValue(body.subject, "Tajweed", "subject", SUBJECTS);
  const level = allowedValue(body.level, "Beginner", "level", LEVELS);
  const attendanceRate = boundedInteger(body.attendanceRate, 0, "attendanceRate", 0, 100);
  const language = allowedValue(body.language, "en", "language", LANGUAGES);
  const recentSessions = Array.isArray(body.recentSessions) && body.recentSessions.length <= MAX_MODEL_ARRAY_LENGTH ? body.recentSessions : [];
  const quizScores = Array.isArray(body.quizScores) && body.quizScores.length <= MAX_MODEL_ARRAY_LENGTH ? body.quizScores : [];

  const values = [studentName, subject, level, attendanceRate, language];
  const failure = values.find((result): result is ValidationFailure => "error" in result);
  if (failure) {
    return failure;
  }

  if (!isBoundedModelValue(recentSessions) || !isBoundedModelValue(quizScores)) {
    return { ok: false, error: "Student activity data is invalid." };
  }

  return {
    ok: true,
    value: {
      studentName: valueOf(studentName),
      subject: valueOf(subject),
      level: valueOf(level),
      attendanceRate: valueOf(attendanceRate),
      recentSessions,
      quizScores,
      language: valueOf(language),
    },
  };
}

export function isBoundedModelValue(value: unknown, depth = 0): boolean {
  if (depth > MAX_MODEL_DEPTH) {
    return false;
  }

  if (typeof value === "string") {
    return value.length <= MAX_MODEL_STRING_LENGTH;
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length <= MAX_MODEL_ARRAY_LENGTH && value.every((item) => isBoundedModelValue(item, depth + 1));
  }

  if (isRecord(value)) {
    return Object.keys(value).length <= MAX_MODEL_OBJECT_KEYS && Object.values(value).every((item) => isBoundedModelValue(item, depth + 1));
  }

  return false;
}

export function hasRequiredModelFields(value: unknown, fields: string[]): value is RecordValue {
  return isRecord(value) && isBoundedModelValue(value) && fields.every((field) => field in value);
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

export function aiRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.uid || req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const now = Date.now();
  pruneExpiredBuckets(now);
  const existing = rateLimitBuckets.get(userId);

  if (existing && existing.count >= AI_REQUEST_LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1_000));
    res.setHeader("Retry-After", retryAfterSeconds);
    return res.status(429).json({ error: "Generation limit reached. Please try again later." });
  }

  if (existing) {
    existing.count += 1;
  } else {
    rateLimitBuckets.set(userId, { count: 1, resetAt: now + AI_REQUEST_WINDOW_MS });
  }

  next();
}

export function sendInvalidRequest(res: Response, details: string) {
  return res.status(400).json({ error: "Invalid request.", details });
}

export function sendServerError(res: Response) {
  return res.status(500).json({ error: "The request could not be completed. Please try again." });
}
