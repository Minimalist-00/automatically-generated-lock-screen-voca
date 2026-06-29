-- Words table
CREATE TABLE IF NOT EXISTS public.words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    part_of_speech TEXT,
    scene TEXT,
    example TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wallpapers table
CREATE TABLE IF NOT EXISTS public.wallpapers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quests table (Daily word lock screens)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    word_ids UUID[] NOT NULL, -- Array of 3 words
    wallpaper_id UUID REFERENCES public.wallpapers(id) ON DELETE SET NULL,
    generated_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) if needed, but since it's single user, we can keep it simple or enable all access.
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read and write to words" ON public.words;
CREATE POLICY "Allow all read and write to words" ON public.words FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all read and write to wallpapers" ON public.wallpapers;
CREATE POLICY "Allow all read and write to wallpapers" ON public.wallpapers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all read and write to quests" ON public.quests;
CREATE POLICY "Allow all read and write to quests" ON public.quests FOR ALL USING (true) WITH CHECK (true);

-- Create wallpapers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage security policies
DROP POLICY IF EXISTS "Wallpapers are publicly accessible" ON storage.objects;
CREATE POLICY "Wallpapers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Anyone can upload wallpapers" ON storage.objects;
CREATE POLICY "Anyone can upload wallpapers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Anyone can update wallpapers" ON storage.objects;
CREATE POLICY "Anyone can update wallpapers"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'wallpapers');

DROP POLICY IF EXISTS "Anyone can delete wallpapers" ON storage.objects;
CREATE POLICY "Anyone can delete wallpapers"
ON storage.objects FOR DELETE
USING (bucket_id = 'wallpapers');

-- System Settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read and write to system_settings" ON public.system_settings;
CREATE POLICY "Allow all read and write to system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- デフォルトのプロンプトを挿入
INSERT INTO public.system_settings (key, value)
VALUES (
    'generation_prompt',
    '### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中、生粋のゲーマーで、語学学校の友人や先生とよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

英単語「{{word}}」（意味: {{meaning}}）について、以下の2点を含むJSONデータを生成してください。

- "scene": 使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「いやそれな！」「まじかよ！」など、Neoのバイブスに合う日本語の口語表現メインにしてください。絶対に長文にしないでください。
- "example": そのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語1文、日本語訳1文のみとし、長々とした説明は省いてください。（改行を入れて表示しやすい形にしてください）。

レスポンスは以下のJSONフォーマットのみを返してください。余計なマークダウン（```jsonなど）やテキストは一切含めないでください。
{
  "scene": "...",
  "example": "..."
}'
) ON CONFLICT (key) DO NOTHING;
