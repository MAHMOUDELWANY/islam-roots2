import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { X, LogIn, Loader2, Sparkles, Globe, User, Key, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<"options" | "username">("options");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameSubmitting, setUsernameSubmitting] = useState(false);
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleGuestLogin = () => {
    loginAsGuest(isRTL ? "أستاذ محمود" : "Ustadh Mahmoud");
    onClose();
  };

  const handleUsernameAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUsernameSubmitting(true);
    
    // Normalize username to internal email
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normalizedUsername) {
      setErrorMsg(isRTL ? "اسم المستخدم غير صالح" : "Invalid username");
      setUsernameSubmitting(false);
      return;
    }
    const internalEmail = `${normalizedUsername}@users.islamroots.local`;

    try {
      if (isSignUp) {
        await signup(username, internalEmail, password);
      } else {
        await login(internalEmail, password);
      }
      onClose();
    } catch (err: any) {
      console.warn("Username Auth error:", err);
      const message = err?.message || err?.error_description || "";
      const code = err?.code || "";
      if (message.includes("Invalid login credentials") || code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setErrorMsg(isRTL ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password");
      } else if (message.includes("User already registered") || code === "auth/email-already-in-use") {
        setErrorMsg(isRTL ? "اسم المستخدم مستخدم بالفعل" : "Username already exists");
      } else if (message.includes("Password should be") || message.includes("weak") || code === "auth/weak-password") {
        setErrorMsg(isRTL ? "كلمة المرور ضعيفة جداً" : "Password is too weak");
      } else if (message.includes("Email signups are disabled") || code === "auth/operation-not-allowed") {
        setErrorMsg(isRTL ? "تسجيل الدخول معطل. يرجى تفعيله (Email/Password) في إعدادات Supabase." : "Username sign-in is disabled. Please enable Email/Password authentication in Supabase.");
      } else if (message.includes("Email not confirmed")) {
        setErrorMsg(isRTL ? "يرجى تعطيل (Confirm Email) في إعدادات Supabase." : "Email not confirmed. Please turn off 'Confirm Email' in Supabase Auth settings.");
      } else {
        setErrorMsg(isRTL ? "حدث خطأ أثناء المصادقة" : "An error occurred during authentication");
      }
    } finally {
      setUsernameSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
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
            ? "تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة أو استكمال الدخول كمعلم زائر."
            : "Sign-in popup was blocked. Please allow popups or continue as Guest Ustadh."
        );
      } else {
        setErrorMsg(
          isRTL
            ? "تعذر تسجيل الدخول عبر حساب جوجل حالياً. يمكنك الاستمرار مجاناً كمعلم زائر."
            : "Google sign-in encountered an issue. You can continue as a Guest Ustadh."
        );
      }
    } finally {
      setGoogleSubmitting(false);
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

        <div className="text-center space-y-2.5 font-sans pt-1">
          <div className="inline-flex p-3 rounded-2xl bg-[#FCFAF5] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] border border-[#E8E5DB] dark:border-[#2A352A] shadow-xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#1F261F] dark:text-[#E2E8E2] tracking-tight">
            {authMode === "options" 
              ? (isRTL ? "تسجيل الدخول عبر Google" : "Sign In with Google")
              : (isRTL ? "تسجيل الدخول" : "Sign In")
            }
          </h3>
          <p className="text-xs text-[#7A7D75] dark:text-stone-300 leading-relaxed max-w-xs mx-auto">
            {authMode === "options"
              ? (isRTL
                ? "استخدم حساب جوجل الخاص بك للوصول إلى لوحة الأستاذ، وإدارة قائمة الطلاب، والمناهج والذكاء الاصطناعي."
                : "Access your private Ustadh workspace, student rosters, curriculums, and Jalilah AI tools.")
              : (isRTL
                ? "قم بتسجيل الدخول للوصول إلى لوحة الأستاذ، وإدارة قائمة الطلاب، والمناهج والذكاء الاصطناعي."
                : "Sign in to access your private Ustadh workspace, student rosters, curriculums, and Jalilah AI tools.")
            }
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium space-y-2.5">
            <p>{errorMsg}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 py-1.5 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {isRTL ? "إعادة المحاولة" : "Try Again"}
              </button>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="py-1.5 px-3 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold cursor-pointer"
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        )}

        {/* Primary Google Login Button */}
        {authMode === "options" ? (
          <div className="space-y-3 font-sans">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleSubmitting}
              className="w-full py-3.5 px-4 rounded-xl border border-[#3E4D3E]/20 dark:border-[#5A6B5A]/40 bg-white dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-bold text-sm hover:bg-[#FCFAF5] dark:hover:bg-[#1C221C] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
            >
              {googleSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#5A6B5A]" />
                  <span>{isRTL ? "جاري الاتصال بـ Google..." : "Connecting to Google..."}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isRTL ? "المتابعة باستخدام Google" : "Continue with Google"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("username")}
              className="w-full py-3.5 px-4 rounded-xl border border-[#3E4D3E]/20 dark:border-[#5A6B5A]/40 bg-white dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] font-bold text-sm hover:bg-[#FCFAF5] dark:hover:bg-[#1C221C] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-3 active:scale-98"
            >
              <User className="w-5 h-5 text-[#5A6B5A]" />
              <span>{isRTL ? "المتابعة باستخدام اسم المستخدم" : "Continue with Username"}</span>
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
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#3E4D3E] dark:text-[#8BA888] font-bold text-xs hover:bg-[#F2EFE6] dark:hover:bg-[#1C221C] transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#8B5A2B] dark:text-[#C49A6C]" />
              <span>{t("continueAsGuest")}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleUsernameAuth} className="space-y-4 font-sans">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {isRTL ? "اسم المستخدم" : "Username"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder={isRTL ? "أدخل اسم المستخدم" : "Enter username"}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1F261F] dark:text-[#E2E8E2] mb-1.5">
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7D75]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                    className="w-full pl-9 pr-10 rtl:pl-10 rtl:pr-9 py-2.5 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#1C221C] text-[#1F261F] dark:text-[#E2E8E2] text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50"
                    placeholder={isRTL ? "أدخل كلمة المرور" : "Enter password"}
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
              disabled={usernameSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#3E4D3E] text-white font-bold text-sm hover:bg-[#2D332D] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {usernameSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSignUp 
                ? (isRTL ? "إنشاء حساب" : "Sign Up")
                : (isRTL ? "تسجيل الدخول" : "Sign In")
              }
            </button>

            <div className="flex items-center justify-between text-xs text-[#7A7D75]">
              <button 
                type="button" 
                onClick={() => setAuthMode("options")}
                className="hover:text-[#3E4D3E] underline decoration-dotted cursor-pointer"
              >
                {isRTL ? "العودة للخيارات" : "Back to options"}
              </button>
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="hover:text-[#3E4D3E] font-bold cursor-pointer"
              >
                {isSignUp 
                  ? (isRTL ? "لديك حساب بالفعل؟ الدخول" : "Already have an account? Sign in")
                  : (isRTL ? "حساب جديد؟ إنشاء" : "New? Sign up")
                }
              </button>
            </div>
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
