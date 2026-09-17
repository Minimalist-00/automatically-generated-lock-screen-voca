require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');

async function runNeonMigration() {
  console.log('Connecting to Neon DB...');
  const client = new Client({ 
    connectionString: process.env.VERCEL_DATABASE_URL?.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true') 
  });
  
  try {
    await client.connect();
    console.log('Connected!');

    console.log('Running schema migrations...');
    await client.query(`
      ALTER TABLE public.words 
      ADD COLUMN IF NOT EXISTS memo TEXT,
      ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    `);
    console.log('Added memo and tags columns.');

    await client.query(`
      UPDATE public.words SET memo = meaning WHERE meaning IS NOT NULL AND memo IS NULL;
    `);
    console.log('Migrated meaning to memo.');

    await client.query(`
      ALTER TABLE public.words
      DROP COLUMN IF EXISTS meaning,
      DROP COLUMN IF EXISTS scene,
      DROP COLUMN IF EXISTS example;
    `);
    console.log('Dropped old columns (meaning, scene, example).');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

runNeonMigration();
