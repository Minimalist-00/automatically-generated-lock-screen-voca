const { Client } = require('pg');

async function runMigration() {
  console.log('Starting migration script...');
  const client = new Client({
    user: 'postgres',
    password: '/cT+Ksh-4aM&u3A',
    host: 'db.axeghrvbpzvwisnaejah.supabase.co',
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
