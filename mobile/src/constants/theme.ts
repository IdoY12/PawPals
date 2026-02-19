import { Platform } from 'react-native';

export const COLORS = {
  // Primary — teal
  primary: '#2EBFAD',
  primaryDark: '#1A9B8A',
  primaryLight: '#4DD9C7',
  primaryMuted: '#1A3330',

  // Secondary — amber
  secondary: '#F59E0B',
  secondaryDark: '#D97706',
  secondaryLight: '#FCD34D',
  secondaryMuted: '#2D2000',

  // Backgrounds — deep dark
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#21262D',
  card: '#1C2128',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Text
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  textLight: '#FFFFFF',
  textLink: '#2EBFAD',

  // Neutrals — dark grays
  white: '#FFFFFF',
  black: '#010409',
  gray50: '#161B22',
  gray100: '#21262D',
  gray200: '#30363D',
  gray300: '#484F58',
  gray400: '#6E7681',
  gray500: '#8B949E',
  gray600: '#B1BAC4',
  gray700: '#C9D1D9',
  gray800: '#E6EDF3',
  gray900: '#F0F6FC',

  // Status
  success: '#3FB950',
  successLight: '#0D2B12',
  warning: '#D29922',
  warningLight: '#2D1F00',
  error: '#F85149',
  errorLight: '#300D0D',
  info: '#58A6FF',
  infoLight: '#0D1F3A',

  // Borders
  border: '#30363D',
  borderLight: '#21262D',
  borderFocus: '#2EBFAD',

  // User types
  owner: '#A371F7',
  ownerLight: '#1E1030',
  sitter: '#58A6FF',
  sitterLight: '#0D1F3A',

  // Rating
  star: '#E3B341',
  starEmpty: '#30363D',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
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
