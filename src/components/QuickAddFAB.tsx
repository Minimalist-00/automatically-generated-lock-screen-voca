'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';

export default function QuickAddFAB() {
  const { words, setWords } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    setIsSubmitting(true);
    const wordToSave = newWord.trim();
    const meaningToSave = 'AI generating...';

    try {
      // 1. データベースに保存
      const { data, error } = await supabase
        .from('words')
        .insert([{ word: wordToSave, meaning: meaningToSave }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // グローバルステートに追加
        setWords(prev => [data, ...prev]);
        
        // モーダルを閉じる＆フォームリセット
        setIsOpen(false);
        setNewWord('');

        // 2. AIによる意味・例文生成をバックグラウンドで実行
        handleGenerateAI(data.id, wordToSave);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save word.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAI = async (id: string, targetWord: string) => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord, meaning: '', scene: '', example: '' })
      });
      const data = await res.json();
      
      if (data.error) {
        console.error('AI error:', data.error);
        return;
      }

      // Update in Supabase
      const updateData: any = {};
      if (data.meaning) updateData.meaning = data.meaning;
      if (data.scene) updateData.scene = data.scene;
      if (data.example) updateData.example = data.example;

      const { error: updateError } = await supabase
        .from('words')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // グローバルステートを更新（画面に即座に反映）
      setWords(prev => prev.map(w => w.id === id ? { ...w, ...updateData } : w));
    } catch (err) {
      console.error('AI generation failed:', err);
    }
  };

  return (
    <>
      {/* 画面右下のフローティングアクションボタン (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#58A498] hover:bg-[#4A8F84] text-white rounded-full shadow-[0_6px_20px_rgba(88,164,152,0.4)] hover:shadow-[0_8px_24px_rgba(88,164,152,0.5)] flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-[0_2px_10px_rgba(88,164,152,0.4)] group"
        title="Quick Add Word"
      >
        <span className="material-symbols-rounded text-3xl group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
      </button>

      {/* 追加用モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm border-4 border-[#2D3748] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[#E0F2EF]/50">
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                <span className="material-symbols-rounded text-[#58A498]">note_add</span>
                Quick Memo
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-[#2D3748] text-[#2D3748] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">
                  Word
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. ubiquitous"
                  className="w-full cute-input px-4 py-3 text-lg font-black text-[#2D3748] placeholder-gray-300"
                  required
                />
              </div>
              
              <p className="text-xs text-[#718096] font-semibold text-center">
                ※ 意味と例文は自動で生成されます✨
              </p>

              <button
                type="submit"
                disabled={isSubmitting || !newWord.trim()}
                className="w-full cute-btn py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-rounded animate-spin">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded">check</span>
                    Save Word
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
