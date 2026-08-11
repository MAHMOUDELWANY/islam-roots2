import re

with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

# Replace guest email
content = content.replace(
    'email: "guest@internal.islamroots.local",',
    'email: "",'
)

# Replace getInternalEmail entirely
# We'll just define the suffix inline in login and signup
new_login_signup = """
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
      if (error.message.includes('email') || error.message.includes('credentials')) {
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
"""

content = re.sub(
    r"  const getInternalEmail = \(username: string\) => \{.*?return true;\n  \};\n",
    new_login_signup.strip() + "\n",
    content,
    flags=re.DOTALL
)

# Update fallbackTeacher in loadProfile
new_fallback = """
           const fallbackTeacher = {
             id: user.id,
             username: user.user_metadata?.username || null,
             name: user.user_metadata?.full_name || "Ustadh",
             email: (user.email && user.email.includes("@system.local")) ? "" : (user.email || ""),
             preferred_language: "en",
             onboarding_completed: true,
             created_at: new Date().toISOString(),
           };
"""
content = re.sub(
    r"           const fallbackTeacher = \{.*?\};\n",
    new_fallback.strip() + "\n",
    content,
    flags=re.DOTALL
)

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(content)

