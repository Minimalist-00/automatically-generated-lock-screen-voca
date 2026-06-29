"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

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
        } else {
          // If no row exists, you could set a default or leave empty.
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

      <div className="cute-card p-6 lg:p-8 bg-white/80 backdrop-blur-sm">
        <div className="mb-6 space-y-2">
          <h3 className="text-lg font-black text-[#2D3748] flex items-center gap-1.5">
            <span className="material-symbols-rounded text-xl">edit_document</span> Edit Generation Prompt
          </h3>
          <p className="text-sm text-[#4A5568] font-bold leading-relaxed">
            This is the system prompt used when AI generates word phrases.<br/>
            <code className="bg-[#E2E8F0] text-[#2D3748] px-1.5 py-0.5 rounded text-[11px]">{"{{word}}"}</code> and <code className="bg-[#E2E8F0] text-[#2D3748] px-1.5 py-0.5 rounded text-[11px]">{"{{meaning}}"}</code> will be replaced with actual values during generation.
          </p>
        </div>
        
        <div className="relative mb-6">
          {isLoading ? (
            <div className="w-full h-96 flex items-center justify-center bg-white rounded-2xl border-2 border-[#D1EAE5]">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#92D0C6] border-t-transparent"></div>
            </div>
          ) : (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-96 p-5 cute-input text-[#2D3748] font-mono text-sm font-semibold leading-relaxed resize-y"
              placeholder="Enter prompt..."
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {message.text && (
              <p className={`text-sm font-bold ${message.type === 'success' ? 'text-[#58A498]' : 'text-red-500'}`}>
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
