/**
 * Reglas UI de liquidaciones internas por nómina (F18c).
 */

import type { EstadoNomina, NominaPeriodoResumen } from '../models/nomina-periodo.models';
import { tieneLiquidaciones } from './admin-nominas.rules';

export function esLiquidacionesSoloLectura(estadoNomina: EstadoNomina): boolean {
  return estadoNomina === 'cerrada' || estadoNomina === 'anulada';
}

export function puedeRegenerarLiquidacionesInternas(
  estadoNomina: EstadoNomina,
  calculoVigente: boolean,
): boolean {
  if (esLiquidacionesSoloLectura(estadoNomina)) return false;
  if (!calculoVigente) return false;
  return ['aprobada', 'liquidada', 'reabierta'].includes(estadoNomina);
}

/** Pantalla Liquidaciones: regenerar solo en nómina reabierta (consulta primaria). */
export function puedeRegenerarDesdePantallaLiquidaciones(
  estadoNomina: EstadoNomina,
  calculoVigente: boolean,
): boolean {
  if (esLiquidacionesSoloLectura(estadoNomina)) return false;
  if (!calculoVigente) return false;
  return estadoNomina === 'reabierta';
}

/**
 * Trabajadores en dotación que aún no tienen comprobante en la versión de referencia.
 * Si no hay lotes materializados, devuelve 0 (el vacío de lotes se comunica aparte).
 */
export function calcularTrabajadoresSinLiquidacion(
  totalNomina: number,
  totalLiquidacionReferencia: number | null | undefined,
  opts?: { hayLotesMaterializados?: boolean },
): number {
  if (!opts?.hayLotesMaterializados) return 0;
  if (totalLiquidacionReferencia == null) return totalNomina;
  return Math.max(0, totalNomina - totalLiquidacionReferencia);
}

/** Nóminas con liquidaciones consultables (liquidada o cerrada con cálculo vigente). */
export function nominasConLiquidacionesDisponibles(
  resumenes: readonly NominaPeriodoResumen[],
): NominaPeriodoResumen[] {
  return resumenes
    .filter((fila) => tieneLiquidaciones(fila.estado) && !!fila.evidenciaCalculo?.idCalculoPeriodo)
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || a.empresaNombre.localeCompare(b.empresaNombre));
}
