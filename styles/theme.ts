/**
 * VinylRoulette Theme System
 * Centralized color and styling definitions
 */

export const colors = {
  // Primary brand colors
  primary: {
    background: '#2d5a4a',     // Main dark green background
    text: '#f4f1eb',           // Primary light cream text
    textInverted: '#2d5a4a',   // Dark text on light backgrounds
  },

  // Secondary colors
  secondary: {
    background: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white for cards
    text: '#f4f1eb',           // Same as primary text for consistency
    muted: 'rgba(244, 241, 235, 0.6)', // Muted version of primary text
  },

  // Accent colors for actions
  accent: {
    success: '#4CAF50',        // Green for success states
    warning: '#FF6600',        // Orange for warnings
    info: '#2196F3',           // Blue for info
    queue: '#76AF50',          // Green for queue-related actions
    reject: '#DC262F',         // Red for reject actions
    dark: '#0d4c3c',          // Dark green for additional actions
  },

  // Status and feedback colors
  status: {
    error: '#c62828',          // Error red
    errorBackground: '#2d5a4a', // Error container background
    success: '#4CAF50',        // Success green
    successBackground: '#e8f5e8', // Success container background
    loading: '#0000ff',        // Loading indicator blue
  },

  // Text variations
  text: {
    primary: '#f4f1eb',        // Main text color
    secondary: '#666',         // Secondary gray text
    tertiary: '#333',          // Darker gray for contrast
    muted: '#999',             // Light gray for placeholders
    inverse: '#ffffff',        // White text for dark backgrounds
    disabled: 'rgba(244, 241, 235, 0.5)', // Disabled text state
  },

  // Background variations
  background: {
    primary: '#2d5a4a',        // Main app background
    secondary: '#f5f5f5',      // Light background for modals/overlays
    card: 'rgba(255, 255, 255, 0.1)', // Semi-transparent card background
    overlay: 'rgba(0, 0, 0, 0.8)', // Dark overlay for tooltips
    placeholder: '#f0f0f0',    // Light gray for image placeholders
    white: '#fff',             // Pure white
  },

  // Border and divider colors
  border: {
    primary: '#ddd',           // Light gray borders
    focus: '#4CAF50',          // Focused state borders
    error: '#c62828',          // Error state borders
    muted: 'rgba(255, 255, 255, 0.3)', // Semi-transparent borders
  },

  // Shadow colors
  shadow: {
    default: '#000',           // Standard shadow color
    light: '0.1', // Light shadow opacity
    medium: '0.25', // Medium shadow opacity
    heavy: '0.5',   // Heavy shadow opacity
  },

  // Navigation specific colors
  navigation: {
    background: '#2d5a4a',     // Navigation background
    activeTab: '#ffffff',      // Active tab text
    inactiveTab: '#f4f1eb',   // Inactive tab text
    headerBackground: '#2d5a4a',
    headerText: '#f4f1eb',
  },

  // Gesture feedback colors (for swipe animations)
  gesture: {
    accept: 'rgba(76, 175, 80, 0.3)',   // Green tint for right swipe
    reject: 'rgba(220, 38, 127, 0.3)',  // Pink/red tint for left swipe
    neutral: 'rgba(255, 255, 255, 0.1)', // Neutral state
  },
} as const;

// Typography system
export const typography = {
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: 'bold' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
} as const;

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadow presets
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadow.default,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadow.light,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: colors.shadow.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadow.light,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.shadow.medium,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// Component-specific theme objects
export const components = {
  button: {
    primary: {
      backgroundColor: colors.accent.success,
      color: colors.text.inverse,
    },
    secondary: {
      backgroundColor: colors.accent.info,
      color: colors.text.inverse,
    },
    danger: {
      backgroundColor: colors.status.error,
      color: colors.text.inverse,
    },
  },
  card: {
    default: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.base,
      ...shadows.base,
    },
  },
  input: {
    default: {
      borderColor: colors.border.primary,
      backgroundColor: colors.background.white,
      color: colors.text.tertiary,
      borderRadius: borderRadius.base,
      padding: spacing.sm,
    },
    focused: {
      borderColor: colors.border.focus,
    },
    error: {
      borderColor: colors.border.error,
    },
  },
} as const;

// Utility function to get theme values
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Theme color path "${path}" not found`);
      return '#000000'; // Fallback color
    }
  }
  
  return typeof value === 'string' ? value : '#000000';
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  getColor,
};