'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import TTSButton from '@/components/TTSButton';
import { useStore, Word } from '@/contexts/StoreContext';

export default function WordsPage() {
  const { words, setWords, loading, todayQuest, setTodayQuest } = useStore();
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newScene, setNewScene] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidatesModal, setCandidatesModal] = useState<{
    wordId: string;
    word: string;
    candidates: { scene: string; example: string; }[];
  } | null>(null);

  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  
  // 初期選択状態を todayQuest からセットする
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  useEffect(() => {
    if (todayQuest && todayQuest.word_ids) {
      setSelectedWordIds(todayQuest.word_ids);
    }
  }, [todayQuest]);
  
  // 削除されて words に存在しない ID が selectedWordIds に残らないようにクリーンアップ
  useEffect(() => {
    if (!loading) {
      setSelectedWordIds(prev => {
        const filtered = prev.filter(id => words.some(w => w.id === id));
        return filtered.length !== prev.length ? filtered : prev;
      });
    }
  }, [words, loading]);

  const [isSavingQuest, setIsSavingQuest] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: '', meaning: '' });
  const [activeTab, setActiveTab] = useState<'learning' | 'archived'>('learning');

  const handleToggleArchive = async (id: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('words')
        .update({ is_archived: newStatus })
        .eq('id', id);
      if (error) throw error;
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_archived: newStatus } : w));
    } catch (err) {
      console.error('Archive error:', err);
      alert('Failed to update archive status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord) return;

    const wordToSave = newWord;
    const meaningToSave = newMeaning || 'AI generating...';
    
    // Save current values for AI generation
    const currentMeaning = newMeaning;
    const currentScene = newScene;
    const currentExample = newExample;
    
    setNewWord('');
    setNewMeaning('');
    setNewExample('');
    setNewScene('');

    try {
      const { data, error } = await supabase
        .from('words')
        .insert([{ word: wordToSave, meaning: meaningToSave }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setWords(prev => [data, ...prev]);
        handleGenerateAI(data.id, wordToSave, currentMeaning, currentScene, currentExample);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save word to database.');
    }
  };

  const handleGenerateAI = async (id: string, targetWord?: string, targetMeaning?: string, targetScene?: string, targetExample?: string) => {
    const wordObj = words.find(w => w.id === id);
    const wordText = targetWord || wordObj?.word;
    
    let meaningText = targetMeaning;
    if (meaningText === undefined) {
      meaningText = wordObj?.meaning === 'AI generating...' ? '' : wordObj?.meaning || '';
    }
    
    const sceneText = targetScene !== undefined ? targetScene : wordObj?.scene || '';
    const exampleText = targetExample !== undefined ? targetExample : wordObj?.example || '';

    if (!wordText) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordText, meaning: meaningText, scene: sceneText, example: exampleText })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }

      // Update meaning immediately if it was generated
      if (data.meaning && data.meaning !== wordObj?.meaning) {
        await supabase.from('words').update({ meaning: data.meaning }).eq('id', id);
        setWords(prev => prev.map(w => w.id === id ? { ...w, meaning: data.meaning } : w));
      }

      if (data.candidates && data.candidates.length > 0) {
        setCandidatesModal({
          wordId: id,
          word: wordText,
          candidates: data.candidates
        });
      } else if (data.scene || data.example) {
        // Fallback for old API format
        const updateData: any = {};
        if (data.scene) updateData.scene = data.scene;
        if (data.example) updateData.example = data.example;

        const { error: updateError } = await supabase
          .from('words')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;
        setWords(prev => prev.map(w => w.id === id ? { ...w, ...updateData } : w));
      }
    } catch (err) {
      console.error(err);
      alert('AI generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCandidate = async (wordId: string, scene: string, example: string) => {
    try {
      const { error } = await supabase
        .from('words')
        .update({ scene, example })
        .eq('id', wordId);
      if (error) throw error;

      setWords(prev => prev.map(w => w.id === wordId ? { ...w, scene, example } : w));
      setCandidatesModal(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save candidate.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      const { error } = await supabase.from('words').delete().eq('id', id);
      if (error) throw error;
      setWords(prev => prev.filter(w => w.id !== id));
      setSelectedWordIds(prev => prev.filter(wId => wId !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete.');
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
      alert('Failed to update.');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setIsBulkAdding(true);

    try {
      const res = await fetch('/api/gemini-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bulkText })
      });
      
      const parsedWords = await res.json();
      
      if (parsedWords.error) {
        alert(parsedWords.error);
        setIsBulkAdding(false);
        return;
      }

      if (!Array.isArray(parsedWords) || parsedWords.length === 0) {
        alert('Could not extract any words from the text.');
        setIsBulkAdding(false);
        return;
      }

      const { data, error } = await supabase
        .from('words')
        .insert(parsedWords)
        .select();

      if (error) throw error;
      if (data) {
        setWords(prev => [...data, ...prev]);
        setBulkText('');
        setAddMode('single');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to bulk add words.');
    } finally {
      setIsBulkAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="menu_book" title="Manage Words" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 単語追加フォーム */}
        <div className="cute-card p-6 bg-[#FEF08A]/30 flex flex-col h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-[#2D3748] flex items-center gap-1.5">
              <span className="material-symbols-rounded">edit</span> Add Words
            </h3>
            <div className="flex bg-white/60 p-1 rounded-xl border-2 border-[#EAF5F2]">
              <button 
                onClick={() => setAddMode('single')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${addMode === 'single' ? 'bg-[#92D0C6] text-white shadow-sm' : 'text-[#718096] hover:text-[#4A6B65] hover:bg-white/40'}`}
              >Single</button>
              <button 
                onClick={() => setAddMode('bulk')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${addMode === 'bulk' ? 'bg-[#92D0C6] text-white shadow-sm' : 'text-[#718096] hover:text-[#4A6B65] hover:bg-white/40'}`}
              >Bulk</button>
            </div>
          </div>

          {addMode === 'single' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Word <span className="text-red-500">*</span></label>
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
                  placeholder="e.g., sample (Leave blank for AI auto-generation)"
                  className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Usage Scene</label>
                <input
                  type="text"
                  value={newScene}
                  onChange={(e) => setNewScene(e.target.value)}
                  placeholder="e.g., When showing an example (Leave blank for AI auto-generation)"
                  className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Example Sentence</label>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="e.g., Here is an example. (Leave blank for AI auto-generation)"
                  className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full cute-btn py-3 text-sm transition-transform active:scale-95"
              >
                Add to Word List
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Paste Words <span className="text-red-500">*</span></label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="apple, banana&#10;* cherry&#10;- date"
                  className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold min-h-[200px] resize-y"
                  required
                />
                <p className="text-[10px] text-[#718096] font-bold mt-2 leading-relaxed">
                  箇条書きやカンマ区切り、改行などで一気に複数単語を入力できます。追加後、AIが順次意味や例文を自動生成します。
                </p>
              </div>
              <button
                type="submit"
                disabled={isBulkAdding}
                className="w-full cute-btn py-3 text-sm transition-transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isBulkAdding ? (
                  <>
                    <span className="material-symbols-rounded animate-spin text-[18px]">progress_activity</span>
                    Adding...
                  </>
                ) : 'Bulk Add Words'}
              </button>
            </form>
          )}
        </div>

        {/* 単語一覧 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-black text-[#2D3748]">Saved Words ({words.length})</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#4A5568]">
                Selected: {selectedWordIds.length}/3
              </span>
              <button
                onClick={async () => {
                  if (selectedWordIds.length === 0 || selectedWordIds.length > 3) {
                    alert('Please select 1 to 3 words of the day.');
                    return;
                  }
                  setIsSavingQuest(true);
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    const newQuest = { quest_date: today, word_ids: selectedWordIds };
                    const { data, error } = await supabase
                      .from('quests')
                      .upsert(newQuest, { onConflict: 'quest_date' })
                      .select()
                      .single();
                    
                    if (error) throw error;
                    if (data) setTodayQuest(data);
                    alert('Set the words of the day!');
                  } catch (err) {
                    console.error(err);
                    alert('Failed to set. Please check if the database table exists.');
                  } finally {
                    setIsSavingQuest(false);
                  }
                }}
                disabled={selectedWordIds.length === 0 || isSavingQuest}
                className="cute-btn px-6 py-2 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingQuest ? 'Saving...' : 'Set as Words of the Day'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b-2 border-[#E2E8F0] mb-4">
            <button
              onClick={() => setActiveTab('learning')}
              className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'learning' ? 'text-[#2B6CB0] border-b-4 border-[#2B6CB0] -mb-[2px]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
            >
              学習中
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'archived' ? 'text-[#2B6CB0] border-b-4 border-[#2B6CB0] -mb-[2px]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
            >
              アーカイブ済
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {words.filter(w => activeTab === 'learning' ? !w.is_archived : w.is_archived).map((word) => {
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
                      <button onClick={() => setEditingId(null)} className="cute-btn-secondary px-4 py-2 text-xs">Cancel</button>
                      <button onClick={() => handleSaveEdit(word.id)} className="cute-btn px-4 py-2 text-xs">Save</button>
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
                              alert('You can select up to 3 words.');
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-[#2B6CB0] tracking-tight">{word.word}</h4>
                        <TTSButton text={word.word} />
                      </div>
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
                        className="text-[#A0AEC0] hover:text-[#58A498] transition-colors p-1"
                        title="Edit"
                      >
                        <span className="material-symbols-rounded text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="text-[#A0AEC0] hover:text-red-400 transition-colors p-1"
                        title="Delete"
                      >
                        <span className="material-symbols-rounded text-[18px]">delete</span>
                      </button>
                      <button
                        onClick={() => handleToggleArchive(word.id, word.is_archived)}
                        className="text-[#A0AEC0] hover:text-[#D69E2E] transition-colors p-1"
                        title={word.is_archived ? "Unarchive" : "Archive"}
                      >
                        <span className="material-symbols-rounded text-[18px]">
                          {word.is_archived ? 'unarchive' : 'archive'}
                        </span>
                      </button>
                    </div>
                    {!word.scene && (
                      <button
                        onClick={() => handleGenerateAI(word.id)}
                        disabled={isGenerating}
                        className="cute-btn-outline px-3 py-1.5 text-[10px] disabled:opacity-50 mt-1"
                      >
                        Generate AI
                      </button>
                    )}
                  </div>
                </div>
                )}
                {!isEditing && word.example && (
                  <div className="text-[12px] text-[#718096] font-semibold border-t border-dashed border-[#2D3748]/20 pt-2 mt-1 leading-relaxed flex items-start gap-1">
                    <div className="flex items-center gap-1 shrink-0 mt-[-2px]">
                      <span className="text-[#A0AEC0] font-bold">Ex:</span>
                      <TTSButton text={word.example} className="scale-75 origin-left" />
                    </div>
                    <span>{word.example.replace(/\n/g, ' ')}</span>
                  </div>
                )}
              </div>
            )})}

            {loading ? (
              <div className="text-center py-12 font-bold text-gray-500">Loading words...</div>
            ) : words.filter(w => activeTab === 'learning' ? !w.is_archived : w.is_archived).length === 0 ? (
              <div className="text-center py-12 border-3 border-dashed border-[#2D3748] rounded-3xl text-gray-500 bg-white/50 font-bold">
                {activeTab === 'learning' 
                  ? "No words saved yet. Add some using the form above." 
                  : "No archived words."}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Candidates Modal */}
      {candidatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border-4 border-[#2D3748] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 shadow-[8px_8px_0px_0px_#2D3748]">
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[#FEF08A]/30">
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                <span className="material-symbols-rounded text-[#2B6CB0]">psychology</span>
                Choose Example for "{candidatesModal.word}"
              </h3>
              <button 
                onClick={() => setCandidatesModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-[#2D3748] text-[#2D3748] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm font-bold text-[#4A5568] mb-2">Select the scene and example that fits best:</p>
              {candidatesModal.candidates.map((candidate, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectCandidate(candidatesModal.wordId, candidate.scene, candidate.example)}
                  className="cute-card p-4 bg-white hover:bg-[#EBF8FF] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#2D3748] transition-all group border-2 border-[#E2E8F0] hover:border-[#2B6CB0]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex">
                      <span className="inline-flex text-left items-start gap-1.5 text-[12px] bg-[#E2E8F0] group-hover:bg-white border border-[#2D3748] text-[#2D3748] font-black px-2.5 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_#2D3748]">
                        <span className="material-symbols-rounded text-[14px] shrink-0">lightbulb</span>
                        <span className="leading-relaxed break-words">{candidate.scene}</span>
                      </span>
                    </div>
                    <div className="text-[13px] text-[#2D3748] font-bold mt-1 leading-relaxed flex items-start gap-2">
                      <span className="text-[#2B6CB0] font-black shrink-0 mt-0.5">Ex:</span>
                      <span>{candidate.example.replace(/\n/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
