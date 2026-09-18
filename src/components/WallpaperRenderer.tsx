'use client';

import React, { forwardRef } from 'react';

import { Word } from '@/types';

interface WallpaperRendererProps {
  words: Word[];
  wallpaperUrl?: string;
  goalDeadline?: string;
  goalFocus?: string;
  hideBackground?: boolean;
}

/**
 * HTML/CSSベースの壁紙レンダラー。
 * 実際の壁紙解像度(1242×2688px)でレイアウトし、
 * プレビューと最終出力の両方で同一のDOMを使用する。
 */
const WallpaperRenderer = forwardRef<HTMLDivElement, WallpaperRendererProps>(
  ({ words, wallpaperUrl, goalDeadline, goalFocus, hideBackground }, ref) => {
    const activeWords = words.slice(0, 3);

    const isImageUrl = wallpaperUrl && !wallpaperUrl.startsWith('#') && !wallpaperUrl.startsWith('rgb') && !wallpaperUrl.startsWith('hsl');

    // 背景スタイルの決定
    const getBackgroundStyle = (): React.CSSProperties => {
      if (hideBackground) {
        return { backgroundColor: 'transparent' };
      }
      if (wallpaperUrl && !isImageUrl) {
        return { backgroundColor: wallpaperUrl };
      }
      if (isImageUrl) {
        return {};
      }
      // Default Gradient (matching current Canvas gradient)
      return {
        background: 'linear-gradient(to bottom, rgba(209, 234, 229, 0.6) 0%, rgba(198, 231, 225, 0.6) 50%, rgba(165, 207, 201, 0.6) 100%)',
        backgroundColor: '#FFFFFF',
      };
    };

    return (
      <div
        ref={ref}
        style={{
          width: '1242px',
          height: '2688px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
          ...getBackgroundStyle(),
        }}
      >
        {!hideBackground && isImageUrl && (
          <img
            src={wallpaperUrl}
            alt="background"
            {...(wallpaperUrl.startsWith('data:') ? {} : { crossOrigin: 'anonymous' })}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* コンテンツラッパー */}
        <div
          style={{
            position: 'absolute',
            top: (goalDeadline || goalFocus) ? '26%' : '32%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${1242 - 16 * 3.65 * 2}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
            alignItems: 'center',
          }}
        >
          {/* ゴール表示 */}
          {(goalDeadline || goalFocus) && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: '48px',
                padding: '36px 40px',
                border: 'none',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              {goalDeadline && (
                <div
                  style={{
                    color: '#385980',
                    fontSize: '32px',
                    fontWeight: 900,
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{goalDeadline}まで</span>
                  <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#385980">
                    <path d="M200-120v-680h360l16 80h224v400H520l-16-80H280v280h-80Z"/>
                  </svg>
                </div>
              )}
              {goalFocus && (
                <div
                  style={{
                    color: '#385980',
                    fontSize: '40px',
                    fontWeight: 800,
                    whiteSpace: 'pre-line',
                    lineHeight: '1.4',
                  }}
                >
                  {goalFocus}
                </div>
              )}
            </div>
          )}

          {/* 単語カード */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderRadius: '48px',
              padding: `${20 * 3.65}px`,
              border: 'none',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
              boxSizing: 'border-box',
            }}
          >
            {activeWords.map((w, index) => (
              <div
                key={w.id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  marginTop: index > 0 ? '90px' : '0px',
                }}
              >
                {/* 単語タイトル */}
                <div
                  style={{
                    color: '#385980',
                    fontSize: '58px',
                    fontWeight: 800,
                    lineHeight: '1.2',
                  }}
                >
                  {w.word}
                </div>

                {/* 意味 (Memo) */}
                {w.memo && (
                  <div
                    style={{
                      color: '#385980',
                      fontSize: '42px',
                      fontWeight: 800,
                      lineHeight: '1.4',
                      marginTop: '15px',
                    }}
                  >
                    {w.memo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

WallpaperRenderer.displayName = 'WallpaperRenderer';

export default WallpaperRenderer;
