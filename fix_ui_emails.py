import re

with open('src/components/layout/Header.tsx', 'r') as f:
    header = f.read()

header = header.replace(
    "{teacher?.email?.includes('@users.islamroots.local') ? teacher.name : teacher?.email}",
    "{teacher?.username ? `@${teacher.username}` : (teacher?.email?.includes('@internal.islamroots.local') || teacher?.email?.includes('@users.islamroots.local') ? teacher.name : teacher?.email)}"
)

with open('src/components/layout/Header.tsx', 'w') as f:
    f.write(header)

with open('src/components/settings/SettingsView.tsx', 'r') as f:
    settings = f.read()

settings = settings.replace(
    'type={email.includes("@users.islamroots.local") ? "text" : "email"}',
    'type={(email.includes("@users.islamroots.local") || email.includes("@internal.islamroots.local") || email === "") ? "text" : "email"}'
)

settings = settings.replace(
    'value={email.includes("@users.islamroots.local") ? email.split("@")[0] : email}',
    'value={teacher?.username || (email.includes("@users.islamroots.local") || email.includes("@internal.islamroots.local") ? email.split("@")[0] : email)}'
)

settings = settings.replace(
    'disabled={email.includes("@users.islamroots.local")}',
    'disabled={email.includes("@users.islamroots.local") || email.includes("@internal.islamroots.local")}'
)

with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(settings)

