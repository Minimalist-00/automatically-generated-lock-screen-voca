'use client';

import React, { forwardRef } from 'react';

import { Word } from '@/types';

interface WallpaperRendererProps {
  words: Word[];
  wallpaperUrl?: string;
  goalDeadline?: string;
  goalFocus?: string;
}

/**
 * HTML/CSSベースの壁紙レンダラー。
 * 実際の壁紙解像度(1242×2688px)でレイアウトし、
 * プレビューと最終出力の両方で同一のDOMを使用する。
 */
const WallpaperRenderer = forwardRef<HTMLDivElement, WallpaperRendererProps>(
  ({ words, wallpaperUrl, goalDeadline, goalFocus }, ref) => {
    const activeWords = words.slice(0, 3);
    const isCompact = activeWords.length > 2;

    // 背景スタイルの決定
    const getBackgroundStyle = (): React.CSSProperties => {
      if (wallpaperUrl && (wallpaperUrl.startsWith('#') || wallpaperUrl.startsWith('rgb') || wallpaperUrl.startsWith('hsl'))) {
        return { backgroundColor: wallpaperUrl };
      }
      if (wallpaperUrl) {
        return {
          backgroundImage: `url(${wallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
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
          fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', 'Noto Sans JP', sans-serif",
          ...getBackgroundStyle(),
        }}
      >
        {/* ゴール表示 */}
        {(goalDeadline || goalFocus) && (
          <div
            style={{
              position: 'absolute',
              top: '26%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${1242 - 16 * 3.65 * 2}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '38px',
              padding: `${12 * 3.65}px ${16 * 3.65}px`,
              border: '3px solid rgba(209, 234, 229, 0.6)',
              boxShadow: '0 10px 30px rgba(165, 207, 201, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {goalDeadline && (
              <div
                style={{
                  color: '#4A6B65',
                  fontSize: '28px',
                  fontWeight: 800,
                  opacity: 0.8,
                  letterSpacing: '0.05em',
                }}
              >
                🏁 DEADLINE: {goalDeadline}
              </div>
            )}
            {goalFocus && (
              <div
                style={{
                  color: '#2C5282',
                  fontSize: '36px',
                  fontWeight: 900,
                  lineHeight: '1.4',
                }}
              >
                🎯 {goalFocus}
              </div>
            )}
          </div>
        )}

        {/* 単語カード */}
        <div
          style={{
            position: 'absolute',
            top: (goalDeadline || goalFocus) ? '38%' : '32%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${1242 - 16 * 3.65 * 2}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '58px',
            padding: isCompact ? `${15 * 3.65}px` : `${20 * 3.65}px`,
            border: '4px solid rgba(209, 234, 229, 0.6)',
            boxShadow: '0 15px 40px rgba(165, 207, 201, 0.3)',
          }}
        >
          {activeWords.map((w, index) => (
            <div
              key={w.id || index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0px',
                marginTop: index > 0 ? (isCompact ? '50px' : '90px') : '0px',
              }}
            >
              {/* 単語タイトル */}
              <div
                style={{
                  color: '#58A498',
                  fontSize: isCompact ? '48px' : '58px',
                  fontWeight: 700,
                  lineHeight: '1.2',
                }}
              >
                {w.word}
              </div>

              {/* 意味 */}
              <div
                style={{
                  color: '#6B8B86',
                  fontSize: isCompact ? '30px' : '34px',
                  fontWeight: 700,
                  lineHeight: '1.4',
                  marginTop: isCompact ? '10px' : '15px',
                }}
              >
                {w.meaning}
              </div>

              {/* シーンタグ */}
              {w.scene && (
                <div
                  style={{
                    marginTop: isCompact ? '20px' : '32px',
                    display: 'inline-block',
                    backgroundColor: '#EAF5F2',
                    borderRadius: '24px',
                    padding: isCompact ? '12px 25px' : '18px 35px',
                    fontSize: isCompact ? '25px' : '29px',
                    fontWeight: 700,
                    color: '#4A6B65',
                    lineHeight: '1.3',
                    maxWidth: `${1242 - 16 * 3.65 * 2 - 20 * 3.65 * 2}px`,
                    wordBreak: 'break-word' as const,
                    boxSizing: 'border-box' as const,
                  }}
                >
                  💡 {w.scene}
                </div>
              )}

              {/* 例文 */}
              {w.example && (
                <div
                  style={{
                    marginTop: w.scene ? (isCompact ? '18px' : '25px') : (isCompact ? '22px' : '32px'),
                    backgroundColor: '#F2F9F8',
                    borderRadius: '29px',
                    padding: isCompact ? '20px 25px' : '30px 35px 30px 35px',
                    fontSize: isCompact ? '30px' : '33px',
                    fontWeight: 400,
                    color: '#6B8B86',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line' as const,
                    wordBreak: 'break-word' as const,
                    boxSizing: 'border-box' as const,
                  }}
                >
                  {w.example}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

WallpaperRenderer.displayName = 'WallpaperRenderer';

export default WallpaperRenderer;
