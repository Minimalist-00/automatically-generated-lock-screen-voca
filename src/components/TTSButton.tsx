'use client';

import React, { useState } from 'react';
import { playTTS } from '@/lib/tts';

interface TTSButtonProps {
  text: string;
  className?: string;
}

export default function TTSButton({ text, className = '' }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // prevent clicking card or other elements
    
    // Simple visual feedback
    setIsPlaying(true);
    playTTS(text);
    
    // Assuming short words, reset after 1 second for simple visual feedback.
    // Proper implementation would use speech synthesis events (onend) but it can be buggy on some browsers
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000);
  };

  return (
    <button
      onClick={handlePlay}
      className={`inline-flex items-center justify-center rounded-full p-1 transition-all ${
        isPlaying ? 'text-[#2B6CB0] bg-[#EBF8FF] scale-110' : 'text-[#A0AEC0] hover:text-[#58A498] hover:bg-[#EAF5F2]'
      } ${className}`}
      title="Play pronunciation"
    >
      <span className="material-symbols-rounded text-[18px]">
        {isPlaying ? 'volume_up' : 'volume_mute'}
      </span>
    </button>
  );
}
