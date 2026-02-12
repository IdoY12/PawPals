"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
// Get JWT secret from environment
const getJWTSecret = () => {
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
const generateToken = (user) => {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        userType: user.userType,
    };
    return jsonwebtoken_1.default.sign(payload, getJWTSecret(), {
        expiresIn: TOKEN_EXPIRATION,
    });
};
exports.generateToken = generateToken;
/**
 * Verify JWT token and return user
 */
const verifyToken = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getJWTSecret());
        const user = await User_1.User.findById(decoded.userId);
        return user;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token has expired');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        throw error;
    }
};
exports.verifyToken = verifyToken;
/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
};
exports.decodeToken = decodeToken;
//# sourceMappingURL=jwt.js.map