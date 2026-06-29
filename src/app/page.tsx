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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setErrorMsg(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Try to fetch today's quest
        const { data: questData, error: questError } = await supabase
          .from('quests')
          .select('word_ids')
          .eq('quest_date', today)
          .maybeSingle();

        if (questError) {
          console.error('Failed to fetch today\'s quest:', questError);
        }

        if (questData && questData.word_ids && questData.word_ids.length > 0) {
          // Fetch the words by IDs
          const { data: wordsData, error: wordsError } = await supabase
            .from('words')
            .select('*')
            .in('id', questData.word_ids);
          
          if (wordsError) throw wordsError;
          if (wordsData && wordsData.length > 0) {
            setSelectedWords(wordsData);
            return;
          }
        }

        // 2. Fallback: fetch latest 3 words
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
        setErrorMsg('Supabaseからのデータ取得に失敗しました。サンプルデータを表示しています。');
        setSelectedWords(MOCK_WORDS);
      }
    }
    loadData();

    // Load selected wallpaper
    const savedWallpaper = localStorage.getItem('selectedWallpaper');
    if (savedWallpaper !== null) {
      setWallpaperUrl(savedWallpaper);
    }
  }, []);

  return (
    <div className="space-y-4 py-2 relative">
      {/* Decorative Wavy Background Elements (Optional soft touch) */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#D1EAE5] rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-1/2 -right-10 w-64 h-64 bg-[#C6E7E1] rounded-full blur-3xl opacity-40 -z-10" />

      {/* メインレイアウト */}
      <div className="max-w-md mx-auto space-y-4 relative z-10 px-4 sm:px-6">
        
        {/* エラーメッセージ表示エリア */}
        {errorMsg && (
          <div className="p-4 bg-[#FFF0F0] border border-[#FFD6D6] text-[#D84C4C] rounded-2xl flex items-center gap-3 shadow-sm">
            <span className="text-xl">⚠️</span>
            <span className="font-bold text-sm leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* 単語セレクトエリア */}
        <div className="cute-card p-4 bg-white/80 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-[#4A6B65] mb-3 flex items-center gap-2">
            <span className="text-2xl">🫧</span> Today's Words
          </h3>
          <div className="space-y-3">
            {selectedWords.map((word) => (
              <div key={word.id} className="p-4 rounded-2xl bg-white/90 shadow-[0_4px_16px_rgba(165,207,201,0.2)] flex flex-col gap-2 border border-[#EAF5F2]">
                <div className="flex flex-col justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-[#58A498] text-lg tracking-tight">{word.word}</h4>
                    <p className="text-sm text-[#6B8B86] font-bold whitespace-pre-line leading-snug">{word.meaning}</p>
                  </div>
                  {word.scene && (
                    <div className="flex-shrink-0 self-start w-full">
                      <span className="inline-flex text-left items-start gap-1.5 text-xs bg-[#EAF5F2] text-[#4A6B65] font-bold px-3 py-2 rounded-xl shadow-sm w-full sm:w-auto">
                        <span className="text-xs shrink-0 pt-0.5">💡</span>
                        <span className="leading-relaxed break-words">{word.scene}</span>
                      </span>
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
