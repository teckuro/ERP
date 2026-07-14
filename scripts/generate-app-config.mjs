import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve('.env'), quiet: true });

const url = (process.env.SUPABASE_URL ?? process.env.E2E_SUPABASE_URL)?.trim().replace(/\/$/, '');
const key = (process.env.SUPABASE_ANON_KEY ?? process.env.E2E_SUPABASE_ANON_KEY)?.trim();

const PLACEHOLDER_KEY = /YOUR_|REPLACE_ME|CHANGEME/i;
const PLACEHOLDER_URL = /YOUR_PROJECT|example\.com/i;
const PUBLISHABLE_KEY = /^sb_publishable_[A-Za-z0-9_-]+$/;
const SECRET_KEY = /^sb_secret_/;

if (!url || !key) {
  console.error(
    'Faltan SUPABASE_URL o SUPABASE_ANON_KEY en Vercel (Settings → Environment Variables).',
  );
  console.error('Fallback local aceptado: E2E_SUPABASE_URL y E2E_SUPABASE_ANON_KEY desde .env.');
  console.error('No pegue el JSON de app-config.example.json: son dos variables separadas.');
  process.exit(1);
}

if (PLACEHOLDER_URL.test(url) || PLACEHOLDER_KEY.test(key)) {
  console.error('SUPABASE_URL o SUPABASE_ANON_KEY siguen con valores de ejemplo (YOUR_...).');
  console.error('Use la URL y la anon public key reales desde Supabase → Settings → API.');
  process.exit(1);
}

if (!/^https:\/\/.+\.supabase\.co$/i.test(url)) {
  console.error('SUPABASE_URL debe verse como https://xxxx.supabase.co');
  process.exit(1);
}

if (SECRET_KEY.test(key)) {
  console.error('SUPABASE_ANON_KEY no puede ser sb_secret_. Use una publishable key o anon public key.');
  process.exit(1);
}

if (!PUBLISHABLE_KEY.test(key) && key.length < 80) {
  console.error('SUPABASE_ANON_KEY parece incompleta. Use publishable key (sb_publishable_...) o anon public key completa.');
  process.exit(1);
}

writeFileSync(
  resolve('public/app-config.json'),
  JSON.stringify(
    {
      supabaseUrl: url,
      supabaseAnonKey: key,
      asistentePreguntorFunction: 'super-service',
    },
    null,
    2,
  ),
);

console.log('public/app-config.json generado para el build.');
