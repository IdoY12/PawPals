/**
 * Validate email format
 */
export declare const validateEmail: (email: string) => boolean;
/**
 * Validate password strength
 */
export declare const validatePassword: (password: string) => {
    valid: boolean;
    message?: string;
};
/**
 * Validate phone number format
 */
export declare const validatePhone: (phone: string) => boolean;
/**
 * Validate coordinates
 */
export declare const validateCoordinates: (coordinates: [number, number]) => boolean;
/**
 * Validate date range
 */
export declare const validateDateRange: (startDate: Date, endDate: Date) => {
    valid: boolean;
    message?: string;
};
/**
 * Throw authentication error
 */
export declare const throwAuthError: (message?: string) => never;
/**
 * Throw authorization error
 */
export declare const throwForbiddenError: (message?: string) => never;
/**
 * Throw validation error
 */
export declare const throwValidationError: (message: string) => never;
/**
 * Throw not found error
 */
export declare const throwNotFoundError: (resource: string) => never;
/**
 * Sanitize string input
 */
export declare const sanitizeString: (input: string) => string;
/**
 * Calculate distance between two coordinates in kilometers
 */
export declare const calculateDistance: (coords1: [number, number], coords2: [number, number]) => number;
//# sourceMappingURL=validation.d.ts.map