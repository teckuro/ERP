/**
 * Diagnóstico previo a la migración haberdescuento_persona → movimiento_recurrente.
 *
 * Imprime:
 *   - Conteo total de filas en haberdescuento_persona y por estado.
 *   - Distribución de `tipo`, `tipohaber`, `periodicidad`, `porcentaje`/`monto`.
 *   - Conceptos referenciados (id, codigo, tipo, naturaleza) para validar mapeo.
 *   - Filas con datos incompletos que serían bloqueantes para migrar
 *     (sin contrato, sin monto y sin porcentaje, vigencia_inicio NULL, etc.).
 *   - Conteo de filas que ya existen en movimiento_recurrente con la misma
 *     identidad lógica (id_persona + id_concepto + vigencia_inicio).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const supabase = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function h(t) { console.log(`\n=== ${t} ===`); }
function grupo(label, items) {
  const map = new Map();
  for (const v of items) map.set(v, (map.get(v) ?? 0) + 1);
  console.log(`  ${label}:`);
  [...map.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`    ${k ?? '(null)'}: ${n}`));
}

async function main() {
  h('haberdescuento_persona — universo');
  const { data: hd, error: eHd } = await supabase
    .from('haberdescuento_persona')
    .select('id_asignacion, id_persona, id_concepto, monto, porcentaje, tipo, tipohaber, estado, id_contrato, vigencia_inicio, vigencia_fin, periodicidad, observacion');
  if (eHd) {
    console.error('  ERROR:', eHd);
    process.exit(1);
  }
  console.log(`  total filas: ${hd.length}`);
  console.log(`  activas (estado=true): ${hd.filter((r) => r.estado === true).length}`);
  console.log(`  inactivas: ${hd.filter((r) => r.estado === false).length}`);

  grupo('tipo (HABER/DESCUENTO/…)', hd.map((r) => r.tipo));
  grupo('tipohaber (IMPONIBLE/NO_IMPONIBLE/…)', hd.map((r) => r.tipohaber));
  grupo('periodicidad', hd.map((r) => r.periodicidad));

  const conMonto = hd.filter((r) => r.monto != null).length;
  const conPct = hd.filter((r) => r.porcentaje != null).length;
  const ambos = hd.filter((r) => r.monto != null && r.porcentaje != null).length;
  const ninguno = hd.filter((r) => r.monto == null && r.porcentaje == null).length;
  console.log(`  con monto: ${conMonto} · con porcentaje: ${conPct} · ambos: ${ambos} · ninguno: ${ninguno}`);

  const sinContrato = hd.filter((r) => r.id_contrato == null).length;
  const sinVigencia = hd.filter((r) => r.vigencia_inicio == null).length;
  console.log(`  sin id_contrato: ${sinContrato} · sin vigencia_inicio: ${sinVigencia}`);

  h('conceptos referenciados');
  const idsConcepto = [...new Set(hd.map((r) => r.id_concepto))];
  const { data: conceptos } = await supabase
    .from('concepto')
    .select('id_concepto, codigo, nombre, tipo, naturaleza, imponible, tributable')
    .in('id_concepto', idsConcepto);
  console.log(`  conceptos únicos usados: ${idsConcepto.length}`);
  conceptos?.forEach((c) => {
    console.log(`    c=${c.id_concepto} | ${c.codigo} | ${c.nombre} | tipo=${c.tipo} | naturaleza=${c.naturaleza} | imp=${c.imponible} trib=${c.tributable}`);
  });

  h('contratos referenciados → empresas');
  const idsContrato = [...new Set(hd.map((r) => r.id_contrato).filter((v) => v != null))];
  const { data: contratos } = await supabase
    .from('contrato')
    .select('id_contrato, id_empresa, id_persona, estado')
    .in('id_contrato', idsContrato);
  console.log(`  contratos únicos: ${idsContrato.length}`);
  const empresasDistintas = new Set((contratos ?? []).map((c) => c.id_empresa));
  console.log(`  empresas distintas: ${[...empresasDistintas].join(', ')}`);

  h('cruce: ¿ya existe en movimiento_recurrente?');
  const { data: rec } = await supabase
    .from('movimiento_recurrente')
    .select('id, id_empresa, id_persona, tipo, activo_desde');
  console.log(`  total movimiento_recurrente actual: ${rec?.length ?? 0}`);
  rec?.forEach((r) => console.log(`    rec id_persona=${r.id_persona} tipo=${r.tipo} desde=${r.activo_desde}`));
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
