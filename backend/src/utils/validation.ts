import { GraphQLError } from 'graphql';

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
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (coordinates: [number, number]): boolean => {
  const [longitude, latitude] = coordinates;
  return (
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: Date,
  endDate: Date
): { valid: boolean; message?: string } => {
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

/**
 * Throw authentication error
 */
export const throwAuthError = (message: string = 'You must be logged in'): never => {
  throw new GraphQLError(message, {
    extensions: { code: 'UNAUTHENTICATED' },
  });
};

/**
 * Throw authorization error
 */
export const throwForbiddenError = (message: string = 'Not authorized'): never => {
  throw new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN' },
  });
};

/**
 * Throw validation error
 */
export const throwValidationError = (message: string): never => {
  throw new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT' },
  });
};

/**
 * Throw not found error
 */
export const throwNotFoundError = (resource: string): never => {
  throw new GraphQLError(`${resource} not found`, {
    extensions: { code: 'NOT_FOUND' },
  });
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Calculate distance between two coordinates in kilometers
 */
export const calculateDistance = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
