/**
 * Smoke test: lee public/app-config.json y verifica Auth + REST.
 * Uso: node scripts/test-supabase-api.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', 'public', 'app-config.json');

if (!fs.existsSync(configPath)) {
  console.error('Falta public/app-config.json. Copia public/app-config.example.json y completa tus valores.');
  process.exit(1);
}

const raw = fs.readFileSync(configPath, 'utf8');
const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
const supabaseUrl = (parsed.supabaseUrl ?? '').replace(/\/$/, '');
const supabaseAnonKey = parsed.supabaseAnonKey ?? '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
  console.error('Falta configurar supabaseUrl / supabaseAnonKey en public/app-config.json');
  process.exit(1);
}

async function main() {
  console.log('Base URL:', supabaseUrl);

  const authHealth = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });
  const authBody = authHealth.ok ? 'OK' : await authHealth.text();
  console.log('GET /auth/v1/health (con apikey) →', authHealth.status, authHealth.ok ? authBody : authBody);

  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { error: sessionErr } = await client.auth.getSession();
  console.log(
    'supabase.auth.getSession() →',
    sessionErr ? `error: ${sessionErr.message}` : 'OK (sin sesión activa es normal)',
  );

  const { data: buckets, error: storageErr } = await client.storage.listBuckets();
  console.log(
    'storage.listBuckets() →',
    storageErr ? `error: ${storageErr.message}` : `OK (${buckets?.length ?? 0} buckets)`,
  );

  const { error: restErr } = await client
    .from('_smoke_nonexistent_')
    .select('*')
    .limit(1);
  const postgrestOk = restErr?.code === 'PGRST205';
  console.log(
    'PostgREST (from tabla inexistente) →',
    postgrestOk
      ? 'OK (clave aceptada; PGRST205 = tabla no existe, esperado)'
      : restErr
        ? `error: ${restErr.code ?? ''} ${restErr.message}`
        : 'OK',
  );

  const ok = authHealth.ok && !sessionErr && !storageErr && postgrestOk;
  console.log(
    '\nResumen:',
    ok
      ? 'API accesible: Auth, Storage y PostgREST responden correctamente con tu clave pública.'
      : 'Revisa errores arriba (URL, anon key en Project Settings → API).',
  );
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
