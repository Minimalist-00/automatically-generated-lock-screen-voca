"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorTheme } from '@/types';
import { upsertSystemSettings } from '@/app/actions/systemSettings';

interface ThemeState {
  color: ColorTheme;
}

interface ThemeContextType {
  theme: ThemeState;
  setColor: (color: ColorTheme) => void;
}

const defaultTheme: ThemeState = {
  color: 'mint',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const COLORS: Record<string, Record<string, string>> = {
  mint: {
    '--background': '#EAF5F2',
    '--foreground': '#4A6B65',
    '--primary': '#92D0C6',
    '--primary-hover': '#7BC0B5',
    '--secondary': '#D1EAE5',
    '--secondary-hover': '#C0DFD9',
    '--card-bg': '#FFFFFF',
    '--input-bg': '#FFFFFF',
  },
  sakura: {
    '--background': '#FDF4F6',
    '--foreground': '#6B4A55',
    '--primary': '#E29CA8',
    '--primary-hover': '#D68996',
    '--secondary': '#F6DDE1',
    '--secondary-hover': '#EBC9CE',
    '--card-bg': '#FFFFFF',
    '--input-bg': '#FFFFFF',
  },
  blue: {
    '--background': '#F0F6FF',
    '--foreground': '#385980',
    '--primary': '#93C5FD',
    '--primary-hover': '#7CB7F6',
    '--secondary': '#DCE9FC',
    '--secondary-hover': '#BFDBFE',
    '--card-bg': '#FFFFFF',
    '--input-bg': '#FFFFFF',
  },
  ginkgo: {
    '--background': '#FCF9F2',
    '--foreground': '#6B5A39',
    '--primary': '#E4C354',
    '--primary-hover': '#D4B344',
    '--secondary': '#F4E8C2',
    '--secondary-hover': '#EADBAC',
    '--card-bg': '#FFFFFF',
    '--input-bg': '#FFFFFF',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: ThemeState }> = ({ children, initialTheme }) => {
  const [theme, setTheme] = useState<ThemeState>(initialTheme || defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if we have a theme in localStorage that overrides the server initial theme
    // (This ensures that if the user changes the theme offline or locally, it still works)
    const saved = localStorage.getItem('app-theme');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only override if the local storage is different from the server (to prevent unnecessary re-renders)
        if (parsed.color !== theme.color) {
          setTheme(parsed);
        }
      } catch (e) {
        console.error('Failed to parse theme from localStorage');
      }
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Save to localStorage
    localStorage.setItem('app-theme', JSON.stringify(theme));

    // Save to database
    upsertSystemSettings([
      { key: 'theme_color', value: theme.color }
    ]).catch(console.error);

    // Apply CSS variables to DOM
    const root = document.documentElement;
    const colors = COLORS[theme.color];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

  }, [theme, mounted]);

  const setColor = (color: ColorTheme) => setTheme((prev) => ({ ...prev, color }));

  return (
<ThemeContext.Provider value={{ theme, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
