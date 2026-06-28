'use client';

import React, { useRef, useState } from 'react';
import GlassmorphicCard from './GlassmorphicCard';

interface Word {
  id: string;
  word: string;
  meaning: string;
  scene?: string;
  example?: string;
}

interface WallpaperCanvasProps {
  words: Word[];
  wallpaperUrl?: string;
}

export default function WallpaperCanvas({ words, wallpaperUrl }: WallpaperCanvasProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('Image generated and downloaded successfully! (Demo)');
    }, 1500);
  };

  // Mock time & date
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Smartphone mockup outline */}
      <div 
        ref={containerRef}
        className="relative aspect-[9/19.5] w-full max-w-[340px] overflow-hidden rounded-[40px] border-4 border-[#2D3748] shadow-[6px_6px_0px_0px_#2D3748] bg-white"
        style={{
          backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background gradient if no wallpaper */}
        {!wallpaperUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#FEF08A]/40 via-[#FBCFE8]/40 to-[#E0F2FE]/40" />
        )}

        {/* Status Bar */}
        <div className="absolute top-3.5 left-0 right-0 flex justify-between px-8 text-[11px] font-black text-[#2D3748] z-20">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <span className="w-4 h-2 border-2 border-[#2D3748] rounded-sm"></span>
          </div>
        </div>

        {/* Clock & Date */}
        <div className="absolute top-14 left-0 right-0 text-center text-[#2D3748] z-20 select-none">
          <p className="text-xs font-black tracking-wide bg-white/40 backdrop-blur-xs inline-block px-3 py-0.5 rounded-full border border-[#2D3748]/10">{dateString}</p>
          <h1 className="text-5xl font-black tracking-tight mt-1 font-sans">
            {timeString}
          </h1>
        </div>

        {/* Cards list container */}
        <div className="absolute bottom-12 left-0 right-0 px-4 flex flex-col gap-3.5 z-20">
          {words.slice(0, 3).map((w, index) => (
            <GlassmorphicCard
              key={w.id || index}
              word={w.word}
              meaning={w.meaning}
              scene={w.scene}
              example={w.example}
            />
          ))}
          {words.length === 0 && (
            <div className="rounded-3xl border-3 border-dashed border-[#2D3748] bg-white/80 p-6 text-center text-[#718096] font-bold">
              No words selected
            </div>
          )}
        </div>

        {/* Home Indicator bar */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-[#2D3748] rounded-full z-20" />
      </div>

      <button
        onClick={handleDownload}
        disabled={isGenerating || words.length === 0}
        className="w-full max-w-[340px] cute-btn py-3.5 transition-transform active:scale-95 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Download Wallpaper'}
      </button>
    </div>
  );
}
