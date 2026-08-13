import React from "react";
import { BrandLogo } from "../common/BrandLogo";
import { ArrowLeft, Shield, Scale, Mail } from "lucide-react";

interface TermsOfServiceProps {
  onBack?: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#FCFAF5] dark:bg-[#121812] text-[#1F261F] dark:text-[#E2E8E2] font-sans selection:bg-[#8BA888] selection:text-white transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FCFAF5]/90 dark:bg-[#121812]/90 backdrop-blur-md border-b border-[#E8E5DB] dark:border-[#2A352A] px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" showSubtitle={true} />
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3E4D3E] hover:bg-[#2A352A] text-white text-xs font-semibold shadow-soft transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
          ) : (
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3E4D3E] hover:bg-[#2A352A] text-white text-xs font-semibold shadow-soft transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-10">
        {/* Title Badge */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3E4D3E]/10 dark:bg-[#8BA888]/15 border border-[#3E4D3E]/20 dark:border-[#8BA888]/30 text-[#3E4D3E] dark:text-[#8BA888] text-xs font-bold tracking-wide">
            <Scale className="w-4 h-4 text-[#8B5A2B] dark:text-[#C49A6C]" />
            <span>Terms & Conditions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 font-mono">
            Effective Date: August 10, 2026 | Last Updated: August 10, 2026
          </p>
        </div>

        {/* Content Box */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-8 text-sm sm:text-base leading-relaxed text-[#3E4D3E] dark:text-stone-300">
          {/* Section 1: Agreement to Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">1</span>
              Agreement to Terms
            </h2>
            <p>
              These Terms of Service ("Terms") govern your access to and use of <strong>Islam Roots (جذور الإسلام)</strong>, including our web applications, services, tools, and features designed for educators of Quran, Tajweed, Hifz, and Islamic Studies.
            </p>
            <p>
              By accessing or using Islam Roots, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use the application.
            </p>
          </section>

          {/* Section 2: Account Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">2</span>
              User Accounts & Educator Responsibilities
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Security:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your account.
              </li>
              <li>
                <strong>Student Information:</strong> As an educator managing student rosters, you agree that any student data inputted into Islam Roots is added responsibly and in compliance with relevant local educational and privacy laws.
              </li>
              <li>
                <strong>Acceptable Use:</strong> You agree not to misuse the platform, attempt unauthorized access, upload harmful code, or disrupt workspace operation for other teachers.
              </li>
            </ul>
          </section>

          {/* Section 3: Intellectual Property & Respect for Sacred Texts */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">3</span>
              Intellectual Property & Sacred Content
            </h2>
            <p>
              All software design, interface components, Jalilah AI prompt frameworks, branding, and logos belong to Islam Roots.
            </p>
            <p>
              The Quranic text, Surah structures, Tafsir references, and Hadith references used within the application remain sacred public domain knowledge or open educational resources. Users retain full ownership of the custom lesson plans and curriculums they create using the platform.
            </p>
          </section>

          {/* Section 4: AI Assistant Disclaimer */}
          <section className="p-5 rounded-2xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#8B5A2B] dark:text-[#C49A6C]" />
              Jalilah AI Studio Assistant Guidance
            </h2>
            <p className="text-xs sm:text-sm text-[#2D332D] dark:text-stone-300">
              The Jalilah AI assistant is designed to assist educators by drafting lesson plans, generating Tajweed quizzes, and organizing study guides.
            </p>
            <p className="text-xs sm:text-sm text-[#5A615A] dark:text-stone-400">
              While Jalilah is tailored specifically for Islamic studies, teachers are expected to review AI-generated content for scholarly accuracy and age-appropriateness before presenting it to students.
            </p>
          </section>

          {/* Section 5: Modifications & Termination */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">4</span>
              Service Availability & Modifications
            </h2>
            <p>
              We continuously improve Islam Roots and may update features, fix issues, or modify services from time to time. We reserve the right to modify these Terms at any time. Notice of significant changes will be posted on this page or communicated to registered users.
            </p>
          </section>

          {/* Section 6: Contact Information */}
          <section className="p-6 rounded-2xl bg-[#5A6B5A]/10 dark:bg-[#232B23] border border-[#5A6B5A]/20 dark:border-[#2A352A] space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#5A6B5A] dark:text-[#8BA888]" />
              Contact & Support
            </h2>
            <p className="text-xs sm:text-sm text-[#3E4D3E] dark:text-stone-300">
              If you have any questions or inquiries about these Terms of Service, please reach out to us:
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              Email: support@islamroots.app
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E5DB] dark:border-[#2A352A] py-8 px-4 sm:px-8 bg-white dark:bg-[#121812] text-center text-xs text-[#7A7D75]">
        <p>© {new Date().getFullYear()} Islam Roots (جذور الإسلام). All rights reserved.</p>
      </footer>
    </div>
  );
};
