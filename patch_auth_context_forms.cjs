const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const targetStr = `  const connectGoogleForms = async (): Promise<string | null> => {
    return requestGoogleToken(`;

const replaceStr = `  const connectGoogleForms = async (): Promise<string | null> => {
    if (!isAdmin) {
      throw new Error("Google Forms integration is restricted to Super Admin only.");
    }
    return requestGoogleToken(`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/context/AuthContext.tsx', content);
