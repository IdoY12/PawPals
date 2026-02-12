import { IUser } from '../models/User';
export interface JWTPayload {
    userId: string;
    email: string;
    userType: string;
}
/**
 * Generate JWT token for a user
 */
export declare const generateToken: (user: IUser) => string;
/**
 * Verify JWT token and return user
 */
export declare const verifyToken: (token: string) => Promise<IUser | null>;
/**
 * Decode token without verification (for debugging)
 */
export declare const decodeToken: (token: string) => JWTPayload | null;
/**
 * Auth payload returned after login/register
 */
export interface AuthPayload {
    token: string;
    user: IUser;
}
//# sourceMappingURL=jwt.d.ts.map