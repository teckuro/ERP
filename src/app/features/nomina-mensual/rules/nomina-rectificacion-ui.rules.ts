import type { NominaPeriodoResumen } from '../models/nomina-periodo.models';
import type { TotalesRectificacionVista } from './proceso-mensual-motor-rectificacion.rules';

export function esNominaRectificacion(
  fila: Pick<NominaPeriodoResumen, 'naturaleza'>,
): boolean {
  return fila.naturaleza === 'rectificacion';
}

/** Rectificaciones vinculadas al cierre original (siempre apuntan al mismo origen). */
export function agruparRectificacionesPorOrigen(
  resumenes: readonly NominaPeriodoResumen[],
): Map<string, NominaPeriodoResumen[]> {
  const map = new Map<string, NominaPeriodoResumen[]>();
  for (const fila of resumenes) {
    if (!esNominaRectificacion(fila) || !fila.nominaOrigenId) continue;
    const lista = map.get(fila.nominaOrigenId) ?? [];
    lista.push(fila);
    map.set(fila.nominaOrigenId, lista);
  }
  for (const [, lista] of map) {
    lista.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return map;
}

export function rectificacionesDeOrigen(
  resumenes: readonly NominaPeriodoResumen[],
  origenId: string,
): NominaPeriodoResumen[] {
  return agruparRectificacionesPorOrigen(resumenes).get(origenId) ?? [];
}

export function indiceRectificacionEnCadena(
  fila: NominaPeriodoResumen,
  resumenes: readonly NominaPeriodoResumen[],
): number | null {
  if (!esNominaRectificacion(fila) || !fila.nominaOrigenId) return null;
  const cadena = rectificacionesDeOrigen(resumenes, fila.nominaOrigenId);
  const idx = cadena.findIndex((r) => r.id === fila.id);
  return idx >= 0 ? idx + 1 : null;
}

export function puedeConsultarOriginal(
  fila: Pick<NominaPeriodoResumen, 'naturaleza' | 'nominaOrigenId'>,
): boolean {
  return esNominaRectificacion(fila) && !!fila.nominaOrigenId;
}

export function etiquetaAccionPrimariaFila(
  fila: Pick<NominaPeriodoResumen, 'naturaleza'>,
): string {
  return esNominaRectificacion(fila) ? 'Continuar rectificación' : 'Abrir generador';
}

export function etiquetaAccionResumen(
  fila: Pick<NominaPeriodoResumen, 'naturaleza'>,
): string {
  return esNominaRectificacion(fila) ? 'Continuar rectificación' : 'Continuar en el generador';
}

export function formatearMonedaClp(valor: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(valor);
}

export function tieneComparativaRectificacion(
  totales: TotalesRectificacionVista | null | undefined,
): totales is TotalesRectificacionVista {
  return totales != null;
}
