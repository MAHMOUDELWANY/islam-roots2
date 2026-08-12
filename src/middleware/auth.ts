import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin';
import { User } from '@supabase/supabase-js';

export interface AuthRequest extends Request {
  user?: User & { uid?: string, email_verified?: boolean };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Error verifying Supabase token. Code:', error?.code || error?.status);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Add compatibility properties for downstream handlers (e.g. server.ts expects uid and email_verified)
    req.user = {
      ...user,
      uid: user.id,
      email_verified: !!user.email_confirmed_at || user.app_metadata?.provider === 'google'
    };
    
    next();
  } catch (error: any) {
    console.error('Error verifying Supabase token. Code:', error?.code || error?.status);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
