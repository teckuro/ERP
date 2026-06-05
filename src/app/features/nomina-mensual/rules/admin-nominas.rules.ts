/**
 * Reglas del Administrador de Nóminas (F2 — NOM-REBUILD-NOMINA-MENSUAL-01).
 *
 * Mapea `EstadoNomina` a las acciones disponibles por fila. F2 sólo ejecuta
 * `abrir-generador` y `ver-resumen`; las demás están declaradas para que F3+
 * las habilite sin reescribir la regla.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import type { EstadoNomina } from '../models/nomina-periodo.models';

export type AccionAdminNomina =
  | 'abrir-generador'
  | 'ver-resumen'
  | 'eliminar-borrador'
  | 'reabrir'
  | 'anular'
  | 'ver-liquidaciones';

/** Solo borradores se pueden eliminar (no hay datos productivos detrás). */
export function puedeEliminarBorrador(estado: EstadoNomina): boolean {
  return estado === 'borrador';
}

/** Solo nóminas cerradas se pueden reabrir (auditable). */
export function puedeReabrir(estado: EstadoNomina): boolean {
  return estado === 'cerrada';
}

/** Una nómina aprobada o cerrada puede tener liquidaciones generadas. */
export function tieneLiquidaciones(estado: EstadoNomina): boolean {
  return estado === 'cerrada';
}

/** Una nómina anulada o ya cerrada no puede anularse. */
export function puedeAnular(estado: EstadoNomina): boolean {
  return estado !== 'anulada' && estado !== 'cerrada';
}

/**
 * Lista de acciones disponibles según el estado. `abrir-generador` y
 * `ver-resumen` siempre están disponibles. Las demás dependen del estado.
 *
 * En F2 sólo se renderizan `abrir-generador` y `ver-resumen` en el HTML.
 * El resto queda declarado para F3+ y para el test que valida la matriz.
 */
export function accionesDisponibles(estado: EstadoNomina): AccionAdminNomina[] {
  const acciones: AccionAdminNomina[] = ['abrir-generador', 'ver-resumen'];

  if (puedeEliminarBorrador(estado)) {
    acciones.push('eliminar-borrador');
  }
  if (puedeReabrir(estado)) {
    acciones.push('reabrir');
  }
  if (tieneLiquidaciones(estado)) {
    acciones.push('ver-liquidaciones');
  }
  if (puedeAnular(estado)) {
    acciones.push('anular');
  }

  return acciones;
}
