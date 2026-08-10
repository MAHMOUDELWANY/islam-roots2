import React from "react";
import { BrandLogo } from "../common/BrandLogo";
import { ShieldCheck, ArrowLeft, Lock, FileText, Globe, CheckCircle, Mail } from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
            <ShieldCheck className="w-4 h-4 text-[#8B5A2B] dark:text-[#C49A6C]" />
            <span>Legal & Data Security</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2]">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7D75] dark:text-stone-400 font-mono">
            Effective Date: August 10, 2026 | Last Updated: August 10, 2026
          </p>
        </div>

        {/* Content Box */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft space-y-8 text-sm sm:text-base leading-relaxed text-[#3E4D3E] dark:text-stone-300">
          {/* Section 1: Introduction */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">1</span>
              Overview & Scope
            </h2>
            <p>
              Welcome to <strong>Islam Roots (جذور الإسلام)</strong>. We are deeply committed to protecting your privacy, personal information, and student data. This Privacy Policy explains how our platform collects, uses, stores, and protects information when you use our educational workspace for Quran and Islamic Studies teachers, students, and academies.
            </p>
            <p>
              By signing in, accessing, or using Islam Roots, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">2</span>
              Information We Collect
            </h2>
            <p>We collect the following categories of information to provide you with a full-featured educational workspace:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Account Profile Information:</strong> When you sign in via Google OAuth, we receive your name, email address, and profile picture URL to create and manage your educator profile.
              </li>
              <li>
                <strong>Educational & Class Data:</strong> Student rosters, curriculums, lesson plans, attendance records, Tajweed/Hifz progress maps, quiz results, and teacher notes created within your workspace.
              </li>
              <li>
                <strong>Google Workspace Data (Optional Granular Integrations):</strong> If you explicitly grant access to optional Google Workspace integrations (such as Google Calendar, Google Docs, Google Drive, Gmail, Google Tasks, Google Slides, or Google Forms), we process data strictly required to perform the action requested by you (e.g., syncing class schedules to Google Calendar, saving generated lesson plans to Google Docs/Slides, or sending progress reports via Gmail).
              </li>
              <li>
                <strong>Technical & Usage Data:</strong> Anonymized browser logs, operational errors, and device type to optimize interface performance and ensure platform reliability.
              </li>
            </ul>
          </section>

          {/* Section 3: Google API Services User Data Policy Compliance */}
          <section className="p-5 rounded-2xl bg-[#FCFAF5] dark:bg-[#1C251D] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#8B5A2B] dark:text-[#C49A6C]" />
              Google API Services User Data Policy Compliance
            </h2>
            <p className="text-xs sm:text-sm text-[#2D332D] dark:text-stone-300">
              Islam Roots' use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-[#3E4D3E] dark:text-[#8BA888] underline font-bold"
              >
                Google API Services User Data Policy
              </a>
              , including the <strong>Limited Use</strong> requirements.
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1.5 text-[#5A615A] dark:text-stone-400">
              <li>We do <strong>NOT</strong> sell user data to third parties under any circumstances.</li>
              <li>We do <strong>NOT</strong> use Google user data for serving targeted advertisements or marketing.</li>
              <li>We only request access to the specific OAuth scopes required to perform user-facing application features.</li>
              <li>Human access to user data is strictly prohibited, except for technical security investigations or explicit user support requests.</li>
            </ul>
          </section>

          {/* Section 4: How We Use Your Data */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">3</span>
              How We Use Your Information
            </h2>
            <p>Your data is strictly utilized for the following functional purposes:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Authenticating your account and personalizing your educator dashboard.</li>
              <li>Storing and displaying student progress maps, curriculums, schedules, and lesson notes.</li>
              <li>Generating AI-assisted lesson prep materials (via Jalilah AI Studio) based on your custom prompts.</li>
              <li>Syncing schedule items to your Google Calendar or creating documents in Google Docs/Slides when invoked.</li>
              <li>Ensuring workspace data security, preventing unauthorized access, and maintaining system health.</li>
            </ul>
          </section>

          {/* Section 5: Data Storage & Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">4</span>
              Data Storage & Security
            </h2>
            <p>
              Your data is stored securely using cloud database infrastructure (Google Firebase Cloud Firestore / Cloud SQL) with end-to-end transport encryption (HTTPS/TLS) and strict access controls. Guest mode data is stored locally in your web browser (localStorage) and can be cleared by you at any time.
            </p>
          </section>

          {/* Section 6: User Control & Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5A6B5A]/10 text-[#5A6B5A] dark:text-[#8BA888]">5</span>
              Your Rights & Data Control
            </h2>
            <p>You have full ownership and control over your data:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Access & Export:</strong> You can view, export, and download your student records and curriculums directly from the workspace settings.</li>
              <li><strong>Data Deletion:</strong> You can delete individual student profiles, lesson plans, or request full account deletion by contacting support.</li>
              <li><strong>Revoking Permissions:</strong> You can revoke Google OAuth permissions at any time through your Google Account Security settings (<a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline font-semibold text-[#3E4D3E] dark:text-[#8BA888]">myaccount.google.com/permissions</a>).</li>
            </ul>
          </section>

          {/* Section 7: Contact Us */}
          <section className="p-6 rounded-2xl bg-[#5A6B5A]/10 dark:bg-[#232B23] border border-[#5A6B5A]/20 dark:border-[#2A352A] space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1F261F] dark:text-[#E2E8E2] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#5A6B5A] dark:text-[#8BA888]" />
              Questions & Privacy Contact
            </h2>
            <p className="text-xs sm:text-sm text-[#3E4D3E] dark:text-stone-300">
              If you have any questions or concerns regarding this Privacy Policy or your data, please contact the Islam Roots administrator team at:
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-[#1F261F] dark:text-[#E2E8E2]">
              Email: support@islamroots.app / mhmwdlwany4222@gmail.com
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
