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
  const [blobWallpaperUrl, setBlobWallpaperUrl] = useState<string | undefined>(wallpaperUrl);
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBlobWallpaperUrl(wallpaperUrl);
  }, [wallpaperUrl]);

  // 画像URLかどうかを判定
  const isImageUrl = (url?: string) =>
    !!url && !url.startsWith('#') && !url.startsWith('rgb') && !url.startsWith('hsl');

  /**
   * 画像URLをfetchしてBase64 data URLに変換する。
   * blob:URLと異なり、data URLはhml-to-imageが内部で再フェッチしないため
   * canvasのtaint（セキュリティエラー）が発生しない。
   */
  const preloadImageAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDownload = async () => {
    if (words.length === 0) return;
    if (!rendererRef.current) return;
    setIsGenerating(true);

    let localDataUrl: string | undefined;
    try {
      // 画像URLの場合: 事前にfetchしてdata URLに変換（canvas taintを完全回避）
      if (isImageUrl(wallpaperUrl)) {
        localDataUrl = await preloadImageAsDataUrl(wallpaperUrl!);
        setBlobWallpaperUrl(localDataUrl);
        // imgタグが新しいdata URLで再レンダリング・ロードされるまで少し待つ
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // フォントの読み込みを確実に待つ
      await document.fonts.ready;

      const blob = await toBlob(rendererRef.current, {
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

      if (!blob) {
        throw new Error('Failed to generate image blob');
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
    } finally {
      // data URLは解放不要。元のURLに戻す
      if (localDataUrl) {
        setBlobWallpaperUrl(wallpaperUrl);
      }
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
          wallpaperUrl={blobWallpaperUrl}
          goalDeadline={goalDeadline}
          goalFocus={goalFocus}
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
