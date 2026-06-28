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
    if (words.length === 0) return;
    setIsGenerating(true);

    try {
      // iPhone 16/17 series Pro Max standard aspect ratio resolution
      const width = 1242;
      const height = 2688;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1. Draw Background
      if (wallpaperUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = wallpaperUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Failed to load wallpaper image'));
        });

        // Cover fit calculation
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // Default Gradient Background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#FEF08A'); // yellow
        grad.addColorStop(0.5, '#FBCFE8'); // pink
        grad.addColorStop(1, '#E0F2FE'); // blue
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw One Combined Card
      const cardWidth = width * 0.90; // ~1118px
      const cardHeight = 720; // Reduced from 840 to fit perfectly
      const cardX = (width - cardWidth) / 2;

      // Centered in the middle space (between 26% and 85%)
      const startY = height * 0.26;
      const endY = height * 0.85;
      const totalAvailableHeight = endY - startY;
      const cardY = startY + (totalAvailableHeight - cardHeight) / 2;

      // A. Draw Shadow (Offset border color)
      ctx.fillStyle = '#2D3748';
      ctx.beginPath();
      ctx.roundRect(cardX + 16, cardY + 16, cardWidth, cardHeight, 44);
      ctx.fill();

      // B. Draw Card Body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, width * 0.90, cardHeight, 44);
      ctx.fill();

      // C. Draw Border
      ctx.strokeStyle = '#2D3748';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 44);
      ctx.stroke();

      // D. Draw Words inside Card
      const activeWords = words.slice(0, 3);
      const itemHeight = (cardHeight - 40) / activeWords.length;
      const paddingX = 45;

      for (let i = 0; i < activeWords.length; i++) {
        const word = activeWords[i];
        const itemY = cardY + 20 + i * itemHeight;

        // Draw divider dashed line
        if (i > 0) {
          ctx.strokeStyle = 'rgba(45, 55, 72, 0.12)';
          ctx.lineWidth = 4;
          ctx.setLineDash([12, 8]);
          ctx.beginPath();
          ctx.moveTo(cardX + paddingX, itemY);
          ctx.lineTo(cardX + cardWidth - paddingX, itemY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const contentY = itemY + (i > 0 ? 20 : 0);

        // Draw Scene Tag (top-right of this item area)
        if (word.scene) {
          ctx.font = 'bold 18px "LINE Seed JP", "M PLUS Rounded 1c", sans-serif';
          const tagTextWidth = ctx.measureText(word.scene).width;
          const tagWidth = tagTextWidth + 24;
          const tagHeight = 34;
          const tagX = cardX + cardWidth - paddingX - tagWidth;
          const tagY = contentY + 6;

          // Tag BG
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 18);
          ctx.fill();

          // Tag border
          ctx.strokeStyle = '#2D3748';
          ctx.lineWidth = 3;
          ctx.strokeRect(tagX, tagY, tagWidth, tagHeight);

          // Tag text
          ctx.fillStyle = '#2D3748';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word.scene, tagX + tagWidth / 2, tagY + tagHeight / 2);
        }

        // Draw Word Title
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '900 38px "LINE Seed JP", "M PLUS Rounded 1c", sans-serif';
        ctx.fillStyle = '#2B6CB0';
        ctx.fillText(word.word, cardX + paddingX, contentY + 2);

        // Draw Meaning (aligned after word)
        ctx.font = 'bold 22px "LINE Seed JP", "M PLUS Rounded 1c", sans-serif';
        ctx.fillStyle = '#4A5568';
        const wordWidth = ctx.measureText(word.word).width;
        ctx.fillText(word.meaning, cardX + paddingX + wordWidth + 16, contentY + 16);

        // Draw Example box
        if (word.example) {
          const exBgX = cardX + paddingX;
          const exBgY = contentY + 56;
          const exBgW = cardWidth - (paddingX * 2);
          const exBgH = 100;

          // Ex box BG
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.roundRect(exBgX, exBgY, exBgW, exBgH, 14);
          ctx.fill();

          // Ex box Border
          ctx.strokeStyle = 'rgba(45, 55, 72, 0.08)';
          ctx.lineWidth = 2;
          ctx.strokeRect(exBgX, exBgY, exBgW, exBgH);

          // Ex text
          ctx.font = '500 18px "LINE Seed JP", "M PLUS Rounded 1c", sans-serif';
          ctx.fillStyle = '#2D3748';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          const lines = word.example.split('\n');
          lines.forEach((line, lineIdx) => {
            if (lineIdx < 2) {
              ctx.fillText(line, exBgX + 16, exBgY + 14 + lineIdx * 28);
            }
          });
        }
      }

      // 3. Export & Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `voca-lockscreen-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      console.error(error);
      alert('Failed to generate lockscreen wallpaper.');
    } finally {
      setIsGenerating(false);
    }
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

        {/* Cards list container (Centered in the empty space below clock and above bottom widgets) */}
        <div className="absolute top-[26%] bottom-[15%] left-0 right-0 px-4 flex flex-col justify-center gap-3 z-20">
          {words.length > 0 ? (
            <GlassmorphicCard words={words} />
          ) : (
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
