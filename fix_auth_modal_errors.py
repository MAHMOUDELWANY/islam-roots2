import re

with open('src/components/auth/AuthModal.tsx', 'r') as f:
    content = f.read()

new_catch = """
    } catch (err: any) {
      console.warn("Username Auth error:", err);
      const message = err?.message || err?.error_description || "";
      const code = err?.code || "";
      
      if (message.includes("Invalid username or password") || message.includes("Invalid login credentials") || code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setErrorMsg(isRTL ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password");
      } else if (message.includes("Username already exists") || message.includes("already exists") || message.includes("User already registered") || code === "auth/email-already-in-use") {
        setErrorMsg(isRTL ? "اسم المستخدم مستخدم بالفعل" : "Username already exists");
      } else if (message.includes("Password should be") || message.includes("weak") || code === "auth/weak-password") {
        setErrorMsg(isRTL ? "كلمة المرور ضعيفة جداً" : "Password is too weak");
      } else if (message.includes("Email signups are disabled") || code === "auth/operation-not-allowed") {
        setErrorMsg(isRTL ? "تسجيل الدخول معطل. يرجى تفعيله (Email/Password) في إعدادات Supabase." : "Username sign-in is disabled. Please enable Email/Password authentication in Supabase.");
      } else if (message.includes("Authentication service is not configured")) {
        setErrorMsg(isRTL ? "خدمة المصادقة غير مكوّنة. يرجى الاتصال بالمسؤول." : message);
      } else {
        setErrorMsg(isRTL ? "حدث خطأ أثناء المصادقة" : message || "An error occurred during authentication");
      }
    } finally {
"""

content = re.sub(
    r"    \} catch \(err: any\) \{.*?\} finally \{",
    new_catch.strip() + " {\n",
    content,
    flags=re.DOTALL,
    count=1
)

with open('src/components/auth/AuthModal.tsx', 'w') as f:
    f.write(content)
