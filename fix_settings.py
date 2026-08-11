import re

with open('src/components/settings/SettingsView.tsx', 'r') as f:
    content = f.read()

replacement = """
            {teacher?.username ? (
              <div className="space-y-1">
                <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                  Username
                </label>
                <input
                  type="text"
                  value={teacher.username}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#f5f5f5] dark:bg-[#1f261f] text-[#7A7D75] dark:text-[#9EA89E] text-xs font-medium focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-semibold text-[#2D332D] dark:text-[#E2E8E2]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E5DB] dark:border-[#2A352A] bg-[#FCFAF5] dark:bg-[#232B23] text-[#1F261F] dark:text-[#E2E8E2] text-xs font-medium focus:outline-none focus:border-[#5A6B5A]"
                />
              </div>
            )}
"""

content = re.sub(
    r'<div className="space-y-1">\s*<label className="font-semibold text-\[#2D332D\] dark:text-\[#E2E8E2\]">\s*Email Address\s*</label>\s*<input\s*type=\{\(email\.includes.*?/>\s*</div>',
    replacement.strip(),
    content,
    flags=re.DOTALL
)

with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(content)

