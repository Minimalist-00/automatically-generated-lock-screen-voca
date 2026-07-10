import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('VERCEL_DATABASE_URL:', process.env.VERCEL_DATABASE_URL ? 'set' : 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');

const connectionString = 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.VERCEL_DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL;

console.log('Using connectionString:', connectionString);
