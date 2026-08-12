import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { X, LogIn, Loader2, Sparkles, User, Key, Eye, EyeOff, Mail, CheckCircle2, ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: string | null;
  initialMode?: "options" | "signup" | "signin" | "verification_pending" | "forgot_password" | "reset_password";
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialError, initialMode }) => {
  const { loginWithGoogle, loginAsGuest, login, signup, resendVerificationEmail, checkEmailConfirmationStatus, resetPassword, updatePassword } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [authMode, setAuthMode] = useState<"options" | "signup" | "signin" | "verification_pending" | "forgot_password" | "reset_password">(
    initialMode || "options"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [checkingConfirmation, setCheckingConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showUnverifiedResend, setShowUnverifiedResend] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("reset-password")) {
      setAuthMode("reset_password");
    }
  }, []);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowUnverifiedResend(false);
  };

  const switchMode = (mode: "options" | "signup" | "signin" | "verification_pending" | "forgot_password" | "reset_password") => {
    resetFormState();
    if (mode === "verification_pending") {
      setResendCooldown(60);
    }
    setAuthMode(mode);
  };

  const handleGuestLogin = () => {
    loginAsGuest(isRTL ? "أستاذ محمود" : "Ustadh Mahmoud");
    onClose();
  };

  const handleGoogleLogin = async () => {
    resetFormState();
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.warn("Google Auth error details:", err);
      const message = err?.message || err?.error_description || "";
      const code = err?.code || "";
      if (message.includes("closed") || code === "auth/popup-closed-by-user") {
        setErrorMsg(
          isRTL
            ? "تم إغلاق نافذة الدخول. يرجى المحاولة مرة أخرى."
            : "Sign-in window was closed. Please try again."
        );
      } else if (message.includes("blocked") || code === "auth/popup-blocked") {
        setErrorMsg(
          isRTL
            ? "تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذه الصفحة."
            : "Sign-in popup was blocked. Please allow popups for this site."
        );
      } else if (message.includes("Authentication service is not configured")) {
        setErrorMsg(isRTL ? "خدمة المصادقة غير مكوّنة. يرجى الاتصال بالمسؤول." : message);
      } else {
        setErrorMsg(
          isRTL
            ? `تعذر تسجيل الدخول عبر حساب جوجل حالياً. (${message || "Unknown Error"})`
            : `Google sign-in encountered an issue: ${message || "Unknown error"}.`
        );
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg(isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("passwordsDoNotMatch"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await signup(cleanEmail, password);
      console.log("[AuthModal] Signup response:", res);

      // If session exists immediately, close modal
      if (res.session && res.user?.email_confirmed_at) {
        onClose();
      } else {
        // Pending email confirmation
        setUnverifiedEmail(cleanEmail);
        switchMode("verification_pending");
      }
    } catch (err: any) {
      console.warn("[AuthModal] Signup error:", err);
      const message = err?.message || "";
      const code = err?.code || "";
      if (message.includes("already registered") || message.includes("User already exists") || code === "user_already_exists") {
        setErrorMsg(isRTL ? "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول." : "This email address is already registered. Please sign in.");
      } else if (err?.status === 429 || code === "over_email_send_rate_limit" || message.includes("rate limit")) {
        setErrorMsg(isRTL ? "تم تجاوز حد الطلبات. يرجى الانتظار بضع دقائق والمحاولة مجدداً." : "Too many requests. Please wait a few minutes and try again.");
      } else {
        setErrorMsg(message || (isRTL ? "تعذر إنشاء الحساب" : "Failed to create account."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMsg(isRTL ? "يرجى إدخال كلمة المرور" : "Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(cleanEmail, password);
      onClose();
    } catch (err: any) {
      console.warn("[AuthModal] Signin error:", err);
      const message = err?.message || "";
      const code = err?.code || "";
      
      if (code === "email_not_confirmed" || message.includes("verify your email") || message.includes("not confirmed")) {
        setUnverifiedEmail(cleanEmail);
        switchMode("verification_pending");
      } else if (message.includes("Invalid email or password") || message.includes("Invalid login credentials") || code === "invalid_credentials") {
        setErrorMsg(t("invalidEmailOrPassword"));
      } else {
        setErrorMsg(message || t("invalidEmailOrPassword"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getEmailProviderLink = (emailAddress: string) => {
    const lower = emailAddress.trim().toLowerCase();
    if (lower.endsWith("@gmail.com") || lower.endsWith("@googlemail.com")) {
      return { label: isRTL ? "فتح Gmail" : "Open Gmail", url: "https://mail.google.com" };
    }
    if (lower.endsWith("@outlook.com") || lower.endsWith("@hotmail.com") || lower.endsWith("@live.com")) {
      return { label: isRTL ? "فتح Outlook" : "Open Outlook", url: "https://outlook.live.com" };
    }
    if (lower.endsWith("@yahoo.com")) {
      return { label: isRTL ? "فتح Yahoo Mail" : "Open Yahoo Mail", url: "https://mail.yahoo.com" };
    }
    return { label: isRTL ? "فتح تطبيق البريد" : "Open Email App", url: "mailto:" };
  };

  const handleCheckConfirmation = async () => {
    resetFormState();
    setCheckingConfirmation(true);
    try {
      const isConfirmed = await checkEmailConfirmationStatus();
      if (isConfirmed) {
        setSuccessMsg(
          isRTL
            ? "تم تأكيد البريد الإلكتروني بنجاح! جاري الانتقال إلى بيئة العمل..."
            : "Email confirmed successfully! Entering workspace..."
        );
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(
          isRTL
            ? `لم يتم تأكيد البريد الإلكتروني بعد. يرجى فتح الرسالة المرسلة إلى ${unverifiedEmail || email} والضغط على "تأكيد البريد الإلكتروني"، ثم الضغط هنا مرة أخرى.`
            : `Email is not confirmed yet. Please open the email sent to ${unverifiedEmail || email} and click "Confirm your email address", then click here again.`
        );
      }
    } catch (err: any) {
      setErrorMsg(
        isRTL
          ? "عذراً، تعذر التحقق من حالة التأكيد حالياً. يرجى المحاولة مرة أخرى."
          : "Could not verify confirmation status right now. Please try again."
      );
    } finally {
      setCheckingConfirmation(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendSubmitting) return;
    const targetEmail = unverifiedEmail || email.trim().toLowerCase();
    if (!targetEmail) return;

    setResendSubmitting(true);
    resetFormState();
    try {
      await resendVerificationEmail(targetEmail);
      setResendCooldown(60);
      setSuccessMsg(
        isRTL
          ? "تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني. يرجى فحص صندوق الوارد."
          : "A new confirmation link has been sent to your email address."
      );
    } catch (err: any) {
      const message = err?.message || "";
      const code = err?.code || "";
      if (err?.status === 429 || code === "over_email_send_rate_limit" || message.includes("rate limit")) {
        setErrorMsg(
          isRTL
            ? "تم تجاوز حد إرسال الرسائل. يرجى الانتظار بضع دقائق والمحاولة مجدداً."
            : "Too many email requests. Please wait a few minutes before trying again."
        );
      } else {
        setErrorMsg(
          err?.message || (isRTL ? "تعذر إعادة إرسال البريد" : "Failed to resend verification email.")
        );
      }
    } finally {
      setResendSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(cleanEmail);
      setSuccessMsg(t("passwordResetSent"));
    } catch (err: any) {
      setErrorMsg(err?.message || (isRTL ? "تعذر إرسال رابط إعادة الضبط" : "Failed to send password reset link."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!password || password.length < 6) {
      setErrorMsg(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("passwordsDoNotMatch"));
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setSuccessMsg(isRTL ? "تم تحديث كلمة المرور بنجاح! يمكنك الآن الاستمرار." : "Password updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || (isRTL ? "تعذر تحديث كلمة المرور" : "Failed to update password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C221C]/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#161D17] border border-[#E8E5DB] dark:border-[#2A352A] shadow-soft overflow-hidden p-6 sm:p-8 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-2 rounded-xl text-[#7A7D75] hover:text-[#2D332D] dark:hover:text-[#E2E8E2] hover:bg-[#F2EFE6] dark:hover:bg-[#232B23] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 font-sans pt-1">
          <div className="inline-flex p-3 rounded-2xl bg-[#FCFAF5] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] border border-[#E8E5DB] dark:border-[#2A352A] shadow-xs">
            {authMode === "verification_pending" ? (
              <Mail className="w-6 h-6 text-[#5A6B5A]" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-xl font-bold text-[#1F261F] dark:text-[#E2E8E2] tracking-tight">
            {authMode === "options" && t("welcomeToIslamRoots")}
            {authMode === "signup" && t("signUpTitle")}
            {authMode === "signin" && t("loginTitle")}
            {authMode === "verification_pending" && t("checkYourEmail")}
            {authMode === "forgot_password" && t("forgotPasswordTitle")}
            {authMode === "reset_password" && t("setNewPassword")}
          </h3>

          <p className="text-xs text-[#7A7D75] dark:text-stone-300 leading-relaxed max-w-xs mx-auto">
            {authMode === "options" && t("areYouNewToIslamRoots")}
            {authMode === "signup" && (isRTL ? "قم بإنشاء حساب أستاذ جديد للوصول إلى لوحتك الخاصة." : "Create your teacher account to access your workspace.")}
            {authMode === "signin" && (isRTL ? "تسجيل الدخول للوصول إلى أدوات الأستاذ والطلاب." : "Sign in to access your Ustadh workspace and student rosters.")}
            {authMode === "verification_pending" && (
              <span>
                {t("verificationSentNotice")}{" "}
                <strong className="text-[#3E4D3E] dark:text-[#8BA888]">{unverifiedEmail || email}</strong>.{" "}
                {t("verificationSentNoticeEnd")}
              </span>
            )}
            {authMode === "forgot_password" && (isRTL ? "أدخل بريدك الإلكتروني لإرسال رابط إعادة ضبط كلمة المرور." : "Enter your email address and we'll send you a password reset link.")}
            {authMode === "reset_password" && (isRTL ? "أدخل كلمة المرور الجديدة لحسابك." : "Type your new password below.")}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium space-y-2">
            <p>{errorMsg}</p>
            {showUnverifiedResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendSubmitting}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {resendSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{t("resendVerificationEmail")}</span>
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* MODE 1: OPTIONS CHOICE SCREEN */}
        {authMode === "options" && (
          <div className="space-y-3 font-sans">
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="w-full py-3.5 px-4 rounded-xl bg-[#3E4D3E] text-white font-bold text-sm hover:bg-[#2D332D] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <User className="w-4 h-4" />
              <span>{t("imANewTeacherSignUp")}</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="w-full py-3.5 px-4 rounded-xl border border-[#3E4D3E]/30 dark:border-[#5A6B5A]/40 bg-white dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-bold text-sm hover:bg-[#FCFAF5] dark:hover:bg-[#1C221C] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <LogIn className="w-4 h-4 text-[#5A6B5A]" />
              <span>{t("iAlreadyHaveAnAccountSignIn")}</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] w-full"></div>
              <span className="bg-white dark:bg-[#161D17] px-3 text-[10px] text-[#7A7D75] dark:text-stone-400 font-bold shrink-0 uppercase tracking-wider">
                {isRTL ? "أو" : "OR"}
              </span>
              <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] w-full"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleSubmitting}
              className="w-full py-3 px-4 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-bold text-xs hover:bg-[#FCFAF5] dark:hover:bg-[#1C221C] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {googleSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#5A6B5A]" />
                  <span>{isRTL ? "جاري الاتصال بـ Google..." : "Connecting to Google..."}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t("continueWithGoogle")}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] font-bold text-xs hover:bg-[#F2EFE6] dark:hover:bg-[#1C221C] transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#8B5A2B] dark:text-[#C49A6C]" />
              <span>{t("continueAsGuest")}</span>
            </button>
          </div>
        )}

        {/* MODE 2: SIGN UP FORM */}
        {authMode === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4 font-sans">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {t("emailAddress")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="ustadh@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {t("password")}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 pr-10 rtl:pl-10 rtl:pr-9 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7D75] hover:text-[#3E4D3E]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {t("confirmPassword")}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 pr-10 rtl:pl-10 rtl:pr-9 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#3E4D3E] text-white font-bold text-sm hover:bg-[#2D332D] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{t("createTeacherAccount")}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#7A7D75]">
              <button
                type="button"
                onClick={() => switchMode("options")}
                className="hover:text-[#3E4D3E] underline decoration-dotted cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t("backToChoices")}</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="hover:text-[#3E4D3E] font-bold cursor-pointer"
              >
                {t("alreadyHaveAccount")}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: SIGN IN FORM */}
        {authMode === "signin" && (
          <form onSubmit={handleSignInSubmit} className="space-y-4 font-sans">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {t("emailAddress")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="ustadh@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2]">
                    {t("password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot_password")}
                    className="text-[11px] text-[#5A6B5A] hover:underline cursor-pointer"
                  >
                    {t("forgotPasswordLink")}
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 pr-10 rtl:pl-10 rtl:pr-9 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7D75] hover:text-[#3E4D3E]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#3E4D3E] text-white font-bold text-sm hover:bg-[#2D332D] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{t("login")}</span>
            </button>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] w-full"></div>
              <span className="bg-white dark:bg-[#161D17] px-2 text-[10px] text-[#7A7D75] dark:text-stone-400 font-bold shrink-0 uppercase">
                {isRTL ? "أو" : "OR"}
              </span>
              <div className="border-t border-[#E8E5DB] dark:border-[#2A352A] w-full"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-bold text-xs hover:bg-[#FCFAF5] dark:hover:bg-[#1C221C] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {googleSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#5A6B5A]" /> : null}
              <span>{t("continueWithGoogle")}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#7A7D75] pt-1">
              <button
                type="button"
                onClick={() => switchMode("options")}
                className="hover:text-[#3E4D3E] underline decoration-dotted cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t("backToChoices")}</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="hover:text-[#3E4D3E] font-bold cursor-pointer"
              >
                {t("needAccount")}
              </button>
            </div>
          </form>
        )}

        {/* MODE 4: EMAIL VERIFICATION PENDING (CONFIRMATION LINK FLOW) */}
        {authMode === "verification_pending" && (
          <div className="space-y-4 font-sans">
            <div className="p-4 rounded-xl bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3 text-center">
              <div className="inline-flex p-3 rounded-full bg-[#EBF2EB] dark:bg-[#2A382A] text-[#3E4D3E] dark:text-[#8BA888]">
                <Mail className="w-6 h-6 animate-pulse text-[#3E4D3E] dark:text-[#8BA888]" />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#3E4D3E] dark:text-[#8BA888] font-medium leading-relaxed">
                  {t("verificationSentNotice")}{" "}
                  <strong className="text-[#1F261F] dark:text-[#E2E8E2] block sm:inline font-bold break-all">
                    {unverifiedEmail || email}
                  </strong>
                </p>
                <p className="text-[11px] text-[#7A7D75] dark:text-stone-300 leading-relaxed pt-1">
                  {t("verificationSentNoticeEnd")}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Open Email Convenience Action */}
              {(() => {
                const provider = getEmailProviderLink(unverifiedEmail || email);
                return (
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl border border-[#3E4D3E]/30 bg-white dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-bold text-xs hover:bg-[#FCFAF5] dark:hover:bg-[#1C221C] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-[#5A6B5A]" />
                    <span>{provider.label}</span>
                  </a>
                );
              })()}

              {/* Security Rule Check Confirmation Button */}
              <button
                type="button"
                onClick={handleCheckConfirmation}
                disabled={checkingConfirmation}
                className="w-full py-3.5 px-4 rounded-xl bg-[#3E4D3E] hover:bg-[#2D332D] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {checkingConfirmation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("checkConfirmationChecking")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
                    <span>{t("checkConfirmationButton")}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#7A7D75] pt-2 border-t border-[#E8E5DB] dark:border-[#2A352A]">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendSubmitting || resendCooldown > 0}
                className="hover:text-[#3E4D3E] dark:hover:text-[#8BA888] font-medium cursor-pointer flex items-center gap-1.5 disabled:opacity-50 text-[11px]"
              >
                {resendSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>
                  {resendCooldown > 0
                    ? isRTL
                      ? `إعادة الإرسال بعد ${resendCooldown} ثانية`
                      : `Resend in ${resendCooldown}s`
                    : t("resendVerificationEmail")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="hover:text-[#3E4D3E] underline cursor-pointer text-[11px]"
              >
                {isRTL ? "تسجيل الدخول" : "Back to Sign In"}
              </button>
            </div>
          </div>
        )}

        {/* MODE 5: FORGOT PASSWORD */}
        {authMode === "forgot_password" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                {t("emailAddress")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                  placeholder="ustadh@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#3E4D3E] text-white font-bold text-sm hover:bg-[#2D332D] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{t("sendResetLink")}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-xs text-[#7A7D75] hover:text-[#3E4D3E] underline cursor-pointer"
              >
                {t("alreadyHaveAccount")}
              </button>
            </div>
          </form>
        )}

        {/* MODE 6: RESET PASSWORD */}
        {authMode === "reset_password" && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 font-sans">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {t("setNewPassword")}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 pr-10 rtl:pl-10 rtl:pr-9 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7D75] hover:text-[#3E4D3E]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {t("confirmPassword")}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 pr-10 rtl:pl-10 rtl:pr-9 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#3E4D3E] text-white font-bold text-sm hover:bg-[#2D332D] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{t("updatePassword")}</span>
            </button>
          </form>
        )}

        <div className="space-y-1 text-[11px] text-center text-[#7A7D75] dark:text-stone-400 font-sans">
          <p>
            {isRTL
              ? "تسجيل الدخول يضمن مزامنة بيانات طلابك ومناهجك بأمان تام عبر السحابة."
              : "Signing in protects your data with end-to-end cloud persistence across all your devices."}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 text-[10px]">
            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#3E4D3E] dark:hover:text-[#E2E8E2] underline font-medium"
            >
              {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
            </a>
            <span>•</span>
            <a
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#3E4D3E] dark:hover:text-[#E2E8E2] underline font-medium"
            >
              {isRTL ? "شروط الخدمة" : "Terms of Service"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
