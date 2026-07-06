/**
 * Verifica el trigger HD→MR end-to-end:
 *   1. Cuenta MR antes.
 *   2. INSERT en HD (concepto 5, monto $5000, MENSUAL, persona 2, contrato 2).
 *   3. Cuenta MR después: debe haber +1 fila con id_haberdescuento_origen.
 *   4. UPDATE en HD (cambia monto a 7777): MR refleja el cambio.
 *   5. DELETE en HD: MR pierde la fila.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const sb = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function contar() {
  const { count } = await sb
    .from('movimiento_recurrente')
    .select('id', { count: 'exact', head: true });
  return count;
}

async function lookupId(idAsign) {
  const { data } = await sb
    .from('movimiento_recurrente')
    .select('id, monto, estado, id_haberdescuento_origen')
    .eq('id_haberdescuento_origen', idAsign);
  return data?.[0];
}

const antes = await contar();
console.log(`MR count antes: ${antes}`);

console.log('\n1) INSERT en HD');
const { data: insHd, error: eIns } = await sb
  .from('haberdescuento_persona')
  .insert({
    id_persona: 2,
    id_contrato: 2,
    id_concepto: 5,
    monto: 5000,
    tipo: 'FIJO',
    tipohaber: 'NO_IMPONIBLE',
    estado: true,
    periodicidad: 'MENSUAL',
    vigencia_inicio: '2026-06-01',
    observacion: 'test trigger',
  })
  .select('id_asignacion');
if (eIns) {
  console.error('  ERROR insert HD:', eIns);
  process.exit(1);
}
const idAsign = insHd[0].id_asignacion;
console.log('  HD creado: id_asignacion=', idAsign);

const despuesIns = await contar();
const mrCreado = await lookupId(idAsign);
console.log(`  MR count despues INSERT: ${despuesIns} (esperado: ${antes + 1})`);
console.log(`  MR creado:`, mrCreado);

console.log('\n2) UPDATE HD (monto 5000→7777)');
const { error: eUpd } = await sb
  .from('haberdescuento_persona')
  .update({ monto: 7777 })
  .eq('id_asignacion', idAsign);
if (eUpd) console.error('  ERROR update:', eUpd);
const mrUpd = await lookupId(idAsign);
console.log(`  MR tras UPDATE:`, mrUpd);

console.log('\n3) DELETE HD');
const { error: eDel } = await sb
  .from('haberdescuento_persona')
  .delete()
  .eq('id_asignacion', idAsign);
if (eDel) console.error('  ERROR delete:', eDel);
const despuesDel = await contar();
const mrFinal = await lookupId(idAsign);
console.log(`  MR count despues DELETE: ${despuesDel} (esperado: ${antes})`);
console.log(`  MR para idAsign=${idAsign} debe ser undefined:`, mrFinal);
