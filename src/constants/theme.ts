/**
 * Design tokens for the app, modeled on Apple's Human Interface Guidelines:
 * the iOS system color palette (systemBlue accent, systemGray neutrals,
 * grouped-table backgrounds), the SF system font (see global.css), and iOS's
 * flat, color-led grouped-list style rather than heavy shadows/elevation.
 * Every screen should style itself from these tokens rather than
 * hardcoding colors/numbers, so the app reads as one consistent system.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#6C6C70',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSelected: '#E5E5EA',
    border: '#D1D1D6',
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    primarySoft: '#E8F1FF',
    secondary: '#34C759',
    secondarySoft: '#E7F9EC',
    danger: '#FF3B30',
    dangerSoft: '#FFEBEA',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#98989D',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSelected: '#2C2C2E',
    border: '#38383A',
    primary: '#0A84FF',
    onPrimary: '#FFFFFF',
    primarySoft: '#0F2C4C',
    secondary: '#30D158',
    secondarySoft: '#123420',
    danger: '#FF453A',
    dangerSoft: '#3A1512',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** iOS corner radii: 10 for controls/inputs, 14 for grouped cards. */
export const Radius = {
  sm: 8,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** iOS's grouped-list style is flat — hierarchy comes from background-color
 * contrast, not elevation. Reserve shadow for floating elements only. */
export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
