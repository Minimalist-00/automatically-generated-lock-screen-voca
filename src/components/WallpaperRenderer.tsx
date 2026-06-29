'use client';

import React, { forwardRef } from 'react';

interface Word {
  id: string;
  word: string;
  meaning: string;
  scene?: string;
  example?: string;
}

interface WallpaperRendererProps {
  words: Word[];
  wallpaperUrl?: string;
}

/**
 * HTML/CSSベースの壁紙レンダラー。
 * 実際の壁紙解像度(1242×2688px)でレイアウトし、
 * プレビューと最終出力の両方で同一のDOMを使用する。
 */
const WallpaperRenderer = forwardRef<HTMLDivElement, WallpaperRendererProps>(
  ({ words, wallpaperUrl }, ref) => {
    const activeWords = words.slice(0, 3);

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
          fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
          ...getBackgroundStyle(),
        }}
      >
        {/* 単語カード */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${1242 - 16 * 3.65 * 2}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '58px',
            padding: `${20 * 3.65}px`,
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
                marginTop: index > 0 ? '90px' : '0px',
              }}
            >
              {/* 単語タイトル */}
              <div
                style={{
                  color: '#58A498',
                  fontSize: '58px',
                  fontWeight: 700,
                  lineHeight: '1.2',
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                }}
              >
                {w.word}
              </div>

              {/* 意味 */}
              <div
                style={{
                  color: '#6B8B86',
                  fontSize: '34px',
                  fontWeight: 700,
                  lineHeight: '1.4',
                  marginTop: '15px',
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                }}
              >
                {w.meaning}
              </div>

              {/* シーンタグ */}
              {w.scene && (
                <div
                  style={{
                    marginTop: '32px',
                    display: 'inline-flex',
                    alignSelf: 'flex-start',
                    backgroundColor: '#EAF5F2',
                    borderRadius: '29px',
                    padding: '15px 35px',
                    fontSize: '29px',
                    fontWeight: 700,
                    color: '#4A6B65',
                    lineHeight: '1.5',
                    maxWidth: `${1242 - 16 * 3.65 * 2 - 20 * 3.65 * 2}px`,
                    wordBreak: 'break-word' as const,
                    fontFamily: "'M PLUS Rounded 1c', sans-serif",
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
                    backgroundColor: '#F2F9F8',
                    borderRadius: '29px',
                    padding: '35px 35px 20px 35px',
                    fontSize: '33px',
                    fontWeight: 400,
                    color: '#6B8B86',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line' as const,
                    wordBreak: 'break-word' as const,
                    fontFamily: "'M PLUS Rounded 1c', sans-serif",
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
