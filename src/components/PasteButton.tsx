'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

interface PasteButtonProps {
  onPaste: (text: string) => void;
  className?: string;
  title?: string;
}

export default function PasteButton({
  onPaste,
  className = '',
  title = 'Paste from clipboard',
}: PasteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handlePaste = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // クリップボードからの読み取り
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.error('Clipboard is empty');
        return;
      }
      
      onPaste(text);
      setCopied(true);
      toast.success('Pasted!');
      
      // 1.5秒後にアイコンを元に戻す
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      toast.error('Failed to paste. Please check clipboard permissions.');
    }
  };

  return (
    <button
      type="button"
      onClick={handlePaste}
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-all duration-200 ${
        copied
          ? 'text-[var(--primary-hover)] bg-[var(--secondary)] scale-110'
          : 'text-[var(--text-light)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/40 hover:scale-105 active:scale-95'
      } ${className}`}
      title={title}
    >
      <span className="material-symbols-rounded text-[18px]">
        {copied ? 'check' : 'content_paste'}
      </span>
    </button>
  );
}
