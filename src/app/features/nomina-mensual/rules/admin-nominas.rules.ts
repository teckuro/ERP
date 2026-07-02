/**
 * Reglas del Administrador de Nóminas (F2 — NOM-REBUILD-NOMINA-MENSUAL-01).
 *
 * Mapea `EstadoNomina` a las acciones disponibles por fila.
 *
 * Política de eliminación (2026-06-10):
 *   - Una sola acción destructiva: **Eliminar nómina** (DELETE físico en BD,
 *     en cascada sobre segmentos, movimientos, incidencias y eventos de
 *     auditoría).
 *   - Sustituye al anterior `Anular` (soft-delete) y absorbe al anterior
 *     `Eliminar borrador`. El soft-delete dejaba la fila como `anulada` y
 *     bloqueaba para siempre el `UNIQUE (empresa, periodo, tipo)` — el usuario
 *     no podía rehacer la nómina de ese mes sin tocar BD a mano.
 *   - Solo se permite sobre estados **no productivos** (pre-cálculo o zombie
 *     anulada). `calculada / validada / aprobada / cerrada / reabierta` quedan
 *     protegidos: tienen o pueden tener cálculo / liquidaciones vigentes y
 *     necesitan un flujo de reversa por separado (reabrir + corregir).
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import type { EstadoNomina } from '../models/nomina-periodo.models';

export type AccionAdminNomina =
  | 'abrir-generador'
  | 'ver-resumen'
  | 'eliminar'
  | 'reabrir'
  | 'ver-liquidaciones';

/**
 * Una nómina puede eliminarse cuando NO tiene cálculo ni liquidaciones
 * vigentes (productivas) detrás. Esto cubre los pre-productivos
 * (`borrador`, `dotacion_generada`, `en_revision`) y el zombie `anulada`,
 * que existe solo como soft-delete histórico y debe poder purgarse para
 * liberar el slot único `(empresa, periodo, tipo)`.
 *
 * Estados protegidos (NO eliminables directamente, requieren reabrir/reversa):
 *   - `calculada`, `validada`, `aprobada`: cálculo vigente.
 *   - `cerrada`: liquidaciones generadas, audit trail crítico.
 *   - `reabierta`: vuelve de cerrada con datos productivos recientes; primero
 *     se debe completar el ciclo o anular vía reversa formal.
 */
export function puedeEliminar(estado: EstadoNomina): boolean {
  switch (estado) {
    case 'borrador':
    case 'dotacion_generada':
    case 'en_revision':
    case 'anulada':
      return true;
    case 'calculada':
    case 'validada':
    case 'aprobada':
    case 'liquidada':
    case 'cerrada':
    case 'reabierta':
      return false;
    default: {
      const _exhaustive: never = estado;
      return _exhaustive;
    }
  }
}

/** Solo nóminas cerradas se pueden reabrir (auditable). */
export function puedeReabrir(estado: EstadoNomina): boolean {
  return estado === 'cerrada';
}

/** Combina regla de estado con permiso admin (matriz §8.1). */
export function puedeEliminarConPermiso(estado: EstadoNomina, esAdmin: boolean): boolean {
  return esAdmin && puedeEliminar(estado);
}

/** Combina regla de estado con permiso admin (matriz §8.1). */
export function puedeReabrirConPermiso(estado: EstadoNomina, esAdmin: boolean): boolean {
  return esAdmin && puedeReabrir(estado);
}

/** Una nómina cerrada puede tener liquidaciones generadas. */
export function tieneLiquidaciones(estado: EstadoNomina): boolean {
  return estado === 'liquidada' || estado === 'cerrada';
}

/** F17: crear rectificación desde nómina cerrada con gate activo. */
export function puedeCrearRectificacion(args: {
  estado: EstadoNomina;
  gateRectificacion: boolean;
  puedeEscribir: boolean;
}): boolean {
  return args.estado === 'cerrada' && args.gateRectificacion && args.puedeEscribir;
}

/**
 * Lista de acciones disponibles según el estado. `abrir-generador` y
 * `ver-resumen` siempre están disponibles. Las demás dependen del estado.
 */
export function accionesDisponibles(estado: EstadoNomina): AccionAdminNomina[] {
  const acciones: AccionAdminNomina[] = ['abrir-generador', 'ver-resumen'];

  if (puedeEliminar(estado)) {
    acciones.push('eliminar');
  }
  if (puedeReabrir(estado)) {
    acciones.push('reabrir');
  }
  if (tieneLiquidaciones(estado)) {
    acciones.push('ver-liquidaciones');
  }

  return acciones;
}
