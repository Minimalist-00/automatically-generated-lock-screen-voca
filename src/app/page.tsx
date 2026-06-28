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
    <div className="space-y-6 py-2">
      {/* メインレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左側: 設定・操作パネル */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 単語セレクトエリア */}
          <div className="cute-card p-6 bg-[#FEF08A]/35">
            <h3 className="text-xl font-black text-[#2D3748] mb-4 flex items-center gap-2">
              <span>📝</span> Today's Words (Selected)
            </h3>
            <div className="space-y-3">
              {selectedWords.map((word) => (
                <div key={word.id} className="flex justify-between items-center p-4.5 rounded-2xl bg-white border-2 border-[#2D3748] shadow-[2px_2px_0px_0px_#2D3748]">
                  <div>
                    <span className="font-extrabold text-[#2B6CB0] text-lg">{word.word}</span>
                    <span className="ml-3 text-sm text-[#4A5568] font-bold">{word.meaning}</span>
                  </div>
                  <span className="text-xs bg-[#E2E8F0] border border-[#2D3748] text-[#2D3748] font-extrabold px-3 py-1.5 rounded-full">
                    {word.scene}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 背景画像選択パネル */}
          <div className="cute-card p-6 bg-[#FBCFE8]/30">
            <h3 className="text-xl font-black text-[#2D3748] mb-4 flex items-center gap-2">
              <span>🖼️</span> Select Wallpaper
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setWallpaperUrl('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80')}
                className="aspect-[9/16] rounded-2xl overflow-hidden border-3 border-[#2D3748] hover:scale-105 active:scale-95 transition-all shadow-[3px_3px_0px_0px_#2D3748] focus:outline-none relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-md">Grad 1</span>
              </button>
              
              <button 
                onClick={() => setWallpaperUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80')}
                className="aspect-[9/16] rounded-2xl overflow-hidden border-3 border-[#2D3748] hover:scale-105 active:scale-95 transition-all shadow-[3px_3px_0px_0px_#2D3748] focus:outline-none relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-teal-500" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-md">Grad 2</span>
              </button>

              <button 
                onClick={() => setWallpaperUrl('')}
                className="aspect-[9/16] rounded-2xl border-3 border-dashed border-[#2D3748] bg-white hover:scale-105 active:scale-95 transition-all shadow-[3px_3px_0px_0px_#2D3748] flex flex-col items-center justify-center text-xs text-[#2D3748] font-bold gap-1"
              >
                <span>Default</span>
                <span className="text-[10px] opacity-75">(Gradient)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 右側: プレビュー画面 */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="space-y-4 w-full">
            <h3 className="text-xl font-black text-[#2D3748] text-center flex items-center justify-center gap-2">
              <span>📱</span> Lock Screen Preview
            </h3>
            <WallpaperCanvas words={selectedWords} wallpaperUrl={wallpaperUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
