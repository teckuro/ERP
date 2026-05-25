/**
 * Verificación ligera post E2E empleados (fixtures U1–U8 y ERR).
 * Uso: node scripts/verify-empleados-qa-post-e2e.mjs
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

async function loadContratoHonorarios(supabase, idPersona) {
  const { data, error } = await supabase
    .from('contrato')
    .select('relacion_laboral')
    .eq('id_persona', idPersona)
    .order('id_contrato', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`contrato: ${error.message}`);
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
  assert(u6.apto_para_remuneraciones === false, 'U6 honorarios apto debe ser false');
  const c6 = await loadContratoHonorarios(supabase, u6.id_persona);
  assert(c6?.relacion_laboral === 'HONORARIOS', 'U6 relacion HONORARIOS');

  const u8 = await loadPersona(supabase, RUT_BODIES.U8);
  assert(u8, 'U8 no existe');
  assert(String(u8.estado_ficha).toUpperCase() === 'INCOMPLETO', 'U8 estado_ficha INCOMPLETO');

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
