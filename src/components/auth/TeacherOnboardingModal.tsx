import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  UserCheck,
  Sparkles,
  Globe,
  Languages,
  Clock,
  User,
  Award,
  BookOpen,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
} from "lucide-react";

interface TeacherOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCompleteOnboarding?: () => void;
}

const POPULAR_COUNTRIES = [
  "Egypt",
  "Saudi Arabia",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Jordan",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
  "Morocco",
  "Algeria",
  "Tunisia",
  "Turkey",
  "Pakistan",
  "Indonesia",
  "Malaysia",
  "Nigeria",
  "Germany",
  "France",
  "Other",
];

const SPECIALIZATION_OPTIONS = [
  { id: "Quran", labelKey: "quranSpec" },
  { id: "Tajweed", labelKey: "tajweedSpec" },
  { id: "Islamic Studies", labelKey: "islamicStudiesSpec" },
  { id: "Arabic", labelKey: "arabicSpec" },
];

export const TeacherOnboardingModal: React.FC<TeacherOnboardingModalProps> = ({
  isOpen,
  onCompleteOnboarding,
}) => {
  const { teacher, firebaseUser, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  // Form Field States
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [country, setCountry] = useState("");
  const [teachingLanguage, setTeachingLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC");
  const [gender, setGender] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [specializations, setSpecializations] = useState<string[]>(["Quran", "Tajweed"]);
  const [bio, setBio] = useState("");

  // Country dropdown filter
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);

  // Status States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Pre-fill fields intelligently on modal open or teacher load
  useEffect(() => {
    if (teacher) {
      const initialFullName =
        teacher.fullName ||
        teacher.name ||
        firebaseUser?.user_metadata?.full_name ||
        firebaseUser?.user_metadata?.name ||
        "";

      const initialDisplayName =
        teacher.displayName ||
        teacher.name ||
        firebaseUser?.user_metadata?.full_name ||
        firebaseUser?.user_metadata?.name ||
        firebaseUser?.user_metadata?.username ||
        teacher.username ||
        "";

      setFullName(initialFullName);
      setDisplayName(initialDisplayName);
      setArabicName(teacher.arabicName || "");
      setCountry(teacher.country || teacher.location || "");
      setTeachingLanguage(teacher.teachingLanguage || teacher.preferredLanguage || "English");
      
      const defaultTz =
        teacher.timezone ||
        (typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "UTC");
      setTimezone(defaultTz);

      setGender(teacher.gender || "");
      setYearsExperience(
        teacher.yearsExperience ? String(teacher.yearsExperience) : teacher.yearsOfExperience ? String(teacher.yearsOfExperience) : ""
      );
      setSpecializations(
        Array.isArray(teacher.specializations) && teacher.specializations.length > 0
          ? teacher.specializations
          : ["Quran", "Tajweed"]
      );
      setBio(teacher.bio || teacher.purpose || "");
    }
  }, [teacher, firebaseUser]);

  if (!isOpen || !teacher) return null;

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Required Fields
    const trimmedFullName = fullName.trim();
    const trimmedDisplayName = displayName.trim();
    const trimmedCountry = country.trim();
    const trimmedTeachingLang = teachingLanguage.trim();
    const trimmedTimezone = timezone.trim();

    if (!trimmedFullName) {
      setErrorMsg(isRTL ? "يرجى إدخال الاسم الكامل" : "Please enter your Full Name.");
      return;
    }

    if (!trimmedDisplayName) {
      setErrorMsg(isRTL ? "يرجى إدخال اسم العرض" : "Please enter your Display Name.");
      return;
    }

    if (!trimmedCountry) {
      setErrorMsg(isRTL ? "يرجى اختيار أو إدخال الدولة" : "Please select or enter your Country.");
      return;
    }

    if (!trimmedTeachingLang) {
      setErrorMsg(isRTL ? "يرجى اختيار لغة التدريس الأساسية" : "Please select your Primary Teaching Language.");
      return;
    }

    if (!trimmedTimezone) {
      setErrorMsg(isRTL ? "يرجى اختيار المنطقة الزمنية" : "Please select your Time Zone.");
      return;
    }

    if (bio.length > 500) {
      setErrorMsg(isRTL ? "النبذة القصيرة يجب ألا تتجاوز 500 حرف" : "Short Bio must be 500 characters or less.");
      return;
    }

    setSubmitting(true);

    try {
      await updateProfile({
        fullName: trimmedFullName,
        displayName: trimmedDisplayName,
        name: trimmedDisplayName,
        arabicName: arabicName.trim(),
        country: trimmedCountry,
        location: trimmedCountry,
        teachingLanguage: trimmedTeachingLang,
        preferredLanguage: trimmedTeachingLang === "Arabic" ? "ar" : "en",
        timezone: trimmedTimezone,
        gender: gender || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        specializations,
        bio: bio.trim(),
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
        onboardingCompleted: true,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        onCompleteOnboarding?.();
      }, 600);
    } catch (err: any) {
      console.error("Error saving teacher onboarding profile:", err);
      setErrorMsg(
        err?.message || (isRTL ? "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى." : "Failed to save profile. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCountries = POPULAR_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1C221C]/80 backdrop-blur-sm animate-fade-in font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-6 sm:p-8 bg-[#FCFAF5] dark:bg-[#1C251D] border-b border-[#E8E5DB] dark:border-[#2A352A] text-center space-y-2 relative shrink-0">
          <div className="inline-flex p-3 rounded-2xl bg-[#5A6B5A] text-white shadow-soft">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] tracking-tight">
            {t("teacherOnboardingTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-300 leading-relaxed max-w-lg mx-auto">
            {t("teacherOnboardingSubtitle")}
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t("profileCompletedSuccess")}</span>
            </div>
          )}

          {/* Section 1: Basic Professional Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B5A] dark:text-[#8BA888] pb-1 border-b border-[#E8E5DB] dark:border-[#2A352A]">
              1. {isRTL ? "الهوية المهنية" : "Professional Identity"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("fullName")}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ahmed Hassan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("displayName")}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ustadh Ahmed"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Arabic Name (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("arabicName")}</span>
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  placeholder="مثال: د. أحمد حسن"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                />
              </div>

              {/* Gender (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("gender")}</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                >
                  <option value="">-- {t("selectGender")} --</option>
                  <option value="Male">{t("male")}</option>
                  <option value="Female">{t("female")}</option>
                  <option value="Prefer not to say">{t("preferNotToSay")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Teaching Context & Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B5A] dark:text-[#8BA888] pb-1 border-b border-[#E8E5DB] dark:border-[#2A352A]">
              2. {isRTL ? "سياق التدريس والدولة" : "Teaching Context & Location"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Country */}
              <div className="space-y-1.5 relative col-span-1 sm:col-span-1">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("country")}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onFocus={() => setShowCountryList(true)}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCountrySearch(e.target.value);
                    setShowCountryList(true);
                  }}
                  placeholder="e.g. Egypt, USA, UK..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                />

                {showCountryList && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto bg-white dark:bg-[#1F261F] border border-[#E8E5DB] dark:border-[#2A352A] rounded-xl shadow-xl p-1 space-y-0.5">
                    {filteredCountries.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCountry(c);
                          setShowCountryList(false);
                        }}
                        className="w-full text-left ltr:text-left rtl:text-right px-3 py-1.5 hover:bg-[#F2EFE6] dark:hover:bg-[#2A352A] rounded-lg text-xs font-medium text-[#1F261F] dark:text-[#E2E8E2] transition-colors cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="p-2 text-[11px] text-[#7A7D75] text-center">
                        {isRTL ? "اكتب اسم الدولة..." : "Type custom country name..."}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Teaching Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("teachingLanguage")}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  required
                  value={teachingLanguage}
                  onChange={(e) => setTeachingLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                >
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                  <option value="French">French</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Time Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("timezone")}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. Africa/Cairo, UTC, EST..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Specializations & Experience */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A6B5A] dark:text-[#8BA888] pb-1 border-b border-[#E8E5DB] dark:border-[#2A352A]">
              3. {isRTL ? "التخصصات والخبرة" : "Specializations & Experience"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Specializations (Multi-Select Pills) */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("specializations")}</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SPECIALIZATION_OPTIONS.map((spec) => {
                    const isSelected = specializations.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpecialization(spec.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-[#5A6B5A] text-white border-[#5A6B5A] shadow-xs"
                            : "bg-[#FCFAF5] dark:bg-[#232B23] text-[#2D332D] dark:text-[#E2E8E2] border-[#E8E5DB] dark:border-[#2A352A] hover:border-[#5A6B5A]"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${isSelected ? "opacity-100" : "opacity-0"}`}
                        />
                        <span>{t(spec.labelKey as any)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Years of Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("yearsExperience")}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors"
                />
              </div>
            </div>

            {/* Short Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#5A6B5A]" />
                  <span>{t("bio")}</span>
                </label>
                <span className="text-[10px] text-[#7A7D75]">
                  {bio.length} / 500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("bioPlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-[#E8E5DB] dark:border-[#2A352A]">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5A6B5A] hover:bg-[#495749] text-white font-semibold text-sm shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("savingProfile")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t("completeProfileButton")}</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-[#7A7D75] text-center mt-2">
              {t("requiredFieldNotice")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
