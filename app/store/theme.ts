// Theme store for managing light/dark mode
// Persists theme preference and provides color schemes

import { create } from 'zustand';

export const colors = {
  light: {
    // Backgrounds
    background: '#ffffff',
    surface: '#f5f5f5',
    card: '#ffffff',
    
    // Text
    text: '#0a0a0a',
    textSecondary: '#71717a',
    textTertiary: '#a1a1aa',
    
    // Borders
    border: '#e4e4e7',
    borderLight: '#f4f4f5',
    
    // Primary (Emerald)
    primary: '#10b981',
    primaryLight: '#d1fae5',
    primaryDark: '#059669',
    
    // Accent colors
    blue: '#3b82f6',
    blueLight: '#dbeafe',
    purple: '#a855f7',
    purpleLight: '#f3e8ff',
    orange: '#f97316',
    orangeLight: '#fed7aa',
    
    // Status
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    cardOverlay: 'rgba(255, 255, 255, 0.8)',
  },
  dark: {
    // Backgrounds
    background: '#09090b',
    surface: '#18181b',
    card: '#27272a',
    
    // Text
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    
    // Borders
    border: '#3f3f46',
    borderLight: '#27272a',
    
    // Primary (Emerald)
    primary: '#34d399',
    primaryLight: 'rgba(52, 211, 153, 0.15)',
    primaryDark: '#10b981',
    
    // Accent colors
    blue: '#60a5fa',
    blueLight: 'rgba(96, 165, 250, 0.15)',
    purple: '#a78bfa',
    purpleLight: 'rgba(167, 139, 250, 0.15)',
    orange: '#fb923c',
    orangeLight: 'rgba(251, 146, 60, 0.15)',
    
    // Status
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    cardOverlay: 'rgba(39, 39, 42, 0.95)',
  },
};

export type ColorScheme = keyof typeof colors;
export type ThemeColors = typeof colors.light;

interface ThemeState {
  colorScheme: ColorScheme;
  isSystemTheme: boolean;
  colors: ThemeColors;
  
  // Actions
  setColorScheme: (scheme: ColorScheme) => void;
  setSystemTheme: (useSystem: boolean) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'dark',
  isSystemTheme: false,
  colors: colors.dark,
  
  setColorScheme: (scheme: ColorScheme) => {
    set({
      colorScheme: scheme,
      colors: colors[scheme],
      isSystemTheme: false,
    });
  },
  
  setSystemTheme: (useSystem: boolean) => {
    if (useSystem) {
      // Default to dark theme when using system preference
      const systemScheme: ColorScheme = 'dark';
      set({
        isSystemTheme: true,
        colorScheme: systemScheme,
        colors: colors[systemScheme],
      });
    } else {
      set({ isSystemTheme: false });
    }
  },
  
  toggleTheme: () => {
    const { colorScheme } = get();
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    set({
      colorScheme: newScheme,
      colors: colors[newScheme],
      isSystemTheme: false,
    });
  },
}));

// Hook to get current theme colors
export const useTheme = () => {
  const { colors, colorScheme } = useThemeStore();
  return { colors, colorScheme, isDark: colorScheme === 'dark' };
};
