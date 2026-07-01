'use client';

import React, { useState, useEffect } from 'react';
import WallpaperCanvas from '@/components/WallpaperCanvas';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/contexts/StoreContext';
import TTSButton from '@/components/TTSButton';

const MOCK_WORDS = [
  {
    id: '1',
    word: 'resilient',
    meaning: 'Quick to recover, resilient',
    scene: 'Business / Self-introduction',
    example: 'She is a resilient leader who overcomes any obstacle.'
  },
  {
    id: '2',
    word: 'cohesive',
    meaning: 'United, cohesive',
    scene: 'Team development',
    example: 'We need to build a cohesive team to succeed.'
  },
  {
    id: '3',
    word: 'leverage',
    meaning: 'Make the most of (strengths, etc.), leverage',
    scene: 'Strategy meeting',
    example: 'We should leverage our technology to grow.'
  }
];

export default function Home() {
  const { words, todayQuest, loading } = useStore();
  const [selectedWords, setSelectedWords] = useState<any[]>([]);
  const [wallpaperUrl, setWallpaperUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (words.length === 0) {
      setErrorMsg('No data available. Showing sample data.');
      setSelectedWords(MOCK_WORDS);
    } else if (todayQuest && todayQuest.word_ids && todayQuest.word_ids.length > 0) {
      const qWords = words.filter(w => todayQuest.word_ids.includes(w.id));
      setSelectedWords(qWords.length > 0 ? qWords : []);
    } else {
      setSelectedWords([]);
    }

    // Load selected wallpaper
    const savedWallpaper = localStorage.getItem('selectedWallpaper');
    if (savedWallpaper !== null) {
      setWallpaperUrl(savedWallpaper);
    }
  }, [words, todayQuest, loading]);

  return (
    <div className="relative">
      {/* Decorative Wavy Background Elements (Optional soft touch) */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-1/2 -right-10 w-64 h-64 bg-secondary/30 rounded-full blur-3xl opacity-40 -z-10" />

      {/* メインレイアウト */}
      <div className="space-y-6 relative z-10">
        <PageHeader icon="home" title="Dashboard" />
        
        {/* エラーメッセージ表示エリア */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 shadow-sm">
            <span className="material-symbols-rounded text-xl">error</span>
            <span className="font-bold text-sm leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6">
          {/* 単語セレクトエリア */}
          <div className="md:col-span-7 lg:col-span-8 cute-card p-4 bg-card-bg/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl">
            <h3 className="text-base md:text-lg font-extrabold text-foreground mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-[22px] md:text-[24px] text-primary">auto_awesome</span> Today's Words
            </h3>
            <div className="space-y-2.5">
              {selectedWords.length > 0 ? (
                selectedWords.map((word) => (
                  <div key={word.id} className="p-3.5 rounded-2xl bg-card-bg/80 backdrop-blur-md shadow-sm flex flex-col gap-1.5 border border-white/5 transition-all hover:-translate-y-0.5 hover:shadow-md duration-200">
                  <div className="flex flex-col justify-between gap-1.5">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <h4 className="font-extrabold text-primary text-base md:text-lg tracking-tight">{word.word}</h4>
                          <TTSButton text={word.word} className="scale-80 origin-left" />
                        </div>
                        {word.part_of_speech && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[var(--secondary)]/70 text-[var(--foreground)] border border-[var(--primary)]/30">
                            {word.part_of_speech}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] md:text-[13.5px] text-foreground/90 font-medium whitespace-pre-line leading-relaxed">{word.meaning}</p>
                    </div>
                    {word.scene && (
                      <div className="flex-shrink-0 self-start w-full">
                        <span className="inline-flex text-left items-center gap-1 text-[11px] bg-secondary/50 text-foreground font-semibold px-2 py-1 rounded-lg shadow-sm w-full sm:w-auto">
                          <span className="material-symbols-rounded text-[13px] shrink-0 opacity-80">lightbulb</span>
                          <span className="leading-snug break-words">{word.scene}</span>
                        </span>
                      </div>
                    )}
                    {word.example && (
                      <div className="text-[11.5px] md:text-[12px] text-foreground/70 font-medium border-t border-secondary/20 pt-1.5 mt-0.5 flex items-start gap-1.5">
                        <div className="flex items-center gap-0.5 shrink-0 mt-[-2px]">
                          <span className="text-foreground/50 font-bold text-[9px] uppercase tracking-wider">Ex:</span>
                          <TTSButton text={word.example} className="scale-75 origin-left" />
                        </div>
                        <span className="leading-relaxed">{word.example.replace(/\n/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                ))
              ) : (
                <div className="p-6 text-center text-foreground/70 bg-card-bg/50 rounded-2xl border border-white/5 shadow-inner">
                  <span className="material-symbols-rounded text-4xl mb-2 opacity-50">menu_book</span>
                  <p className="text-sm font-bold">Today's Words are not set yet.</p>
                  <p className="text-xs mt-1">Please select up to 3 words from the Manage Words page.</p>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button Container */}
          <div className="md:col-span-5 lg:col-span-4">
            <WallpaperCanvas words={selectedWords} wallpaperUrl={wallpaperUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
