'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        const [wordsRes, wallpapersRes, questRes] = await Promise.all([
          supabase.from('words').select('*').order('sort_order', { ascending: true, nullsFirst: true }).order('created_at', { ascending: false }),
          supabase.from('wallpapers').select('*').order('created_at', { ascending: false }),
          supabase.from('quests').select('*').eq('quest_date', today).maybeSingle()
        ]);

        if (wordsRes.data) setWords(wordsRes.data);
        if (wallpapersRes.data) setWallpapers(wallpapersRes.data);
        if (questRes.data) setTodayQuest(questRes.data);

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
