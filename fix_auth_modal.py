import re

with open('src/components/auth/AuthModal.tsx', 'r') as f:
    content = f.read()

replacement = """
    // Basic format validation
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 32 || !/^[a-z0-9_.-]+$/.test(normalizedUsername)) {
      setErrorMsg(isRTL ? "اسم المستخدم غير صالح" : "Invalid username. Must be 3-32 characters (a-z, 0-9, ., _, -).");
      setUsernameSubmitting(false);
      return;
    }

    try {
      if (isSignUp) {
        await signup(normalizedUsername, normalizedUsername, password);
      } else {
        await login(normalizedUsername, password);
      }
"""

content = re.sub(
    r"// Normalize username to internal email.*?await login\(internalEmail, password\);\n      }",
    replacement.strip(),
    content,
    flags=re.DOTALL
)

with open('src/components/auth/AuthModal.tsx', 'w') as f:
    f.write(content)

