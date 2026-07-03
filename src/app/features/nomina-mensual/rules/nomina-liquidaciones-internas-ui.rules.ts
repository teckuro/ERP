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

/** Trabajadores en dotación que aún no aparecen en la liquidación vigente. */
export function calcularTrabajadoresSinLiquidacion(
  totalNomina: number,
  totalLiquidacionVigente: number | null | undefined,
): number {
  if (totalLiquidacionVigente == null) return totalNomina;
  return Math.max(0, totalNomina - totalLiquidacionVigente);
}

/** Nóminas con liquidaciones consultables (liquidada o cerrada con cálculo vigente). */
export function nominasConLiquidacionesDisponibles(
  resumenes: readonly NominaPeriodoResumen[],
): NominaPeriodoResumen[] {
  return resumenes
    .filter((fila) => tieneLiquidaciones(fila.estado) && !!fila.evidenciaCalculo?.idCalculoPeriodo)
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || a.empresaNombre.localeCompare(b.empresaNombre));
}
