import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const action = process.argv[2];
  const key = process.argv[3] || 'generation_prompt';

  if (action === 'get') {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      console.log(`Error fetching ${key}:`, error.message);
    } else {
      console.log(`Value for ${key}:`);
      console.log("----------------------------------------");
      console.log(data?.value || '(empty)');
      console.log("----------------------------------------");
    }
  } else if (action === 'set') {
    const value = process.argv[4];
    if (value === undefined) {
      console.error("Please provide a value to set.");
      process.exit(1);
    }
    
    const res = await supabase.from('system_settings').upsert({ key, value }, { onConflict: 'key' });
    
    if (res.error) {
      console.error("Error setting value:", res.error.message);
    } else {
      console.log(`Successfully updated ${key}.`);
    }
  } else if (action === 'delete') {
    const { error } = await supabase.from('system_settings').delete().eq('key', key);
    if (error) {
      console.error("Error deleting value:", error.message);
    } else {
      console.log(`Successfully deleted ${key}.`);
    }
  } else {
    console.log("Usage:");
    console.log("  node scripts/manage_prompt.mjs get [key]");
    console.log("  node scripts/manage_prompt.mjs set [key] [value]");
    console.log("  node scripts/manage_prompt.mjs delete [key]");
  }
}

main();
