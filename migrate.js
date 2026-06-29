const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Starting migration script...');
  
  const client = new Client({
    user: 'postgres.axeghrvbpzvwisnaejah',
    password: '/cT+Ksh-4aM&u3A',
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to db...');
    await client.connect();
    console.log('Connected!');
    
    // Add sort_order column if not exists
    await client.query(`
      ALTER TABLE public.words 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER;
    `);

    console.log('Added sort_order column.');

    // Add part_of_speech column if not exists
    await client.query(`
      ALTER TABLE public.words 
      ADD COLUMN IF NOT EXISTS part_of_speech TEXT;
    `);

    console.log('Added part_of_speech column.');

    // Update generation_prompt setting to include part_of_speech
    const newPrompt = `### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中、生粋のゲーマーで、語学学校の友人や先生とよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

英単語「{{word}}」（意味: {{meaning}}）について、以下の3点を含むJSONデータを生成してください。

- "part_of_speech": 該当する品詞（"Noun", "Verb", "Adj", "Adv", "Prep", "Phrase" などの短い英語表記）。
- "scene": 使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「いやそれな！」「まじかよ！」など、Neoのバイブスに合う日本語の口語表現メインにしてください。絶対に長文にしないでください。
- "example": そのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語1文、日本語訳1文のみとし、長々とした説明は省いてください。（改行を入れて表示しやすい形にしてください）。

レスポンスは以下のJSONフォーマットのみを返してください。余計なマークダウン（\`\`\`jsonなど）やテキストは一切含めないでください。
{
  "part_of_speech": "...",
  "scene": "...",
  "example": "..."
}`;

    await client.query(`
      INSERT INTO public.system_settings (key, value, updated_at)
      VALUES ('generation_prompt', $1, now())
      ON CONFLICT (key) DO UPDATE
      SET value = $1, updated_at = now();
    `, [newPrompt]);

    console.log('Updated system generation prompt setting.');

    // Initialize existing words with sort_order based on created_at
    // Using a window function to generate sequence numbers
    await client.query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
        FROM public.words
      )
      UPDATE public.words w
      SET sort_order = n.rn
      FROM numbered n
      WHERE w.id = n.id AND w.sort_order IS NULL;
    `);

    console.log('Initialized sort_order for existing records.');
    
    // Reload PostgREST schema cache
    console.log('Notifying pgrst to reload schema...');
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('Reload schema notified.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

runMigration();
