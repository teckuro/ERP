/**
 * Smoke post-despliegue — flujo Administrador + Generador (F21).
 *
 * Requiere:
 *   - public/app-config.json con Supabase configurado
 *   - E2E_SUPABASE_AUTH_EMAIL / E2E_SUPABASE_AUTH_PASSWORD (usuario con empresa en JWT)
 *
 * Verifica infraestructura, sesión, feature gates Anexo B, vista previa de
 * «Nueva nómina» (período actual, mensual) y lectura de nomina_periodo.
 * No modifica datos. Exit 0 = listo para piloto; exit 1 = bloqueante.
 *
 * Rollback de incidente: npm run rollback:nomina:feature-gates -- --empresa-id=N
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const TABLAS_NOMINA = [
  'nomina_periodo',
  'segmento_nomina',
  'nomina_calculo_periodo',
  'nomina_liquidacion_periodo',
];

const RPC_NOMINA = [
  'obtener_feature_gates_nomina',
  'cerrar_nomina',
  'generar_liquidaciones_nomina',
  'resumen_calculo_nomina',
  'listar_calculo_trabajadores_nomina',
  'erp_nomina_permiso_efectivo',
  'actualizar_estado_revision_liquidacion_trabajador',
];

/** UUID ficticio: solo para comprobar que la RPC está registrada (error de negocio = OK). */
const SMOKE_NOMINA_ID = '00000000-0000-0000-0000-000000000001';

const RPC_SMOKE_ARGS = {
  cerrar_nomina: { p_nomina_id: SMOKE_NOMINA_ID, p_motivo: 'smoke' },
  generar_liquidaciones_nomina: { p_id_nomina_periodo: SMOKE_NOMINA_ID },
  resumen_calculo_nomina: { p_nomina_id: SMOKE_NOMINA_ID },
  listar_calculo_trabajadores_nomina: { p_nomina_id: SMOKE_NOMINA_ID },
  erp_nomina_permiso_efectivo: { p_permiso: 'nomina.validar' },
  actualizar_estado_revision_liquidacion_trabajador: {
    p_id_liquidacion_trabajador: 0,
    p_estado_revision: 'autorizada',
  },
};

function fail(msg) {
  console.error(`[smoke nomina] FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`[smoke nomina] OK: ${msg}`);
}

function loadAppConfig() {
  const configPath = path.join(__dirname, '..', 'public', 'app-config.json');
  if (!fs.existsSync(configPath)) {
    fail('Falta public/app-config.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const supabaseUrl = (parsed.supabaseUrl ?? '').replace(/\/$/, '');
  const supabaseAnonKey = parsed.supabaseAnonKey ?? '';
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
    fail('supabaseUrl / supabaseAnonKey incompletos en app-config');
    process.exit(1);
  }
  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Vista previa del modal «Nueva nómina» (solo lectura, ambas RPC son STABLE).
 * Cualquier error es bloqueante: con él el modal muestra el conteo y la lista vacía.
 */
async function smokeVistaPreviaCreacion(client) {
  const hoy = new Date();
  const periodo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const tipo = 'mensual';

  const { data: preview, error: previewErr } = await client.rpc('previsualizar_creacion_nomina', {
    p_periodo: periodo,
    p_tipo: tipo,
  });
  if (previewErr) {
    fail(`RPC previsualizar_creacion_nomina(${periodo}) → ${previewErr.code ?? ''} ${previewErr.message}`);
    process.exit(1);
  }
  const totalIncluidos = Number(preview?.totales?.incluidos ?? 0);
  ok(`RPC previsualizar_creacion_nomina(${periodo}) → ${totalIncluidos} incluido(s)`);

  for (const clasificacion of ['incluidos', 'excluidos']) {
    const { data: filas, error } = await client.rpc('listar_preview_creacion_trabajadores', {
      p_periodo: periodo,
      p_tipo: tipo,
      p_clasificacion: clasificacion,
      p_page: 1,
      p_page_size: 10,
    });
    if (error) {
      fail(`RPC listar_preview_creacion_trabajadores(${clasificacion}) → ${error.code ?? ''} ${error.message}`);
      process.exit(1);
    }
    const total = Number(filas?.[0]?.total_count ?? 0);
    if (clasificacion === 'incluidos' && total !== totalIncluidos) {
      fail(`Vista previa inconsistente: ${totalIncluidos} incluidos en el resumen, ${total} en la lista`);
      process.exit(1);
    }
    ok(`RPC listar_preview_creacion_trabajadores(${clasificacion}) → ${total} fila(s)`);
  }
}

async function main() {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!email || !password) {
    fail('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env');
    process.exit(1);
  }

  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  console.log('[smoke nomina] Base URL:', supabaseUrl);

  const authHealth = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  });
  if (!authHealth.ok) {
    fail(`Auth health → ${authHealth.status}`);
    process.exit(1);
  }
  ok('Auth health');

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) {
    fail(`Login → ${signInErr.message}`);
    process.exit(1);
  }
  ok(`Sesión ${email}`);

  for (const tabla of TABLAS_NOMINA) {
    const { error } = await client.from(tabla).select('*', { count: 'exact', head: true });
    if (error) {
      fail(`Tabla ${tabla} → ${error.code ?? ''} ${error.message}`);
      process.exit(1);
    }
    ok(`Tabla ${tabla} accesible`);
  }

  const { data: gates, error: gatesErr } = await client.rpc('obtener_feature_gates_nomina');
  if (gatesErr) {
    fail(`RPC obtener_feature_gates_nomina → ${gatesErr.message}`);
    process.exit(1);
  }
  ok(`Feature gates → ${JSON.stringify(gates ?? {})}`);

  for (const rpc of RPC_NOMINA.slice(1)) {
    const args = RPC_SMOKE_ARGS[rpc] ?? {};
    const { error } = await client.rpc(rpc, args);
    const missing =
      error?.code === 'PGRST202'
      || (error?.message ?? '').toLowerCase().includes('could not find the function');
    if (missing) {
      fail(`RPC ${rpc} no encontrada → ${error?.message ?? error?.code}`);
      process.exit(1);
    }
    ok(`RPC ${rpc} registrada${error ? ` (${error.code ?? 'negocio'}: ${error.message})` : ''}`);
  }

  await smokeVistaPreviaCreacion(client);

  const { count, error: countErr } = await client
    .from('nomina_periodo')
    .select('id', { count: 'exact', head: true });
  if (countErr) {
    fail(`Conteo nomina_periodo → ${countErr.message}`);
    process.exit(1);
  }
  ok(`Bandeja: ${count ?? 0} nómina(s) visibles para el tenant`);

  console.log('[smoke nomina] Piloto listo. Habilitar flags gradualmente (Anexo B) tras validar UI.');
  console.log('[smoke nomina] Rollback incidente: npm run rollback:nomina:feature-gates -- --empresa-id=<id>');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
