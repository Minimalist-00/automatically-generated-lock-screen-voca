'use client';

import React, { useState } from 'react';

interface Word {
  id: string;
  word: string;
  meaning: string;
  scene?: string;
  example?: string;
  created_at: string;
}

const INITIAL_WORDS: Word[] = [
  {
    id: '1',
    word: 'resilient',
    meaning: '立ち直りの早い、回復力のある',
    scene: 'ビジネス・自己紹介',
    example: 'She is a resilient leader who overcomes any obstacle.\n（彼女はどんな障害も克服する、回復力のあるリーダーだ。）',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    word: 'cohesive',
    meaning: '結束した、まとまりのある',
    scene: 'チーム開発',
    example: 'We need to build a cohesive team to succeed.\n（成功するためには、結束力のあるチームを築く必要がある。）',
    created_at: new Date().toISOString()
  }
];

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>(INITIAL_WORDS);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newMeaning) return;

    const wordItem: Word = {
      id: Math.random().toString(),
      word: newWord,
      meaning: newMeaning,
      created_at: new Date().toISOString()
    };

    setWords([wordItem, ...words]);
    setNewWord('');
    setNewMeaning('');
  };

  const handleGenerateAI = async (id: string) => {
    const wordItem = words.find(w => w.id === id);
    if (!wordItem) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordItem.word, meaning: wordItem.meaning })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }

      setWords(words.map(w => w.id === id ? { ...w, scene: data.scene, example: data.example } : w));
    } catch (err) {
      console.error(err);
      alert('AI生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div>
        <h2 className="text-3xl font-black text-[#2D3748] flex items-center gap-2">
          <span>📚</span> 単語管理
        </h2>
        <p className="text-[#4A5568] mt-2 font-medium">手動で単語を追加したり、Gemini APIを用いて文脈や例文を自動生成します。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 単語追加フォーム */}
        <div className="cute-card p-6 bg-[#FEF08A]/30">
          <h3 className="text-lg font-black text-[#2D3748] mb-4 flex items-center gap-1.5">
            <span>✏️</span> 単語のクイック追加
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">英単語</label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="example"
                className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">日本語の意味</label>
              <input
                type="text"
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                placeholder="例、見本"
                className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full cute-btn py-3 text-sm transition-transform active:scale-95"
            >
              単語リストに追加
            </button>
          </form>
        </div>

        {/* 単語一覧 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-[#2D3748]">登録済み単語一覧 ({words.length})</h3>
          </div>

          <div className="space-y-4">
            {words.map((word) => (
              <div key={word.id} className="cute-card p-5 bg-white space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-[#2B6CB0]">{word.word}</h4>
                    <p className="text-[#4A5568] font-bold text-sm mt-0.5">{word.meaning}</p>
                  </div>
                  {word.scene ? (
                    <span className="rounded-full bg-[#E2E8F0] border-2 border-[#2D3748] px-3 py-1 text-xs font-extrabold text-[#2D3748]">
                      {word.scene}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGenerateAI(word.id)}
                      disabled={isGenerating}
                      className="px-4 py-2 rounded-full border-2 border-[#2D3748] bg-[#E0F2FE] hover:bg-[#BAE6FD] text-xs font-extrabold text-[#2B6CB0] transition-colors disabled:opacity-50"
                    >
                      AIで文脈・例文を生成 🪄
                    </button>
                  )}
                </div>

                {word.example && (
                  <div className="border-t-2 border-dashed border-[#E2E8F0] pt-3.5">
                    <p className="text-xs text-[#718096] font-extrabold uppercase tracking-wide">例文と訳</p>
                    <p className="text-sm text-[#2D3748] font-bold mt-1 whitespace-pre-line leading-relaxed">{word.example}</p>
                  </div>
                )}
              </div>
            ))}

            {words.length === 0 && (
              <div className="text-center py-12 border-3 border-dashed border-[#2D3748] rounded-3xl text-gray-500 bg-white/50 font-bold">
                単語が登録されていません。上のフォームから追加してください。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
