import { Pool } from 'pg';

async function testConn() {
  const connectionString = 'postgresql://postgres.axeghrvbpzvwisnaejah:%2FcT%2BKsh-4aM%26u3A@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require';
  const oldPool = new Pool({ connectionString });

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
