import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const sb = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: noms } = await sb
  .from('nomina_periodo')
  .select('id, periodo, tipo, estado, id_empresa, total_trabajadores, total_segmentos, created_at')
  .order('created_at', { ascending: false });
console.log('Nóminas existentes:', noms);

for (const n of noms ?? []) {
  const { data: segs } = await sb
    .from('segmento_nomina')
    .select('id, nombre, trabajador_ids')
    .eq('id_nomina_periodo', n.id);
  console.log(`  nomina ${n.id} (${n.periodo} · ${n.estado}) → segmentos:`);
  segs?.forEach((s) => console.log(`    seg ${s.nombre}: trabajadores=${JSON.stringify(s.trabajador_ids)}`));
}
