/**
 * Smoke SEC — anon sin acceso; sesión autenticada con lectura tenant.
 *
 * Variables (.env):
 * - E2E_SUPABASE_AUTH_EMAIL / E2E_SUPABASE_AUTH_PASSWORD (obligatorias)
 * - E2E_SUPABASE_AUTH_EMAIL_CONSULTA / E2E_SUPABASE_AUTH_PASSWORD_CONSULTA (opcional, perfil consulta)
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
loadEnv({ path: path.resolve(__dirname, '..', '.env.local.e2e'), quiet: true });

function fail(msg) {
  console.error(`[smoke sec] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke sec] OK: ${msg}`);
}

function warn(msg) {
  console.warn(`[smoke sec] WARN: ${msg}`);
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

async function probarAnonSinAcceso(supabaseUrl, supabaseAnonKey) {
  const anon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tablas = ['persona', 'parametros_generales', 'nomina_periodo'];
  for (const tabla of tablas) {
    const { error } = await anon.from(tabla).select('*').limit(1);
    if (!error) fail(`anon no debió leer ${tabla}`);
    const msg = (error.message ?? '').toLowerCase();
    if (error.code === '42501' || /permission denied|policy|jwt/i.test(msg)) {
      ok(`anon bloqueado en ${tabla}`);
    } else {
      fail(`anon en ${tabla}: ${error.message}`);
    }
  }
}

async function probarSesionAutenticada(supabaseUrl, supabaseAnonKey, email, password) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) fail(`Login → ${signInErr.message}`);
  ok(`Sesión ${email}`);

  const { data: personas, error: readErr } = await client.from('persona').select('id_persona').limit(1);
  if (readErr) fail(`Lectura persona autenticada → ${readErr.message}`);
  if (!personas?.length) warn('persona sin filas visibles (¿empresa vacía?)');
  else ok(`Lectura tenant persona (${personas.length} fila(s))`);

  const role = signIn.user?.app_metadata?.role ?? '';
  return { client, role };
}

async function probarPermisosNominaConsulta(client) {
  const permisos = ['nomina.crear', 'nomina.editar', 'nomina.eliminar', 'nomina.validar', 'movvar.escribir'];
  for (const permiso of permisos) {
    const { data, error } = await client.rpc('erp_nomina_permiso_efectivo', { p_permiso: permiso });
    if (error) fail(`erp_nomina_permiso_efectivo(${permiso}) → ${error.message}`);
    if (data === true) fail(`Perfil consulta no debió tener permiso ${permiso}`);
    ok(`RPC permiso ${permiso} = false (consulta)`);
  }
}

function esErrorRlsEscritura(error) {
  const msg = (error?.message ?? '').toLowerCase();
  return (
    error?.code === '42501'
    || /permission|policy|row-level|not authorized|denied|violates row-level/i.test(msg)
  );
}

async function assertEscrituraBloqueada(client, label, fn) {
  const { error } = await fn();
  if (!error) {
    fail(`${label} debió fallar para perfil consulta (RLS rol)`);
  }
  if (esErrorRlsEscritura(error)) {
    ok(`RLS ${label} bloqueó escritura consulta (${error.code ?? 'sin código'})`);
    return;
  }
  fail(`${label} consulta: ${error.message}`);
}

async function probarEscrituraMovvarConsulta(client) {
  await assertEscrituraBloqueada(client, 'movimiento_variable_mensual INSERT', () =>
    client.from('movimiento_variable_mensual').insert({
      id_persona: 1,
      id_concepto: 1,
      periodo: '2099-01',
      monto: 100,
      estado: 'BORRADOR',
      origen: 'MANUAL',
    }),
  );
}

async function probarEscrituraSec02eConsulta(client) {
  await assertEscrituraBloqueada(client, 'parametros_generales INSERT', () =>
    client.from('parametros_generales').insert({
      periodo: '2099-01',
      uf: 1,
      utm: 1,
    }),
  );

  await assertEscrituraBloqueada(client, 'concepto INSERT', () =>
    client.from('concepto').insert({
      codigo: 'SEC02E_SMOKE',
      nombre: 'Smoke SEC-02e',
      tipo: 'HABER',
      vigente: true,
    }),
  );

  await assertEscrituraBloqueada(client, 'persona INSERT', () =>
    client.from('persona').insert({
      rut: '99999999',
      dv: '9',
      nombres: 'Smoke',
      apellido_paterno: 'SEC',
      apellido_materno: '02e',
      fecha_nacimiento: '2000-01-01',
    }),
  );

  const { data: personas } = await client.from('persona').select('id_persona').limit(1);
  if (personas?.length) {
    const id = personas[0].id_persona;
    const { data: updated, error: updErr } = await client
      .from('persona')
      .update({ nombres: 'Bloqueado' })
      .eq('id_persona', id)
      .select('id_persona');
    if (updErr) {
      if (esErrorRlsEscritura(updErr)) {
        ok(`RLS persona UPDATE bloqueó escritura consulta (${updErr.code ?? 'sin código'})`);
      } else {
        fail(`persona UPDATE consulta: ${updErr.message}`);
      }
    } else if (!updated?.length) {
      ok('RLS persona UPDATE sin filas afectadas (consulta)');
    } else {
      fail('persona UPDATE debió fallar para perfil consulta (RLS rol)');
    }
  } else {
    warn('persona sin filas legibles; omitiendo smoke UPDATE persona');
  }
}

async function probarEscrituraAdmin(client, role) {
  if (/consulta/i.test(String(role))) {
    return;
  }
  const codigo = `SEC_SMOKE_${Date.now()}`;
  const { data, error } = await client.from('concepto').insert({
    codigo,
    nombre: 'Smoke SEC admin',
    tipo: 'HABER',
    vigente: true,
  }).select('id_concepto');
  if (error) {
    fail(`admin INSERT concepto debió permitirse → ${error.message}`);
  }
  if (!data?.length) {
    fail('admin INSERT concepto sin filas devueltas');
  }
  ok(`admin INSERT concepto permitido (${codigo})`);
  const id = data[0].id_concepto;
  await client.from('concepto').delete().eq('id_concepto', id);
}

async function probarEscrituraConsulta(client, role) {
  if (!/consulta/i.test(String(role))) {
    warn(`Rol "${role}" no es consulta; omitiendo smoke de permisos RPC/movvar`);
    return;
  }
  await probarPermisosNominaConsulta(client);
  await probarEscrituraMovvarConsulta(client);
  await probarEscrituraSec02eConsulta(client);
}

async function main() {
  const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!email || !password) {
    fail('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD en .env');
  }

  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  await probarAnonSinAcceso(supabaseUrl, supabaseAnonKey);

  const { client, role } = await probarSesionAutenticada(supabaseUrl, supabaseAnonKey, email, password);
  await probarEscrituraAdmin(client, role);
  await probarEscrituraConsulta(client, role);

  const consultaEmail = process.env['E2E_SUPABASE_AUTH_EMAIL_CONSULTA'] ?? '';
  const consultaPassword = process.env['E2E_SUPABASE_AUTH_PASSWORD_CONSULTA'] ?? '';
  if (consultaEmail && consultaPassword) {
    const consulta = await probarSesionAutenticada(supabaseUrl, supabaseAnonKey, consultaEmail, consultaPassword);
    await probarEscrituraConsulta(consulta.client, consulta.role);
  } else {
    warn('Sin E2E_SUPABASE_AUTH_EMAIL_CONSULTA; smoke de perfil consulta omitido');
  }

  ok('Smoke SEC anon + sesión completado');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
