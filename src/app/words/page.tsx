'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import TTSButton from '@/components/TTSButton';
import { useStore, Word } from '@/contexts/StoreContext';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import SortableWordItem from '@/components/SortableWordItem';
import { toast } from 'sonner';

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
    partOfSpeech?: string;
    candidates: { scene: string; example: string; }[];
  } | null>(null);

  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkCandidatesModal, setBulkCandidatesModal] = useState<{
    items: {
      wordId: string;
      word: string;
      meaning: string;
      partOfSpeech?: string;
      candidates: { scene: string; example: string }[];
      selectedIndex: number | null;
    }[];
  } | null>(null);
  const [regeneratingWordIdx, setRegeneratingWordIdx] = useState<number | null>(null);
  
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
  const [editForm, setEditForm] = useState<{ word: string; meaning: string; part_of_speech?: string }>({ word: '', meaning: '', part_of_speech: '' });
  const [activeTab, setActiveTab] = useState<'learning' | 'archived'>('learning');

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    setWords((items) => {
      const isArchivedTab = activeTab === 'archived';
      const visibleItems = items.filter(w => isArchivedTab ? w.is_archived : !w.is_archived);
      
      const movedItem = visibleItems[sourceIndex];
      const targetItem = visibleItems[destIndex];
      
      const oldIndex = items.findIndex(w => w.id === movedItem.id);
      const newIndex = items.findIndex(w => w.id === targetItem.id);

      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);

      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));
      
      fetch('/api/words/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      }).catch(err => console.error('Failed to save order', err));

      return newItems.map((item, index) => ({...item, sort_order: index + 1}));
    });
  };

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
      toast.error('Failed to update archive status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    // 重複チェック
    const normalizedWord = newWord.trim().toLowerCase();
    if (words.some(w => w.word.trim().toLowerCase() === normalizedWord)) {
      toast.error(`"${newWord.trim()}" is already registered.`);
      return;
    }

    const wordToSave = newWord.trim();
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
      toast.error('Failed to save word to database.');
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
        toast.error(data.error);
        return;
      }

      // Update meaning and part of speech immediately if they were generated
      const updateFields: any = {};
      let shouldUpdate = false;

      if (data.meaning && data.meaning !== wordObj?.meaning) {
        updateFields.meaning = data.meaning;
        shouldUpdate = true;
      }
      if (data.part_of_speech && data.part_of_speech !== wordObj?.part_of_speech) {
        updateFields.part_of_speech = data.part_of_speech;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await supabase.from('words').update(updateFields).eq('id', id);
        setWords(prev => prev.map(w => w.id === id ? { ...w, ...updateFields } : w));
      }

      if (data.candidates && data.candidates.length > 0) {
        setCandidatesModal({
          wordId: id,
          word: wordText,
          partOfSpeech: data.part_of_speech,
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
      toast.error('AI generation failed.');
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
      toast.error('Failed to save candidate.');
    }
  };

  const handleDelete = async (id: string) => {
    toast('Are you sure you want to delete this?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const { error } = await supabase.from('words').delete().eq('id', id);
            if (error) throw error;
            setWords(prev => prev.filter(w => w.id !== id));
            setSelectedWordIds(prev => prev.filter(wId => wId !== id));
            toast.success('Deleted successfully');
          } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete.');
          }
        }
      },
      cancel: { label: 'Cancel', onClick: () => {} }
    });
  };

  const startEdit = (word: Word) => {
    setEditingId(word.id);
    setEditForm({ word: word.word, meaning: word.meaning, part_of_speech: word.part_of_speech || '' });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.word || !editForm.meaning) return;
    try {
      const { error } = await supabase
        .from('words')
        .update({ word: editForm.word, meaning: editForm.meaning, part_of_speech: editForm.part_of_speech || '' })
        .eq('id', id);
      if (error) throw error;
      setWords(prev => prev.map(w => 
        w.id === id ? { ...w, word: editForm.word, meaning: editForm.meaning, part_of_speech: editForm.part_of_speech } : w
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Edit error:', err);
      toast.error('Failed to update.');
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
        toast.error(parsedWords.error);
        setIsBulkAdding(false);
        return;
      }

      if (!Array.isArray(parsedWords) || parsedWords.length === 0) {
        toast.error('Could not extract any words from the text.');
        setIsBulkAdding(false);
        return;
      }

      // word + meaning + part_of_speech をDBに保存（scene/exampleはまだ）
      const wordsToInsert = parsedWords.map((w: any) => ({
        word: w.word,
        meaning: w.meaning,
        part_of_speech: w.part_of_speech || '',
      }));

      const { data, error } = await supabase
        .from('words')
        .insert(wordsToInsert)
        .select();

      if (error) throw error;
      if (data) {
        setWords(prev => [...data, ...prev]);
        setBulkText('');

        // 候補選択モーダルを開く
        const items = data.map((savedWord: any, idx: number) => ({
          wordId: savedWord.id,
          word: savedWord.word,
          meaning: savedWord.meaning,
          partOfSpeech: savedWord.part_of_speech,
          candidates: parsedWords[idx]?.candidates || [],
          selectedIndex: null,
        }));
        setBulkCandidatesModal({ items });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to bulk add words.');
    } finally {
      setIsBulkAdding(false);
    }
  };

  const handleBulkSelectCandidate = (wordIndex: number, candidateIndex: number) => {
    setBulkCandidatesModal(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items];
      newItems[wordIndex] = { ...newItems[wordIndex], selectedIndex: candidateIndex };
      return { items: newItems };
    });
  };

  const handleBulkRegenerate = async (wordIndex: number) => {
    if (!bulkCandidatesModal) return;
    const item = bulkCandidatesModal.items[wordIndex];
    setRegeneratingWordIdx(wordIndex);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: item.word, meaning: item.meaning, scene: '', example: '' })
      });
      const data = await res.json();

      if (data.candidates && data.candidates.length > 0) {
        setBulkCandidatesModal(prev => {
          if (!prev) return prev;
          const newItems = [...prev.items];
          newItems[wordIndex] = { ...newItems[wordIndex], candidates: data.candidates, selectedIndex: null };
          return { items: newItems };
        });
        toast.success(`"${item.word}" の候補を再生成しました`);
      } else {
        toast.error('再生成に失敗しました');
      }
    } catch (err) {
      console.error(err);
      toast.error('再生成に失敗しました');
    } finally {
      setRegeneratingWordIdx(null);
    }
  };

  const handleBulkSaveAll = async () => {
    if (!bulkCandidatesModal) return;

    try {
      const updates = bulkCandidatesModal.items.map(item => {
        const idx = item.selectedIndex ?? 0; // 未選択は1番目を自動選択
        const candidate = item.candidates[idx] || item.candidates[0];
        return {
          id: item.wordId,
          scene: candidate?.scene || '',
          example: candidate?.example || '',
        };
      });

      // 各単語を更新
      for (const update of updates) {
        const { error } = await supabase
          .from('words')
          .update({ scene: update.scene, example: update.example })
          .eq('id', update.id);
        if (error) throw error;
      }

      // グローバルステートを更新
      setWords(prev => prev.map(w => {
        const update = updates.find(u => u.id === w.id);
        if (update) return { ...w, scene: update.scene, example: update.example };
        return w;
      }));

      setBulkCandidatesModal(null);
      toast.success(`${updates.length} words saved with examples!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save examples.');
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
          </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Paste Words <span className="text-red-500">*</span></label>
                <textarea
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder=""
                  className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold min-h-[80px] max-h-[300px] resize-none overflow-y-auto"
                  rows={2}
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
                    toast.error('Please select 1 to 3 words of the day.');
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
                    toast.success('Set the words of the day!');
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to set. Please check if the database table exists.');
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
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="words-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-3 min-h-[50px]"
                  >
                    {words.filter(w => activeTab === 'learning' ? !w.is_archived : w.is_archived).map((word, index) => (
                      <SortableWordItem
                        key={word.id}
                        word={word}
                        index={index}
                        isSelected={selectedWordIds.includes(word.id)}
                        onToggleSelect={() => {
                          setSelectedWordIds(prev => {
                            if (prev.includes(word.id)) {
                              return prev.filter(wId => wId !== word.id);
                            } else {
                              if (prev.length >= 3) {
                                toast.error('You can select up to 3 words.');
                                return prev;
                              }
                              return [...prev, word.id];
                            }
                          });
                        }}
                        onEdit={() => startEdit(word)}
                        onDelete={() => handleDelete(word.id)}
                        onToggleArchive={() => handleToggleArchive(word.id, word.is_archived)}
                        onGenerateAI={() => handleGenerateAI(word.id)}
                        isGenerating={isGenerating}
                        isEditing={editingId === word.id}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onSaveEdit={() => handleSaveEdit(word.id)}
                        onCancelEdit={() => setEditingId(null)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

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
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748] flex-wrap">
                <span className="material-symbols-rounded text-[#2B6CB0]">psychology</span>
                <span>Choose Example for "{candidatesModal.word}"</span>
                {candidatesModal.partOfSpeech && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                    {candidatesModal.partOfSpeech}
                  </span>
                )}
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
                    <div className="flex mb-1">
                      <span className="inline-flex text-left items-center gap-1.5 text-[13px] text-[#4A5568] font-bold">
                        <span className="material-symbols-rounded text-[16px] text-[#F6E05E]">lightbulb</span>
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

      {/* Bulk Candidates Selection Modal */}
      {bulkCandidatesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border-4 border-[#2D3748] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 shadow-[8px_8px_0px_0px_#2D3748]">
            {/* Header */}
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[#E0F2EF]/50">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                  <span className="material-symbols-rounded text-[#58A498]">psychology</span>
                  Choose Examples
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden w-32">
                    <div
                      className="h-full bg-[#58A498] rounded-full transition-all duration-300"
                      style={{ width: `${(bulkCandidatesModal.items.filter(i => i.selectedIndex !== null).length / bulkCandidatesModal.items.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#4A5568]">
                    {bulkCandidatesModal.items.filter(i => i.selectedIndex !== null).length}/{bulkCandidatesModal.items.length} selected
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setBulkCandidatesModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-[#2D3748] text-[#2D3748] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {bulkCandidatesModal.items.map((item, wordIdx) => (
                <div key={item.wordId} className="cute-card p-4 bg-white">
                  {/* Word Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed border-[#E2E8F0]">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2D3748] text-white text-xs font-black">
                      {wordIdx + 1}
                    </span>
                    <span className="font-black text-[#2D3748] text-base">{item.word}</span>
                    {item.partOfSpeech && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                        {item.partOfSpeech}
                      </span>
                    )}
                    <span className="text-sm text-[#718096] font-semibold">— {item.meaning}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {item.selectedIndex !== null && (
                        <span className="material-symbols-rounded text-[#58A498] text-lg">check_circle</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBulkRegenerate(wordIdx); }}
                        disabled={regeneratingWordIdx !== null}
                        className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-[#E2E8F0] hover:border-[#2B6CB0] hover:bg-[#EBF8FF] text-[#718096] hover:text-[#2B6CB0] transition-all disabled:opacity-40"
                        title="候補を再生成"
                      >
                        <span className={`material-symbols-rounded text-[16px] ${regeneratingWordIdx === wordIdx ? 'animate-spin' : ''}`}>autorenew</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Candidates */}
                  <div className="space-y-2">
                    {item.candidates.map((candidate, candIdx) => (
                      <div 
                        key={candIdx}
                        onClick={() => handleBulkSelectCandidate(wordIdx, candIdx)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all border-2 ${
                          item.selectedIndex === candIdx
                            ? 'border-[#58A498] bg-[#E0F2EF]/60 shadow-[2px_2px_0px_0px_#2D3748]'
                            : 'border-[#E2E8F0] bg-white hover:bg-[#F7FAFC] hover:border-[#A0AEC0]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            item.selectedIndex === candIdx
                              ? 'border-[#58A498] bg-[#58A498]'
                              : 'border-[#CBD5E0] bg-white'
                          }`}>
                            {item.selectedIndex === candIdx && (
                              <span className="material-symbols-rounded text-white text-sm">check</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex mb-1">
                              <span className="inline-flex text-left items-center gap-1 text-[12px] text-[#4A5568] font-bold">
                                <span className="material-symbols-rounded text-[14px] text-[#F6E05E]">lightbulb</span>
                                <span className="leading-relaxed break-words">{candidate.scene}</span>
                              </span>
                            </div>
                            <div className="text-[13px] text-[#2D3748] font-bold leading-relaxed flex items-start gap-1.5">
                              <span className="text-[#2B6CB0] font-black shrink-0">Ex:</span>
                              <span>{candidate.example.replace(/\n/g, ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t-2 border-dashed border-[#2D3748]/20 bg-[#F7FAFC]">
              <button
                onClick={handleBulkSaveAll}
                className="w-full cute-btn py-3.5 text-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-rounded">save</span>
                Save All ({bulkCandidatesModal.items.filter(i => i.selectedIndex !== null).length}/{bulkCandidatesModal.items.length})
              </button>
              <p className="text-[10px] text-[#A0AEC0] font-semibold text-center mt-2">
                ※ 未選択の単語は1番目の候補が自動で選ばれます
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
