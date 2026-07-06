/**
 * Reglas de negocio del paso Dotación (F3e-2).
 *
 * Define qué se puede hacer sobre cada trabajador según su estado:
 *   - listo / advertencia: aceptan acciones masivas y cambios de segmento.
 *   - critico: aceptan acciones masivas (con preview que avise) pero NO cierre.
 *   - bloqueado: SOLO permite ver detalle. No se asignan a segmentos ni se aplican movimientos.
 */

import type { FilaTrabajadorNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';

export function puedeAplicarAccionMasiva(
  fila: FilaTrabajadorNominaResumen,
): boolean {
  return fila.estado !== 'bloqueado';
}

export function puedeAsignarSegmento(fila: FilaTrabajadorNominaResumen): boolean {
  return fila.estado !== 'bloqueado';
}

export function puedeAvanzarDotacion(
  filas: FilaTrabajadorNominaResumen[],
): { puede: boolean; motivo?: string } {
  if (filas.length === 0) {
    return {
      puede: false,
      motivo: 'No hay trabajadores en la dotación. Agrega al menos un segmento con trabajadores.',
    };
  }
  const bloqueados = filas.filter((f) => f.estado === 'bloqueado');
  if (bloqueados.length > 0) {
    return {
      puede: false,
      motivo: `${bloqueados.length} trabajadores están bloqueados. Resuelve sus incidencias antes de continuar.`,
    };
  }
  return { puede: true };
}

/** Evalúa avance con conteos agregados del servidor (F07). */
export function puedeAvanzarDotacionResumen(resumen: {
  total: number;
  bloqueados: number;
}): { puede: boolean; motivo?: string } {
  if (resumen.total === 0) {
    return {
      puede: false,
      motivo: 'No hay trabajadores en la dotación. Agrega al menos un segmento con trabajadores.',
    };
  }
  if (resumen.bloqueados > 0) {
    return {
      puede: false,
      motivo: `${resumen.bloqueados} trabajadores están bloqueados. Resuelve sus incidencias antes de continuar.`,
    };
  }
  return { puede: true };
}

export function clasificarFilasParaPreview(
  filas: FilaTrabajadorNominaResumen[],
): { aplicables: FilaTrabajadorNominaResumen[]; descartadas: FilaTrabajadorNominaResumen[] } {
  const aplicables: FilaTrabajadorNominaResumen[] = [];
  const descartadas: FilaTrabajadorNominaResumen[] = [];
  for (const fila of filas) {
    if (puedeAplicarAccionMasiva(fila)) aplicables.push(fila);
    else descartadas.push(fila);
  }
  return { aplicables, descartadas };
}
