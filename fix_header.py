import re

with open('src/components/layout/Header.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "{teacher?.username ? `@${teacher.username}` : (teacher?.email?.includes('@internal.islamroots.local') || teacher?.email?.includes('@users.islamroots.local') ? teacher.name : teacher?.email)}",
    "{teacher?.username ? `@${teacher.username}` : teacher?.email}"
)

with open('src/components/layout/Header.tsx', 'w') as f:
    f.write(content)
