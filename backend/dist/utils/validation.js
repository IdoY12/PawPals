"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = exports.sanitizeString = exports.throwNotFoundError = exports.throwValidationError = exports.throwForbiddenError = exports.throwAuthError = exports.validateDateRange = exports.validateCoordinates = exports.validatePhone = exports.validatePassword = exports.validateEmail = void 0;
const graphql_1 = require("graphql");
/**
 * Validation utilities for GraphQL resolvers
 */
// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone validation regex (basic)
const PHONE_REGEX = /^[+]?[\d\s-]{10,}$/;
/**
 * Validate email format
 */
const validateEmail = (email) => {
    return EMAIL_REGEX.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Validate password strength
 */
const validatePassword = (password) => {
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
};
exports.validatePassword = validatePassword;
/**
 * Validate phone number format
 */
const validatePhone = (phone) => {
    return PHONE_REGEX.test(phone);
};
exports.validatePhone = validatePhone;
/**
 * Validate coordinates
 */
const validateCoordinates = (coordinates) => {
    const [longitude, latitude] = coordinates;
    return (longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90);
};
exports.validateCoordinates = validateCoordinates;
/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (startDate < now) {
        return { valid: false, message: 'Start date cannot be in the past' };
    }
    if (endDate < startDate) {
        return { valid: false, message: 'End date must be after or equal to start date' };
    }
    return { valid: true };
};
exports.validateDateRange = validateDateRange;
/**
 * Throw authentication error
 */
const throwAuthError = (message = 'You must be logged in') => {
    throw new graphql_1.GraphQLError(message, {
        extensions: { code: 'UNAUTHENTICATED' },
    });
};
exports.throwAuthError = throwAuthError;
/**
 * Throw authorization error
 */
const throwForbiddenError = (message = 'Not authorized') => {
    throw new graphql_1.GraphQLError(message, {
        extensions: { code: 'FORBIDDEN' },
    });
};
exports.throwForbiddenError = throwForbiddenError;
/**
 * Throw validation error
 */
const throwValidationError = (message) => {
    throw new graphql_1.GraphQLError(message, {
        extensions: { code: 'BAD_USER_INPUT' },
    });
};
exports.throwValidationError = throwValidationError;
/**
 * Throw not found error
 */
const throwNotFoundError = (resource) => {
    throw new graphql_1.GraphQLError(`${resource} not found`, {
        extensions: { code: 'NOT_FOUND' },
    });
};
exports.throwNotFoundError = throwNotFoundError;
/**
 * Sanitize string input
 */
const sanitizeString = (input) => {
    return input.trim().replace(/[<>]/g, '');
};
exports.sanitizeString = sanitizeString;
/**
 * Calculate distance between two coordinates in kilometers
 */
const calculateDistance = (coords1, coords2) => {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
const toRad = (deg) => deg * (Math.PI / 180);
//# sourceMappingURL=validation.js.map