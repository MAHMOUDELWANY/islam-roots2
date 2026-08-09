const fs = require('fs');
let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const targetStr = `            <div className="p-4 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#1C221C]">
              <h4 className="font-bold text-[#1F261F] dark:text-[#E2E8E2] text-sm mb-1">
                Google Forms
              </h4>
              <p className="text-xs text-[#7A7D75] mb-3">
                Connect Google Forms for automated quizzes.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await connectGoogleForms();
                    alert("Google Forms connected successfully!");
                  } catch (e: any) {
                    alert(e?.message || "Failed to connect Google Forms");
                  }
                }}
                className={\`text-xs font-bold py-1.5 px-3 rounded-lg border \${
                  googleTokens?.forms
                    ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#8BA888] text-[#3E4D3E] dark:text-[#8BA888]"
                    : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] dark:hover:bg-[#1C221C]"
                }\`}
              >
                {googleTokens?.forms ? "Connected" : "Connect"}
              </button>
            </div>`;

const replaceStr = `            {isAdmin && (<div className="p-4 rounded-xl border border-[#E8E5DB] dark:border-[#2A352A] bg-white dark:bg-[#1C221C]">
              <h4 className="font-bold text-[#1F261F] dark:text-[#E2E8E2] text-sm mb-1">
                Google Forms
              </h4>
              <p className="text-xs text-[#7A7D75] mb-3">
                Connect Google Forms for automated quizzes.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await connectGoogleForms();
                    alert("Google Forms connected successfully!");
                  } catch (e: any) {
                    alert(e?.message || "Failed to connect Google Forms");
                  }
                }}
                className={\`text-xs font-bold py-1.5 px-3 rounded-lg border \${
                  googleTokens?.forms
                    ? "bg-[#FCFAF5] dark:bg-[#232B23] border-[#8BA888] text-[#3E4D3E] dark:text-[#8BA888]"
                    : "bg-white dark:bg-[#161D17] border-[#E8E5DB] dark:border-[#2A352A] text-[#1F261F] dark:text-[#E2E8E2] hover:bg-[#F2EFE6] dark:hover:bg-[#1C221C]"
                }\`}
              >
                {googleTokens?.forms ? "Connected" : "Connect"}
              </button>
            </div>)}`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/settings/SettingsView.tsx', content);
