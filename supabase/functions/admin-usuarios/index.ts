/**
 * ADMIN-01: administración de usuarios del ERP.
 *
 * Requiere JWT de un usuario autenticado con rol admin del sistema en
 * `app_metadata.role`. Opera solo sobre usuarios de la misma empresa
 * (`app_metadata.id_empresa`) usando la Admin API con service role.
 *
 * Acciones (POST JSON `{ accion, ... }`):
 * - listar
 * - crear { email, password, nombre, idPerfil }
 * - asignar_perfil { userId, idPerfil }
 * - desactivar { userId }
 * - reactivar { userId }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import type { User } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { buildCorsHeaders } from '../_shared/cors.ts';

const ROLES_ADMIN_SISTEMA = new Set(['admin', 'admin_sistema', 'administrador', 'administrator']);

const ROLES_BASE_VALIDOS = new Set([
  'admin_sistema',
  'admin_remuneraciones',
  'operador_remuneraciones',
  'consulta_remuneraciones',
]);

interface AccionPayload {
  accion?: string;
  email?: string;
  password?: string;
  nombre?: string;
  idPerfil?: number;
  userId?: string;
}

interface UsuarioResumen {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: string | null;
  idPerfil: number | null;
  desactivado: boolean;
  ultimoAcceso: string | null;
  creadoEn: string | null;
}

type CorsHeaders = Record<string, string>;

function jsonResponse(corsHeaders: CorsHeaders, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

console.info('admin-usuarios: worker started');

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse(corsHeaders, { error: 'Método no permitido' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse(corsHeaders, { error: 'No autorizado' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(corsHeaders, { error: 'Función no configurada en el servidor' }, 503);
  }

  const supabaseCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
    error: authError,
  } = await supabaseCaller.auth.getUser();
  if (authError || !caller) {
    return jsonResponse(corsHeaders, { error: 'Sesión inválida' }, 401);
  }

  const callerMeta = (caller.app_metadata ?? {}) as Record<string, unknown>;
  const callerRol = normalizarRol(callerMeta['role'] ?? callerMeta['rol']);
  if (!ROLES_ADMIN_SISTEMA.has(callerRol)) {
    return jsonResponse(corsHeaders, { error: 'Requiere permisos de administrador del sistema' }, 403);
  }

  const idEmpresa = parseIdEmpresa(callerMeta['id_empresa'] ?? callerMeta['idEmpresa']);
  if (idEmpresa == null) {
    return jsonResponse(corsHeaders, { error: 'Tu sesión no tiene empresa asignada' }, 403);
  }

  let body: AccionPayload;
  try {
    body = (await req.json()) as AccionPayload;
  } catch {
    return jsonResponse(corsHeaders, { error: 'Cuerpo JSON inválido' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (body.accion) {
      case 'listar':
        return jsonResponse(corsHeaders, { usuarios: await listarUsuarios(admin, idEmpresa) });
      case 'crear':
        return await crearUsuario(admin, idEmpresa, body, corsHeaders);
      case 'asignar_perfil':
        return await asignarPerfil(admin, idEmpresa, body, corsHeaders);
      case 'desactivar':
        return await cambiarBloqueo(admin, idEmpresa, body.userId, caller.id, true, corsHeaders);
      case 'reactivar':
        return await cambiarBloqueo(admin, idEmpresa, body.userId, caller.id, false, corsHeaders);
      default:
        return jsonResponse(corsHeaders, { error: 'Acción no reconocida' }, 400);
    }
  } catch (err) {
    console.error('admin-usuarios', body.accion, err);
    return jsonResponse(corsHeaders, { error: 'No fue posible completar la operación' }, 500);
  }
});

// deno-lint-ignore no-explicit-any
type AdminClient = any;

async function listarUsuarios(admin: AdminClient, idEmpresa: number): Promise<UsuarioResumen[]> {
  const usuarios: UsuarioResumen[] = [];
  let page = 1;
  // La Admin API pagina; el tenant piloto es pequeño, se recorren hasta 10 páginas.
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const lote = (data?.users ?? []) as User[];
    for (const u of lote) {
      const meta = (u.app_metadata ?? {}) as Record<string, unknown>;
      if (parseIdEmpresa(meta['id_empresa'] ?? meta['idEmpresa']) !== idEmpresa) continue;
      usuarios.push(mapUsuario(u));
    }
    if (lote.length < 200) break;
    page += 1;
  }
  usuarios.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));
  return usuarios;
}

async function crearUsuario(
  admin: AdminClient,
  idEmpresa: number,
  body: AccionPayload,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';
  const nombre = body.nombre?.trim() ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(corsHeaders, { error: 'Correo no válido' }, 400);
  }
  if (password.length < 8) {
    return jsonResponse(corsHeaders, {
      error: 'La contraseña temporal debe tener al menos 8 caracteres',
    }, 400);
  }

  const perfil = await obtenerPerfil(admin, idEmpresa, body.idPerfil);
  if (!perfil) {
    return jsonResponse(corsHeaders, { error: 'Debe indicar un perfil válido' }, 400);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: nombre ? { full_name: nombre } : {},
    app_metadata: {
      id_empresa: idEmpresa,
      role: perfil.rol_base,
      id_perfil: perfil.id_perfil,
    },
  });
  if (error) {
    const msg = String(error.message ?? '');
    if (/already.*registered|exists/i.test(msg)) {
      return jsonResponse(corsHeaders, { error: 'Ya existe un usuario con ese correo' }, 409);
    }
    throw error;
  }

  return jsonResponse(corsHeaders, { ok: true, usuario: mapUsuario(data.user as User) });
}

async function asignarPerfil(
  admin: AdminClient,
  idEmpresa: number,
  body: AccionPayload,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const objetivo = await obtenerUsuarioEmpresa(admin, idEmpresa, body.userId);
  if (!objetivo) {
    return jsonResponse(corsHeaders, { error: 'Usuario no encontrado' }, 404);
  }

  const perfil = await obtenerPerfil(admin, idEmpresa, body.idPerfil);
  if (!perfil) {
    return jsonResponse(corsHeaders, { error: 'Debe indicar un perfil válido' }, 400);
  }

  const { data, error } = await admin.auth.admin.updateUserById(objetivo.id, {
    app_metadata: {
      ...(objetivo.app_metadata ?? {}),
      role: perfil.rol_base,
      id_perfil: perfil.id_perfil,
    },
  });
  if (error) throw error;

  return jsonResponse(corsHeaders, { ok: true, usuario: mapUsuario(data.user as User) });
}

async function cambiarBloqueo(
  admin: AdminClient,
  idEmpresa: number,
  userId: string | undefined,
  callerId: string,
  bloquear: boolean,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const objetivo = await obtenerUsuarioEmpresa(admin, idEmpresa, userId);
  if (!objetivo) {
    return jsonResponse(corsHeaders, { error: 'Usuario no encontrado' }, 404);
  }
  if (bloquear && objetivo.id === callerId) {
    return jsonResponse(corsHeaders, { error: 'No puedes desactivar tu propia cuenta' }, 400);
  }

  const { data, error } = await admin.auth.admin.updateUserById(objetivo.id, {
    ban_duration: bloquear ? '87600h' : 'none',
  });
  if (error) throw error;

  return jsonResponse(corsHeaders, { ok: true, usuario: mapUsuario(data.user as User) });
}

async function obtenerUsuarioEmpresa(
  admin: AdminClient,
  idEmpresa: number,
  userId: string | undefined,
): Promise<User | null> {
  if (!userId?.trim()) return null;
  const { data, error } = await admin.auth.admin.getUserById(userId.trim());
  if (error || !data?.user) return null;
  const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  if (parseIdEmpresa(meta['id_empresa'] ?? meta['idEmpresa']) !== idEmpresa) return null;
  return data.user as User;
}

async function obtenerPerfil(
  admin: AdminClient,
  idEmpresa: number,
  idPerfil: number | undefined,
): Promise<{ id_perfil: number; rol_base: string } | null> {
  if (!Number.isFinite(idPerfil) || (idPerfil ?? 0) <= 0) return null;
  const { data, error } = await admin
    .from('perfil_acceso')
    .select('id_perfil, rol_base, activo')
    .eq('id_perfil', idPerfil)
    .eq('id_empresa', idEmpresa)
    .maybeSingle();
  if (error || !data || !data.activo || !ROLES_BASE_VALIDOS.has(data.rol_base)) return null;
  return { id_perfil: data.id_perfil, rol_base: data.rol_base };
}

function mapUsuario(u: User): UsuarioResumen {
  const appMeta = (u.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const bannedUntil = (u as unknown as Record<string, unknown>)['banned_until'];
  const desactivado =
    typeof bannedUntil === 'string' && Date.parse(bannedUntil) > Date.now();
  const idPerfilRaw = appMeta['id_perfil'];
  const idPerfil =
    typeof idPerfilRaw === 'number'
      ? idPerfilRaw
      : typeof idPerfilRaw === 'string' && idPerfilRaw.trim()
        ? Number(idPerfilRaw)
        : null;
  return {
    id: u.id,
    email: u.email ?? null,
    nombre: typeof userMeta['full_name'] === 'string' ? (userMeta['full_name'] as string) : null,
    rol: typeof appMeta['role'] === 'string' ? (appMeta['role'] as string) : null,
    idPerfil: Number.isFinite(idPerfil) ? (idPerfil as number) : null,
    desactivado,
    ultimoAcceso: u.last_sign_in_at ?? null,
    creadoEn: u.created_at ?? null,
  };
}

function normalizarRol(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
}

function parseIdEmpresa(raw: unknown): number | null {
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
