import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bingo_secret_key_2026';

export interface AuthPayload {
  uid: string;
  phone: string;
  displayName: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token from the Authorization header.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

/**
 * Admin role middleware — must be used after authenticate.
 * Checks that the user has an admin role (operator or super-admin).
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const role = req.user.role;
  if (role !== 'operator' && role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }

  next();
}

/**
 * Generate a JWT token for a user.
 */
export function signToken(payload: AuthPayload, expiresIn: string = '30d'): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: expiresIn as any });
}
