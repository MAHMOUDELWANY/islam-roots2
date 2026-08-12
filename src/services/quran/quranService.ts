import { Surah, Verse } from "./quranTypes";
import { QURAN_SURAHS } from "../../data/quranData";

const API_BASE = "/api/quran";

export async function getSurahs(): Promise<Surah[]> {
  try {
    const res = await fetch(`${API_BASE}/surahs`);
    if (!res.ok) throw new Error("Failed to fetch surahs");
    const data = await res.json();
    if (data.chapters && data.chapters.length > 0) {
      return data.chapters.map((c: any) => ({
        id: c.id,
        revelationPlace: c.revelation_place,
        revelationOrder: c.revelation_order,
        bismillahPre: c.bismillah_pre,
        nameSimple: c.name_simple,
        nameComplex: c.name_complex,
        nameArabic: c.name_arabic,
        versesCount: c.verses_count,
        translatedName: {
          languageName: c.translated_name?.language_name || "english",
          name: c.translated_name?.name || c.name_simple,
        },
      }));
    }
  } catch (err) {
    console.warn("Quran API network fallback to local surah metadata:", err);
  }

  // Fallback metadata if offline
  return QURAN_SURAHS.map((s) => ({
    id: s.number,
    revelationPlace: s.revelationType,
    revelationOrder: s.number,
    bismillahPre: s.number !== 9 && s.number !== 1,
    nameSimple: s.nameTransliterated,
    nameComplex: s.nameTransliterated,
    nameArabic: s.nameArabic,
    versesCount: s.totalAyat,
    translatedName: {
      languageName: "english",
      name: s.nameEnglish,
    },
  }));
}

export async function getSurah(id: number): Promise<Surah | null> {
  const surahs = await getSurahs();
  return surahs.find((s) => s.id === id) || null;
}

export async function getVerses(surahId: number, perPage: number = 50): Promise<Verse[]> {
  try {
    const res = await fetch(`${API_BASE}/verses/${surahId}?perPage=${perPage}`);
    if (!res.ok) throw new Error("Failed to fetch verses");
    const data = await res.json();
    if (data.verses && data.verses.length > 0) {
      return data.verses.map((v: any) => ({
        id: v.id,
        verseNumber: v.verse_number,
        verseKey: v.verse_key,
        textUthmani: v.text_uthmani || v.text_imlaei || v.text_simple || "",
        translations: v.translations?.map((t: any) => ({
          id: t.id,
          resourceId: t.resource_id,
          text: t.text?.replace(/<[^>]*>/g, "") || "", // clean HTML tags
        })),
      }));
    }
  } catch (err) {
    console.warn("Error fetching verses from API:", err);
  }

  return [];
}

export interface ScopeOptions {
  scopeType?: "entire" | "page" | "ayah_range";
  startAyah?: number;
  endAyah?: number;
}

/**
 * Generates Memory Detective Questions Deterministically from Verified Quran Verses
 */
export async function generateMemoryDetectiveQuestions(
  surahId: number,
  count: number = 5,
  types: string[] = ["continue_ayah", "whats_next", "fill_gap", "identify"],
  scope?: ScopeOptions
): Promise<any[]> {
  const surah = await getSurah(surahId);
  const surahs = await getSurahs();
  const fetchedVerses = await getVerses(surahId, 300);

  if (!surah || fetchedVerses.length === 0) {
    return [];
  }

  // Apply scope filtering if specified
  let verses = fetchedVerses;
  if (scope && scope.scopeType === "ayah_range") {
    const start = scope.startAyah || 1;
    const end = scope.endAyah || surah.versesCount;
    verses = fetchedVerses.filter(
      (v) => v.verseNumber >= start && v.verseNumber <= end
    );
    if (verses.length === 0) verses = fetchedVerses;
  }

  const questions: any[] = [];
  // Shuffle available verses for random selection without wrapping
  const shuffledIndices = Array.from({ length: verses.length }, (_, i) => i)
    .sort(() => Math.random() - 0.5);

  let qIndex = 0;
  for (const vIndex of shuffledIndices) {
    if (questions.length >= count) break;
    const v = verses[vIndex];
    const qType = types[qIndex % types.length];

    if (qType === "continue_ayah" || qType === "whats_next") {
      // Must NOT wrap around if vIndex is the last verse in the surah
      if (vIndex >= verses.length - 1) continue;

      const nextV = verses[vIndex + 1];
      const otherVersesText = verses
        .filter((_, idx) => idx !== vIndex + 1 && idx !== vIndex)
        .map((x) => x.textUthmani);

      // Pick up to 3 distractors
      const distractors = otherVersesText.sort(() => Math.random() - 0.5).slice(0, 3);
      while (distractors.length < 3) {
        distractors.push("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
      }

      const options = [nextV.textUthmani, ...distractors].sort(() => Math.random() - 0.5);

      questions.push({
        id: `q-${questions.length + 1}`,
        type: "continue_ayah",
        surahName: surah.nameSimple,
        surahNumber: surah.id,
        ayahNumber: v.verseNumber,
        promptText: `Which Ayah comes directly AFTER Ayah ${v.verseNumber} (${v.verseKey})?`,
        promptTextArabic: `ما هي الآية التي تلي الآية ${v.verseNumber} في سورة ${surah.nameArabic}؟\n"${v.textUthmani}"`,
        options,
        correctAnswer: nextV.textUthmani,
        explanation: `Verified Quran Text: Ayah ${nextV.verseNumber} of Surah ${surah.nameSimple}.`,
      });
      qIndex++;
    } else if (qType === "fill_gap") {
      const words = v.textUthmani.trim().split(/\s+/);
      if (words.length > 2) {
        const targetIndex = Math.floor(words.length / 2);
        const correctWord = words[targetIndex];
        const gapText = words.map((w, idx) => (idx === targetIndex ? "____" : w)).join(" ");

        const distractors = ["الرَّحْمَٰنِ", "الْعَالَمِينَ", "الْمُسْتَقِيمَ", "الْكَرِيمِ", "الْحَكِيمِ"]
          .filter((w) => w !== correctWord)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const options = [correctWord, ...distractors].sort(() => Math.random() - 0.5);

        questions.push({
          id: `q-${questions.length + 1}`,
          type: "fill_gap",
          surahName: surah.nameSimple,
          surahNumber: surah.id,
          ayahNumber: v.verseNumber,
          promptText: `Fill in the missing word for Ayah ${v.verseNumber} in Surah ${surah.nameSimple}`,
          promptTextArabic: gapText,
          options,
          correctAnswer: correctWord,
          explanation: `The missing word in ${v.verseKey} is "${correctWord}".`,
        });
        qIndex++;
      }
    } else {
      const otherSurahs = surahs
        .filter((s) => s.id !== surah.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [
        `${surah.nameSimple} (${surah.nameArabic})`,
        ...otherSurahs.map((s) => `${s.nameSimple} (${s.nameArabic})`),
      ].sort(() => Math.random() - 0.5);

      questions.push({
        id: `q-${questions.length + 1}`,
        type: "identify",
        surahName: surah.nameSimple,
        surahNumber: surah.id,
        ayahNumber: v.verseNumber,
        promptText: `Identify the Surah containing this Ayah:`,
        promptTextArabic: v.textUthmani,
        options,
        correctAnswer: `${surah.nameSimple} (${surah.nameArabic})`,
        explanation: `Ayah ${v.verseKey} is located in Surah ${surah.nameSimple}.`,
      });
      qIndex++;
    }
  }

  return questions;
}
