import re

with open('src/components/auth/AuthModal.tsx', 'r') as f:
    content = f.read()

new_catch = """
      if (message.includes("Invalid username or password") || message.includes("Invalid login credentials") || code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setErrorMsg(isRTL ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password");
      } else if (message.includes("Username already exists") || message.includes("already exists") || message.includes("User already registered") || code === "auth/email-already-in-use") {
        setErrorMsg(isRTL ? "اسم المستخدم مستخدم بالفعل" : "Username already exists");
      } else if (message.includes("Password should be") || message.includes("weak") || code === "auth/weak-password") {
        setErrorMsg(isRTL ? "كلمة المرور ضعيفة جداً" : "Password is too weak");
      } else if (message.includes("Email signups are disabled") || code === "auth/operation-not-allowed") {
        setErrorMsg(isRTL ? "تسجيل الدخول معطل. يرجى تفعيله (Email/Password) في إعدادات Supabase." : "Username sign-in is disabled. Please enable Email/Password authentication in Supabase.");
      } else if (message.includes("rate limit") || code === "over_email_send_rate_limit") {
        setErrorMsg(isRTL ? "تم تجاوز حد المحاولات. يرجى المحاولة لاحقاً." : "Too many signup attempts. Please try again later.");
      } else if (message.includes("Authentication service is not configured")) {
"""

content = re.sub(
    r"      if \(message\.includes\(\"Invalid username or password\"\).*?      \} else if \(message\.includes\(\"Authentication service is not configured\"\)\) \{",
    new_catch.strip() + " {\n",
    content,
    flags=re.DOTALL
)

with open('src/components/auth/AuthModal.tsx', 'w') as f:
    f.write(content)
