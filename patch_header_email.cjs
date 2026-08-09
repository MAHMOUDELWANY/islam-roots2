const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

const target = `<p className="text-[#7A7D75] dark:text-stone-400 truncate">{teacher?.email}</p>`;
const replacement = `<p className="text-[#7A7D75] dark:text-stone-400 truncate">{teacher?.email?.includes('@islamroots.internal') ? teacher.name : teacher?.email}</p>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/layout/Header.tsx', content);
    console.log("Patched Header email");
} else {
    console.log("Target not found in Header");
}
