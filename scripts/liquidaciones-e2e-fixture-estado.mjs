/**
 * Fixture reversible para LIQ-E2E-01: alinea la primera nómina visible en UI
 * con al menos un trabajador pendiente_autorizar.
 *
 * Uso: node scripts/liquidaciones-e2e-fixture-estado.mjs prepare|restore
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.resolve(__dirname, '..', '.cursor', 'e2e-liq-estado-restore.json');

loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function fail(msg) {
  console.error(`[liq e2e fixture] FAIL: ${msg}`);
  process.exit(1);
}

function loadAppConfig() {
  const configPath = path.join(__dirname, '..', 'public', 'app-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  return {
    supabaseUrl: (parsed.supabaseUrl ?? '').replace(/\/$/, ''),
    supabaseAnonKey: parsed.supabaseAnonKey ?? '',
  };
}

async function createAuthedClient() {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!email || !password) {
    fail('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env');
  }
  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) fail(`Login → ${signInErr.message}`);
  return client;
}

function esNominaConLiquidaciones(estado) {
  return estado === 'liquidada' || estado === 'cerrada' || estado === 'reabierta';
}

function ordenarNominasUi(a, b) {
  const byPeriodo = b.periodo.localeCompare(a.periodo);
  if (byPeriodo !== 0) return byPeriodo;
  return (a.empresaNombre ?? '').localeCompare(b.empresaNombre ?? '');
}

async function resolverEmpresaActiva(client) {
  const { data: nomina, error: nomErr } = await client
    .from('nomina_periodo')
    .select('id_empresa')
    .order('periodo', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (nomErr) fail(`nomina_periodo → ${nomErr.message}`);
  if (!nomina?.id_empresa) fail('No se pudo resolver id_empresa para fixture E2E.');
  return nomina.id_empresa;
}

async function listarNominasUi(client, idEmpresa) {
  const { data, error } = await client
    .from('nomina_periodo')
    .select('id, periodo, estado, id_empresa')
    .eq('id_empresa', idEmpresa)
    .order('periodo', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) fail(`listar nomina_periodo → ${error.message}`);

  return (data ?? [])
    .filter((row) => esNominaConLiquidaciones(row.estado))
    .map((row) => ({
      id: row.id,
      periodo: row.periodo,
      estado: row.estado,
      empresaNombre: '',
    }))
    .sort(ordenarNominasUi);
}

async function listarLiquidacionesNomina(client, nominaPeriodoId) {
  const { data, error } = await client.rpc('listar_liquidaciones_nomina', {
    p_id_nomina_periodo: nominaPeriodoId,
  });
  if (error) fail(`listar_liquidaciones_nomina → ${error.message}`);
  return data ?? [];
}

async function listarTrabajadoresLiquidacion(client, idLiquidacionPeriodo) {
  const { data, error } = await client
    .from('nomina_liquidacion_trabajador')
    .select('id_liquidacion_trabajador, estado_revision, rut')
    .eq('id_liquidacion_periodo', idLiquidacionPeriodo)
    .order('nombre_trabajador', { ascending: true });
  if (error) fail(`listar trabajadores → ${error.message}`);
  return data ?? [];
}

function esPendiente(estadoRevision) {
  return estadoRevision == null || estadoRevision === 'pendiente_autorizar';
}

async function prepare() {
  const client = await createAuthedClient();
  const idEmpresa = await resolverEmpresaActiva(client);
  const nominas = await listarNominasUi(client, idEmpresa);
  if (nominas.length === 0) {
    console.warn('[liq e2e fixture] SKIP: sin nóminas liquidadas/cerradas.');
    process.exit(0);
  }

  for (const nomina of nominas) {
    const liquidaciones = await listarLiquidacionesNomina(client, nomina.id);
    if (liquidaciones.length === 0) continue;

    const vigente = liquidaciones.find((liq) => liq.activo) ?? liquidaciones[0];
    const trabajadores = await listarTrabajadoresLiquidacion(client, vigente.id_liquidacion_periodo);
    if (trabajadores.length === 0) continue;

    const pendiente = trabajadores.find((t) => esPendiente(t.estado_revision));
    const candidato = pendiente
      ?? trabajadores.find((t) => t.estado_revision === 'autorizada')
      ?? trabajadores[0];
    const previo = candidato.estado_revision ?? null;

    if (!esPendiente(previo)) {
      const { error: rpcErr } = await client.rpc('actualizar_estado_revision_liquidacion_trabajador', {
        p_id_liquidacion_trabajador: candidato.id_liquidacion_trabajador,
        p_estado_revision: 'pendiente_autorizar',
      });
      if (rpcErr) fail(`RPC preparar pendiente → ${rpcErr.message}`);

      fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
      fs.writeFileSync(
        SNAPSHOT_PATH,
        JSON.stringify(
          {
            nominaPeriodoId: nomina.id,
            mutado: true,
            id: candidato.id_liquidacion_trabajador,
            previo,
          },
          null,
          2,
        ),
        'utf8',
      );
      console.log(
        `[liq e2e fixture] Nómina ${nomina.id}: trabajador ${candidato.id_liquidacion_trabajador} → pendiente_autorizar`,
      );
      return;
    }

    fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    fs.writeFileSync(
      SNAPSHOT_PATH,
      JSON.stringify({ nominaPeriodoId: nomina.id, mutado: false }, null, 2),
      'utf8',
    );
    console.log(`[liq e2e fixture] Nómina ${nomina.id} ya tiene pendiente; sin mutación.`);
    return;
  }

  console.warn('[liq e2e fixture] SKIP: ninguna nómina con trabajadores liquidados.');
  process.exit(0);
}

async function restore() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.log('[liq e2e fixture] Sin snapshot de restauración.');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  fs.unlinkSync(SNAPSHOT_PATH);

  if (!snapshot.mutado) {
    console.log('[liq e2e fixture] Sin mutación previa; nada que restaurar.');
    return;
  }

  const client = await createAuthedClient();
  const { error: rpcErr } = await client.rpc('actualizar_estado_revision_liquidacion_trabajador', {
    p_id_liquidacion_trabajador: snapshot.id,
    p_estado_revision: snapshot.previo,
  });
  if (rpcErr) fail(`RPC restaurar → ${rpcErr.message}`);
  console.log(`[liq e2e fixture] Trabajador ${snapshot.id} restaurado a ${snapshot.previo ?? 'null'}`);
}

export function readLiqE2eSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) return null;
  return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
}

const mode = process.argv[2];
if (mode === 'prepare') {
  await prepare();
} else if (mode === 'restore') {
  await restore();
} else {
  fail('Modo inválido. Use prepare o restore.');
}
