import type { EstadoNomina, NominaPeriodoResumen } from '../models/nomina-periodo.models';
import type { RectificacionPreview } from '../models/nomina-rectificacion-preview.models';
import type { TotalesRectificacionVista } from '../rules/proceso-mensual-motor-rectificacion.rules';
import {
  formatearMonedaClp,
  indiceRectificacionEnCadena,
  rectificacionesDeOrigen,
} from '../rules/nomina-rectificacion-ui.rules';

export interface ColumnaComparativaRectificacion {
  id: 'original' | 'diferencia' | 'acumulado';
  label: string;
  haberes: string;
  descuentos: string;
  liquido: string;
  destacada: boolean;
}

export interface FilaCadenaRectificacionView {
  id: string;
  indice: number;
  estado: EstadoNomina;
  trabajadores: number;
  liquido: string;
  actualizada: string;
}

export interface ContextoRectificacionModalView {
  liquidoOriginal: string;
  trabajadoresOriginal: number;
  seleccionados: number;
  referenciaEsOriginal: boolean;
  notaReferencia: string;
}

export function prepararComparativaRectificacion(
  totales: TotalesRectificacionVista,
): ColumnaComparativaRectificacion[] {
  return [
    {
      id: 'original',
      label: 'Original cerrada',
      haberes: formatearMonedaClp(totales.original.haberes),
      descuentos: formatearMonedaClp(totales.original.descuentos),
      liquido: formatearMonedaClp(totales.original.liquido),
      destacada: false,
    },
    {
      id: 'diferencia',
      label: 'Ajuste',
      haberes: formatearMonedaClp(totales.diferencia.haberes),
      descuentos: formatearMonedaClp(totales.diferencia.descuentos),
      liquido: formatearMonedaClp(totales.diferencia.liquido),
      destacada: false,
    },
    {
      id: 'acumulado',
      label: 'Resultado acumulado',
      haberes: formatearMonedaClp(totales.acumulado.haberes),
      descuentos: formatearMonedaClp(totales.acumulado.descuentos),
      liquido: formatearMonedaClp(totales.acumulado.liquido),
      destacada: true,
    },
  ];
}

export function prepararContextoRectificacionModal(
  origen: NominaPeriodoResumen,
  preview: RectificacionPreview | null,
): ContextoRectificacionModalView {
  const referenciaEsOriginal =
    !preview?.nominaReferenciaId || preview.nominaReferenciaId === preview.nominaOrigenId;
  return {
    liquidoOriginal: formatearMonedaClp(origen.totalLiquido),
    trabajadoresOriginal: origen.totalTrabajadores,
    seleccionados: preview?.totales.seleccionados ?? 0,
    referenciaEsOriginal,
    notaReferencia: referenciaEsOriginal
      ? 'La rectificación se vincula al cierre original. Ese registro no se modifica.'
      : 'Este ajuste también referencia el cierre original, no la rectificación intermedia.',
  };
}

export function prepararFilasCadenaRectificacion(
  resumenes: readonly NominaPeriodoResumen[],
  origenId: string,
  formatearFecha: (iso: string) => string,
): FilaCadenaRectificacionView[] {
  return rectificacionesDeOrigen(resumenes, origenId).map((fila, index) => ({
    id: fila.id,
    indice: index + 1,
    estado: fila.estado,
    trabajadores: fila.totalTrabajadores,
    liquido: formatearMonedaClp(fila.totalLiquido),
    actualizada: formatearFecha(fila.updatedAt),
  }));
}

export function etiquetaSublineaRectificacion(
  fila: NominaPeriodoResumen,
  resumenes: readonly NominaPeriodoResumen[],
): string | null {
  const indice = indiceRectificacionEnCadena(fila, resumenes);
  if (!indice) return null;
  const total = rectificacionesDeOrigen(resumenes, fila.nominaOrigenId!).length;
  if (total <= 1) return 'Ajuste diferencial · apunta al cierre original';
  return `Ajuste #${indice} de ${total} · apunta al cierre original`;
}

export function etiquetaCadenaEnOriginal(totalRectificaciones: number): string | null {
  if (totalRectificaciones <= 0) return null;
  if (totalRectificaciones === 1) return '1 rectificación vinculada';
  return `${totalRectificaciones} rectificaciones vinculadas`;
}
