"use client";

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { useTheme, COLORS } from '@/contexts/ThemeContext';
import { getSystemSettings, upsertSystemSettings } from '@/app/actions/systemSettings';
import { useStore } from '@/contexts/StoreContext';
import { renameTag, deleteTag } from '@/app/actions/words';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalFocus, setGoalFocus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const { theme, setColor } = useTheme();

  const { words, setWords } = useStore();
  const availableTags = Array.from(new Set((words || []).flatMap(w => w.tags || []))).sort();
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed || trimmed === oldTag) {
      setEditingTag(null);
      return;
    }
    
    // Optimistic Update
    setWords(words.map(w => ({
      ...w,
      tags: (w.tags || []).map(t => t === oldTag ? trimmed : t)
    })));
    setEditingTag(null);
    
    try {
      await renameTag(oldTag, trimmed);
      toast.success('Tag renamed successfully.');
    } catch {
      toast.error('Failed to rename tag.');
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    // Optimistic Update
    setWords(words.map(w => ({
      ...w,
      tags: (w.tags || []).filter(t => t !== tagToDelete)
    })));
    
    try {
      await deleteTag(tagToDelete);
      toast.success('Tag deleted successfully.');
    } catch {
      toast.error('Failed to delete tag.');
    }
  };


  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getSystemSettings(['goal_deadline', 'goal_focus']);

        if (data) {
          const deadlineSetting = data.find(d => d.key === 'goal_deadline');
          if (deadlineSetting) setGoalDeadline(deadlineSetting.value);

          const focusSetting = data.find(d => d.key === 'goal_focus');
          if (focusSetting) setGoalFocus(focusSetting.value);
        }
      } catch (err: any) {
        console.error('Failed to fetch settings:', err.message);
        setMessage({ text: 'Failed to fetch settings.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await upsertSystemSettings([
        { key: 'goal_deadline', value: goalDeadline },
        { key: 'goal_focus', value: goalFocus }
      ]);

      setMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (err: any) {
      console.error('Failed to save settings:', err.message);
      setMessage({ text: 'Failed to save.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="settings" title="System Settings" />

      {/* Theme Settings Section */}
      <div className="cute-card p-5 lg:p-6 bg-white/60 backdrop-blur-sm">
        <div className="mb-5 space-y-1">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-1.5">
            <span className="material-symbols-rounded text-xl">palette</span> Theme
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 font-bold leading-relaxed">
            Customize the look and feel of the application.
          </p>
        </div>

        <div className="space-y-6">
          {/* Color Theme Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[var(--foreground)]">Color Palette</h4>
            <div className="flex flex-wrap gap-3">
              {(['mint', 'sakura', 'blue', 'ginkgo'] as const).map((colorMode) => (
                <button
                  key={colorMode}
                  onClick={() => setColor(colorMode)}
                  style={{
                    backgroundColor: COLORS[colorMode]['--background'],
                    color: COLORS[colorMode]['--foreground'],
                    borderColor: theme.color === colorMode ? COLORS[colorMode]['--primary'] : 'transparent'
                  }}
                  className={`px-4 py-2.5 rounded-2xl border-2 transition-all flex items-center justify-between min-w-[110px] gap-2 hover:brightness-95 shadow-sm`}
                >
                  <span className="font-bold capitalize">{colorMode}</span>
                  {theme.color === colorMode && (
                    <span 
                      className="material-symbols-rounded text-lg flex items-center justify-center font-bold"
                      style={{ color: COLORS[colorMode]['--primary'] }}
                    >
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      
      {/* Tags Management Section */}
      <div className="cute-card p-5 lg:p-6 bg-white/60 backdrop-blur-sm">
        <div className="mb-5 space-y-1">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-1.5">
            <span className="material-symbols-rounded text-xl">sell</span> Tags Management
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 font-bold leading-relaxed">
            Manage your tags. Rename them or remove them from all words.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {availableTags.length === 0 ? (
            <p className="text-sm text-[var(--foreground)] opacity-50 font-medium">No tags available yet.</p>
          ) : (
            availableTags.map(tag => (
              <div key={tag} className="flex items-center gap-3 bg-white/40 border border-black/5 pl-3 pr-1.5 py-1.5 rounded-2xl transition-all hover:bg-white/60 shadow-sm">
                {editingTag === tag ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={editingTagValue}
                      onChange={(e) => setEditingTagValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRenameTag(tag, editingTagValue);
                        } else if (e.key === 'Escape') {
                          setEditingTag(null);
                        }
                      }}
                      className="cute-input py-1 px-2 text-sm font-bold w-28 min-w-[80px]"
                    />
                    <button onClick={() => handleRenameTag(tag, editingTagValue)} className="shrink-0 w-7 h-7 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-full transition-colors">
                      <span className="material-symbols-rounded text-[18px]">check</span>
                    </button>
                    <button onClick={() => setEditingTag(null)} className="shrink-0 w-7 h-7 flex items-center justify-center text-foreground/40 hover:bg-black/5 rounded-full transition-colors">
                      <span className="material-symbols-rounded text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 overflow-hidden pl-1">
                      <span className="font-bold text-sm text-[var(--foreground)]">{tag}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-1 border-l border-black/5 pl-1">
                      {deletingTag === tag ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                          <span className="text-[10px] font-bold text-red-500 px-1 uppercase tracking-wider">Sure?</span>
                          <button onClick={() => handleDeleteTag(tag)} className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors">
                            <span className="material-symbols-rounded text-[14px]">check</span>
                          </button>
                          <button onClick={() => setDeletingTag(null)} className="w-6 h-6 flex items-center justify-center text-foreground/50 hover:bg-black/5 rounded-full transition-colors">
                            <span className="material-symbols-rounded text-[14px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditingTag(tag);
                              setEditingTagValue(tag);
                              setDeletingTag(null);
                            }} 
                            className="w-7 h-7 flex items-center justify-center text-foreground/40 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-full transition-colors"
                            title="Edit Tag"
                          >
                            <span className="material-symbols-rounded text-[15px]">edit</span>
                          </button>
                          <button 
                            onClick={() => setDeletingTag(tag)} 
                            className="w-7 h-7 flex items-center justify-center text-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Tag"
                          >
                            <span className="material-symbols-rounded text-[15px]">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Goal Settings Section */}
      <div className="cute-card p-5 lg:p-6 bg-white/60 backdrop-blur-sm">
        <div className="mb-5 space-y-1">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-1.5">
            <span className="material-symbols-rounded text-xl">flag</span> Current Goal
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 font-bold leading-relaxed">
            Set your target to stay focused.
          </p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="w-full h-32 flex items-center justify-center bg-[var(--card-bg)] rounded-2xl border-2 border-[var(--secondary)]">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--primary)] border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Deadline</label>
                <input
                  type="text"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full cute-input px-4 py-2 text-[var(--foreground)] font-bold text-sm"
                  placeholder="e.g. Until the end of July (Philippines trip)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Focus</label>
                <textarea
                  value={goalFocus}
                  onChange={(e) => setGoalFocus(e.target.value)}
                  className="w-full cute-input px-4 py-3 text-[var(--foreground)] font-bold text-sm min-h-[100px] resize-y leading-relaxed"
                  placeholder="e.g. Learn new expressions < Fight fast with current vocabulary&#10;• Class: Pronunciation & Grammar + Daily Words&#10;• Daily chat: Rally with current weapons"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <div>
            {message.text && (
              <p className={`text-sm font-bold ${message.type === 'success' ? 'text-[var(--primary)]' : 'text-red-500'}`}>
                {message.text}
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="cute-btn px-8 py-3 text-sm flex items-center gap-2 justify-center disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded text-[18px]">save</span>
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
