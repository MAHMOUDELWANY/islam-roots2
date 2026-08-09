import fs from 'fs';

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const adminEndpoint = `
  // API: Grant Super Admin Claim
  app.post("/api/auth/claim-admin", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const adminEmail = "mhmwdlwany4222@gmail.com";
      if (user.email && user.email.toLowerCase() === adminEmail.toLowerCase() && user.email_verified) {
        const { adminAuth } = await import("./src/lib/firebase-admin");
        await adminAuth.setCustomUserClaims(user.uid, { superAdmin: true });
        return res.json({ success: true, message: "Super admin claim granted" });
      }
      
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    } catch (err: any) {
      console.error("Error setting custom claim:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
`;

if (!serverCode.includes('/api/auth/claim-admin')) {
  serverCode = serverCode.replace('  // API Health Check', adminEndpoint + '\n  // API Health Check');
  fs.writeFileSync('server.ts', serverCode);
}
