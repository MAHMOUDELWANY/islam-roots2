import { Request, Response, NextFunction } from "express";
import { User } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured, supabaseAdmin } from "../lib/supabase-admin";

export interface AuthRequest extends Request {
  user?: User & { uid?: string; email_verified?: boolean };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    console.error("[Auth] Protected server route rejected because Supabase admin credentials are not configured.");
    return res.status(503).json({ error: "Authentication service is unavailable." });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.error("[Auth] Supabase token verification failed.", error?.code || error?.status || "unknown");
      return res.status(401).json({ error: "Unauthorized." });
    }

    req.user = {
      ...user,
      uid: user.id,
      email_verified: Boolean(user.email_confirmed_at) || user.app_metadata?.provider === "google",
    };

    next();
  } catch (error: any) {
    console.error("[Auth] Supabase token verification failed.", error?.code || error?.status || "unknown");
    return res.status(401).json({ error: "Unauthorized." });
  }
};
