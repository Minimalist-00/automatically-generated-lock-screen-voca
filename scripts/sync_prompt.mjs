import fs from 'fs';
import { execSync, spawnSync } from 'child_process';

const code = fs.readFileSync('src/lib/constants.ts', 'utf8');
const match = code.match(/export const defaultPersonaPrompt = `([\s\S]*?)`;/);

if (match) {
  const prompt = match[1];
  // manage_prompt.mjs を用いてアップデート
  console.log("Updating Supabase generation_prompt...");
  // Node.jsのchild_process.spawnなどを使って引数として安全に渡す
  const result = spawnSync('node', ['scripts/manage_prompt.mjs', 'set', 'generation_prompt', prompt], {
    encoding: 'utf8',
  });
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
} else {
  console.error("Could not find defaultPersonaPrompt");
}
