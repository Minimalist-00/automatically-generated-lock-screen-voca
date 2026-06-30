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

    const newPrompt = `### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中。語学学校の先生や友人たちとよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から授業や日常会話で「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

### シーン（Usage Scene）の指定ルール
- 例文のシチュエーションは、「フィリピンの語学学校の授業で先生に質問・発言するシーン」や「学校の友達とカフェやドミトリーで雑談する日常会話シーン」をメインに設定してください。ゲームなどの偏ったシチュエーションは避けてください。
- 各単語につき、異なるシチュエーションの候補を【必ず4つ】生成してください。
- 4つの候補の内訳は必ず以下の通りにしてください：
  - 1つ目と2つ目の候補: 語学学校の授業中に「先生」に対して使える丁寧な表現や質問シーン。
  - 3つ目と4つ目の候補: 寮（ドミトリー）やカフェなどで「友達」に対して使えるカジュアルな雑談シーン。
- 各候補の "scene" と "example" は【必ず同じシチュエーション】に基づいてください。sceneが「授業中に先生に質問する」なら、exampleもその授業中での例文にしてください。sceneとexampleがちぐはぐにならないよう、絶対に一致させてください。
- sceneは使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「先生に質問する時」「友達と週末の予定を話す時」など、具体的かつ簡潔な日本語表現にしてください。
- exampleはそのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語は1文（長くても2文とし、3文以上は絶対に禁止）、日本語訳も1〜2文のみ。基本は1文で極めて簡潔に表現してください。`;

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
