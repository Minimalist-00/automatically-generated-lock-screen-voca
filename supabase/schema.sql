-- Words table
CREATE TABLE IF NOT EXISTS public.words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    scene TEXT,
    example TEXT,
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

CREATE POLICY "Allow all read and write to words" ON public.words FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read and write to wallpapers" ON public.wallpapers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read and write to quests" ON public.quests FOR ALL USING (true) WITH CHECK (true);
