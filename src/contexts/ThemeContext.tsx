"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontFamily = 'rounded' | 'sans' | 'serif' | 'handwriting';
type ColorTheme = 'mint' | 'sakura' | 'blue' | 'ginkgo';

interface ThemeState {
  font: FontFamily;
  color: ColorTheme;
}

interface ThemeContextType {
  theme: ThemeState;
  setFont: (font: FontFamily) => void;
  setColor: (color: ColorTheme) => void;
}

const defaultTheme: ThemeState = {
  font: 'rounded',
  color: 'mint',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const FONTS = {
  rounded: "'M PLUS Rounded 1c', 'LINE Seed JP', sans-serif",
  sans: "'Noto Sans JP', sans-serif",
  serif: "'Noto Serif JP', serif",
  handwriting: "'Zen Kurenaido', cursive",
};

const COLORS = {
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ページロード時に localStorage からテーマを復元
    const saved = localStorage.getItem('app-theme');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTheme(parsed);
      } catch (e) {
        console.error('Failed to parse theme from localStorage');
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // localStorage に保存
    localStorage.setItem('app-theme', JSON.stringify(theme));

    // CSS変数の適用
    const root = document.documentElement;
    
    // フォント適用
    root.style.setProperty('--font-sans', FONTS[theme.font]);
    root.style.fontFamily = FONTS[theme.font];

    // カラー適用
    const colors = COLORS[theme.color];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

  }, [theme, mounted]);

  const setFont = (font: FontFamily) => setTheme((prev) => ({ ...prev, font }));
  const setColor = (color: ColorTheme) => setTheme((prev) => ({ ...prev, color }));

  // マウント前は初期テーマでレンダリング（ハイドレーションエラー防止）
  // ただし、一瞬ちらつく可能性はある。
  return (
    <ThemeContext.Provider value={{ theme, setFont, setColor }}>
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
