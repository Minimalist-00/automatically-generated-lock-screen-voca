'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWords } from '@/app/actions/words';
import { getWallpapers } from '@/app/actions/wallpapers';
import { getTodayQuest } from '@/app/actions/quests';

import { Word, Wallpaper, Quest } from '@/types';

interface StoreContextType {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  wallpapers: Wallpaper[];
  setWallpapers: React.Dispatch<React.SetStateAction<Wallpaper[]>>;
  todayQuest: Quest | null;
  setTodayQuest: React.Dispatch<React.SetStateAction<Quest | null>>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [words, setWords] = useState<Word[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [todayQuest, setTodayQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        // 並列でデータを取得 (Fetch data in parallel)
        const [wordsData, wallpapersData, questData] = await Promise.all([
          getWords(),
          getWallpapers(),
          getTodayQuest()
        ]);

        if (wordsData) setWords(wordsData);
        if (wallpapersData) setWallpapers(wallpapersData);
        if (questData) setTodayQuest(questData);

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  return (
    <StoreContext.Provider value={{ words, setWords, wallpapers, setWallpapers, todayQuest, setTodayQuest, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
