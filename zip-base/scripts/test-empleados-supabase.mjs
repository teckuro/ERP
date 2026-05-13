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
const parsed = JSON.parse(raw);
const supabaseUrl = (parsed.supabaseUrl ?? '').replace(/\/$/, '');
const supabaseAnonKey = parsed.supabaseAnonKey ?? '';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function tryPersona(schema, table) {
  const q = client.schema(schema).from(table).select('*').limit(5);
  const { data, error } = await q;
  return { schema, table, data, error };
}

// 1) Esquema del modelo ERP
let r = await tryPersona('public', 'persona');
if (!r.error) {
  console.log(`OK ${r.schema}.${r.table} → ${r.data?.length ?? 0} filas (muestra)`);
  console.log(JSON.stringify(r.data, null, 2));
  process.exit(0);
}

console.warn('public.persona:', r.error.message);

// 2) Tabla en public (si migraste datos ahí)
const pub = await client.from('persona').select('*').limit(5);
if (!pub.error) {
  console.log('OK public.persona →', pub.data?.length ?? 0, 'filas');
  console.log(JSON.stringify(pub.data, null, 2));
  process.exit(0);
}

console.warn('public.persona:', pub.error.message);

console.log(`
Conclusión: PostgREST solo expone los esquemas configurados en Supabase (Dashboard → Settings → API → Exposed schemas).
Para usar public.* desde el cliente, añade el esquema "public" ahí y reinicia, o crea vistas en "public" que lean public.persona.
`);
