'use client';

import React, { useRef, useEffect, useState } from 'react';
import WallpaperRenderer from './WallpaperRenderer';

import { Word } from '@/types';

interface PhoneMockupPreviewProps {
  words: Word[];
  wallpaperUrl?: string;
  goalDeadline?: string;
  goalFocus?: string;
}

/**
 * iPhoneスタイルのモックアップフレーム内に壁紙プレビューを表示する。
 * WallpaperRenderer を transform: scale() で縮小表示し、
 * リアルタイムで壁紙の見た目を確認できる。
 */
export default function PhoneMockupPreview({ words, wallpaperUrl, goalDeadline, goalFocus }: PhoneMockupPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.12);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.offsetWidth;
      if (containerWidth <= 0) return;

      const availableWidth = containerWidth - 24;
      // PC画面では最大280pxに制限（スマホサイズ感を維持）
      const maxWidth = 280;
      const clampedWidth = Math.max(100, Math.min(availableWidth, maxWidth));
      const newScale = clampedWidth / 1242;
      setScale(newScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const scaledHeight = 2688 * scale;

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {/* Phone Frame */}
      <div
        style={{
          position: 'relative',
          width: `${1242 * scale + 24}px`,
          height: `${scaledHeight + 24}px`,
          borderRadius: `${58 * scale + 8}px`,
          padding: '12px',
          background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.1),
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 8px 20px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
        }}
      >
        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: `${12 + 44 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${370 * scale}px`,
            height: `${110 * scale}px`,
            backgroundColor: '#000000',
            borderRadius: `${55 * scale}px`,
            zIndex: 20,
          }}
        />

        {/* Status Bar - Time */}
        <div
          style={{
            position: 'absolute',
            top: `${12 + 50 * scale}px`,
            left: `${12 + 100 * scale}px`,
            zIndex: 10,
            color: '#FFFFFF',
            fontSize: `${38 * scale}px`,
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>

        {/* Status Bar - Icons (right side) */}
        <div
          style={{
            position: 'absolute',
            top: `${12 + 50 * scale}px`,
            right: `${12 + 100 * scale}px`,
            zIndex: 10,
            display: 'flex',
            gap: `${16 * scale}px`,
            alignItems: 'center',
          }}
        >
          {/* Signal */}
          <svg width={`${44 * scale}`} height={`${32 * scale}`} viewBox="0 0 44 32" fill="white">
            <rect x="0" y="22" width="8" height="10" rx="2" opacity="1"/>
            <rect x="12" y="15" width="8" height="17" rx="2" opacity="1"/>
            <rect x="24" y="8" width="8" height="24" rx="2" opacity="1"/>
            <rect x="36" y="0" width="8" height="32" rx="2" opacity="1"/>
          </svg>
          {/* WiFi */}
          <svg width={`${36 * scale}`} height={`${30 * scale}`} viewBox="0 0 24 20" fill="white">
            <path d="M1 7C4.55 3.45 9.03 1.5 12 1.5s7.45 1.95 11 5.5l-2 2c-2.8-2.8-6.1-4.5-9-4.5s-6.2 1.7-9 4.5L1 7z" opacity="0.5"/>
            <path d="M5 11c1.95-1.95 4.35-3 7-3s5.05 1.05 7 3l-2 2c-1.35-1.35-3.1-2-5-2s-3.65.65-5 2l-2-2z" opacity="0.75"/>
            <path d="M9 15c.85-.85 1.85-1.25 3-1.25s2.15.4 3 1.25l-3 3-3-3z"/>
          </svg>
          {/* Battery */}
          <svg width={`${56 * scale}`} height={`${26 * scale}`} viewBox="0 0 56 26" fill="white">
            <rect x="0" y="0" width="48" height="26" rx="6" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="4" y="4" width="40" height="18" rx="3" fill="white"/>
            <rect x="50" y="8" width="6" height="10" rx="2"/>
          </svg>
        </div>

        {/* Lock Screen Clock */}
        <div
          style={{
            position: 'absolute',
            top: `${12 + 160 * scale}px`,
            left: 0,
            right: 0,
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: `${48 * scale}px`,
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              marginBottom: `${-10 * scale}px`,
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: `${250 * scale}px`,
              fontWeight: 800,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              lineHeight: 1,
              letterSpacing: `${-8 * scale}px`,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        </div>

        {/* Home Indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: `${12 + 30 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${400 * scale}px`,
            height: `${14 * scale}px`,
            backgroundColor: 'rgba(255,255,255,0.4)',
            borderRadius: `${7 * scale}px`,
            zIndex: 20,
          }}
        />

        {/* Screen Content - Scaled WallpaperRenderer */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: `${46 * scale}px`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '1242px',
              height: '2688px',
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <WallpaperRenderer words={words} wallpaperUrl={wallpaperUrl} goalDeadline={goalDeadline} goalFocus={goalFocus} />
          </div>
        </div>
      </div>
    </div>
  );
}
