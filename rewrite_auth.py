import re

with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

new_useEffect = """
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

  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async (user: FirebaseUser) => {
      try {
        setLoading(true);
        console.log("[Auth] Supabase teacher lookup started for ID:", user.id);
        
        sessionStorage.removeItem("islamroots_session_guest");
        localStorage.removeItem("islamroots_guest_teacher");
        
        const { data, error } = await supabase.from("teachers").select("*").eq("id", user.id).single();
        
        let teacherData = null;
        if (data && !error) {
          console.log("[Auth] Teacher lookup succeeded: Profile found in Supabase.");
          teacherData = data;
        } else {
           console.log("[Auth] Teacher lookup: No profile document found or error. Creating teacher profile in Supabase.");
           const fallbackTeacher = {
             id: user.id,
             name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Ustadh",
             email: user.email || "",
             preferred_language: "en",
             onboarding_completed: true,
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

        if (isMounted) {
            setTeacher({
              id: teacherData.id,
              name: teacherData.name || "Ustadh",
              email: teacherData.email || "",
              preferredLanguage: teacherData.preferred_language || "en",
              age: teacherData.age,
              yearsOfExperience: teacherData.years_of_experience,
              purpose: teacherData.purpose,
              location: teacherData.location,
              onboardingCompleted: teacherData.onboarding_completed ?? true,
              tourCompleted: teacherData.tour_completed ?? false,
              timezone: teacherData.timezone,
              reminderMinutes: teacherData.reminder_minutes,
              reminderSoundEnabled: teacherData.reminder_sound_enabled,
              reminderVibrationEnabled: teacherData.reminder_vibration_enabled,
              createdAt: teacherData.created_at || new Date().toISOString(),
            });
            setIsSuperAdminClaim(!!teacherData.is_super_admin);
        }

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
                if (isMounted) setIsSuperAdminClaim(true);
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
        if (isMounted) {
           setTeacher(null);
           setIsSuperAdminClaim(false);
        }
      } finally {
        if (isMounted) {
           setLoading(false);
           console.log("[Auth] Final authentication state updated.");
        }
      }
    };

    if (firebaseUser) {
       loadProfile(firebaseUser);
    }
  }, [firebaseUser]);
"""

pattern = r"  useEffect\(\(\) => \{\n    // Check if guest mode was explicitly chosen in session.*?    \};\n  \}, \[\]\);"

new_content = re.sub(pattern, new_useEffect.strip(), content, flags=re.DOTALL)

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(new_content)
