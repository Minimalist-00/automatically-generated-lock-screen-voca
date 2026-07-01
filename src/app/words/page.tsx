'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { defaultPersonaPrompt } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import TTSButton from '@/components/TTSButton';
import { useStore, Word } from '@/contexts/StoreContext';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import SortableWordItem from '@/components/SortableWordItem';
import PasteButton from '@/components/PasteButton';
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

  const [promptSelectModal, setPromptSelectModal] = useState<{
    wordId: string;
    word: string;
    meaning: string;
  } | null>(null);
  const [promptType, setPromptType] = useState<'system' | 'custom'>('system');
  const [customPromptText, setCustomPromptText] = useState('');
  const [systemPromptText, setSystemPromptText] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

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

  const [isLoaded, setIsLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height when bulkText is restored or changed
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [bulkText, isLoaded]);

  // Restore form state from localStorage on mount
  useEffect(() => {
    const savedNewWord = localStorage.getItem('vocalock_newWord') || '';
    const savedNewMeaning = localStorage.getItem('vocalock_newMeaning') || '';
    const savedNewExample = localStorage.getItem('vocalock_newExample') || '';
    const savedNewScene = localStorage.getItem('vocalock_newScene') || '';
    const savedBulkText = localStorage.getItem('vocalock_bulkText') || '';
    const savedAddMode = localStorage.getItem('vocalock_addMode') || 'single';

    setNewWord(savedNewWord);
    setNewMeaning(savedNewMeaning);
    setNewExample(savedNewExample);
    setNewScene(savedNewScene);
    setBulkText(savedBulkText);
    if (savedAddMode === 'single' || savedAddMode === 'bulk') {
      setAddMode(savedAddMode as 'single' | 'bulk');
    }
    setIsLoaded(true);
  }, []);

  // Sync form state back to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocalock_newWord', newWord);
  }, [newWord, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocalock_newMeaning', newMeaning);
  }, [newMeaning, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocalock_newExample', newExample);
  }, [newExample, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocalock_newScene', newScene);
  }, [newScene, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocalock_bulkText', bulkText);
  }, [bulkText, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocalock_addMode', addMode);
  }, [addMode, isLoaded]);
  
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
  const [editForm, setEditForm] = useState<{ word: string; meaning: string; part_of_speech?: string; scene?: string; example?: string }>({ word: '', meaning: '', part_of_speech: '', scene: '', example: '' });
  const [activeTab, setActiveTab] = useState<'learning' | 'archived'>('learning');
  const [filterPriorityOnly, setFilterPriorityOnly] = useState(false);

  const getDisplayWords = (allWords: Word[]) => {
    return allWords
      .filter(w => activeTab === 'learning' ? !w.is_archived : w.is_archived)
      .filter(w => !filterPriorityOnly || w.is_priority)
      .sort((a, b) => {
        const aSelected = selectedWordIds.includes(a.id);
        const bSelected = selectedWordIds.includes(b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return 0; // Maintain original order for others
      });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    setWords((items) => {
      const visibleItems = getDisplayWords(items);
      
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

  const handleTogglePriority = async (id: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('words')
        .update({ is_priority: newStatus })
        .eq('id', id);
      if (error) throw error;
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_priority: newStatus } : w));
    } catch (err) {
      console.error('Priority error:', err);
      toast.error('Failed to update priority status.');
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

  const openPromptSelectModal = async (wordId: string, wordText: string, meaningText: string) => {
    setIsLoadingPrompt(true);
    setPromptType('system');
    
    const cleanMeaning = meaningText === 'AI generating...' ? '' : meaningText;

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'generation_prompt')
        .single();
      
      if (data && !error && data.value.trim() !== '') {
        setSystemPromptText(data.value);
        setCustomPromptText(data.value);
      } else {
        setSystemPromptText(defaultPersonaPrompt);
        setCustomPromptText(defaultPersonaPrompt);
      }
    } catch (err) {
      console.error('Failed to fetch prompt:', err);
      setSystemPromptText(defaultPersonaPrompt);
      setCustomPromptText(defaultPersonaPrompt);
    } finally {
      setIsLoadingPrompt(false);
      setPromptSelectModal({ wordId, word: wordText, meaning: cleanMeaning });
    }
  };

  const handleGenerateAI = async (id: string, targetWord?: string, targetMeaning?: string, targetScene?: string, targetExample?: string, customPrompt?: string) => {
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
        body: JSON.stringify({ word: wordText, meaning: meaningText, scene: sceneText, example: exampleText, customPrompt })
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
    setEditForm({ 
      word: word.word, 
      meaning: word.meaning, 
      part_of_speech: word.part_of_speech || '',
      scene: word.scene || '',
      example: word.example || ''
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.word || !editForm.meaning) return;
    try {
      const { error } = await supabase
        .from('words')
        .update({ 
          word: editForm.word, 
          meaning: editForm.meaning, 
          part_of_speech: editForm.part_of_speech || '',
          scene: editForm.scene || '',
          example: editForm.example || ''
        })
        .eq('id', id);
      if (error) throw error;
      setWords(prev => prev.map(w => 
        w.id === id ? { 
          ...w, 
          word: editForm.word, 
          meaning: editForm.meaning, 
          part_of_speech: editForm.part_of_speech,
          scene: editForm.scene,
          example: editForm.example
        } : w
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

      if (parsedWords && parsedWords.length > 0) {
        setBulkText('');

        // 候補選択モーダルを開く (まだDBには保存しない)
        const items = parsedWords.map((w: any) => ({
          wordId: '', // DB保存前のため空
          word: w.word,
          meaning: w.meaning,
          partOfSpeech: w.part_of_speech || '',
          candidates: w.candidates || [],
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
      const currentSelectedIndex = newItems[wordIndex].selectedIndex;
      newItems[wordIndex] = {
        ...newItems[wordIndex],
        selectedIndex: currentSelectedIndex === candidateIndex ? null : candidateIndex
      };
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

  const handleBulkRemoveWord = (wordIndex: number) => {
    setBulkCandidatesModal(prev => {
      if (!prev) return prev;
      const newItems = prev.items.filter((_, idx) => idx !== wordIndex);
      if (newItems.length === 0) {
        return null;
      }
      return { items: newItems };
    });
    toast.success('単語を候補から削除しました');
  };

  const handleBulkSaveAll = async () => {
    if (!bulkCandidatesModal) return;

    try {
      const baseTime = Date.now();
      const wordsToInsert = bulkCandidatesModal.items.map((item, index) => {
        const idx = item.selectedIndex;
        const candidate = idx !== null ? item.candidates[idx] : null;
        // 一括追加された単語がデータベースから "created_at" 降順でフェッチされた時に
        // 上から順に「新しい順」（最新が一番下、最古が一番上）になるように
        // インデックス 0 (一番上) の created_at が最も古く、インデックスの大きいものが新しくなるように、
        // 1秒ずつの時間差をつけて created_at を設定します。
        const diffSeconds = bulkCandidatesModal.items.length - 1 - index;
        const createdAt = new Date(baseTime - diffSeconds * 1000).toISOString();

        return {
          word: item.word,
          meaning: item.meaning,
          part_of_speech: item.partOfSpeech || '',
          scene: candidate?.scene || '',
          example: candidate?.example || '',
          created_at: createdAt,
        };
      });

      // DBに一括インサート
      const { data, error } = await supabase
        .from('words')
        .insert(wordsToInsert)
        .select();

      if (error) throw error;
      if (data) {
        // グローバルステートに保存されたデータを追加
        // DBから `created_at` 降順（新しい順）で取得したときの並び順と一致させるため、逆順にして追加します
        setWords(prev => [...[...data].reverse(), ...prev]);
        setBulkCandidatesModal(null);
        toast.success(`${data.length} words saved with examples!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save words.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="menu_book" title="Manage Words" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 単語追加フォーム */}
        <div className="cute-card p-6 bg-[var(--secondary)]/30 flex flex-col h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-[#2D3748] flex items-center gap-1.5">
              <span className="material-symbols-rounded">edit</span> Add Words
            </h3>
          </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider">Paste Words <span className="text-red-500">*</span></label>
                  <PasteButton
                    onPaste={(text) => {
                      const newText = bulkText ? `${bulkText}\n${text}` : text;
                      setBulkText(newText);
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                        }
                      }, 0);
                    }}
                  />
                </div>
                <textarea
                  ref={textareaRef}
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
          <div className="flex justify-between items-center border-b-2 border-[#E2E8F0] mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('learning')}
                className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'learning' ? 'text-[var(--foreground)] border-b-4 border-[var(--primary)] -mb-[2px]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
              >
                学習中 ({words.filter(w => !w.is_archived).length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'archived' ? 'text-[var(--foreground)] border-b-4 border-[var(--primary)] -mb-[2px]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
              >
                アーカイブ済 ({words.filter(w => w.is_archived).length})
              </button>
            </div>
            
            <button
              onClick={() => setFilterPriorityOnly(!filterPriorityOnly)}
              className={`pb-2 flex items-center gap-1 text-sm font-bold transition-colors -mb-[2px] ${filterPriorityOnly ? 'text-yellow-500 border-b-4 border-yellow-500' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
            >
              <span className="material-symbols-rounded text-[18px]">star</span>
              <span>優先度高のみ</span>
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
                    {getDisplayWords(words).map((word, index) => (
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
                          onTogglePriority={() => handleTogglePriority(word.id, word.is_priority)}
                          onGenerateAI={() => openPromptSelectModal(word.id, word.word, word.meaning)}
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
            ) : getDisplayWords(words).length === 0 ? (
              <div className="text-center py-12 border-3 border-dashed border-[#2D3748] rounded-3xl text-gray-500 bg-white/50 font-bold">
                {filterPriorityOnly 
                  ? "優先度が高い単語はありません。"
                  : activeTab === 'learning' 
                    ? "No words saved yet. Add some using the form above." 
                    : "No archived words."}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Prompt Selection Modal */}
      {promptSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl border-2 border-[#2D3748] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[var(--secondary)]/30">
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                <span className="material-symbols-rounded text-[var(--primary)]">psychology_alt</span>
                <span>Select Generation Prompt</span>
              </h3>
              <button 
                onClick={() => setPromptSelectModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-[#2D3748] text-[#2D3748] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm font-bold text-[#4A5568]">
                単語「<span className="text-[#2C5282] font-black">{promptSelectModal.word}</span>」の例文を生成するためのプロンプトを選択してください。
              </p>

              {isLoadingPrompt ? (
                <div className="py-12 flex justify-center items-center">
                  <span className="material-symbols-rounded animate-spin text-[32px] text-[var(--primary)]">progress_activity</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 二択のラジオボタン風コンポーネント */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPromptType('system')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-1
                        ${promptType === 'system' 
                          ? 'border-[var(--primary)] bg-[var(--secondary)]/30 shadow-[2px_2px_0px_0px_#2D3748]' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      <span className="font-extrabold text-[#2D3748] flex items-center gap-1 text-sm">
                        <span className="material-symbols-rounded text-base text-[var(--primary)]">settings</span>
                        設定のプロンプト
                      </span>
                      <span className="text-[10px] text-[#718096] font-bold">システム設定で保存されている共通プロンプトを使用します。</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPromptType('custom')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-1
                        ${promptType === 'custom' 
                          ? 'border-[var(--primary)] bg-[var(--secondary)]/30 shadow-[2px_2px_0px_0px_#2D3748]' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      <span className="font-extrabold text-[#2D3748] flex items-center gap-1 text-sm">
                        <span className="material-symbols-rounded text-base text-[var(--primary)]">edit_document</span>
                        独自のプロンプト
                      </span>
                      <span className="text-[10px] text-[#718096] font-bold">この単語の生成時のみ使用するプロンプトを自由に入力します。</span>
                    </button>
                  </div>

                  {/* 独自のプロンプト用テキストエリア */}
                  {promptType === 'custom' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider">
                        独自のプロンプト内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={customPromptText}
                        onChange={(e) => setCustomPromptText(e.target.value)}
                        placeholder="例：この単語を使った、カフェで友達と話している関西弁の口調の例文を生成してください。"
                        className="w-full cute-input p-3 text-xs font-semibold min-h-[150px] max-h-[300px] resize-y font-mono leading-relaxed"
                        rows={6}
                        required
                      />
                    </div>
                  )}
                  
                  {promptType === 'system' && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 max-h-[150px] overflow-y-auto">
                      <span className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">使用予定のプロンプトプレビュー</span>
                      <p className="text-[11px] text-[#718096] font-medium font-mono whitespace-pre-wrap leading-normal">
                        {systemPromptText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t-2 border-dashed border-[#2D3748]/20 bg-[#F7FAFC] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPromptSelectModal(null)}
                className="cute-btn-secondary px-6 py-2.5 text-xs font-bold transition-transform active:scale-95"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalPrompt = promptType === 'custom' ? customPromptText : undefined;
                  setPromptSelectModal(null);
                  handleGenerateAI(
                    promptSelectModal.wordId,
                    promptSelectModal.word,
                    promptSelectModal.meaning,
                    undefined,
                    undefined,
                    finalPrompt
                  );
                }}
                disabled={isLoadingPrompt || (promptType === 'custom' && !customPromptText.trim())}
                className="cute-btn px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-rounded text-base">psychology</span>
                例文を生成する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidates Modal */}
      {candidatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border-2 border-[#2D3748] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[var(--secondary)]/30">
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748] flex-wrap">
                <span className="material-symbols-rounded text-[var(--primary)]">psychology</span>
                <span>Choose Example for "{candidatesModal.word}"</span>
                {candidatesModal.partOfSpeech && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--secondary)]/70 text-[var(--foreground)] border border-[var(--primary)]/30">
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
                  className="cute-card p-4 bg-white hover:bg-[var(--background)] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#2D3748] transition-all group border-2 border-[#E2E8F0] hover:border-[var(--primary)]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex mb-1">
                      <span className="inline-flex text-left items-center gap-1.5 text-[13px] text-[#4A5568] font-bold">
                        <span className="material-symbols-rounded text-[16px] text-[#F6E05E]">lightbulb</span>
                        <span className="leading-relaxed break-words">{candidate.scene}</span>
                      </span>
                    </div>
                    <div className="text-[13px] text-[#2D3748] font-bold mt-1 leading-relaxed flex items-start gap-2">
                      <span className="text-[var(--primary)] font-black shrink-0 mt-0.5">Ex:</span>
                      <span>{candidate.example.replace(/\n/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-dashed border-[#2D3748]/20 mt-4">
                <button
                  onClick={() => handleSelectCandidate(candidatesModal.wordId, '', '')}
                  className="w-full cute-btn-secondary py-3 text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-rounded">bookmark_remove</span>
                  例文なしで保存する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Candidates Selection Modal */}
      {bulkCandidatesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border-2 border-[#2D3748] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 shadow-xl">
            {/* Header */}
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[var(--secondary)]/50">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                  <span className="material-symbols-rounded text-[var(--primary)]">psychology</span>
                  Choose Examples
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden w-32">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
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
                <div key={`bulk-word-${wordIdx}`} className="cute-card p-4 bg-white">
                  {/* Word Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed border-[#E2E8F0]">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2D3748] text-white text-xs font-black">
                      {wordIdx + 1}
                    </span>
                    <span className="font-black text-[#2D3748] text-base">{item.word}</span>
                    {item.partOfSpeech && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--secondary)]/70 text-[var(--foreground)] border border-[var(--primary)]/30">
                        {item.partOfSpeech}
                      </span>
                    )}
                    <span className="text-sm text-[#718096] font-semibold">— {item.meaning}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {item.selectedIndex !== null && (
                        <span className="material-symbols-rounded text-[var(--primary)] text-lg">check_circle</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBulkRegenerate(wordIdx); }}
                        disabled={regeneratingWordIdx !== null}
                        className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-[#E2E8F0] hover:border-[var(--primary)] hover:bg-[var(--background)] text-[#718096] hover:text-[var(--primary)] transition-all disabled:opacity-40"
                        title="候補を再生成"
                      >
                        <span className={`material-symbols-rounded text-[16px] ${regeneratingWordIdx === wordIdx ? 'animate-spin' : ''}`}>autorenew</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBulkRemoveWord(wordIdx); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-[#E2E8F0] hover:border-red-400 hover:bg-red-50 text-[#718096] hover:text-red-500 transition-all"
                        title="この単語を削除"
                      >
                        <span className="material-symbols-rounded text-[16px]">delete</span>
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
                            ? 'border-[var(--primary)] bg-[var(--secondary)]/60 shadow-[2px_2px_0px_0px_#2D3748]'
                            : 'border-[#E2E8F0] bg-white hover:bg-[#F7FAFC] hover:border-[#A0AEC0]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            item.selectedIndex === candIdx
                              ? 'border-[var(--primary)] bg-[var(--primary)]'
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
                              <span className="text-[var(--primary)] font-black shrink-0">Ex:</span>
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
                ※ 未選択の単語は例文なしで登録されます
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
