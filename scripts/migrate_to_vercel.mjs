import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting migration from Supabase to Vercel...");
  
  // 1. Migrate Words
  console.log("Fetching words...");
  const { data: words, error: wordsError } = await supabase.from('words').select('*');
  if (wordsError) throw wordsError;
  
  if (words && words.length > 0) {
    console.log(`Migrating ${words.length} words...`);
    await prisma.word.createMany({
      data: words,
      skipDuplicates: true
    });
  }

  // 2. Migrate System Settings
  console.log("Fetching system settings...");
  const { data: settings, error: settingsError } = await supabase.from('system_settings').select('*');
  if (settingsError) throw settingsError;
  
  if (settings && settings.length > 0) {
    console.log(`Migrating ${settings.length} system settings...`);
    await prisma.systemSetting.createMany({
      data: settings,
      skipDuplicates: true
    });
  }

  // 3. Migrate Wallpapers and images
  console.log("Fetching wallpapers...");
  const { data: wallpapers, error: wallpapersError } = await supabase.from('wallpapers').select('*');
  if (wallpapersError) throw wallpapersError;
  
  if (wallpapers && wallpapers.length > 0) {
    console.log(`Migrating ${wallpapers.length} wallpapers...`);
    for (const wp of wallpapers) {
      const existing = await prisma.wallpaper.findUnique({ where: { id: wp.id } });
      if (existing) {
        console.log(`Wallpaper ${wp.name} already migrated.`);
        continue;
      }
      
      console.log(`Processing wallpaper: ${wp.name}`);
      let newPublicUrl = wp.public_url;
      
      try {
        const response = await fetch(wp.public_url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const blob = await put(`wallpapers/${wp.storage_path}`, buffer, {
            access: 'public',
            addRandomSuffix: false
          });
          
          newPublicUrl = blob.url;
        } else {
          console.warn(`Failed to fetch image from Supabase for ${wp.name}: ${response.statusText}`);
        }
      } catch (err) {
        console.warn(`Error uploading image to Blob for ${wp.name}:`, err.message);
      }
      
      await prisma.wallpaper.create({
        data: {
          id: wp.id,
          name: wp.name,
          storage_path: wp.storage_path,
          public_url: newPublicUrl,
          created_at: wp.created_at
        }
      });
    }
  }

  // 4. Migrate Quests
  console.log("Fetching quests...");
  const { data: quests, error: questsError } = await supabase.from('quests').select('*');
  if (questsError) throw questsError;
  
  if (quests && quests.length > 0) {
    console.log(`Migrating ${quests.length} quests...`);
    for (const quest of quests) {
       const existing = await prisma.quest.findUnique({ where: { id: quest.id } });
       if (existing) continue;
       
       await prisma.quest.create({
         data: {
           id: quest.id,
           quest_date: new Date(quest.quest_date),
           word_ids: quest.word_ids,
           wallpaper_id: quest.wallpaper_id,
           generated_image_url: quest.generated_image_url,
           created_at: quest.created_at
         }
       });
    }
  }

  console.log("Migration completed successfully!");
}

migrate()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
