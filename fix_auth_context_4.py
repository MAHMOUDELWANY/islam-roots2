import re

with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

new_signup_error = """
    if (error) {
       throw error;
    }
"""

content = re.sub(
    r"    if \(error\) \{\s*if \(error\.message\.includes\('email'\) \|\| error\.message\.includes\('address'\)\) \{\s*throw new Error\(\"Invalid username format or already exists\.\"\);\s*\}\s*throw error;\s*\}",
    new_signup_error.lstrip(),
    content,
    flags=re.DOTALL
)

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(content)
