import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const supabase = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const periodo = process.argv[2] ?? '2026-05';

const tables = [
  ['parametros_generales', (q) => q.eq('periodo', periodo)],
  ['parametros_generales_cliente', (q) => q.eq('periodo', periodo)],
  ['afp', (q) => q],
  ['tabla_impuesto_unico', (q) => q.eq('periodo', periodo)],
  ['salud', (q) => q.eq('tipo', 'ISAPRE')],
  ['periodo_remuneracion', (q) => q.eq('codigo', periodo)],
];

for (const [table, filter] of tables) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  q = filter(q);
  const { count, error } = await q;
  console.log(`[anon] ${table}: count=${count ?? 0}${error ? ` error=${error.message}` : ''}`);
}

const { data: pg, error: pgErr } = await supabase
  .from('parametros_generales')
  .select('periodo, uf, utm, sueldo_minimo, sueldo_minimo18_65, tope_afp, sis')
  .eq('periodo', periodo)
  .maybeSingle();
console.log('[anon] parametros_generales row:', pgErr ? pgErr.message : JSON.stringify(pg));
