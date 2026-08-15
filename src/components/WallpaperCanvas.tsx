'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { toast } from 'sonner';

import WallpaperRenderer from './WallpaperRenderer';

import { Word } from '@/types';

interface WallpaperCanvasProps {
  words: Word[];
  wallpaperUrl?: string;
  goalDeadline?: string;
  goalFocus?: string;
}

export default function WallpaperCanvas({ words, wallpaperUrl, goalDeadline, goalFocus }: WallpaperCanvasProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [hideBackground, setHideBackground] = useState(false);
  const rendererRef = useRef<HTMLDivElement>(null);

  // 画像URLかどうかを判定
  const isImageUrl = (url?: string) =>
    !!url && !url.startsWith('#') && !url.startsWith('rgb') && !url.startsWith('hsl');

  const handleDownload = async () => {
    if (words.length === 0) return;
    if (!rendererRef.current) return;
    setIsGenerating(true);

    try {
      // フォントの読み込みを確実に待つ
      await document.fonts.ready;

      // 1. html-to-image で iOS Safari が巨大な DataURL を SVG に埋め込んで描画できず真っ暗になるバグを回避するため、
      // プレビュー用の Canvas では背景を透明（または除外）にして、前景（テキスト・カード等）のみをキャプチャする。
      setHideBackground(true);
      // Reactの再レンダリングを待つ
      await new Promise((resolve) => setTimeout(resolve, 100));

      const fgBlob = await toBlob(rendererRef.current, {
        width: 1242,
        height: 2688,
        pixelRatio: 1, // 実寸で出力
        cacheBust: true,
        fontEmbedCSS: '', // Webフォントのインライン化をスキップして高速化
        fetchRequestInit: {
          mode: 'cors',
          credentials: 'omit',
        },
      });

      setHideBackground(false);

      if (!fgBlob) {
        throw new Error('Failed to generate foreground image blob');
      }

      // 2. 標準の Canvas で背景と前景を合成する
      const canvas = document.createElement('canvas');
      canvas.width = 1242;
      canvas.height = 2688;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      if (isImageUrl(wallpaperUrl)) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = wallpaperUrl!;
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
        });

        // object-fit: cover に相当する描画
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = bgImg.width * (canvas.height / bgImg.height);
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = bgImg.height * (canvas.width / bgImg.width);
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
      } else if (wallpaperUrl) {
        ctx.fillStyle = wallpaperUrl;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(209, 234, 229, 0.6)');
        gradient.addColorStop(0.5, 'rgba(198, 231, 225, 0.6)');
        gradient.addColorStop(1, 'rgba(165, 207, 201, 0.6)');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 前景（キャプチャしたテキストとカード）を描画
      const fgImg = new Image();
      const fgUrl = URL.createObjectURL(fgBlob);
      fgImg.src = fgUrl;
      await new Promise((resolve, reject) => {
        fgImg.onload = resolve;
        fgImg.onerror = reject;
      });
      ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(fgUrl);

      // 合成結果を Blob に変換
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error('Failed to generate final image blob');
      }

      // preview用のDataURLを生成してセットする
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedDataUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);

      const fileName = `voca-lockscreen-${new Date().toISOString().slice(0, 10)}.png`;

      // モバイルで Web Share API が使用可能な場合は共有シートを開く (PCでは直接ダウンロードする)
      const file = new File([blob], fileName, { type: 'image/png' });
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isMobile && typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'VocaLock Wallpaper',
          });
          toast.success('Shared successfully!');
          return;
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            toast.error('Sharing canceled.');
            return;
          }
          console.error('Error sharing file:', shareError);
        }
      }

      // フォールバック: 通常のダウンロード処理
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // メモリ解放
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // PWAやSafariでのダウンロード困難に備えてモーダルを表示
      setShowModal(true);
      toast.success('Wallpaper generated! Please check if downloaded or save it from the preview.');
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate lockscreen wallpaper.');
      setHideBackground(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-4">
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
          goalDeadline={goalDeadline}
          goalFocus={goalFocus}
          hideBackground={hideBackground}
        />
      </div>

      {/* ダウンロードボタン */}
      <button
        onClick={handleDownload}
        disabled={isGenerating || words.length === 0}
        className="w-full cute-btn py-3 text-base font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>{isGenerating ? '⏳' : '✨'}</span>
        {isGenerating ? 'Generating Wallpaper...' : 'Generate & Download Wallpaper'}
      </button>

      {/* 長押し保存 / クリップボードコピー用モーダル */}
      {showModal && generatedDataUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--card-bg)] rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto flex flex-col items-center gap-5 shadow-2xl border border-zinc-100">
            <div className="w-full flex justify-between items-center border-b border-zinc-100 pb-3">
              <h4 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span className="material-symbols-rounded text-primary">download</span>
                Save Wallpaper
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="relative group max-h-[50vh] overflow-hidden rounded-2xl border border-zinc-200 shadow-md">
              <img
                src={generatedDataUrl}
                alt="Generated Wallpaper"
                className="max-h-[45vh] w-auto object-contain select-none pointer-events-auto"
                onContextMenu={(e) => e.stopPropagation()} // iOSでの長押しメニューを阻害しないように
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-base">touch_app</span>
                  Long press to save
                </span>
              </div>
            </div>

            <p className="text-sm text-zinc-500 text-center leading-relaxed">
              💡 <strong>iOS / PWA環境をご利用の場合:</strong><br />
              画像を長押しして「写真に保存」を選択してください。
            </p>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setShowModal(false)}
                className="w-full cute-btn py-3 text-sm font-semibold active:scale-98 transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
