/**
 * Smoke — cadena empleados → liquidación → LRE (códigos oficiales).
 *
 * Verifica:
 *   1. Catálogo LRE vigente con códigos oficiales (2101, 3141, …)
 *   2. Conceptos del sistema mapeados a catalogo_lre
 *   3. Liquidaciones materializadas con codigo_lre en conceptos exportables
 *
 * Uso: node scripts/smoke-lre-exportacion.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const CODIGOS_LRE_OFICIALES = ['2101', '3141', '3143', '3161'];
const CONCEPTOS_ESPERADOS = [
  { codigo: 'SUELDO_BASE', codigoLre: '2101' },
  { codigo: 'AFP', codigoLre: '3141' },
  { codigo: 'SALUD', codigoLre: '3143' },
  { codigo: 'IMPUESTO_RENTA', codigoLre: '3161' },
  { codigo: 'BONO', codigoLre: '2113' },
  { codigo: 'HORAS_EXTRAS', codigoLre: '2102' },
];

const ALIAS_MOTOR_ESPERADOS = [
  { codigo: 'IMPUESTO_RENTA', codigoMotor: 'IMPUESTO_UNICO' },
  { codigo: 'CESANTIA', codigoMotor: 'AFC' },
  { codigo: 'HORAS_EXTRAS', codigoMotor: 'HORA_EXTRA' },
];

function fail(msg) {
  console.error(`[smoke lre export] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke lre export] OK: ${msg}`);
}

function warn(msg) {
  console.warn(`[smoke lre export] WARN: ${msg}`);
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

function esTablaInexistente(error) {
  const code = error?.code ?? '';
  const msg = (error?.message ?? '').toLowerCase();
  return code === 'PGRST205' || code === '42P01' || msg.includes('could not find the table');
}

async function main() {
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
  ok(`Sesión ${email}`);

  const { data: catalogo, error: catErr } = await client
    .from('catalogo_lre')
    .select('codigo_lre')
    .eq('vigente', true)
    .in('codigo_lre', CODIGOS_LRE_OFICIALES);

  if (catErr) {
    if (esTablaInexistente(catErr)) {
      fail('Tabla catalogo_lre no desplegada. Ejecute migraciones LRE (bd/base/v11/partes/07 y 24).');
    }
    fail(`Lectura catálogo LRE → ${catErr.message}`);
  }

  const encontrados = new Set((catalogo ?? []).map((r) => r.codigo_lre));
  for (const codigo of CODIGOS_LRE_OFICIALES) {
    if (!encontrados.has(codigo)) {
      fail(`Falta código LRE oficial vigente: ${codigo}`);
    }
  }
  ok(`Catálogo LRE vigente (${CODIGOS_LRE_OFICIALES.join(', ')})`);

  const { data: conceptos, error: conErr } = await client
    .from('concepto')
    .select('codigo, id_catalogo_lre, catalogo_lre(codigo_lre)')
    .in('codigo', CONCEPTOS_ESPERADOS.map((c) => c.codigo));

  if (conErr) fail(`Lectura concepto → ${conErr.message}`);

  for (const esperado of CONCEPTOS_ESPERADOS) {
    const fila = (conceptos ?? []).find((c) => c.codigo === esperado.codigo);
    if (!fila) {
      warn(`Concepto ${esperado.codigo} no existe en BD.`);
      continue;
    }
    const codigoLre = fila.catalogo_lre?.codigo_lre ?? null;
    if (codigoLre !== esperado.codigoLre) {
      fail(`Concepto ${esperado.codigo} debería mapear a ${esperado.codigoLre}, tiene ${codigoLre ?? 'null'}`);
    }
  }
  ok('Conceptos del sistema alineados al catálogo LRE');

  const { data: aliasRows, error: aliasErr } = await client
    .from('concepto')
    .select('codigo, codigo_motor')
    .in('codigo', ALIAS_MOTOR_ESPERADOS.map((c) => c.codigo));

  if (aliasErr) fail(`Lectura codigo_motor → ${aliasErr.message}`);

  for (const esperado of ALIAS_MOTOR_ESPERADOS) {
    const fila = (aliasRows ?? []).find((c) => c.codigo === esperado.codigo);
    if (!fila) {
      warn(`Concepto ${esperado.codigo} no existe para alias motor.`);
      continue;
    }
    if (fila.codigo_motor !== esperado.codigoMotor) {
      fail(`Concepto ${esperado.codigo}: codigo_motor debería ser ${esperado.codigoMotor}, tiene ${fila.codigo_motor ?? 'null'}`);
    }
  }
  ok('Alias motor alineados (IMPUESTO_UNICO, AFC, HORA_EXTRA)');

  const { data: periodo, error: perErr } = await client
    .from('nomina_liquidacion_periodo')
    .select('id_liquidacion_periodo')
    .eq('activo', true)
    .order('id_liquidacion_periodo', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (perErr) fail(`Lectura liquidación → ${perErr.message}`);
  if (!periodo) {
    warn('SKIP cadena liquidación: no hay liquidaciones activas. Ejecute nómina y genere liquidaciones.');
    process.exit(0);
  }

  const { data: trabajador, error: traErr } = await client
    .from('nomina_liquidacion_trabajador')
    .select('id_liquidacion_trabajador')
    .eq('id_liquidacion_periodo', periodo.id_liquidacion_periodo)
    .limit(1)
    .maybeSingle();

  if (traErr) fail(`liquidación trabajador → ${traErr.message}`);
  if (!trabajador?.id_liquidacion_trabajador) {
    warn('Liquidación sin trabajadores. Recalcule y regenere liquidaciones.');
    process.exit(0);
  }

  const { data: lineas, error: liqErr } = await client
    .from('nomina_liquidacion_concepto')
    .select('codigo_lre, nombre, monto, tipo')
    .eq('id_liquidacion_trabajador', trabajador.id_liquidacion_trabajador)
    .neq('monto', 0);

  if (liqErr) fail(`Lectura conceptos liquidación → ${liqErr.message}`);

  const exportables = (lineas ?? []).filter((l) => l.tipo !== 'cotizacion' && l.monto !== 0);
  const conCodigo = exportables.filter((l) => (l.codigo_lre ?? '').trim());
  if (exportables.length === 0) {
    warn('Liquidación sin conceptos exportables. Recalcule snapshot y regenere liquidaciones.');
    process.exit(0);
  }

  if (conCodigo.length === 0) {
    fail(
      'Liquidación materializada sin codigo_lre en conceptos exportables. '
      + 'Recalcule nómina (snapshot) y regenere liquidaciones oficiales.',
    );
  }

  ok(
    `${conCodigo.length}/${exportables.length} concepto(s) exportable(s) con código LRE `
    + `(ej. ${conCodigo[0].codigo_lre} — ${conCodigo[0].nombre})`,
  );
  process.exit(0);
}

main().catch((err) => fail(err?.message ?? String(err)));
