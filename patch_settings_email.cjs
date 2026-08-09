const fs = require('fs');
let content = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// Hide or replace the email input if it's internal
const target = `<input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}`;

const replacement = `<input
                type={email.includes("@islamroots.internal") ? "text" : "email"}
                required
                value={email.includes("@islamroots.internal") ? email.split("@")[0] : email}
                disabled={email.includes("@islamroots.internal")}
                onChange={(e) => setEmail(e.target.value)}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/settings/SettingsView.tsx', content);
    console.log("Patched email field");
} else {
    console.log("Target not found");
}
