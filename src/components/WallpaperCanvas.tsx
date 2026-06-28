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



      // 4. Draw Word Card (GlassmorphicCard)
      const cardPadding = 20 * scale; // ~73px
      const cardWidth = width - (16 * scale * 2); // 1125px
      const contentWidth = cardWidth - (cardPadding * 2); // 1023px
      const cardX = (width - cardWidth) / 2;

      const activeWords = words.slice(0, 3);
      const itemHeights: number[] = [];
      const itemElements: any[] = [];

      // Calculate dynamic dimensions for card content first
      for (let i = 0; i < activeWords.length; i++) {
        const w = activeWords[i];
        
        const titleHeight = 58 + 15 + 34; // word (58) + gap (15) + meaning (34)
        
        let sceneHeight = 0;
        let wrappedTagLines: string[] = [];
        if (w.scene) {
          ctx.font = 'bold 29px sans-serif';
          const tagText = '💡 ' + w.scene;
          const tagMaxW = contentWidth - 70; // tag padding X 35px * 2
          wrappedTagLines = getWrappedLines(ctx, tagText, tagMaxW);
          const tagH = (15 * 2) + (wrappedTagLines.length * 29) + (12 * (wrappedTagLines.length - 1));
          sceneHeight = 32 + tagH; // gap + tag height
        }
        
        let exampleHeight = 0;
        let wrappedExLines: string[] = [];
        if (w.example) {
          ctx.font = 'normal 33px sans-serif';
          const exMaxW = contentWidth - 70; // ex padding X 35px * 2
          wrappedExLines = getWrappedLines(ctx, w.example, exMaxW);
          const exH = 35 + 20 + (wrappedExLines.length * 48); // top padding 35, bottom padding 20
          exampleHeight = (w.scene ? 25 : 32) + exH; // gap + box height
        }
        
        const totalItemHeight = titleHeight + sceneHeight + exampleHeight;
        itemHeights.push(totalItemHeight);
        itemElements.push({
          wrappedExLines,
          wrappedTagLines
        });
      }

      // Total Card Height Calculation
      let cardHeight = cardPadding * 2;
      for (let i = 0; i < itemHeights.length; i++) {
        cardHeight += itemHeights[i];
        if (i < itemHeights.length - 1) {
          cardHeight += 90; // equal gap between items
        }
      }

      // Position Card inside the empty space (Based on actual iPhone lockscreen margins)
      const startY = height * 0.28; // 時計と被らない安全な位置
      const endY = height * 0.86; // 下部ボタンと被らない安全な位置
      const cardY = startY; // 上詰め配置

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
          currentY += 90; // equal gap between items
        }
        
        const itemX = cardX + cardPadding;
        
        // 1. Draw Word Title & Meaning
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#58A498'; // Minty Teal
        ctx.font = 'bold 58px sans-serif';
        ctx.fillText(w.word, itemX, currentY);
        
        ctx.fillStyle = '#6B8B86'; // Soft Dark Teal
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(w.meaning, itemX, currentY + 58 + 15);
        
        let nextY = currentY + 58 + 15 + 34; // titleHeight
        
        if (w.scene) {
          ctx.font = 'bold 29px sans-serif';
          const tagPaddingX = 35;
          const tagPaddingY = 15;
          
          let maxLineWidth = 0;
          elem.wrappedTagLines.forEach((line: string) => {
            const lineW = ctx.measureText(line).width;
            if (lineW > maxLineWidth) maxLineWidth = lineW;
          });
          
          const tagW = maxLineWidth + tagPaddingX * 2;
          const tagH = (tagPaddingY * 2) + (elem.wrappedTagLines.length * 29) + (12 * (elem.wrappedTagLines.length - 1));
          
          const tagX = itemX;
          const tagY = nextY + 32;
          
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
            ctx.fillText(line, tagX + tagPaddingX, tagY + tagPaddingY + idx * (29 + 12));
          });
          
          nextY = tagY + tagH;
        }
        
        if (w.example) {
          const exX = itemX;
          const exY = nextY + (w.scene ? 25 : 32);
          const exW = contentWidth;
          const exPadding = 35;
          const lineHeight = 48;
          const exH = 35 + 20 + (elem.wrappedExLines.length * lineHeight);
          
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
            ctx.fillText(line, exX + exPadding, exY + exPadding + idx * lineHeight);
          });
          
          nextY = exY + exH;
        }
        
        currentY = nextY;
      }



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
    <div className="w-full">
      <button
        onClick={handleDownload}
        disabled={isGenerating || words.length === 0}
        className="w-full cute-btn py-4 text-lg font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>{isGenerating ? '⏳' : '✨'}</span>
        {isGenerating ? 'Generating Wallpaper...' : 'Generate & Download Wallpaper'}
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

