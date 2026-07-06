/**
 * Fixture cadena LRE: empleados aptos → catálogo/conceptos → liquidación → codigo_lre.
 *
 * Fase 1 (verify): valida prerequisitos en BD remota sin mutar datos.
 * Fase 2 (prepare): opcional — ejecuta seed de empleados aptos si --seed-empleados.
 *
 * Uso:
 *   node scripts/seed-lre-export-chain.mjs verify
 *   node scripts/seed-lre-export-chain.mjs verify --seed-empleados
 */
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const RUT_APTO_PREFIX = '270000';
const MAPEOS_LRE = [
  ['SUELDO_BASE', '2101'],
  ['AFP', '3141'],
  ['SALUD', '3143'],
  ['IMPUESTO_RENTA', '3161'],
  ['CESANTIA', '3151'],
  ['BONO', '2113'],
  ['HORAS_EXTRAS', '2102'],
  ['MOVILIZACION', '2302'],
];

const ALIAS_MOTOR = [
  ['IMPUESTO_RENTA', 'IMPUESTO_UNICO'],
  ['CESANTIA', 'AFC'],
  ['HORAS_EXTRAS', 'HORA_EXTRA'],
  ['GRATIFICACION', 'GRATIFICACION_ART_50'],
];

function fail(msg) {
  console.error(`[seed lre chain] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[seed lre chain] OK: ${msg}`);
}

function warn(msg) {
  console.warn(`[seed lre chain] WARN: ${msg}`);
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
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) fail(`Login → ${error.message}`);
  return client;
}

async function verificarEmpleadosAptos(client) {
  const { data, error } = await client
    .from('persona')
    .select('rut, apto_para_remuneraciones')
    .like('rut', `${RUT_APTO_PREFIX}%`)
    .eq('apto_para_remuneraciones', true)
    .limit(3);
  if (error) fail(`persona apta → ${error.message}`);
  if (!data?.length) {
    warn(`Sin empleados aptos RUT ${RUT_APTO_PREFIX}*. Ejecute: npm run seed:empleados:aptos`);
    return 0;
  }
  ok(`${data.length} empleado(s) apto(s) encontrado(s) (${data.map((p) => p.rut).join(', ')})`);
  return data.length;
}

async function verificarMapeosConcepto(client) {
  const codigos = MAPEOS_LRE.map(([c]) => c);
  const { data, error } = await client
    .from('concepto')
    .select('codigo, catalogo_lre(codigo_lre)')
    .in('codigo', codigos);
  if (error) fail(`concepto → ${error.message}`);

  let okCount = 0;
  for (const [codigoConcepto, codigoLre] of MAPEOS_LRE) {
    const fila = (data ?? []).find((r) => r.codigo === codigoConcepto);
    if (!fila) {
      warn(`Falta concepto ${codigoConcepto}`);
      continue;
    }
    const lre = fila.catalogo_lre?.codigo_lre ?? null;
    if (lre !== codigoLre) {
      warn(`Concepto ${codigoConcepto}: esperado ${codigoLre}, tiene ${lre ?? 'null'}`);
      continue;
    }
    okCount++;
  }
  ok(`${okCount}/${MAPEOS_LRE.length} mapeos concepto→LRE verificados`);
  return okCount;
}

async function verificarAliasMotor(client) {
  const codigos = ALIAS_MOTOR.map(([c]) => c);
  const { data, error } = await client
    .from('concepto')
    .select('codigo, codigo_motor')
    .in('codigo', codigos);
  if (error) fail(`concepto codigo_motor → ${error.message}`);

  let okCount = 0;
  for (const [codigoConcepto, codigoMotor] of ALIAS_MOTOR) {
    const fila = (data ?? []).find((r) => r.codigo === codigoConcepto);
    if (!fila) {
      warn(`Falta concepto ${codigoConcepto} para alias motor`);
      continue;
    }
    if (fila.codigo_motor !== codigoMotor) {
      warn(`Concepto ${codigoConcepto}: codigo_motor esperado ${codigoMotor}, tiene ${fila.codigo_motor ?? 'null'}`);
      continue;
    }
    okCount++;
  }
  ok(`${okCount}/${ALIAS_MOTOR.length} alias motor verificados`);
  return okCount;
}

async function verificarDirectosSinLre(client) {
  const { data, error } = await client
    .from('concepto')
    .select('codigo, estrategia_lre, requiere_exportacion_lre, id_catalogo_lre')
    .eq('estrategia_lre', 'DIRECTO')
    .eq('requiere_exportacion_lre', true)
    .is('id_catalogo_lre', null)
    .limit(20);
  if (error) {
    if ((error.message ?? '').includes('estrategia_lre')) {
      warn('Columnas estrategia_lre no desplegadas. Ejecute 25_lre_concept_rules y 27_lre_concepto_cierre.');
      return;
    }
    fail(`validación DIRECTO sin LRE → ${error.message}`);
  }
  const huérfanos = (data ?? []).filter(
    (c) => !['INASISTENCIA', 'ZONA_EXTREMA', 'AFP_EMPLEADOR'].includes(c.codigo),
  );
  if (huérfanos.length > 0) {
    warn(
      `${huérfanos.length} concepto(s) DIRECTO sin LRE: ${huérfanos.map((c) => c.codigo).join(', ')}`,
    );
    return;
  }
  ok('Sin conceptos DIRECTO exportables huérfanos críticos');
}

  const { data: periodo, error: perErr } = await client
    .from('nomina_liquidacion_periodo')
    .select('id_liquidacion_periodo, periodo')
    .eq('activo', true)
    .order('id_liquidacion_periodo', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (perErr) fail(`liquidación periodo → ${perErr.message}`);
  if (!periodo) {
    warn('Sin liquidaciones activas. Genere liquidaciones desde nómina liquidada/cerrada.');
    return false;
  }

  const { data: trabajador, error: traErr } = await client
    .from('nomina_liquidacion_trabajador')
    .select('id_liquidacion_trabajador, rut')
    .eq('id_liquidacion_periodo', periodo.id_liquidacion_periodo)
    .limit(1)
    .maybeSingle();
  if (traErr) fail(`liquidación trabajador → ${traErr.message}`);
  if (!trabajador) {
    warn(`Liquidación ${periodo.periodo} sin trabajadores.`);
    return false;
  }

  const { data: conceptos, error: conErr } = await client
    .from('nomina_liquidacion_concepto')
    .select('codigo_lre, nombre, tipo, monto')
    .eq('id_liquidacion_trabajador', trabajador.id_liquidacion_trabajador)
    .neq('monto', 0);
  if (conErr) fail(`liquidación concepto → ${conErr.message}`);

  const exportables = (conceptos ?? []).filter((c) => c.tipo !== 'cotizacion');
  const conLre = exportables.filter((c) => (c.codigo_lre ?? '').trim());
  if (conLre.length === 0) {
    warn(
      `Trabajador ${trabajador.rut}: ${exportables.length} concepto(s) sin codigo_lre. `
      + 'Recalcule snapshot y regenere liquidaciones.',
    );
    return false;
  }

  ok(
    `Liquidación ${periodo.periodo}: ${conLre.length} línea(s) LRE `
    + `(${conLre.map((c) => c.codigo_lre).slice(0, 4).join(', ')})`,
  );
  return true;
}

async function main() {
  const modo = process.argv[2] ?? 'verify';
  const seedEmpleados = process.argv.includes('--seed-empleados');

  if (modo !== 'verify') {
    fail(`Modo desconocido: ${modo}. Use: verify`);
  }

  if (seedEmpleados) {
    ok('Ejecutando seed empleados aptos…');
    execSync('node scripts/seed-empleados-aptos.mjs --confirm --append', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
  }

  const client = await createAuthedClient();
  ok('Sesión autenticada');

  await verificarEmpleadosAptos(client);
  await verificarMapeosConcepto(client);
  await verificarAliasMotor(client);
  await verificarDirectosSinLre(client);
  const listo = await verificarLiquidacionConLre(client);

  if (!listo) {
    warn('Cadena incompleta. Pasos sugeridos: seed empleados → nómina → liquidaciones → smoke LRE.');
    process.exit(0);
  }

  ok('Cadena empleados → liquidación → LRE verificada');
  process.exit(0);
}

main().catch((err) => fail(err?.message ?? String(err)));
