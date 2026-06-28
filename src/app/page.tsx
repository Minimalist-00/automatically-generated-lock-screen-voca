'use client';

import React, { useState, useEffect } from 'react';
import WallpaperCanvas from '@/components/WallpaperCanvas';
import { supabase } from '@/lib/supabase';

const MOCK_WORDS = [
  {
    id: '1',
    word: 'resilient',
    meaning: '立ち直りの早い、回復力のある',
    scene: 'ビジネス・自己紹介',
    example: 'She is a resilient leader who overcomes any obstacle.\n（彼女はどんな障害も克服する、回復力のあるリーダーだ。）'
  },
  {
    id: '2',
    word: 'cohesive',
    meaning: '結束した、まとまりのある',
    scene: 'チーム開発',
    example: 'We need to build a cohesive team to succeed.\n（成功するためには、結束力のあるチームを築く必要がある。）'
  },
  {
    id: '3',
    word: 'leverage',
    meaning: '（強みなどを）最大限に活かす、レバレッジ',
    scene: '戦略会議',
    example: 'We should leverage our technology to grow.\n（成長するために、私たちの技術を最大限に活かすべきだ。）'
  }
];

export default function Home() {
  const [selectedWords, setSelectedWords] = useState<any[]>([]);
  const [wallpaperUrl, setWallpaperUrl] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('words')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        if (data && data.length > 0) {
          setSelectedWords(data);
        } else {
          setSelectedWords(MOCK_WORDS);
        }
      } catch (err) {
        console.error('Failed to load words from Supabase:', err);
        setSelectedWords(MOCK_WORDS);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 py-2 relative">
      {/* Decorative Wavy Background Elements (Optional soft touch) */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#D1EAE5] rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-1/2 -right-10 w-64 h-64 bg-[#C6E7E1] rounded-full blur-3xl opacity-40 -z-10" />

      {/* メインレイアウト */}
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* 単語セレクトエリア */}
        <div className="cute-card p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-[#4A6B65] mb-5 flex items-center gap-2">
            <span className="text-2xl">🫧</span> Today's Words
          </h3>
          <div className="space-y-4">
            {selectedWords.map((word) => (
              <div key={word.id} className="p-5 rounded-2xl bg-white/90 shadow-[0_4px_16px_rgba(165,207,201,0.2)] flex flex-col gap-3 border border-[#EAF5F2]">
                <div className="flex flex-col justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-[#58A498] text-xl tracking-tight">{word.word}</h4>
                    <p className="text-sm text-[#6B8B86] font-bold whitespace-pre-line leading-relaxed">{word.meaning}</p>
                  </div>
                  {word.scene && (
                    <div className="flex-shrink-0 self-start">
                      <span className="inline-flex items-center gap-1 text-xs bg-[#EAF5F2] text-[#4A6B65] font-bold px-3 py-1.5 rounded-full shadow-sm">
                        <span className="text-xs">💡</span>
                        <span className="leading-tight">{word.scene}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 背景画像選択パネル */}
        <div className="cute-card p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-[#4A6B65] mb-5 flex items-center gap-2">
            <span className="text-2xl">🌊</span> Select Wallpaper
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => setWallpaperUrl('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80')}
              className={`aspect-[9/16] rounded-2xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(165,207,201,0.3)] focus:outline-none relative group ${wallpaperUrl === 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80' ? 'ring-4 ring-[#58A498]' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#92D0C6] to-[#EAF5F2]" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#4A6B65] bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">Ocean</span>
            </button>
            
            <button 
              onClick={() => setWallpaperUrl('https://images.unsplash.com/photo-1498623116890-37e912163d5d?w=600&auto=format&fit=crop&q=80')}
              className={`aspect-[9/16] rounded-2xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(165,207,201,0.3)] focus:outline-none relative group ${wallpaperUrl === 'https://images.unsplash.com/photo-1498623116890-37e912163d5d?w=600&auto=format&fit=crop&q=80' ? 'ring-4 ring-[#58A498]' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#7BC0B5] to-[#A5CFC9]" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#4A6B65] bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">Deep Sea</span>
            </button>

            <button 
              onClick={() => setWallpaperUrl('')}
              className={`aspect-[9/16] rounded-2xl border-2 border-dashed border-[#A5CFC9] bg-white/50 hover:bg-white/80 hover:scale-105 active:scale-95 transition-all shadow-sm flex flex-col items-center justify-center text-xs text-[#4A6B65] font-bold gap-1 ${wallpaperUrl === '' ? 'ring-4 ring-[#58A498] border-solid' : ''}`}
            >
              <span>Default</span>
              <span className="text-[10px] opacity-75">(Soft Mint)</span>
            </button>
          </div>
        </div>

        {/* Generate Button Container */}
        <div className="pt-4 pb-12">
          <WallpaperCanvas words={selectedWords} wallpaperUrl={wallpaperUrl} />
        </div>
      </div>
    </div>
  );
}
