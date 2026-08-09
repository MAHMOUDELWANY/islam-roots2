export interface Surah {
  id: number;
  revelationPlace: string;
  revelationOrder: number;
  bismillahPre: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  translatedName: {
    languageName: string;
    name: string;
  };
}

export interface Verse {
  id: number;
  verseNumber: number;
  verseKey: string;
  textUthmani: string;
  textSimple?: string;
  translations?: {
    id: number;
    resourceId: number;
    text: string;
  }[];
}

export interface QuranTranslation {
  id: number;
  name: string;
  authorName: string;
  languageName: string;
}
