/**
 * Presenter de liquidaciones internas por nómina (F18c).
 *
 * Clasifica versiones como vigente, superada o congelada por cierre.
 */

import type { EstadoNomina } from '../models/nomina-periodo.models';
import type { NominaLiquidacionResumen } from '../models/nomina-consolidacion.models';

export type ClasificacionLiquidacionInterna = 'vigente' | 'superada' | 'congelada';

export type TonoLiquidacionInterna = 'success' | 'neutral' | 'warning';

export interface FilaLiquidacionInterna extends NominaLiquidacionResumen {
  clasificacion: ClasificacionLiquidacionInterna;
  etiquetaClasificacion: string;
  tono: TonoLiquidacionInterna;
}

const ETIQUETAS: Record<ClasificacionLiquidacionInterna, string> = {
  vigente: 'Vigente',
  superada: 'Superada',
  congelada: 'Congelada por cierre',
};

const TONOS: Record<ClasificacionLiquidacionInterna, TonoLiquidacionInterna> = {
  vigente: 'success',
  superada: 'neutral',
  congelada: 'warning',
};

export function clasificarLiquidacionInterna(
  liquidacion: NominaLiquidacionResumen,
  opts: { nominaCerrada: boolean; versionMaxima: number },
): ClasificacionLiquidacionInterna {
  if (opts.nominaCerrada) return 'congelada';
  if (liquidacion.version >= opts.versionMaxima && liquidacion.activo) return 'vigente';
  return 'superada';
}

export function prepararFilasLiquidacionesInternas(
  liquidaciones: readonly NominaLiquidacionResumen[],
  estadoNomina: EstadoNomina,
): FilaLiquidacionInterna[] {
  if (liquidaciones.length === 0) return [];
  const versionMaxima = Math.max(...liquidaciones.map((l) => l.version));
  const nominaCerrada = estadoNomina === 'cerrada' || estadoNomina === 'anulada';

  return [...liquidaciones]
    .sort((a, b) => b.version - a.version)
    .map((liquidacion) => {
      const clasificacion = clasificarLiquidacionInterna(liquidacion, {
        nominaCerrada,
        versionMaxima,
      });
      return {
        ...liquidacion,
        clasificacion,
        etiquetaClasificacion: ETIQUETAS[clasificacion],
        tono: TONOS[clasificacion],
      };
    });
}

export function liquidacionVigente(
  filas: readonly FilaLiquidacionInterna[],
): FilaLiquidacionInterna | null {
  return filas.find((fila) => fila.clasificacion === 'vigente') ?? null;
}

/** Versión de referencia para medir cobertura de trabajadores (vigente o última materializada). */
export function liquidacionReferenciaCobertura(
  filas: readonly FilaLiquidacionInterna[],
): FilaLiquidacionInterna | null {
  return liquidacionVigente(filas) ?? filas[0] ?? null;
}

export function formatearFechaLiquidacion(iso: string): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  const hh = fecha.getHours().toString().padStart(2, '0');
  const mm = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}
