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
      // 確実にフォントのロードが完了するのを待つ
      await document.fonts.ready;

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
        // Default Gradient Background (Matching Preview with opacity blend)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(209, 234, 229, 0.6)'); // #D1EAE5
        grad.addColorStop(0.5, 'rgba(198, 231, 225, 0.6)'); // #C6E7E1
        grad.addColorStop(1, 'rgba(165, 207, 201, 0.6)'); // #A5CFC9
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      const scale = 3.65;

      // 2. Draw Status Bar
      ctx.fillStyle = '#4A6B65';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('9:41', 117, 51);

      // Battery Outline
      const battX = width - 117 - 58;
      const battY = 51 + (40 - 29) / 2;
      ctx.strokeStyle = '#4A6B65';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.roundRect(battX, battY, 58, 29, 7);
      ctx.stroke();

      // 3. Draw Clock & Date
      // Date Badge
      const dateFont = 'bold 44px sans-serif';
      ctx.font = dateFont;
      const dateTextWidth = ctx.measureText(dateString).width;
      const badgePaddingX = 44;
      const badgePaddingY = 12;
      const badgeWidth = dateTextWidth + badgePaddingX * 2;
      const badgeHeight = 44 + badgePaddingY * 2;
      const badgeX = (width - badgeWidth) / 2;
      const badgeY = 205;

      // Date Badge BG
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();

      // Date Badge Border
      ctx.strokeStyle = 'rgba(165, 207, 201, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.stroke();

      // Date Text
      ctx.fillStyle = '#4A6B65';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dateString, width / 2, badgeY + badgeHeight / 2);

      // Time Text
      const timeFont = 'bold 175px sans-serif';
      ctx.font = timeFont;
      const timeY = badgeY + badgeHeight + 25;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(timeString, width / 2, timeY);

      // 4. Draw Word Card (GlassmorphicCard)
      const cardPadding = 14 * scale; // ~51.1px
      const cardWidth = width - (16 * scale * 2); // 1125px
      const contentWidth = cardWidth - (cardPadding * 2); // 1023px
      const cardX = (width - cardWidth) / 2;

      const activeWords = words.slice(0, 3);
      const itemHeights: number[] = [];
      const itemElements: any[] = [];

      // Calculate dynamic dimensions for card content first
      for (let i = 0; i < activeWords.length; i++) {
        const w = activeWords[i];
        
        // Measure word and meaning
        ctx.font = 'bold 58px sans-serif';
        const wordW = ctx.measureText(w.word).width;
        ctx.font = 'bold 36px sans-serif';
        const meaningW = ctx.measureText(w.meaning).width;
        
        const gapBetween = 16;
        const isWordWrapped = (wordW + gapBetween + meaningW) > contentWidth;
        const titleHeight = isWordWrapped ? (58 + 10 + 36) : 58;
        
        let sceneHeight = 0;
        let wrappedTagLines: string[] = [];
        if (w.scene) {
          ctx.font = 'bold 29px sans-serif';
          const tagText = '💡 ' + w.scene;
          const tagMaxW = contentWidth - 58; // inner padding 29px * 2
          wrappedTagLines = getWrappedLines(ctx, tagText, tagMaxW);
          const tagH = (7 * 2) + (wrappedTagLines.length * 29) + (10 * (wrappedTagLines.length - 1));
          sceneHeight = 15 + tagH; // spacing + tag height
        }
        
        let exampleHeight = 0;
        let wrappedExLines: string[] = [];
        if (w.example) {
          ctx.font = 'normal 33px sans-serif';
          const exMaxW = contentWidth - 44; // ex padding left/right 22px * 2
          wrappedExLines = getWrappedLines(ctx, w.example, exMaxW);
          exampleHeight = 15 + (22 * 2) + (wrappedExLines.length * 54); // spacing + padding + text
        }
        
        const totalItemHeight = titleHeight + sceneHeight + exampleHeight;
        itemHeights.push(totalItemHeight);
        itemElements.push({
          isWordWrapped,
          wordW,
          meaningW,
          sceneHeight,
          exampleHeight,
          wrappedExLines,
          wrappedTagLines
        });
      }

      // Total Card Height Calculation
      let cardHeight = cardPadding * 2;
      for (let i = 0; i < itemHeights.length; i++) {
        cardHeight += itemHeights[i];
        if (i > 0) {
          cardHeight += 66; // divider spacing + padding (66px)
        }
      }

      // Position Card inside the empty space
      const startY = height * 0.26;
      const endY = height * 0.85;
      const totalAvailableHeight = endY - startY;
      const cardY = startY + (totalAvailableHeight - cardHeight) / 2;

      // Draw Soft Shadow
      ctx.shadowColor = 'rgba(165, 207, 201, 0.3)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;

      // Draw Card Body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; // bg-white/95
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 58);
      ctx.fill();

      // Reset Shadow for subsequent drawings
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Draw Soft Card Border
      ctx.strokeStyle = 'rgba(209, 234, 229, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 58);
      ctx.stroke();

      // Draw Items inside Card
      let currentY = cardY + cardPadding;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      for (let i = 0; i < activeWords.length; i++) {
        const w = activeWords[i];
        const elem = itemElements[i];
        
        if (i > 0) {
          // Point line divider
          ctx.strokeStyle = 'rgba(45, 55, 72, 0.1)';
          ctx.lineWidth = 7;
          ctx.setLineDash([20, 15]);
          ctx.beginPath();
          ctx.moveTo(cardX + cardPadding, currentY + 15);
          ctx.lineTo(cardX + cardWidth - cardPadding, currentY + 15);
          ctx.stroke();
          ctx.setLineDash([]);
          
          currentY += 66;
        }
        
        const itemX = cardX + cardPadding;
        
        // 1. Draw Word Title & Meaning
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#58A498'; // Minty Teal
        ctx.font = 'bold 58px sans-serif';
        ctx.fillText(w.word, itemX, currentY);
        
        ctx.fillStyle = '#6B8B86'; // Soft Dark Teal
        ctx.font = 'bold 36px sans-serif';
        
        const meaningY = currentY + (58 - 36); // align baseline visually
        if (elem.isWordWrapped) {
          ctx.fillText(w.meaning, itemX, currentY + 58 + 10);
        } else {
          ctx.fillText(w.meaning, itemX + elem.wordW + 16, meaningY);
        }
        
        const titleHeight = elem.isWordWrapped ? (58 + 10 + 36) : 58;
        let nextY = currentY + titleHeight;
        
        // 2. Draw Scene Tag (Multiline support)
        if (w.scene) {
          ctx.font = 'bold 29px sans-serif';
          const tagPaddingX = 29;
          const tagPaddingY = 7;
          
          let maxLineWidth = 0;
          elem.wrappedTagLines.forEach((line: string) => {
            const lineW = ctx.measureText(line).width;
            if (lineW > maxLineWidth) maxLineWidth = lineW;
          });
          
          const tagW = maxLineWidth + tagPaddingX * 2;
          const tagH = (tagPaddingY * 2) + (elem.wrappedTagLines.length * 29) + (10 * (elem.wrappedTagLines.length - 1));
          
          const tagX = itemX;
          const tagY = nextY + 15;
          
          // Tag BG
          ctx.fillStyle = '#EAF5F2';
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagW, tagH, 29);
          ctx.fill();
          
          // Tag Text
          ctx.fillStyle = '#4A6B65';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          elem.wrappedTagLines.forEach((line: string, idx: number) => {
            ctx.fillText(line, tagX + tagPaddingX, tagY + tagPaddingY + idx * (29 + 10));
          });
          
          nextY += 15 + tagH;
        }
        
        // 3. Draw Example Box
        if (w.example) {
          const exX = itemX;
          const exY = nextY + 15;
          const exW = contentWidth;
          const exH = (22 * 2) + (elem.wrappedExLines.length * 54);
          
          // Box BG
          ctx.fillStyle = '#F2F9F8';
          ctx.beginPath();
          ctx.roundRect(exX, exY, exW, exH, 29);
          ctx.fill();
          
          // Box Text
          ctx.fillStyle = '#6B8B86';
          ctx.font = 'normal 33px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          elem.wrappedExLines.forEach((line: string, idx: number) => {
            ctx.fillText(line, exX + 22, exY + 22 + idx * 54);
          });
          
          nextY += 15 + exH;
        }
        
        currentY = nextY;
      }

      // 5. Draw Home Indicator
      const homeW = 409;
      const homeH = 15;
      const homeX = (width - homeW) / 2;
      const homeY = height - 36 - homeH;
      ctx.fillStyle = '#4A6B65';
      ctx.beginPath();
      ctx.roundRect(homeX, homeY, homeW, homeH, homeH / 2);
      ctx.fill();

      // 6. Export & Download
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
        className="relative aspect-[9/19.5] w-full max-w-[340px] overflow-hidden rounded-[40px] border-[6px] border-[#EAF5F2] shadow-[0_12px_32px_rgba(165,207,201,0.3)] bg-white"
        style={{
          backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background gradient if no wallpaper */}
        {!wallpaperUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#D1EAE5]/60 via-[#C6E7E1]/60 to-[#A5CFC9]/60" />
        )}

        {/* Status Bar */}
        <div className="absolute top-3.5 left-0 right-0 flex justify-between px-8 text-[11px] font-black text-[#4A6B65] z-20">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <span className="w-4 h-2 border-2 border-[#4A6B65] rounded-sm"></span>
          </div>
        </div>

        {/* Clock & Date */}
        <div className="absolute top-14 left-0 right-0 text-center text-[#4A6B65] z-20 select-none">
          <p className="text-xs font-black tracking-wide bg-white/60 backdrop-blur-xs inline-block px-3 py-0.5 rounded-full border border-[#A5CFC9]/30">{dateString}</p>
          <h1 className="text-5xl font-black tracking-tight mt-1 font-sans">
            {timeString}
          </h1>
        </div>

        {/* Cards list container (Centered in the empty space below clock and above bottom widgets) */}
        <div className="absolute top-[26%] bottom-[15%] left-0 right-0 px-4 flex flex-col justify-center gap-3 z-20">
          {words.length > 0 ? (
            <GlassmorphicCard words={words} />
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-[#A5CFC9] bg-white/80 p-6 text-center text-[#6B8B86] font-bold">
              No words selected
            </div>
          )}
        </div>

        {/* Home Indicator bar */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-[#4A6B65] rounded-full z-20" />
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

// テキストをCanvasの幅に合わせて折り返すためのヘルパー関数
function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  
  for (const para of paragraphs) {
    const chars = para.split(''); // 日本語の文字単位での分割に対応
    let currentLine = '';
    
    for (let n = 0; n < chars.length; n++) {
      const testLine = currentLine + chars[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lines.push(currentLine);
        currentLine = chars[n];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

