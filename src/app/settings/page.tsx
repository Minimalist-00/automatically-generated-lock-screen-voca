"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const { theme, setFont, setColor } = useTheme();

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'generation_prompt')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          throw error;
        }

        if (data) {
          setPrompt(data.value);
        }
      } catch (err: any) {
        console.error('Failed to fetch prompt:', err.message);
        setMessage({ text: 'Failed to fetch prompt.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompt();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'generation_prompt', 
          value: prompt,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setMessage({ text: 'Prompt saved successfully!', type: 'success' });
    } catch (err: any) {
      console.error('Failed to save prompt:', err.message);
      setMessage({ text: 'Failed to save.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="settings" title="System Settings" />

      {/* Theme Settings Section */}
      <div className="cute-card p-6 lg:p-8 bg-[var(--card-bg)]/80 backdrop-blur-sm">
        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-1.5">
            <span className="material-symbols-rounded text-xl">palette</span> Theme & Font
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 font-bold leading-relaxed">
            Customize the look and feel of the application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Color Theme Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[var(--foreground)]">Color Palette</h4>
            <div className="grid grid-cols-2 gap-3">
              {(['mint', 'sakura', 'blue', 'ginkgo'] as const).map((colorMode) => (
                <button
                  key={colorMode}
                  onClick={() => setColor(colorMode)}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between
                    ${theme.color === colorMode ? 'border-[var(--primary)] bg-[var(--secondary)]/30' : 'border-transparent hover:bg-black/5'}
                  `}
                >
                  <span className="font-bold capitalize">{colorMode}</span>
                  {theme.color === colorMode && (
                    <span className="material-symbols-rounded text-[var(--primary)]">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[var(--foreground)]">Typography</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'rounded', name: 'Rounded (M PLUS)', class: 'font-sans' },
                { id: 'sans', name: 'Sans-serif (Noto Sans)', class: 'font-sans' },
                { id: 'serif', name: 'Serif (Noto Serif)', class: 'font-serif' },
                { id: 'handwriting', name: 'Handwriting (Zen K)', class: 'font-sans' },
              ].map((fontOption) => (
                <button
                  key={fontOption.id}
                  onClick={() => setFont(fontOption.id as any)}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between
                    ${theme.font === fontOption.id ? 'border-[var(--primary)] bg-[var(--secondary)]/30' : 'border-transparent hover:bg-black/5'}
                  `}
                >
                  <span className={`font-bold ${fontOption.class}`} style={{ fontFamily: fontOption.id === 'handwriting' ? "'Zen Kurenaido', cursive" : fontOption.id === 'serif' ? "'Noto Serif JP', serif" : fontOption.id === 'sans' ? "'Noto Sans JP', sans-serif" : "'M PLUS Rounded 1c', sans-serif" }}>
                    {fontOption.name}
                  </span>
                  {theme.font === fontOption.id && (
                    <span className="material-symbols-rounded text-[var(--primary)]">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Settings Section */}
      <div className="cute-card p-6 lg:p-8 bg-[var(--card-bg)]/80 backdrop-blur-sm">
        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-1.5">
            <span className="material-symbols-rounded text-xl">edit_document</span> Edit Generation Prompt
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 font-bold leading-relaxed">
            This is the system prompt used when AI generates word phrases.<br/>
            <code className="bg-[var(--secondary)] text-[var(--foreground)] px-1.5 py-0.5 rounded text-[11px]">{"{{word}}"}</code> and <code className="bg-[var(--secondary)] text-[var(--foreground)] px-1.5 py-0.5 rounded text-[11px]">{"{{meaning}}"}</code> will be replaced with actual values during generation.
          </p>
        </div>
        
        <div className="relative mb-6">
          {isLoading ? (
            <div className="w-full h-96 flex items-center justify-center bg-[var(--card-bg)] rounded-2xl border-2 border-[var(--secondary)]">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[var(--primary)] border-t-transparent"></div>
            </div>
          ) : (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-96 p-5 cute-input text-[var(--foreground)] font-mono text-sm font-semibold leading-relaxed resize-y"
              placeholder="Enter prompt..."
            />
          )}
        </div>

        <div className="flex items-center justify-between">
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
