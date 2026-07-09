/**
 * ADMIN-01: permisos finos por módulo.
 *
 * El perfil de acceso (`perfil_acceso`) define un rol base (que alimenta
 * guards y RLS existentes) y ajustes finos por módulo en jsonb. Estas reglas
 * derivan los permisos por defecto del rol base y aplican los ajustes finos
 * por encima. Sin perfil asignado, el comportamiento es idéntico al actual.
 */

import type { RolRemuneracionesLogico } from './erp-rol-remuneraciones.models';

export const MODULOS_PERMISO = [
  'empleados',
  'nominas',
  'liquidaciones',
  'parametros',
  'conceptos',
  'movimientos',
  'licencias',
  'empresas',
  'reportes',
  'administracion',
] as const;

export type ModuloPermiso = (typeof MODULOS_PERMISO)[number];

export interface PermisoModulo {
  ver: boolean;
  editar: boolean;
}

export type PermisosPorModulo = Record<ModuloPermiso, PermisoModulo>;

/** Ajustes finos guardados en `perfil_acceso.permisos` (claves opcionales). */
export type PermisosFinosPerfil = Partial<
  Record<ModuloPermiso, Partial<PermisoModulo>>
>;

export const ETIQUETAS_MODULO_PERMISO: Record<ModuloPermiso, string> = {
  empleados: 'Empleados',
  nominas: 'Nóminas',
  liquidaciones: 'Liquidaciones',
  parametros: 'Parámetros',
  conceptos: 'Conceptos',
  movimientos: 'Movimientos',
  licencias: 'Licencias médicas',
  empresas: 'Empresas',
  reportes: 'Reportes',
  administracion: 'Administración',
};

function permiso(ver: boolean, editar: boolean): PermisoModulo {
  return { ver, editar: editar && ver };
}

/** Permisos por defecto del rol base, alineados a `matriz-roles-permisos.md`. */
export function permisosPorDefectoDesdeRol(rol: RolRemuneracionesLogico): PermisosPorModulo {
  const esAdminSistema = rol === 'admin_sistema';
  const esAdmin = esAdminSistema || rol === 'admin_remuneraciones';
  const esOperador = rol === 'operador_remuneraciones';
  const conSesion = rol !== 'sin_sesion';

  return {
    empleados: permiso(conSesion, esAdmin || esOperador),
    nominas: permiso(conSesion, esAdmin || esOperador),
    liquidaciones: permiso(conSesion, esAdmin || esOperador),
    parametros: permiso(conSesion, esAdmin),
    conceptos: permiso(conSesion, esAdmin),
    movimientos: permiso(conSesion, esAdmin || esOperador),
    licencias: permiso(conSesion, esAdmin || esOperador),
    empresas: permiso(conSesion, esAdmin),
    reportes: permiso(conSesion, esAdmin),
    administracion: permiso(esAdminSistema, esAdminSistema),
  };
}

/**
 * Combina los permisos por defecto del rol base con los ajustes finos del
 * perfil. Solo se aplican claves definidas; `editar: true` implica `ver: true`.
 * La administración de seguridad nunca se habilita vía ajuste fino: requiere
 * rol base admin del sistema.
 */
export function combinarPermisosPerfil(
  base: PermisosPorModulo,
  finos: PermisosFinosPerfil | null | undefined,
): PermisosPorModulo {
  if (!finos) return base;

  const resultado: PermisosPorModulo = { ...base };
  for (const modulo of MODULOS_PERMISO) {
    const ajuste = finos[modulo];
    if (!ajuste) continue;
    if (modulo === 'administracion') continue;

    const ver = ajuste.ver ?? resultado[modulo].ver;
    const editar = ajuste.editar ?? resultado[modulo].editar;
    resultado[modulo] = {
      ver: ver || editar,
      editar,
    };
  }
  return resultado;
}

/** Normaliza el jsonb crudo de BD a `PermisosFinosPerfil` (ignora claves extrañas). */
export function normalizarPermisosFinos(raw: unknown): PermisosFinosPerfil {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const finos: PermisosFinosPerfil = {};
  for (const modulo of MODULOS_PERMISO) {
    const valor = (raw as Record<string, unknown>)[modulo];
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) continue;
    const entrada = valor as Record<string, unknown>;
    const ajuste: Partial<PermisoModulo> = {};
    if (typeof entrada['ver'] === 'boolean') ajuste.ver = entrada['ver'];
    if (typeof entrada['editar'] === 'boolean') ajuste.editar = entrada['editar'];
    if (Object.keys(ajuste).length > 0) {
      finos[modulo] = ajuste;
    }
  }
  return finos;
}
