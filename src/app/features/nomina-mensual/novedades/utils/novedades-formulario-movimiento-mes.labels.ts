import {
  NOVEDAD_MENSUAL_CATEGORIAS,
  NOVEDAD_MENSUAL_ORIGENES,
  NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO,
  type NovedadMensualCategoria,
  type NovedadMensualOrigen,
  type NovedadMensualTipoMovimiento,
} from '../models/novedad-mensual.model';

const CATEGORIA_LABELS: Record<NovedadMensualCategoria, string> = {
  haber_variable: 'Haber puntual',
  tiempo_trabajado_adicional: 'Horas o tiempo adicional',
  ausencia_descuento_tiempo: 'Ausencia o descuento de tiempo',
  licencia_permiso: 'Licencia o permiso',
  anticipo_descuento_unico: 'Anticipo o descuento único',
  retroactivo_reintegro: 'Retroactivo o reintegro',
  ajuste_manual_controlado: 'Ajuste controlado',
};

const ORIGEN_LABELS: Record<NovedadMensualOrigen, string> = {
  manual: 'Manual',
  asistencia: 'Asistencia',
  importacion: 'Importación',
  integracion_externa: 'Integración externa',
  ajuste_administrativo: 'Ajuste administrativo',
  regularizacion: 'Regularización',
  sistema: 'Sistema',
};

const TIPO_MOVIMIENTO_LABELS: Record<NovedadMensualTipoMovimiento, string> = {
  haber: 'Haber',
  descuento: 'Descuento',
  ajuste: 'Ajuste',
  informativo: 'Informativo',
};

export const TIPOS_MOVIMIENTO_MES = NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO;
export const CATEGORIAS_MOVIMIENTO_MES = NOVEDAD_MENSUAL_CATEGORIAS;
export const ORIGENES_MOVIMIENTO_MES = NOVEDAD_MENSUAL_ORIGENES;

export function etiquetaTipoMovimientoMes(tipo: NovedadMensualTipoMovimiento): string {
  return TIPO_MOVIMIENTO_LABELS[tipo];
}

export function etiquetaCategoriaMovimientoMes(categoria: NovedadMensualCategoria): string {
  return CATEGORIA_LABELS[categoria];
}

export function etiquetaOrigenMovimientoMes(origen: NovedadMensualOrigen): string {
  return ORIGEN_LABELS[origen];
}
