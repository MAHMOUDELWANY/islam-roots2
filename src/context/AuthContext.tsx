import React, { createContext, useContext, useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, supabaseAnonKey } from "../lib/supabase";
import { Teacher } from "../types";

export const ADMIN_EMAIL = "mhmwdlwany4222@gmail.com";

export interface GoogleTokens {
  calendar?: string;
  docs?: string;
  slides?: string;
  tasks?: string;
  gmail?: string;
  forms?: string;
  picker?: string;
}

// Extend SupabaseUser to include a uid alias for compatibility with existing DataContext code during migration
export type FirebaseUser = SupabaseUser & { uid: string };

interface AuthContextType {
  teacher: Teacher | null;
  firebaseUser: FirebaseUser | null;
  googleTokens: GoogleTokens;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<{ user: SupabaseUser | null; session: any }>;
  resendVerificationEmail: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  connectGoogleCalendar: () => Promise<string | null>;
  connectGoogleDocs: () => Promise<string | null>;
  connectGoogleSlides: () => Promise<string | null>;
  connectGoogleTasks: () => Promise<string | null>;
  connectGmail: () => Promise<string | null>;
  connectGoogleForms: () => Promise<string | null>;
  connectGooglePicker: () => Promise<string | null>;
  loginAsGuest: (name?: string) => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updatedData: Partial<Teacher>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ensure your OAuth Client ID matches the one in your environment variables.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens>(() => {
    try {
      const stored = sessionStorage.getItem("googleTokens");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  useEffect(() => {
    sessionStorage.setItem("googleTokens", JSON.stringify(googleTokens));
  }, [googleTokens]);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
    // Check if guest mode was explicitly chosen in session
    const isSessionGuest = sessionStorage.getItem("islamroots_session_guest");
    if (isSessionGuest) {
      try {
        setTeacher(JSON.parse(isSessionGuest));
      } catch (e) {
        console.error("Failed to parse session guest teacher:", e);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      console.log("[Auth] Auth state changed. Supabase User:", user ? user.id : "null");
      
      if (user) {
        const userWithUid: FirebaseUser = { ...user, uid: user.id } as FirebaseUser;
        setFirebaseUser(userWithUid);
      } else {
        setFirebaseUser(null);
        setIsSuperAdminClaim(false);
        if (!sessionStorage.getItem("islamroots_session_guest")) {
          setTeacher(null);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (user: FirebaseUser) => {
    try {
      setLoading(true);
      console.log("[Auth] Supabase teacher lookup started for ID:", user.id);
      
      sessionStorage.removeItem("islamroots_session_guest");
      localStorage.removeItem("islamroots_guest_teacher");

      // STRICT AUTH BOUNDARY: Block unverified email/password users from creating or loading profile
      const isGoogleUser = user.app_metadata?.provider === "google" ||
        (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes("google")) ||
        (Array.isArray((user as any).identities) && (user as any).identities.some((id: any) => id.provider === "google"));

      const isEmailUnverified = !isGoogleUser && !user.email_confirmed_at;

      if (isEmailUnverified) {
        console.log("[Auth Boundary] User email is unverified. Skipping teacher profile creation, load, and workspace access.");
        setTeacher(null);
        setIsSuperAdminClaim(false);
        return;
      }
      
      const { data, error } = await supabase.from("teachers").select("*").eq("id", user.id).single();
      
      let teacherData = null;
      if (data && !error) {
        console.log("[Auth] Teacher lookup succeeded: Profile found in Supabase.");
        teacherData = data;
        // Synchronize email in teachers table if user email exists and differs
        if (user.email && teacherData.email !== user.email) {
          supabase.from("teachers").update({ email: user.email }).eq("id", user.id).then(() => {
            console.log("[Auth] Updated teacher email in database to match auth email.");
          });
        }
      } else {
         console.log("[Auth] Teacher lookup: No profile document found or error. Creating teacher profile in Supabase.");
         const initialDisplayName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : "Ustadh");
         const fallbackTeacher = {
           id: user.id,
           username: user.user_metadata?.username || null,
           name: initialDisplayName,
           email: user.email || "",
           full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
           display_name: initialDisplayName,
           preferred_language: "en",
           onboarding_completed: false,
           profile_completed: false,
           created_at: new Date().toISOString(),
         };
         
         const { data: insertData, error: insertErr } = await supabase
           .from("teachers")
           .upsert(fallbackTeacher, { onConflict: 'id' })
           .select()
           .single();
           
         if (insertErr) {
           console.warn("[Auth] Upsert for teacher row failed:", insertErr);
           throw insertErr;
         }
         console.log("[Auth] Teacher profile row created/verified successfully in Supabase.");
         teacherData = insertData || fallbackTeacher;
      }

      const isProfileDone = Boolean(
        (teacherData.profile_completed === true || teacherData.onboarding_completed === true) &&
        (teacherData.full_name || teacherData.name) &&
        (teacherData.display_name || teacherData.name) &&
        (teacherData.country || teacherData.location) &&
        (teacherData.teaching_language || teacherData.preferred_language)
      );

      setTeacher({
        id: teacherData.id,
        username: teacherData.username || user.user_metadata?.username,
        name: teacherData.display_name || teacherData.name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Ustadh",
        email: user.email || teacherData.email || "",
        preferredLanguage: (teacherData.teaching_language || teacherData.preferred_language || "en") as any,
        
        fullName: teacherData.full_name || teacherData.name || user.user_metadata?.full_name || "",
        displayName: teacherData.display_name || teacherData.name || user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        arabicName: teacherData.arabic_name || "",
        country: teacherData.country || teacherData.location || "",
        teachingLanguage: teacherData.teaching_language || teacherData.preferred_language || "en",
        gender: teacherData.gender || "",
        yearsExperience: teacherData.years_experience ?? teacherData.years_of_experience ?? "",
        specializations: Array.isArray(teacherData.specializations) ? teacherData.specializations : [],
        bio: teacherData.bio || teacherData.purpose || "",
        profileCompleted: isProfileDone,
        profileCompletedAt: teacherData.profile_completed_at,

        age: teacherData.age,
        yearsOfExperience: teacherData.years_experience ?? teacherData.years_of_experience,
        purpose: teacherData.bio || teacherData.purpose,
        location: teacherData.country || teacherData.location,
        onboardingCompleted: isProfileDone,
        tourCompleted: teacherData.tour_completed ?? false,
        timezone: teacherData.timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"),
        reminderMinutes: teacherData.reminder_minutes,
        reminderSoundEnabled: teacherData.reminder_sound_enabled,
        reminderVibrationEnabled: teacherData.reminder_vibration_enabled,
        isSuperAdmin: !!teacherData.is_super_admin,
        createdAt: teacherData.created_at || new Date().toISOString(),
      });
      setIsSuperAdminClaim(!!teacherData.is_super_admin);

      // Trigger super admin claim if this is the admin email
      if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const res = await fetch("/api/auth/claim-admin", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${session.access_token}`
              }
            });
            if (res.ok) {
              setIsSuperAdminClaim(true);
            } else {
              console.warn("[Auth] Failed to claim admin status via API. Status:", res.status);
            }
          }
        } catch (adminErr) {
          console.error("Failed to claim admin status:", adminErr);
        }
      }
    } catch (err) {
      console.warn("[Auth] Teacher profile initialization failed:", err);
      setTeacher(null);
      setIsSuperAdminClaim(false);
    } finally {
      setLoading(false);
      console.log("[Auth] Final authentication state updated.");
    }
  };

  useEffect(() => {
    if (firebaseUser) {
       loadProfile(firebaseUser);
    }
  }, [firebaseUser]);

const loginAsGuest = (name: string = "Ustadh Guest") => {
    const guestTeacher: Teacher = {
      id: "guest-ustadh-101",
      username: "guest",
      name,
      email: "",
      preferredLanguage: "en",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    setTeacher(guestTeacher);
    sessionStorage.setItem("islamroots_session_guest", JSON.stringify(guestTeacher));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly clear local state and sign out before attempting to sign in to avoid session conflicts
    setTeacher(null);
    setFirebaseUser(null);
    setIsSuperAdminClaim(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Silent signout failed during login step", e);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.warn(`[Auth Diagnostic] Supabase signInWithPassword error status=${error.status}, code=${error.code || 'none'}, message=${error.message}`);
      if (
        error.message?.toLowerCase().includes("email not confirmed") ||
        error.code === "email_not_confirmed"
      ) {
        const unconfirmedErr = new Error("Please verify your email before signing in.");
        (unconfirmedErr as any).code = "email_not_confirmed";
        throw unconfirmedErr;
      }
      if (
        error.message?.includes("Invalid login credentials") ||
        error.message?.includes("invalid") ||
        error.code === "invalid_credentials" ||
        error.status === 400
      ) {
        throw new Error("Invalid email or password.");
      }
      throw error;
    }

    if (data?.user && !data.user.email_confirmed_at) {
      const isGoogleUser = data.user.app_metadata?.provider === "google" ||
        (Array.isArray(data.user.app_metadata?.providers) && data.user.app_metadata.providers.includes("google")) ||
        (Array.isArray((data.user as any).identities) && (data.user as any).identities.some((id: any) => id.provider === "google"));

      if (!isGoogleUser) {
        const unconfirmedErr = new Error("Please verify your email before signing in.");
        (unconfirmedErr as any).code = "email_not_confirmed";
        throw unconfirmedErr;
      }
    }

    console.log("[Auth Diagnostic] Supabase signInWithPassword succeeded.");
    return true;
  };

  const signup = async (email: string, password: string): Promise<{ user: SupabaseUser | null; session: any }> => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly clear local state and sign out before attempting to sign up to avoid session conflicts
    setTeacher(null);
    setFirebaseUser(null);
    setIsSuperAdminClaim(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Silent signout failed during signup step", e);
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
        data: {
          full_name: normalizedEmail.split('@')[0],
        },
      },
    });

    if (error) {
      console.warn(`[Auth Diagnostic] Supabase signUp error status=${error.status}, code=${error.code || 'none'}`);
      throw error;
    }

    console.log("[Auth Diagnostic] Supabase signUp succeeded.");
    return { user: data.user, session: data.session };
  };

  const resendVerificationEmail = async (email: string): Promise<void> => {
    if (!email) throw new Error("Email is required.");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });
    if (error) {
      if (error.status === 429 || error.message?.includes("rate limit") || error.code === "over_email_send_rate_limit") {
        throw new Error("Too many email requests. Please wait a few minutes before trying again.");
      }
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<boolean> => {
    if (!email || !token) {
      throw new Error("Email and verification code are required.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // Primary attempt: type 'signup' for email confirmation OTPs
    let { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type: "signup",
    });

    if (error) {
      // Secondary attempt: type 'email' fallback
      const fallbackRes = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: "email",
      });
      if (!fallbackRes.error) {
        data = fallbackRes.data;
        error = null;
      }
    }

    if (error) {
      console.warn(`[Auth Diagnostic] Supabase verifyOtp error: status=${error.status}, code=${error.code || 'none'}, message=${error.message}`);
      if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.message?.includes("rate limit")) {
        throw new Error("Too many verification attempts. Please wait a few minutes before trying again.");
      }
      if (error.message?.includes("expired") || error.code === "otp_expired") {
        throw new Error("Verification code has expired. Please request a new code.");
      }
      throw new Error("Invalid verification code. Please check your email and try again.");
    }

    console.log("[Auth Diagnostic] Supabase verifyOtp succeeded for:", normalizedEmail);

    if (data?.user) {
      const fbUser = { ...data.user, uid: data.user.id } as FirebaseUser;
      setFirebaseUser(fbUser);
      await loadProfile(fbUser);
    }

    return true;
  };

  const getRedirectUrl = () => {

    let url = window.location.origin;
    // ensure no trailing slash
    url = url.endsWith('/') ? url.slice(0, -1) : url;
    return url; 
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    console.log("[Auth] Google sign-in started. Redirect URL:", getRedirectUrl());
    if (!isSupabaseConfigured) {
      console.warn("[Auth] Supabase environment variables missing.");
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      console.log("[Auth] Google sign-in initiated successfully. Data:", data ? "OAuth URL generated" : "No data");
      if (error) {
        console.warn("[Auth] Google sign-in OAuth error:", error.message, error.status);
        throw error;
      }
      return true;
    } catch (err: any) {
      console.warn("[Auth] Google sign-in failed:", err.message || err);
      throw err;
    }
  };

  const requestGoogleToken = (scopes: string, key: keyof GoogleTokens): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const w = window as any;
      if (!w.google?.accounts?.oauth2) {
        reject(new Error("Google Identity Services script not loaded."));
        return;
      }
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error("Missing VITE_GOOGLE_CLIENT_ID environment variable. Google Workspace integrations require an OAuth Client ID."));
        return;
      }
      const client = w.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: scopes,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setGoogleTokens((prev) => ({ ...prev, [key]: tokenResponse.access_token }));
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error("Failed to get Google Access Token."));
          }
        },
        error_callback: (error: any) => {
          reject(error);
        },
      });
      client.requestAccessToken();
    });
  };

  const connectGoogleCalendar = async (): Promise<string | null> => {
    return requestGoogleToken(
      "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      "calendar"
    );
  };

  const connectGoogleDocs = async (): Promise<string | null> => {
    return requestGoogleToken(
      "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
      "docs"
    );
  };

  const connectGoogleSlides = async (): Promise<string | null> => {
    return requestGoogleToken(
      "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/presentations.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
      "slides"
    );
  };

  const connectGoogleTasks = async (): Promise<string | null> => {
    return requestGoogleToken(
      "https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly",
      "tasks"
    );
  };

  const connectGmail = async (): Promise<string | null> => {
    return requestGoogleToken(
      "https://mail.google.com/ https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
      "gmail"
    );
  };

  const connectGoogleForms = async (): Promise<string | null> => {
    if (!isAdmin) {
      throw new Error("Google Forms integration is restricted to Super Admin only.");
    }
    return requestGoogleToken(
      "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly",
      "forms"
    );
  };

  const connectGooglePicker = async (): Promise<string | null> => {
    return requestGoogleToken(
      "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly",
      "picker"
    );
  };

  const logout = async () => {
    sessionStorage.removeItem("islamroots_session_guest");
    localStorage.removeItem("islamroots_guest_teacher");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    setTeacher(null);
    setFirebaseUser(null);
    setGoogleTokens({});
    setIsSuperAdminClaim(false);
  };

  const resetPassword = async (email: string) => {
    if (!email) throw new Error("Email is required.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    if (error) {
      if (error.status === 429 || error.message?.includes("rate limit") || error.code === "over_email_send_rate_limit") {
        throw new Error("Too many requests. Please wait a few minutes and try again.");
      }
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateProfile = async (updatedData: Partial<Teacher>) => {
    if (teacher) {
      const updated = { ...teacher, ...updatedData };
      setTeacher(updated);
      if (teacher.id === "guest-ustadh-101") {
        localStorage.setItem("islamroots_guest_teacher", JSON.stringify(updated));
      } else if (firebaseUser) {
        try {
          const dbData: any = {};
          if (updatedData.fullName !== undefined) dbData.full_name = updatedData.fullName;
          if (updatedData.displayName !== undefined) {
            dbData.display_name = updatedData.displayName;
            dbData.name = updatedData.displayName;
          }
          if (updatedData.name !== undefined && updatedData.displayName === undefined) dbData.name = updatedData.name;
          if (updatedData.arabicName !== undefined) dbData.arabic_name = updatedData.arabicName;
          if (updatedData.country !== undefined) {
            dbData.country = updatedData.country;
            dbData.location = updatedData.country;
          }
          if (updatedData.teachingLanguage !== undefined) {
            dbData.teaching_language = updatedData.teachingLanguage;
            dbData.preferred_language = updatedData.teachingLanguage;
          }
          if (updatedData.gender !== undefined) dbData.gender = updatedData.gender;
          if (updatedData.yearsExperience !== undefined) {
            const num = updatedData.yearsExperience ? Number(updatedData.yearsExperience) : null;
            dbData.years_experience = num;
            dbData.years_of_experience = num;
          }
          if (updatedData.specializations !== undefined) dbData.specializations = updatedData.specializations;
          if (updatedData.bio !== undefined) {
            dbData.bio = updatedData.bio;
            dbData.purpose = updatedData.bio;
          }
          if (updatedData.profileCompleted !== undefined || updatedData.onboardingCompleted !== undefined) {
            const val = updatedData.profileCompleted ?? updatedData.onboardingCompleted ?? true;
            dbData.profile_completed = val;
            dbData.onboarding_completed = val;
            if (val) {
              dbData.profile_completed_at = new Date().toISOString();
            }
          }
          if (updatedData.timezone !== undefined) dbData.timezone = updatedData.timezone;
          if (updatedData.reminderMinutes !== undefined) dbData.reminder_minutes = updatedData.reminderMinutes;
          if (updatedData.reminderSoundEnabled !== undefined) dbData.reminder_sound_enabled = updatedData.reminderSoundEnabled;
          if (updatedData.reminderVibrationEnabled !== undefined) dbData.reminder_vibration_enabled = updatedData.reminderVibrationEnabled;

          if (Object.keys(dbData).length > 0) {
            const { error } = await supabase.from("teachers").update(dbData).eq("id", firebaseUser.uid);
            if (error) {
              console.warn("[Auth] Primary update returned error, attempting fallback update:", error.message);
              const fallbackDbData: any = {};
              if (dbData.name || dbData.display_name || dbData.full_name) fallbackDbData.name = dbData.display_name || dbData.full_name || dbData.name;
              if (dbData.location || dbData.country) fallbackDbData.location = dbData.country || dbData.location;
              if (dbData.preferred_language || dbData.teaching_language) fallbackDbData.preferred_language = dbData.teaching_language || dbData.preferred_language;
              if (dbData.years_of_experience || dbData.years_experience) fallbackDbData.years_of_experience = dbData.years_experience || dbData.years_of_experience;
              if (dbData.purpose || dbData.bio) fallbackDbData.purpose = dbData.bio || dbData.purpose;
              if (dbData.timezone) fallbackDbData.timezone = dbData.timezone;
              if (dbData.onboarding_completed !== undefined) fallbackDbData.onboarding_completed = dbData.onboarding_completed;

              const { error: fallbackErr } = await supabase.from("teachers").update(fallbackDbData).eq("id", firebaseUser.uid);
              if (fallbackErr) throw fallbackErr;
            }
          }
        } catch (e) {
          console.error("Failed to update teacher profile in Supabase:", e);
          throw e;
        }
      }
    }
  };

  const isGuest = Boolean(teacher?.id === "guest-ustadh-101" || teacher?.isGuest);

  const isAdmin = Boolean(
    (teacher?.email && teacher.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
      (firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );
  
  // Note: isSuperAdminClaim is now populated during teacher lookup in onAuthStateChange
  const [isSuperAdminClaim, setIsSuperAdminClaim] = useState(false);
  
  const effectiveIsAdmin = isAdmin || isSuperAdminClaim;
  

  return (
    <AuthContext.Provider
      value={{
        teacher,
        firebaseUser,
        googleTokens,
        isAuthenticated: !!teacher,
        isGuest,
        isAdmin: effectiveIsAdmin,
        loading,
        login,
        signup,
        resendVerificationEmail,
        verifyOtp,
        updatePassword,
        loginWithGoogle,
        connectGoogleCalendar,
        connectGoogleDocs,
        connectGoogleSlides,
        connectGoogleTasks,
        connectGmail,
        connectGoogleForms,
        connectGooglePicker,
        loginAsGuest,
        logout,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
