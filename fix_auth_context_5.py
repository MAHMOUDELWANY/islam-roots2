import re

with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

new_signup = """
  const signup = async (name: string, username: string, password?: string): Promise<boolean> => {
    if (!password) {
      throw new Error("Password is required to sign up.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Authentication service is not configured. Please contact the administrator.");
    }
    
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const authEmail = `${normalizedUsername}@system.local`;

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
       throw error;
    }
    
    return true;
  };
"""

content = re.sub(
    r"  const signup = async \(name: string, username: string, password\?: string\): Promise<boolean> => \{.*?return true;\n  \};",
    new_signup.strip(),
    content,
    flags=re.DOTALL
)

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(content)
