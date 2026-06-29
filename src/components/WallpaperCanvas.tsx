'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import WallpaperRenderer from './WallpaperRenderer';
import PhoneMockupPreview from './PhoneMockupPreview';

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
  const rendererRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (words.length === 0) return;
    if (!rendererRef.current) return;
    setIsGenerating(true);

    try {
      // フォントの読み込みを確実に待つ
      await document.fonts.ready;

      const dataUrl = await toPng(rendererRef.current, {
        width: 1242,
        height: 2688,
        pixelRatio: 1, // 実寸で出力（レンダラーは既に1242x2688）
        cacheBust: true,
        // 外部画像のCORS問題対策
        fetchRequestInit: {
          mode: 'cors',
          credentials: 'omit',
        },
      });

      const link = document.createElement('a');
      link.download = `voca-lockscreen-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Wallpaper downloaded!');
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate lockscreen wallpaper.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* リアルタイムプレビュー */}
      <div className="cute-card p-6 bg-card-bg/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl">
        <h3 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
          <span className="material-symbols-rounded text-[28px] text-primary">phone_iphone</span>
          Preview
        </h3>

        <PhoneMockupPreview words={words} wallpaperUrl={wallpaperUrl} />
      </div>

      {/* 非表示の実寸レンダラー (html-to-image キャプチャ用) */}
      <div
        style={{
          position: 'absolute',
          left: '-99999px',
          top: 0,
          pointerEvents: 'none',
          opacity: 0,
        }}
        aria-hidden="true"
      >
        <WallpaperRenderer
          ref={rendererRef}
          words={words}
          wallpaperUrl={wallpaperUrl}
        />
      </div>

      {/* ダウンロードボタン */}
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
