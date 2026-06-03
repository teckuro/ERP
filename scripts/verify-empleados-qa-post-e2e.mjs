/**
 * Verificación ligera post E2E empleados (fixtures U1–U8 y ERR).
 * Uso: node scripts/verify-empleados-qa-post-e2e.mjs
 *
 * 2026-06-02: U6/U7/U8 degradados a dependiente_activo apto. Los asserts
 * históricos (HONORARIOS, INCOMPLETO) se removieron. Casos especiales
 * (honorarios/básico/ficha incompleta) ahora viven en `seed:empleados:errores`.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

import { createSupabaseScriptClient } from './lib/empleados-cleanup.mjs';

config({ path: resolve(process.cwd(), '.env'), quiet: true });

const RUT_BODIES = {
  U1: '25050001',
  U2: '25050002',
  U6: '25050006',
  U8: '25050008',
  ERR01: '26100001',
};

async function loadPersona(supabase, rut) {
  const { data, error } = await supabase
    .from('persona')
    .select('id_persona,rut,dv,nombres,estado,estado_ficha,apto_para_remuneraciones')
    .eq('rut', rut)
    .maybeSingle();
  if (error) throw new Error(`persona ${rut}: ${error.message}`);
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const supabase = await createSupabaseScriptClient();

  const u1 = await loadPersona(supabase, RUT_BODIES.U1);
  assert(u1, 'U1 no existe');
  assert(u1.apto_para_remuneraciones === true, 'U1 apto debe ser true');

  const u2 = await loadPersona(supabase, RUT_BODIES.U2);
  assert(u2, 'U2 no existe');
  assert(String(u2.estado).toLowerCase() === 'borrador', 'U2 estado debe ser borrador');

  const u6 = await loadPersona(supabase, RUT_BODIES.U6);
  assert(u6, 'U6 no existe');
  assert(u6.apto_para_remuneraciones === true, 'U6 (Operario Apto) debe quedar apto tras degradación');

  const u8 = await loadPersona(supabase, RUT_BODIES.U8);
  assert(u8, 'U8 no existe');
  assert(String(u8.estado).toUpperCase() === 'ACTIVO', 'U8 (Tecnico Apto) debe estar ACTIVO');
  assert(String(u8.estado_ficha).toUpperCase() === 'VALIDO', 'U8 ficha debe ser VALIDO');

  const err = await loadPersona(supabase, RUT_BODIES.ERR01);
  if (err) {
    assert(err.apto_para_remuneraciones === false, 'ERR01 apto false');
    console.log('verify:empleados-qa OK (U1, U2, U6, U8, ERR01)');
  } else {
    console.warn('verify:empleados-qa OK (U1, U2, U6, U8); ERR01 ausente — ejecutar seed --append si se requiere.');
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
