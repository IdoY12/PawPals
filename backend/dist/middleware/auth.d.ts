import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
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
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Express middleware to require authentication
 * Use after authMiddleware for protected routes
 */
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Express middleware to require specific user type
 */
export declare const requireUserType: (userType: "owner" | "sitter") => (req: Request, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.d.ts.map