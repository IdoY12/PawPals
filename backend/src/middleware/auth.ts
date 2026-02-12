import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { IUser } from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Express middleware for authentication
 * Extracts JWT from Authorization header and attaches user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const user = await verifyToken(token);
    
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Token is invalid, continue without user
    console.error('Auth middleware error:', error);
    next();
  }
};

/**
 * Express middleware to require authentication
 * Use after authMiddleware for protected routes
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};

/**
 * Express middleware to require specific user type
 */
export const requireUserType = (userType: 'owner' | 'sitter') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.userType !== userType) {
      res.status(403).json({ error: `Only ${userType}s can access this resource` });
      return;
    }

    next();
  };
};

export default authMiddleware;
