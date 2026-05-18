import type { DetalleOperativoTab } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

export const DETALLE_REVISION_MODAL_TITULO = 'Revisión de nómina mensual';

export type DetalleRevisionFooterAccion =
  | { kind: 'cerrar'; label: string }
  | { kind: 'tab'; label: string; tab: DetalleOperativoTab }
  | { kind: 'ruta'; label: string; ruta: string };

export function buildDetalleRevisionModalLead(input: {
  periodoEtiqueta: string;
  estadoTitulo: string;
}): string {
  return `${input.periodoEtiqueta} · ${input.estadoTitulo} · Revise trabajadores, parámetros y movimientos antes de confirmar la nómina.`;
}

export function buildDetalleRevisionFooterAccion(tab: DetalleOperativoTab): DetalleRevisionFooterAccion {
  switch (tab) {
    case 'resumen':
      return { kind: 'tab', label: 'Ver trabajadores', tab: 'trabajadores' };
    case 'trabajadores':
      return { kind: 'cerrar', label: 'Volver a la consola' };
    case 'parametros':
      return { kind: 'ruta', label: 'Revisar parámetros', ruta: '/parametros' };
    case 'movimientos_recurrentes':
      return {
        kind: 'ruta',
        label: 'Revisar movimientos del mes',
        ruta: '/remuneraciones/novedades-mensuales',
      };
    case 'resultado':
      return { kind: 'tab', label: 'Ver resumen operativo', tab: 'resumen' };
    default:
      return { kind: 'cerrar', label: 'Volver a la consola' };
  }
}
