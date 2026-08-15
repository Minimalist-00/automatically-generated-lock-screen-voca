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
          fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', 'Noto Sans JP', sans-serif",
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
                    fontWeight: 800,
                    opacity: 0.9,
                  }}
                >
                  {goalDeadline}まで
                </div>
              )}
              {goalFocus && (
                <div
                  style={{
                    color: '#385980',
                    fontSize: '40px',
                    fontWeight: 900,
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
                    fontWeight: 700,
                    lineHeight: '1.2',
                  }}
                >
                  {w.word}
                </div>

                {/* 意味 */}
                <div
                  style={{
                    color: '#385980',
                    fontSize: '42px',
                    fontWeight: 700,
                    lineHeight: '1.4',
                    marginTop: '15px',
                  }}
                >
                  {w.meaning}
                </div>

                {/* シーンタグ */}
                {w.scene && (
                  <div
                    style={{
                      marginTop: '32px',
                      display: 'inline-block',
                      backgroundColor: '#F0F6FF',
                      borderRadius: '24px',
                      padding: '20px 40px',
                      fontSize: '34px',
                      fontWeight: 700,
                      color: '#385980',
                      lineHeight: '1.3',
                      maxWidth: '100%',
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
                      marginTop: w.scene ? '25px' : '32px',
                      backgroundColor: '#F4F8FD',
                      borderRadius: '29px',
                      padding: '30px 35px 30px 35px',
                      fontSize: '36px',
                      fontWeight: 400,
                      color: '#385980',
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
        </div>border-box' as const,
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
