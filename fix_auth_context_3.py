import re

with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

new_block = """
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

  const login = async (username: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error("Password is required to sign in.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }
    
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const authEmail = `${normalizedUsername}@system.local`;

    // Explicitly clear local state and sign out before attempting to sign in to avoid session conflicts
    setTeacher(null);
    setFirebaseUser(null);
    setIsSuperAdminClaim(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Silent signout failed during login step", e);
    }

    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) {
      if (error.message.includes('email') || error.message.includes('credentials') || error.message.includes('Invalid login')) {
         throw new Error("Invalid username or password.");
      }
      throw error;
    }
    return true;
  };

  const signup = async (name: string, username: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error("Password is required to sign up.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }
    
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const authEmail = `${normalizedUsername}@system.local`;

    // Check username uniqueness (Application Layer)
    const { data: existingUser } = await supabase
      .from('teachers')
      .select('username')
      .ilike('username', normalizedUsername)
      .maybeSingle();
      
    if (existingUser) {
      throw new Error("Username already exists.");
    }

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
      email: authEmail, 
      password,
      options: { data: { full_name: name, username: normalizedUsername } }
    });

    if (error) {
       if (error.message.includes('email') || error.message.includes('address')) {
         throw new Error("Invalid username format or already exists.");
       }
       throw error;
    }
    
    return true;
  };

  const getRedirectUrl = () => {
"""

content = re.sub(
    r"  const loginAsGuest = \(name: string = \"Ustadh Guest\"\) => \{.*?  const getRedirectUrl = \(\) => \{",
    new_block.lstrip(),
    content,
    flags=re.DOTALL
)

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(content)

