import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { words, wallpaperUrl } = await request.json();
    if (!words || !Array.isArray(words)) {
      return NextResponse.json({ error: '単語データが不正です。' }, { status: 400 });
    }

    // TODO: ここでCanvasを使用して画像を合成し、URLまたはバイナリを返却する
    return NextResponse.json({
      success: true,
      message: '画像合成機能のモックレスポンスです。',
      generatedImageUrl: wallpaperUrl || '/mock-lockscreen.png',
    });
  } catch (error: any) {
    console.error('Wallpaper generation failed:', error);
    return NextResponse.json(
      { error: '画像の生成に失敗しました。' },
      { status: 500 }
    );
  }
}
