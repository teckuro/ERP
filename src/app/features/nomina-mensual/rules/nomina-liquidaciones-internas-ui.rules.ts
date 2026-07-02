/**
 * Reglas UI de liquidaciones internas por nómina (F18c).
 */

import type { EstadoNomina } from '../models/nomina-periodo.models';

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
