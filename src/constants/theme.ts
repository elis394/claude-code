/**
 * Design tokens for the app: color palette (light/dark), type scale fonts,
 * spacing scale, corner radii, and shadows. Every screen should style itself
 * from these tokens rather than hardcoding colors/numbers, so the app reads
 * as one consistent, considered design system.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#241A12',
    textSecondary: '#8A7A68',
    background: '#FBF6EF',
    surface: '#FFFFFF',
    surfaceSelected: '#F2E4D1',
    border: '#ECE0CD',
    primary: '#D9552E',
    onPrimary: '#FFFFFF',
    primarySoft: '#FBE3D2',
    secondary: '#4F7A5B',
    secondarySoft: '#E3EEE6',
    danger: '#C13F2C',
    dangerSoft: '#FAE1D9',
  },
  dark: {
    text: '#F5EBE0',
    textSecondary: '#B0A18E',
    background: '#18130F',
    surface: '#241C16',
    surfaceSelected: '#352A20',
    border: '#352A20',
    primary: '#E97A4E',
    onPrimary: '#1B120B',
    primarySoft: '#3B2519',
    secondary: '#7CAE87',
    secondarySoft: '#213027',
    danger: '#E97158',
    dangerSoft: '#3B2119',
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

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#28170A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#28170A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
