import type {
  PermisosNominaMensual,
  RolRemuneracionesLogico,
} from './erp-rol-remuneraciones.models';

export function normalizarRolClaim(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
}

const ROLES_ADMIN = new Set([
  'admin',
  'admin_sistema',
  'admin_remuneraciones',
  'administrador',
  'administrator',
]);

const ROLES_CONSULTA = new Set([
  'consulta',
  'consulta_remuneraciones',
  'solo_lectura',
  'readonly',
  'viewer',
]);

const ROLES_OPERADOR = new Set([
  'operador',
  'operador_remuneraciones',
  'rrhh',
  'user',
]);

export function esRolAdministradorRemuneraciones(role: string): boolean {
  return ROLES_ADMIN.has(normalizarRolClaim(role));
}

export function esRolConsultaRemuneraciones(role: string): boolean {
  return ROLES_CONSULTA.has(normalizarRolClaim(role));
}

export function esRolOperadorRemuneraciones(role: string): boolean {
  return ROLES_OPERADOR.has(normalizarRolClaim(role));
}

/**
 * Resuelve el rol efectivo. La administración solo se confía desde
 * `app_metadata` (SEG-01b / BKL-07); `user_metadata` no eleva a admin.
 */
export function resolverRolRemuneracionesDesdeClaims(input: {
  appMetadataRole?: unknown;
  userMetadataRole?: unknown;
  autenticado?: boolean;
}): RolRemuneracionesLogico {
  if (input.autenticado === false) return 'sin_sesion';

  const appRole = normalizarRolClaim(input.appMetadataRole);
  if (esRolAdministradorRemuneraciones(appRole)) {
    if (appRole === 'admin_sistema' || appRole === 'admin') return 'admin_sistema';
    return 'admin_remuneraciones';
  }

  const userRole = normalizarRolClaim(input.userMetadataRole);

  if (esRolConsultaRemuneraciones(appRole) || esRolConsultaRemuneraciones(userRole)) {
    return 'consulta_remuneraciones';
  }

  if (esRolOperadorRemuneraciones(appRole) || esRolOperadorRemuneraciones(userRole)) {
    return 'operador_remuneraciones';
  }

  return 'operador_remuneraciones';
}

export function resolverPermisosNominaMensual(rol: RolRemuneracionesLogico): PermisosNominaMensual {
  const esConsulta = rol === 'consulta_remuneraciones';
  const esAdmin = rol === 'admin_sistema' || rol === 'admin_remuneraciones';
  const esOperador = rol === 'operador_remuneraciones';

  return {
    puedeVerNomina: rol !== 'sin_sesion',
    puedeCrearNomina: esAdmin || esOperador,
    puedeEditarNomina: esAdmin || esOperador,
    puedeEliminarNomina: esAdmin,
    puedeReabrirNomina: esAdmin,
    puedeCerrarNomina: esAdmin,
    puedeRecargarParametrosBase: esAdmin,
    puedeValidarNomina: esAdmin || esOperador,
    puedeAprobarNomina: esAdmin || esOperador,
    puedeConsolidarNomina: esAdmin || esOperador,
    puedeGenerarLiquidaciones: esAdmin || esOperador,
  };
}

/** Etiqueta RRHH para sidebar / perfil (sin nombres técnicos de enum). */
export function etiquetaRolRemuneraciones(rol: RolRemuneracionesLogico): string {
  switch (rol) {
    case 'admin_sistema':
      return 'Admin sistema';
    case 'admin_remuneraciones':
      return 'Admin remuneraciones';
    case 'operador_remuneraciones':
      return 'Operador';
    case 'consulta_remuneraciones':
      return 'Consulta';
    default:
      return 'RRHH';
  }
}
