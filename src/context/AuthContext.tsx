import React, { createContext, useContext, useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
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
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
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
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      console.log("[Auth] Auth state changed. Supabase User:", user ? user.id : "null");
      
      if (user) {
        const userWithUid: FirebaseUser = { ...user, uid: user.id } as FirebaseUser;
        setFirebaseUser(userWithUid);
        console.log("[Auth] Supabase User ID received:", user.id);
        sessionStorage.removeItem("islamroots_session_guest");
        localStorage.removeItem("islamroots_guest_teacher");

        const fallbackTeacher: Teacher = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Ustadh",
          email: user.email || "",
          preferredLanguage: "en",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
        };

        try {
          console.log("[Auth] Supabase teacher lookup started for ID:", user.id);
          const { data, error } = await supabase.from("teachers").select("*").eq("id", user.id).single();

          if (data && !error) {
            console.log("[Auth] Teacher lookup succeeded: Profile found in Supabase.");
            setTeacher({
              id: user.id,
              name: data.name || user.user_metadata?.full_name || "Ustadh",
              email: data.email || user.email || "",
              preferredLanguage: data.preferred_language || "en",
              age: data.age,
              yearsOfExperience: data.years_of_experience,
              purpose: data.purpose,
              location: data.location,
              onboardingCompleted: data.onboarding_completed ?? true,
              tourCompleted: data.tour_completed ?? false,
              timezone: data.timezone,
              reminderMinutes: data.reminder_minutes,
              reminderSoundEnabled: data.reminder_sound_enabled,
              reminderVibrationEnabled: data.reminder_vibration_enabled,
              createdAt: data.created_at || new Date().toISOString(),
            });
            setIsSuperAdminClaim(!!data.is_super_admin);
          } else {
            console.log("[Auth] Teacher lookup: No profile document found. Creating teacher profile in Supabase.");
            setTeacher(fallbackTeacher);
            setIsSuperAdminClaim(false);
            
            supabase.from("teachers").insert({
              id: user.id,
              name: fallbackTeacher.name,
              email: fallbackTeacher.email,
              preferred_language: fallbackTeacher.preferredLanguage,
              onboarding_completed: fallbackTeacher.onboardingCompleted,
              created_at: fallbackTeacher.createdAt
            }).then(({ error: insertErr }) => {
               if (insertErr) {
                 console.warn("[Auth] Async insert for teacher row failed gracefully:", insertErr);
               } else {
                 console.log("[Auth] Teacher profile row created successfully in Supabase.");
               }
            });
          }
        } catch (err) {
          console.warn("[Auth] Teacher lookup failed in Supabase, defaulting to Auth profile:", err);
          setTeacher(fallbackTeacher);
          setIsSuperAdminClaim(false);
        }
      } else {
        setFirebaseUser(null);
        setIsSuperAdminClaim(false);
        if (!sessionStorage.getItem("islamroots_session_guest")) {
          setTeacher(null);
        }
      }
      setLoading(false);
      console.log("[Auth] Final authentication state updated. Authenticated:", !!user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsGuest = (name: string = "Ustadh Guest") => {
    const guestTeacher: Teacher = {
      id: "guest-ustadh-101",
      name,
      email: "guest@islamroots.org",
      preferredLanguage: "en",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    setTeacher(guestTeacher);
    sessionStorage.setItem("islamroots_session_guest", JSON.stringify(guestTeacher));
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error("Password is required to sign in.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
  };

  const signup = async (name: string, email: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error("Password is required to sign up.");
    }
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    
    if (data.user) {
      const newTeacher: Teacher = {
        id: data.user.id,
        name: name || "Teacher",
        email: email,
        preferredLanguage: "en",
        createdAt: new Date().toISOString(),
      };
      
      const { error: insertErr } = await supabase.from("teachers").insert({
        id: data.user.id,
        name: newTeacher.name,
        email: newTeacher.email,
        preferred_language: newTeacher.preferredLanguage,
        created_at: newTeacher.createdAt
      });
      if (insertErr) {
        console.error("Failed to create teacher row", insertErr);
      }
      setTeacher(newTeacher);
    }
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    console.log("[Auth] Google sign-in started");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("[Auth] Google sign-in failed:", err);
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
        reject(new Error("Missing VITE_GOOGLE_OAUTH_CLIENT_ID environment variable. Google Workspace integrations require an OAuth Client ID."));
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
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
          // Convert camelCase to snake_case
          const dbData: any = {};
          if (updatedData.name !== undefined) dbData.name = updatedData.name;
          if (updatedData.preferredLanguage !== undefined) dbData.preferred_language = updatedData.preferredLanguage;
          if (updatedData.age !== undefined) dbData.age = updatedData.age;
          if (updatedData.yearsOfExperience !== undefined) dbData.years_of_experience = updatedData.yearsOfExperience;
          if (updatedData.purpose !== undefined) dbData.purpose = updatedData.purpose;
          if (updatedData.location !== undefined) dbData.location = updatedData.location;
          if (updatedData.timezone !== undefined) dbData.timezone = updatedData.timezone;
          if (updatedData.reminderMinutes !== undefined) dbData.reminder_minutes = updatedData.reminderMinutes;
          if (updatedData.reminderSoundEnabled !== undefined) dbData.reminder_sound_enabled = updatedData.reminderSoundEnabled;
          if (updatedData.reminderVibrationEnabled !== undefined) dbData.reminder_vibration_enabled = updatedData.reminderVibrationEnabled;
          
          if (Object.keys(dbData).length > 0) {
            const { error } = await supabase.from("teachers").update(dbData).eq("id", firebaseUser.uid);
            if (error) throw error;
          }
        } catch (e) {
          console.error("Failed to update teacher profile in Supabase:", e);
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
