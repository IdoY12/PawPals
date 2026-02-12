import { Platform } from 'react-native';

export const COLORS = {
  // Primary - Deep teal gradient
  primary: '#1A8A7D',
  primaryDark: '#14706A',
  primaryLight: '#2DB5A5',
  primaryMuted: '#E8F6F4',

  // Accent - Warm amber
  secondary: '#F59E0B',
  secondaryDark: '#D97706',
  secondaryLight: '#FCD34D',
  secondaryMuted: '#FEF3C7',

  // Neutrals - Warm grays
  white: '#FFFFFF',
  black: '#0F172A',
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#27272A',
  gray900: '#18181B',

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Backgrounds
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.4)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#52525B',
  textMuted: '#A1A1AA',
  textLight: '#FFFFFF',
  textLink: '#1A8A7D',

  // Borders
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  borderFocus: '#1A8A7D',

  // User types
  owner: '#8B5CF6',     // Purple for owners
  ownerLight: '#EDE9FE',
  sitter: '#0EA5E9',    // Sky blue for sitters
  sitterLight: '#E0F2FE',

  // Rating
  star: '#F59E0B',
  starEmpty: '#E4E4E7',
};

export const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',

  sizes: {
    xs: 11,
    sm: 13,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 26,
    xxxl: 34,
    hero: 42,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const MAP_STYLE = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#C9E8F0' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F0F4F0' }],
  },
];

export default {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  MAP_STYLE,
};
