import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchSupabaseTable(table: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
  }
  return response.json();
}

async function migrateData() {
  console.log('Starting data migration using Supabase REST API...');

  const newPool = new Pool({ connectionString: process.env.VERCEL_DATABASE_URL });
  const adapter = new PrismaPg(newPool);
  const prisma = new PrismaClient({ adapter });

  try {
    // --- Migrate Words ---
    console.log('Migrating words...');
    const oldWords = await fetchSupabaseTable('words');
    if (oldWords.length > 0) {
      await prisma.word.createMany({
        data: oldWords,
        skipDuplicates: true,
      });
      console.log(`Migrated ${oldWords.length} words.`);
    }

    // --- Migrate Wallpapers ---
    console.log('Migrating wallpapers...');
    const oldWallpapers = await fetchSupabaseTable('wallpapers');
    if (oldWallpapers.length > 0) {
      await prisma.wallpaper.createMany({
        data: oldWallpapers,
        skipDuplicates: true,
      });
      console.log(`Migrated ${oldWallpapers.length} wallpapers.`);
    }

    // --- Migrate Quests ---
    console.log('Migrating quests...');
    let oldQuests = await fetchSupabaseTable('quests');
    oldQuests = oldQuests.map((q: any) => ({
      ...q,
      quest_date: q.quest_date ? new Date(q.quest_date).toISOString() : null,
    }));
    
    if (oldQuests.length > 0) {
      await prisma.quest.createMany({
        data: oldQuests,
        skipDuplicates: true,
      });
      console.log(`Migrated ${oldQuests.length} quests.`);
    }

    // --- Migrate System Settings ---
    console.log('Migrating system settings...');
    const oldSettings = await fetchSupabaseTable('system_settings');
    if (oldSettings.length > 0) {
      await prisma.systemSetting.createMany({
        data: oldSettings,
        skipDuplicates: true,
      });
      console.log(`Migrated ${oldSettings.length} system settings.`);
    }

    console.log('Data migration completed successfully!');
  } catch (err) {
    console.error('Error during data migration:', err);
  } finally {
    await prisma.$disconnect();
    await newPool.end();
  }
}

migrateData();
