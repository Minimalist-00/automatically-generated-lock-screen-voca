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
      setSelectedWords(qWords.length > 0 ? qWords : words.slice(0, 3));
    } else {
      setSelectedWords(words.slice(0, 3));
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
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#D1EAE5] rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-1/2 -right-10 w-64 h-64 bg-[#C6E7E1] rounded-full blur-3xl opacity-40 -z-10" />

      {/* メインレイアウト */}
      <div className="space-y-6 relative z-10">
        <PageHeader icon="home" title="Dashboard" />
        
        {/* エラーメッセージ表示エリア */}
        {errorMsg && (
          <div className="p-4 bg-[#FFF0F0] border border-[#FFD6D6] text-[#D84C4C] rounded-2xl flex items-center gap-3 shadow-sm">
            <span className="material-symbols-rounded text-xl">error</span>
            <span className="font-bold text-sm leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* 単語セレクトエリア */}
        <div className="cute-card p-4 bg-white/80 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-[#4A6B65] mb-3 flex items-center gap-2">
            <span className="material-symbols-rounded text-2xl text-[#58A498]">bubble_chart</span> Today's Words
          </h3>
          <div className="space-y-3">
            {selectedWords.map((word) => (
              <div key={word.id} className="p-4 rounded-2xl bg-white/90 shadow-[0_4px_16px_rgba(165,207,201,0.2)] flex flex-col gap-2 border border-[#EAF5F2]">
                <div className="flex flex-col justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#58A498] text-lg tracking-tight">{word.word}</h4>
                      <TTSButton text={word.word} />
                    </div>
                    <p className="text-sm text-[#6B8B86] font-bold whitespace-pre-line leading-snug">{word.meaning}</p>
                  </div>
                  {word.scene && (
                    <div className="flex-shrink-0 self-start w-full">
                      <span className="inline-flex text-left items-center gap-1.5 text-xs bg-[#EAF5F2] text-[#4A6B65] font-bold px-3 py-2 rounded-xl shadow-sm w-full sm:w-auto">
                        <span className="material-symbols-rounded text-sm shrink-0">lightbulb</span>
                        <span className="leading-snug break-words">{word.scene}</span>
                      </span>
                    </div>
                  )}
                  {word.example && (
                    <div className="text-[12px] text-[#6B8B86] font-semibold border-t border-dashed border-[#A5CFC9]/50 pt-2 mt-1 leading-relaxed flex items-start gap-1">
                      <div className="flex items-center gap-1 shrink-0 mt-[-2px]">
                        <span className="text-[#4A6B65] font-bold">Ex:</span>
                        <TTSButton text={word.example} className="scale-75 origin-left" />
                      </div>
                      <span>{word.example.replace(/\n/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button Container */}
        <div className="pt-2 pb-6">
          <WallpaperCanvas words={selectedWords} wallpaperUrl={wallpaperUrl} />
        </div>
      </div>
    </div>
  );
}
