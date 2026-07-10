import { Pool } from 'pg';

async function testConn() {
  const oldPool = new Pool({
    user: 'postgres',
    password: '/cT+Ksh-4aM&u3A',
    host: 'db.axeghrvbpzvwisnaejah.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await oldPool.query('SELECT count(*) FROM words');
    console.log('Words count:', res.rows[0].count);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await oldPool.end();
  }
}
testConn();
