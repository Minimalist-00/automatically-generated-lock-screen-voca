'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

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
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSavingQuest, setIsSavingQuest] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: '', meaning: '' });

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

    const wordToSave = newWord;
    const meaningToSave = newMeaning;
    
    setNewWord('');
    setNewMeaning('');

    try {
      const { data, error } = await supabase
        .from('words')
        .insert([{ word: wordToSave, meaning: meaningToSave }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setWords(prev => [data, ...prev]);
        handleGenerateAI(data.id, wordToSave, meaningToSave);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save word to database.');
    }
  };

  const handleGenerateAI = async (id: string, targetWord?: string, targetMeaning?: string) => {
    const wordText = targetWord || words.find(w => w.id === id)?.word;
    const meaningText = targetMeaning || words.find(w => w.id === id)?.meaning;

    if (!wordText || !meaningText) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordText, meaning: meaningText })
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

      setWords(prev => prev.map(w => w.id === id ? { ...w, scene: data.scene, example: data.example } : w));
    } catch (err) {
      console.error(err);
      alert('AI generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      const { error } = await supabase.from('words').delete().eq('id', id);
      if (error) throw error;
      setWords(prev => prev.filter(w => w.id !== id));
      setSelectedWordIds(prev => prev.filter(wId => wId !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('削除に失敗しました。');
    }
  };

  const startEdit = (word: Word) => {
    setEditingId(word.id);
    setEditForm({ word: word.word, meaning: word.meaning });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.word || !editForm.meaning) return;
    try {
      const { error } = await supabase
        .from('words')
        .update({ word: editForm.word, meaning: editForm.meaning })
        .eq('id', id);
      if (error) throw error;
      setWords(prev => prev.map(w => 
        w.id === id ? { ...w, word: editForm.word, meaning: editForm.meaning } : w
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Edit error:', err);
      alert('更新に失敗しました。');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="menu_book" title="Manage Words" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 単語追加フォーム */}
        <div className="cute-card p-6 bg-[#FEF08A]/30">
          <h3 className="text-lg font-black text-[#2D3748] mb-4 flex items-center gap-1.5">
            <span className="material-symbols-rounded">edit</span> Quick Add Word
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
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-black text-[#2D3748]">Saved Words ({words.length})</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#4A5568]">
                選択中: {selectedWordIds.length}/3
              </span>
              <button
                onClick={async () => {
                  if (selectedWordIds.length === 0 || selectedWordIds.length > 3) {
                    alert('今日のワードは1〜3個選択してください。');
                    return;
                  }
                  setIsSavingQuest(true);
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    const { error } = await supabase
                      .from('quests')
                      .upsert(
                        { quest_date: today, word_ids: selectedWordIds },
                        { onConflict: 'quest_date' }
                      );
                    
                    if (error) throw error;
                    alert('今日のワードを設定しました！');
                    setSelectedWordIds([]);
                  } catch (err) {
                    console.error(err);
                    alert('設定に失敗しました。データベースのテーブルが存在するか確認してください。');
                  } finally {
                    setIsSavingQuest(false);
                  }
                }}
                disabled={selectedWordIds.length === 0 || isSavingQuest}
                className="px-4 py-2 bg-[#2D3748] text-white text-sm font-bold rounded-xl hover:bg-[#4A5568] disabled:opacity-50 transition-colors shadow-[2px_2px_0px_0px_#A0AEC0] active:translate-y-[1px] active:shadow-none"
              >
                {isSavingQuest ? '保存中...' : '今日のワードに設定'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {words.map((word) => {
              const isEditing = editingId === word.id;
              return (
              <div key={word.id} className={`cute-card p-4 bg-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#2D3748] transition-all flex flex-col gap-3 ${selectedWordIds.includes(word.id) ? 'border-2 border-[#2B6CB0] bg-[#EBF8FF]' : ''}`}>
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editForm.word}
                      onChange={e => setEditForm({ ...editForm, word: e.target.value })}
                      className="w-full cute-input px-3 py-2 text-sm font-semibold"
                      placeholder="Word"
                    />
                    <input
                      type="text"
                      value={editForm.meaning}
                      onChange={e => setEditForm({ ...editForm, meaning: e.target.value })}
                      className="w-full cute-input px-3 py-2 text-sm font-semibold"
                      placeholder="Meaning"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg">キャンセル</button>
                      <button onClick={() => handleSaveEdit(word.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-[#2B6CB0] rounded-lg shadow-sm hover:bg-blue-600">保存</button>
                    </div>
                  </div>
                ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center pt-1">
                    <input 
                      type="checkbox"
                      checked={selectedWordIds.includes(word.id)}
                      onChange={() => {
                        setSelectedWordIds(prev => {
                          if (prev.includes(word.id)) {
                            return prev.filter(wId => wId !== word.id);
                          } else {
                            if (prev.length >= 3) {
                              alert('選択できるのは最大3つまでです。');
                              return prev;
                            }
                            return [...prev, word.id];
                          }
                        });
                      }}
                      className="w-5 h-5 accent-[#2B6CB0] cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h4 className="text-lg font-black text-[#2B6CB0] tracking-tight">{word.word}</h4>
                      <p className="text-[#4A5568] font-bold text-sm">{word.meaning.replace(/\n/g, ' ')}</p>
                    </div>
                    {word.scene && (
                      <div className="flex">
                        <span className="inline-flex text-left items-start gap-1.5 text-[11px] bg-[#E2E8F0] border border-[#2D3748] text-[#2D3748] font-black px-2.5 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_#2D3748]">
                          <span className="material-symbols-rounded text-[14px] shrink-0">lightbulb</span>
                          <span className="leading-relaxed break-words">{word.scene}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(word)}
                        className="text-[#A0AEC0] hover:text-[#2B6CB0] transition-colors p-1"
                        title="Edit"
                      >
                        <span className="material-symbols-rounded text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="text-[#A0AEC0] hover:text-red-500 transition-colors p-1"
                        title="Delete"
                      >
                        <span className="material-symbols-rounded text-[18px]">delete</span>
                      </button>
                    </div>
                    {!word.scene && (
                      <button
                        onClick={() => handleGenerateAI(word.id)}
                        disabled={isGenerating}
                        className="px-3 py-1.5 rounded-full border border-[#2D3748] bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[10px] font-extrabold text-[#2B6CB0] transition-colors disabled:opacity-50 shadow-[1px_1px_0px_0px_#2D3748] active:translate-y-[1px] active:shadow-none cursor-pointer mt-1"
                      >
                        Generate AI
                      </button>
                    )}
                  </div>
                </div>
                )}
                {!isEditing && word.example && (
                  <div className="text-[12px] text-[#718096] font-semibold border-t border-dashed border-[#2D3748]/20 pt-2 mt-1 leading-relaxed">
                    <span className="text-[#A0AEC0] font-bold mr-1">Ex:</span>{word.example.replace(/\n/g, ' ')}
                  </div>
                )}
              </div>
            )})}

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
