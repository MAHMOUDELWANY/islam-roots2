import fs from 'fs';

let authCode = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');

// Replace isAdmin logic
authCode = authCode.replace(
  /const isAdmin = Boolean\([\s\S]*?\);/,
  `const isAdmin = Boolean(
    (teacher?.email && teacher.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
      (firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );
  
  // Actually, let's also read the claim from the token
  const [isSuperAdminClaim, setIsSuperAdminClaim] = useState(false);
  
  useEffect(() => {
    if (firebaseUser) {
      firebaseUser.getIdTokenResult().then(idTokenResult => {
        setIsSuperAdminClaim(!!idTokenResult.claims.superAdmin);
      }).catch(console.error);
    } else {
      setIsSuperAdminClaim(false);
    }
  }, [firebaseUser]);
  
  const effectiveIsAdmin = isAdmin || isSuperAdminClaim;
  `
);

// We need to export effectiveIsAdmin as isAdmin
authCode = authCode.replace(
  /isAdmin,/g,
  `isAdmin: effectiveIsAdmin,`
);

// Add API call after Google login
authCode = authCode.replace(
  /const result = await signInWithPopup\(auth, provider\);/,
  `const result = await signInWithPopup(auth, provider);
      if (result.user.email && result.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        try {
          const token = await result.user.getIdToken();
          await fetch("/api/auth/claim-admin", {
            method: "POST",
            headers: {
              "Authorization": \`Bearer \${token}\`
            }
          });
          // Force token refresh to get the new claim
          await result.user.getIdToken(true);
        } catch (e) {
          console.error("Failed to claim admin:", e);
        }
      }`
);

fs.writeFileSync('src/context/AuthContext.tsx', authCode);
