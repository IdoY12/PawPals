"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserType = exports.requireAuth = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
/**
 * Express middleware for authentication
 * Extracts JWT from Authorization header and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return next();
        }
        const user = await (0, jwt_1.verifyToken)(token);
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        // Token is invalid, continue without user
        console.error('Auth middleware error:', error);
        next();
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Express middleware to require authentication
 * Use after authMiddleware for protected routes
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
/**
 * Express middleware to require specific user type
 */
const requireUserType = (userType) => {
    return (req, res, next) => {
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
exports.requireUserType = requireUserType;
exports.default = exports.authMiddleware;
//# sourceMappingURL=auth.js.map