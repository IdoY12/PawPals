import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/User';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
}

// Get JWT secret from environment
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

// Token expiration time (7 days)
const TOKEN_EXPIRATION = '7d';

/**
 * Generate JWT token for a user
 */
export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  };

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: TOKEN_EXPIRATION,
  });
};

/**
 * Verify JWT token and return user
 */
export const verifyToken = async (token: string): Promise<IUser | null> => {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
    const user = await User.findById(decoded.userId);
    return user;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Auth payload returned after login/register
 */
export interface AuthPayload {
  token: string;
  user: IUser;
}
