const fs = require('fs');
let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const target = `<div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Forms</span>`;

const replacement = `{isAdmin && (<div className="p-4 rounded-lg bg-[#FCFAF5] dark:bg-[#232B23] border border-[#E8E5DB] dark:border-[#2A352A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F261F] dark:text-[#E2E8E2]">Google Forms</span>`;

content = content.replace(target, replacement);

const targetEnd = `                {googleTokens.forms ? "Reconnect Forms" : "Connect Forms"}
              </button>
            </div>`;

// Be careful, this might match other cards if they look exactly like this. 
// Instead let's just do a manual replace of the specific block.
// Or just match everything from Google Forms to the end of the div.
const fullRegex = /<div className="p-4 rounded-lg bg=\[#FCFAF5\][^>]*>[\s\S]*?<span className="font-bold text=\[#1F261F\] dark:text=\[#E2E8E2\]">Google Forms<\/span>[\s\S]*?\{googleTokens\.forms \? "Reconnect Forms" : "Connect Forms"\}[\s\S]*?<\/button>\s*<\/div>/;

if (content.match(fullRegex)) {
    content = content.replace(fullRegex, (match) => {
        return `{isAdmin && (${match})}`;
    });
    fs.writeFileSync('src/components/settings/SettingsView.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Regex didn't match");
}
