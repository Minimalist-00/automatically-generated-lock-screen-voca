'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Word {
  id: string;
  word: string;
  meaning: string;
  scene?: string;
  example?: string;
  created_at: string;
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch words from Supabase on mount
  useEffect(() => {
    async function fetchWords() {
      try {
        const { data, error } = await supabase
          .from('words')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWords(data || []);
      } catch (err) {
        console.error('Error fetching words:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newMeaning) return;

    try {
      const { data, error } = await supabase
        .from('words')
        .insert([{ word: newWord, meaning: newMeaning }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setWords([data, ...words]);
      }
      setNewWord('');
      setNewMeaning('');
    } catch (err) {
      console.error(err);
      alert('Failed to save word to database.');
    }
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

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('words')
        .update({ scene: data.scene, example: data.example })
        .eq('id', id);

      if (updateError) throw updateError;

      setWords(words.map(w => w.id === id ? { ...w, scene: data.scene, example: data.example } : w));
    } catch (err) {
      console.error(err);
      alert('AI generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div>
        <h2 className="text-3xl font-black text-[#2D3748] flex items-center gap-2">
          <span>📚</span> Manage Words
        </h2>
        <p className="text-[#4A5568] mt-2 font-medium">Manually add words or auto-generate context and example sentences using Gemini API.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 単語追加フォーム */}
        <div className="cute-card p-6 bg-[#FEF08A]/30">
          <h3 className="text-lg font-black text-[#2D3748] mb-4 flex items-center gap-1.5">
            <span>✏️</span> Quick Add Word
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Word</label>
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
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Japanese Meaning</label>
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
              Add to Word List
            </button>
          </form>
        </div>

        {/* 単語一覧 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-[#2D3748]">Saved Words ({words.length})</h3>
          </div>

          <div className="space-y-4">
            {words.map((word) => (
              <div key={word.id} className="cute-card p-5 bg-white space-y-4 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#2D3748] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-2xl font-black text-[#2B6CB0] tracking-tight">{word.word}</h4>
                    <p className="text-[#4A5568] font-bold text-sm whitespace-pre-line leading-relaxed">{word.meaning}</p>
                  </div>
                  <div className="flex-shrink-0 self-start">
                    {word.scene ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-[#E2E8F0] border-2 border-[#2D3748] text-[#2D3748] font-black px-3 py-1 rounded-xl shadow-[1px_1px_0px_0px_#2D3748]">
                        <span>💡</span>
                        <span className="leading-tight">{word.scene}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleGenerateAI(word.id)}
                        disabled={isGenerating}
                        className="px-4 py-2 rounded-full border-2 border-[#2D3748] bg-[#E0F2FE] hover:bg-[#BAE6FD] text-xs font-extrabold text-[#2B6CB0] transition-colors disabled:opacity-50 shadow-[2px_2px_0px_0px_#2D3748] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#2D3748] cursor-pointer"
                      >
                        Generate with AI 🪄
                      </button>
                    )}
                  </div>
                </div>

                {word.example && (
                  <div className="border-t-2 border-dashed border-[#2D3748]/10 pt-3.5">
                    <p className="text-xs text-[#718096] font-extrabold uppercase tracking-wide">Example & Translation</p>
                    <div className="bg-slate-50 border border-[#2D3748]/5 p-3.5 rounded-xl mt-1.5">
                      <p className="text-sm text-[#2D3748] font-semibold whitespace-pre-line leading-relaxed">{word.example}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading ? (
              <div className="text-center py-12 font-bold text-gray-500">Loading words...</div>
            ) : words.length === 0 ? (
              <div className="text-center py-12 border-3 border-dashed border-[#2D3748] rounded-3xl text-gray-500 bg-white/50 font-bold">
                No words saved yet. Add some using the form above.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
