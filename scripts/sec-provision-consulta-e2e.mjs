/**
 * Provisiona (o reutiliza) usuario E2E de solo consulta para smoke SEC-04.
 *
 * Requiere sesión admin (E2E_SUPABASE_AUTH_EMAIL con rol admin_sistema/admin).
 * Opcional: E2E_SUPABASE_SERVICE_ROLE_KEY para upsert directo sin Edge.
 *
 * Escribe en .env.local.e2e (gitignored) las variables:
 *   E2E_SUPABASE_AUTH_EMAIL_CONSULTA
 *   E2E_SUPABASE_AUTH_PASSWORD_CONSULTA
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const CONSULTA_EMAIL = process.env['E2E_CONSULTA_EMAIL'] ?? 'consulta.smoke@erp.cl';
const CONSULTA_PASSWORD = process.env['E2E_CONSULTA_PASSWORD'] ?? 'ConsultaSmoke2026!';

function fail(msg) {
  console.error(`[sec consulta fixture] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[sec consulta fixture] OK: ${msg}`);
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

async function obtenerIdPerfilConsulta(client) {
  const { data, error } = await client
    .from('perfil_acceso')
    .select('id_perfil, nombre, rol_base')
    .eq('rol_base', 'consulta_remuneraciones')
    .limit(1)
    .maybeSingle();
  if (error) fail(`perfil_acceso → ${error.message}`);
  if (!data?.id_perfil) fail('No existe perfil Consulta en perfil_acceso');
  return data.id_perfil;
}

async function listarUsuariosEdge(client) {
  const { data, error } = await client.functions.invoke('admin-usuarios', {
    body: { accion: 'listar' },
  });
  if (error) fail(`admin-usuarios listar → ${error.message}`);
  return data?.usuarios ?? data ?? [];
}

async function crearUsuarioEdge(client, idPerfil) {
  const { data, error } = await client.functions.invoke('admin-usuarios', {
    body: {
      accion: 'crear',
      email: CONSULTA_EMAIL,
      password: CONSULTA_PASSWORD,
      nombre: 'Consulta Smoke SEC',
      idPerfil,
    },
  });
  if (error && !String(error.message).includes('non-2xx')) {
    fail(`admin-usuarios crear → ${error.message}`);
  }
  if (data?.error && !/ya existe|exists/i.test(String(data.error))) {
    fail(String(data.error));
  }
  if (!data?.error) ok(`Usuario creado ${CONSULTA_EMAIL}`);
}

function escribirEnvLocal() {
  const out = path.join(__dirname, '..', '.env.local.e2e');
  const lines = [
    `E2E_SUPABASE_AUTH_EMAIL_CONSULTA=${CONSULTA_EMAIL}`,
    `E2E_SUPABASE_AUTH_PASSWORD_CONSULTA=${CONSULTA_PASSWORD}`,
    '',
  ];
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  ok(`Variables en ${out} (cargar con dotenv o copiar a .env)`);
}

async function main() {
  const adminEmail = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  const adminPassword = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  if (!adminEmail || !adminPassword) {
    fail('Defina E2E_SUPABASE_AUTH_EMAIL y E2E_SUPABASE_AUTH_PASSWORD (admin)');
  }

  const { supabaseUrl, supabaseAnonKey } = loadAppConfig();
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInErr } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (signInErr) fail(`Login admin → ${signInErr.message}`);
  ok(`Sesión admin ${adminEmail}`);

  const idPerfil = await obtenerIdPerfilConsulta(client);
  ok(`Perfil consulta id=${idPerfil}`);

  const usuarios = await listarUsuariosEdge(client);
  const existe = usuarios.some((u) => (u.email ?? '').toLowerCase() === CONSULTA_EMAIL.toLowerCase());
  if (existe) {
    ok(`Usuario ${CONSULTA_EMAIL} ya existe`);
  } else {
    await crearUsuarioEdge(client, idPerfil);
  }

  const probe = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: consultaSignIn, error: consultaErr } = await probe.auth.signInWithPassword({
    email: CONSULTA_EMAIL,
    password: CONSULTA_PASSWORD,
  });
  if (consultaErr) fail(`Login consulta → ${consultaErr.message}`);
  const role = consultaSignIn.user?.app_metadata?.role ?? '';
  if (!/consulta/i.test(String(role))) {
    fail(`Rol inesperado tras login consulta: ${role}`);
  }
  ok(`Login consulta verificado (rol ${role})`);

  escribirEnvLocal();
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
