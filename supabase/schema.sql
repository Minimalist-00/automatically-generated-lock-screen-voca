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
あなたはNeo（23歳、現在フィリピン留学中。語学学校の先生や友人たちとよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から授業や日常会話で「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

### シーン（Usage Scene）の指定ルール
- 例文のシチュエーションは、「フィリピンの語学学校の授業で先生に質問・発言するシーン」や「学校の友達とカフェやドミトリーで雑談する日常会話シーン」をメインに設定してください。ゲームなどの偏ったシチュエーションは避けてください。
- 各単語につき、異なるシチュエーションの候補を【必ず4つ】生成してください。
- 4つの候補の内訳は必ず以下の通りにしてください：
  - 1つ目と2つ目の候補: 語学学校の授業中に「先生」に対して使える丁寧な表現や質問シーン。
  - 3つ目と4つ目の候補: 寮（ドミトリー）やカフェなどで「友達」に対して使えるカジュアルな雑談シーン。
- 各候補の "scene" と "example" は【必ず同じシチュエーション】に基づいてください。sceneが「授業中に先生に質問する」なら、exampleもその授業中での例文にしてください。sceneとexampleがちぐはぐにならないよう、絶対に一致させてください。
- sceneは使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「先生に質問する時」「友達と週末の予定を話す時」など、具体的かつ簡潔な日本語表現にしてください。
- exampleはそのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語は1文（長くても2文とし、3文以上は絶対に禁止）、日本語訳も1〜2文のみ。基本は1文で極めて簡潔に表現してください。'
) ON CONFLICT (key) DO NOTHING;
