/**
 * Diagnóstico del bridge HD → MR.
 * - Lista filas HD y comprueba si el trigger las llevó a MR.
 * - Si MR está vacío, prueba un UPDATE no-op en HD para gatillar el trigger
 *   y aislar el problema (backfill vs trigger).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const supabase = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function h(t) { console.log(`\n=== ${t} ===`); }

const { data: hds } = await supabase
  .from('haberdescuento_persona')
  .select('id_asignacion, id_persona, id_contrato, id_concepto, monto, porcentaje, periodicidad, estado, vigencia_inicio, observacion');
h('HD universo'); console.log(hds);

const { data: mrs } = await supabase
  .from('movimiento_recurrente')
  .select('id, id_empresa, id_persona, tipo, categoria, monto, cantidad, unidad, frecuencia, activo_desde, activo_hasta, estado, glosa, id_haberdescuento_origen');
h('MR actual'); console.log(mrs);

if (hds && hds.length > 0 && (!mrs || mrs.length === 0)) {
  h('Gatillo manual: UPDATE no-op para forzar trigger');
  const hd = hds[0];
  const { error: eUpd } = await supabase
    .from('haberdescuento_persona')
    .update({ observacion: (hd.observacion ?? '') + '' })
    .eq('id_asignacion', hd.id_asignacion);
  if (eUpd) {
    console.error('  ERROR UPDATE:', eUpd);
  } else {
    console.log('  UPDATE OK. Revisando MR de nuevo…');
    const { data: mr2 } = await supabase
      .from('movimiento_recurrente')
      .select('id, id_empresa, id_persona, tipo, categoria, monto, frecuencia, activo_desde, estado, id_haberdescuento_origen');
    console.log(mr2);
  }
}
