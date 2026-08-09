import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { UserCheck, Sparkles, MapPin, Briefcase, Award, Calendar, Target } from "lucide-react";

interface TeacherOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCompleteOnboarding?: () => void;
}

export const TeacherOnboardingModal: React.FC<TeacherOnboardingModalProps> = ({
  isOpen,
  onCompleteOnboarding,
}) => {
  const { teacher, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState(teacher?.name || "");
  const [age, setAge] = useState<string>(teacher?.age ? String(teacher.age) : "");
  const [yearsOfExperience, setYearsOfExperience] = useState<string>(
    teacher?.yearsOfExperience ? String(teacher.yearsOfExperience) : ""
  );
  const [location, setLocation] = useState(teacher?.location || "");
  const [purpose, setPurpose] = useState(teacher?.purpose || "");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile({
        name,
        age,
        yearsOfExperience,
        location,
        purpose,
        onboardingCompleted: true,
      });
      onCompleteOnboarding?.();
    } catch (err) {
      console.error("Error updating teacher onboarding profile:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-2 font-sans">
          <div className="inline-flex p-3 rounded-2xl bg-[#FCFAF5] dark:bg-[#232B23] text-[#5A6B5A] border border-[#E8E5DB] dark:border-[#2A352A] shadow-xs">
            <UserCheck className="w-6 h-6 text-[#5A6B5A]" />
          </div>
          <h3 className="text-xl font-bold text-[#1F261F] dark:text-[#E2E8E2] tracking-tight">
            {t("teacherOnboardingTitle")}
          </h3>
          <p className="text-xs text-[#7A7D75] dark:text-stone-400 leading-relaxed max-w-md mx-auto">
            {t("teacherOnboardingSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#5A6B5A]" />
              <span>{t("fullName")}</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5A6B5A]" />
                <span>{t("age")}</span>
              </label>
              <input
                type="text"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t("agePlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#5A6B5A]" />
                <span>{t("yearsOfExperience")}</span>
              </label>
              <input
                type="text"
                required
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder={t("experiencePlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
              />
            </div>
          </div>

          {/* Location / Where he lives */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5A6B5A]" />
              <span>{t("location")}</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("locationPlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
            />
          </div>

          {/* Purpose / Goal */}
          <div className="space-y-1">
            <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#5A6B5A]" />
              <span>{t("purpose")}</span>
            </label>
            <textarea
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t("purposePlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#5A6B5A] hover:bg-[#495749] text-white font-semibold text-xs shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("saveAndContinue")}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
