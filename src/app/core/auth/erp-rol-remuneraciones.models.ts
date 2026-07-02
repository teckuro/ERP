/** Roles lógicos alineados a `matriz-roles-permisos.md` §4 y §8.1. */
export type RolRemuneracionesLogico =
  | 'admin_sistema'
  | 'admin_remuneraciones'
  | 'operador_remuneraciones'
  | 'consulta_remuneraciones'
  | 'sin_sesion';

export interface PermisosNominaMensual {
  puedeVerNomina: boolean;
  puedeCrearNomina: boolean;
  puedeEditarNomina: boolean;
  puedeEliminarNomina: boolean;
  puedeReabrirNomina: boolean;
  puedeCerrarNomina: boolean;
  puedeRecargarParametrosBase: boolean;
  puedeValidarNomina: boolean;
  puedeAprobarNomina: boolean;
  puedeConsolidarNomina: boolean;
  puedeGenerarLiquidaciones: boolean;
  puedeRectificarNomina: boolean;
}

export const MENSAJE_SIN_PERMISO_ADMIN_NOMINA =
  'No tienes permiso para esta acción. Requiere rol de administración de remuneraciones.';

export const MENSAJE_SOLO_LECTURA_NOMINA =
  'Tu perfil es de solo consulta. No puedes modificar nóminas.';
