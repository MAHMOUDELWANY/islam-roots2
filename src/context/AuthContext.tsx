import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
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

// Ensure your OAuth Client ID matches the one in firebase-applet-config.json or GCP console.
const GOOGLE_CLIENT_ID = "517603962496-8ts3iq4f3fdtlodofujkbdfcknu86ffb.apps.googleusercontent.com";

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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[Auth] Auth state changed. Firebase User:", user ? user.uid : "null");
      setFirebaseUser(user);
      if (user) {
        console.log("[Auth] Firebase UID received:", user.uid);
        sessionStorage.removeItem("islamroots_session_guest");
        localStorage.removeItem("islamroots_guest_teacher");

        const fallbackTeacher: Teacher = {
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "Ustadh",
          email: user.email || "",
          preferredLanguage: "en",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
        };

        try {
          console.log("[Auth] Firestore teacher lookup started for UID:", user.uid);
          const docRef = doc(db, "teachers", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("[Auth] Teacher lookup succeeded: Profile found in Firestore.");
            const data = docSnap.data();
            setTeacher({
              id: user.uid,
              name: data.name || user.displayName || "Ustadh",
              email: data.email || user.email || "",
              preferredLanguage: data.preferredLanguage || "en",
              age: data.age,
              yearsOfExperience: data.yearsOfExperience,
              purpose: data.purpose,
              location: data.location,
              onboardingCompleted: data.onboardingCompleted ?? true,
              tourCompleted: data.tourCompleted ?? false,
              timezone: data.timezone,
              reminderMinutes: data.reminderMinutes,
              reminderSoundEnabled: data.reminderSoundEnabled,
              reminderVibrationEnabled: data.reminderVibrationEnabled,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          } else {
            console.log("[Auth] Teacher lookup: No profile document found. Creating teacher profile in Firestore.");
            setTeacher(fallbackTeacher);
            setDoc(docRef, fallbackTeacher)
              .then(() => console.log("[Auth] Teacher profile document created successfully in Firestore."))
              .catch((e) =>
                console.warn("[Auth] Async setDoc for teacher doc failed gracefully:", e)
              );
          }
        } catch (err) {
          console.warn("[Auth] Teacher lookup failed in Firestore, defaulting to Auth profile:", err);
          setTeacher(fallbackTeacher);
        }
      } else if (!sessionStorage.getItem("islamroots_session_guest")) {
        setTeacher(null);
      }
      setLoading(false);
      console.log("[Auth] Final authentication state updated. Authenticated:", !!user);
    });

    return () => unsubscribe();
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
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  };

  const signup = async (name: string, email: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error("Password is required to sign up.");
    }
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const newTeacher: Teacher = {
      id: res.user.uid,
      name: name || "Teacher",
      email: email,
      preferredLanguage: "en",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "teachers", res.user.uid), newTeacher);
    setTeacher(newTeacher);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    console.log("[Auth] Google sign-in started");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      if (result.user.email && result.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        try {
          const token = await result.user.getIdToken();
          await fetch("/api/auth/claim-admin", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          // Force token refresh to get the new claim
          await result.user.getIdToken(true);
        } catch (e) {
          console.error("Failed to claim admin:", e);
        }
      }
      console.log("[Auth] Google sign-in succeeded. User UID:", result.user.uid);
      return true;
    } catch (err) {
      console.error("[Auth] Google sign-in failed:", err);
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
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    setTeacher(null);
    setFirebaseUser(null);
    setGoogleTokens({});
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (updatedData: Partial<Teacher>) => {
    if (teacher) {
      const updated = { ...teacher, ...updatedData };
      setTeacher(updated);
      if (teacher.id === "guest-ustadh-101") {
        localStorage.setItem("islamroots_guest_teacher", JSON.stringify(updated));
      } else if (firebaseUser) {
        try {
          await updateDoc(doc(db, "teachers", firebaseUser.uid), updatedData);
        } catch (e) {
          console.error("Failed to update teacher profile in Firestore:", e);
        }
      }
    }
  };

  const isGuest = Boolean(teacher?.id === "guest-ustadh-101" || teacher?.isGuest);

  const isAdmin = Boolean(
    (teacher?.email && teacher.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
      (firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );
  
  // Actually, let's also read the claim from the token
  const [isSuperAdminClaim, setIsSuperAdminClaim] = useState(false);
  
  useEffect(() => {
    if (firebaseUser) {
      firebaseUser.getIdTokenResult().then(idTokenResult => {
        setIsSuperAdminClaim(!!idTokenResult.claims.superAdmin);
      }).catch(console.error);
    } else {
      setIsSuperAdminClaim(false);
    }
  }, [firebaseUser]);
  
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
