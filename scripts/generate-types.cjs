require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const __projectId = process.env.SUPABASE_PROJECT_ID;

if (!__projectId) {
  throw new Error('Falta SUPABASE_PROJECT_ID en el archivo .env');
}

const __outputDir = path.resolve(__dirname, '../src/app/core/models');
const __outputFile = path.join(__outputDir, 'database.types.ts');

fs.mkdirSync(__outputDir, { recursive: true });

const __result = execSync(
  `npm exec -- supabase gen types typescript --project-id ${__projectId}`,
  { encoding: 'utf8', shell: true }
);

fs.writeFileSync(__outputFile, __result, 'utf8');

console.log(`Tipos generados en: ${__outputFile}`);