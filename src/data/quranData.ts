export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  totalAyat: number;
  revelationType: "Meccan" | "Medinan";
}

export const QURAN_SURAHS: SurahMeta[] = [
  { number: 1, nameArabic: "الفاتحة", nameTransliterated: "Al-Fatihah", nameEnglish: "The Opening", totalAyat: 7, revelationType: "Meccan" },
  { number: 2, nameArabic: "البقرة", nameTransliterated: "Al-Baqarah", nameEnglish: "The Cow", totalAyat: 286, revelationType: "Medinan" },
  { number: 3, nameArabic: "آل عمران", nameTransliterated: "Ali 'Imran", nameEnglish: "Family of Imran", totalAyat: 200, revelationType: "Medinan" },
  { number: 36, nameArabic: "يس", nameTransliterated: "Ya-Sin", nameEnglish: "Ya-Sin", totalAyat: 83, revelationType: "Meccan" },
  { number: 55, nameArabic: "الرحمن", nameTransliterated: "Ar-Rahman", nameEnglish: "The Beneficent", totalAyat: 78, revelationType: "Medinan" },
  { number: 56, nameArabic: "الواقعة", nameTransliterated: "Al-Waqi'ah", nameEnglish: "The Inevitable", totalAyat: 96, revelationType: "Meccan" },
  { number: 67, nameArabic: "الملك", nameTransliterated: "Al-Mulk", nameEnglish: "The Sovereignty", totalAyat: 30, revelationType: "Meccan" },
  { number: 78, nameArabic: "النبأ", nameTransliterated: "An-Naba", nameEnglish: "The Tidings", totalAyat: 40, revelationType: "Meccan" },
  { number: 87, nameArabic: "الأعلى", nameTransliterated: "Al-A'la", nameEnglish: "The Most High", totalAyat: 19, revelationType: "Meccan" },
  { number: 88, nameArabic: "الغاشية", nameTransliterated: "Al-Ghashiyah", nameEnglish: "The Overwhelming", totalAyat: 26, revelationType: "Meccan" },
  { number: 89, nameArabic: "الفجر", nameTransliterated: "Al-Fajr", nameEnglish: "The Dawn", totalAyat: 30, revelationType: "Meccan" },
  { number: 93, nameArabic: "الضحى", nameTransliterated: "Ad-Duha", nameEnglish: "The Morning Hours", totalAyat: 11, revelationType: "Meccan" },
  { number: 94, nameArabic: "الشرح", nameTransliterated: "Ash-Sharh", nameEnglish: "The Relief", totalAyat: 8, revelationType: "Meccan" },
  { number: 95, nameArabic: "التين", nameTransliterated: "At-Tin", nameEnglish: "The Fig", totalAyat: 8, revelationType: "Meccan" },
  { number: 96, nameArabic: "العلق", nameTransliterated: "Al-'Alaq", nameEnglish: "The Clot", totalAyat: 19, revelationType: "Meccan" },
  { number: 97, nameArabic: "القدر", nameTransliterated: "Al-Qadr", nameEnglish: "The Power", totalAyat: 5, revelationType: "Meccan" },
  { number: 108, nameArabic: "الكوثر", nameTransliterated: "Al-Kawthar", nameEnglish: "Abundance", totalAyat: 3, revelationType: "Meccan" },
  { number: 109, nameArabic: "الكافرون", nameTransliterated: "Al-Kafirun", nameEnglish: "The Disbelievers", totalAyat: 6, revelationType: "Meccan" },
  { number: 110, nameArabic: "النصر", nameTransliterated: "An-Nasr", nameEnglish: "The Divine Support", totalAyat: 3, revelationType: "Medinan" },
  { number: 111, nameArabic: "المسد", nameTransliterated: "Al-Masad", nameEnglish: "The Palm Fiber", totalAyat: 5, revelationType: "Meccan" },
  { number: 112, nameArabic: "الإخلاص", nameTransliterated: "Al-Ikhlas", nameEnglish: "The Sincerity", totalAyat: 4, revelationType: "Meccan" },
  { number: 113, nameArabic: "الفلق", nameTransliterated: "Al-Falaq", nameEnglish: "The Daybreak", totalAyat: 5, revelationType: "Meccan" },
  { number: 114, nameArabic: "الناس", nameTransliterated: "An-Nas", nameEnglish: "Mankind", totalAyat: 6, revelationType: "Meccan" },
];

export interface VerifiedAyah {
  surahNumber: number;
  surahNameArabic: string;
  surahNameTransliterated: string;
  ayahNumber: number;
  textArabic: string;
  textEnglish: string;
}

export const VERIFIED_AYAT_DATABASE: VerifiedAyah[] = [
  // Surah Al-Fatihah (1)
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 1, textArabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", textEnglish: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 2, textArabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", textEnglish: "[All] praise is due to Allah, Lord of the worlds." },
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 3, textArabic: "الرَّحْمَٰنِ الرَّحِيمِ", textEnglish: "The Entirely Merciful, the Especially Merciful." },
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 4, textArabic: "مَالِكِ يَوْمِ الدِّينِ", textEnglish: "Sovereign of the Day of Recompense." },
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 5, textArabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", textEnglish: "It is You we worship and You we ask for help." },
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 6, textArabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", textEnglish: "Guide us to the straight path." },
  { surahNumber: 1, surahNameArabic: "الفاتحة", surahNameTransliterated: "Al-Fatihah", ayahNumber: 7, textArabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", textEnglish: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray." },

  // Surah Al-Mulk (67)
  { surahNumber: 67, surahNameArabic: "الملك", surahNameTransliterated: "Al-Mulk", ayahNumber: 1, textArabic: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", textEnglish: "Blessed is He in whose hand is dominion, and He is over all things competent." },
  { surahNumber: 67, surahNameArabic: "الملك", surahNameTransliterated: "Al-Mulk", ayahNumber: 2, textArabic: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا", textEnglish: "[He] who created death and life to test you as to which of you is best in deed." },
  { surahNumber: 67, surahNameArabic: "الملك", surahNameTransliterated: "Al-Mulk", ayahNumber: 3, textArabic: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا", textEnglish: "[And] who created seven heavens in layers." },

  // Surah Al-Ikhlas (112)
  { surahNumber: 112, surahNameArabic: "الإخلاص", surahNameTransliterated: "Al-Ikhlas", ayahNumber: 1, textArabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", textEnglish: "Say, He is Allah, [who is] One." },
  { surahNumber: 112, surahNameArabic: "الإخلاص", surahNameTransliterated: "Al-Ikhlas", ayahNumber: 2, textArabic: "اللَّهُ الصَّمَدُ", textEnglish: "Allah, the Eternal Refuge." },
  { surahNumber: 112, surahNameArabic: "الإخلاص", surahNameTransliterated: "Al-Ikhlas", ayahNumber: 3, textArabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ", textEnglish: "He neither begets nor is born." },
  { surahNumber: 112, surahNameArabic: "الإخلاص", surahNameTransliterated: "Al-Ikhlas", ayahNumber: 4, textArabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", textEnglish: "Nor is there to Him any equivalent." },

  // Surah Al-Falaq (113)
  { surahNumber: 113, surahNameArabic: "الفلق", surahNameTransliterated: "Al-Falaq", ayahNumber: 1, textArabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", textEnglish: "Say, I seek refuge in the Lord of daybreak." },
  { surahNumber: 113, surahNameArabic: "الفلق", surahNameTransliterated: "Al-Falaq", ayahNumber: 2, textArabic: "مِن شَرِّ مَا خَلَقَ", textEnglish: "From the evil of that which He created." },
  { surahNumber: 113, surahNameArabic: "الفلق", surahNameTransliterated: "Al-Falaq", ayahNumber: 3, textArabic: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", textEnglish: "And from the evil of darkness when it settles." },
  { surahNumber: 113, surahNameArabic: "الفلق", surahNameTransliterated: "Al-Falaq", ayahNumber: 4, textArabic: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", textEnglish: "And from the evil of the blowers in knots." },
  { surahNumber: 113, surahNameArabic: "الفلق", surahNameTransliterated: "Al-Falaq", ayahNumber: 5, textArabic: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", textEnglish: "And from the evil of an envier when he envies." },

  // Surah An-Nas (114)
  { surahNumber: 114, surahNameArabic: "الناس", surahNameTransliterated: "An-Nas", ayahNumber: 1, textArabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", textEnglish: "Say, I seek refuge in the Lord of mankind." },
  { surahNumber: 114, surahNameArabic: "الناس", surahNameTransliterated: "An-Nas", ayahNumber: 2, textArabic: "مَلِكِ النَّاسِ", textEnglish: "The Sovereign of mankind." },
  { surahNumber: 114, surahNameArabic: "الناس", surahNameTransliterated: "An-Nas", ayahNumber: 3, textArabic: "إِلَٰهِ النَّاسِ", textEnglish: "The God of mankind." },
  { surahNumber: 114, surahNameArabic: "الناس", surahNameTransliterated: "An-Nas", ayahNumber: 4, textArabic: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", textEnglish: "From the evil of the retreating whisperer." },
  { surahNumber: 114, surahNameArabic: "الناس", surahNameTransliterated: "An-Nas", ayahNumber: 5, textArabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", textEnglish: "Who whispers into the breasts of mankind." },
  { surahNumber: 114, surahNameArabic: "الناس", surahNameTransliterated: "An-Nas", ayahNumber: 6, textArabic: "مِنَ الْجِنَّةِ وَالنَّاسِ", textEnglish: "From among the jinn and mankind." }
];
