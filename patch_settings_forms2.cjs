const fs = require('fs');
let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// The block starts with <div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
// And has <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Forms</span>
// Ends with {googleTokens.forms ? "Reconnect Forms" : "Connect Forms"} </button> </div>
const matchRegex = /<div className="p-4 rounded-lg bg=\[#FCFAF5\].*?<span className="font-bold text=\[#1F261F\] dark:text=\[#E2E8E2\]">Google Forms<\/span>[\s\S]*?\{googleTokens\.forms \? "Reconnect Forms" : "Connect Forms"\}[\s\S]*?<\/button>\s*<\/div>/g;

content = content.replace(matchRegex, (match) => {
    return `{isAdmin && (${match})}`;
});

fs.writeFileSync('src/components/settings/SettingsView.tsx', content);
