import type { User } from '@supabase/supabase-js';

export interface UsuarioResponsableActual {
  id: string | null;
  nombre: string;
}

export const USUARIO_RESPONSABLE_NO_DISPONIBLE = 'Usuario no disponible en esta sesion';

export function resolverUsuarioResponsableActual(
  user: Pick<User, 'id' | 'email' | 'user_metadata'> | null | undefined,
): UsuarioResponsableActual {
  if (!user) return { id: null, nombre: USUARIO_RESPONSABLE_NO_DISPONIBLE };
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const nombre =
    textoMeta(meta, 'nombre')
    || textoMeta(meta, 'full_name')
    || textoMeta(meta, 'name')
    || textoMeta(meta, 'display_name')
    || user.email?.trim()
    || USUARIO_RESPONSABLE_NO_DISPONIBLE;
  return { id: user.id ?? null, nombre };
}

export function usuarioResponsableDisponible(usuario: UsuarioResponsableActual): boolean {
  return usuario.id != null || usuario.nombre !== USUARIO_RESPONSABLE_NO_DISPONIBLE;
}

function textoMeta(meta: Record<string, unknown> | undefined, key: string): string | null {
  const value = meta?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
