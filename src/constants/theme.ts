import { Platform } from 'react-native';

export const Colors = {
  brand: {
    orange: '#FF9F43',
    orangeHover: '#f08d2f',
    slate: '#1E3A44',
    slateDark: '#152b33',
    bg: '#F4F6F6',
    cream: '#FFF2E5',
    muted: '#8C9A9E',
    card: '#FFFFFF',
    emerald: '#10B981',
    emeraldBg: '#ECFDF5',
    rose: '#F43F5E',
    roseBg: '#FFF1F2',
  },
  light: {
    text: '#1E3A44',
    background: '#F4F6F6',
    backgroundElement: '#E2E8F0',
    backgroundSelected: '#CBD5E1',
    tint: '#FF9F43',
    card: '#FFFFFF',
    textSecondary: '#8C9A9E',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1E3A44',
    backgroundElement: '#152b33',
    backgroundSelected: '#0F172A',
    tint: '#FF9F43',
    card: '#152b33',
    textSecondary: '#8C9A9E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  web: {
    sans: 'Plus Jakarta Sans, sans-serif',
    mono: 'monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
