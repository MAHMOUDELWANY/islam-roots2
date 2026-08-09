import fs from 'fs';

let authCode = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');

authCode = authCode.replace(
  `const [googleTokens, setGoogleTokens] = useState<GoogleTokens>({});`,
  `const [googleTokens, setGoogleTokens] = useState<GoogleTokens>(() => {
    try {
      const stored = sessionStorage.getItem("googleTokens");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  useEffect(() => {
    sessionStorage.setItem("googleTokens", JSON.stringify(googleTokens));
  }, [googleTokens]);`
);

fs.writeFileSync('src/context/AuthContext.tsx', authCode);
