import { SubjectType } from "../types";

export const SUBJECTS: readonly SubjectType[] = ["Quran", "Tajweed", "Islamic Studies", "Arabic"];

export const SUBJECT_LABELS: Record<SubjectType, { en: string; ar: string }> = {
  Quran: { en: "Quran", ar: "القرآن" },
  Tajweed: { en: "Tajweed", ar: "التجويد" },
  "Islamic Studies": { en: "Islamic Studies", ar: "الدراسات الإسلامية" },
  Arabic: { en: "Arabic", ar: "العربية" },
};

export const getSubjectLabel = (subject: SubjectType, language: "en" | "ar") => SUBJECT_LABELS[subject][language];
