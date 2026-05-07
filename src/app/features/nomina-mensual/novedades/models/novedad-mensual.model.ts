export const NOVEDAD_MENSUAL_ESTADOS = [
  'borrador',
  'pendiente_revision',
  'aprobada',
  'rechazada',
  'incorporada_a_pre_nomina',
  'calculada',
  'anulada',
] as const;

export type NovedadMensualEstado = (typeof NOVEDAD_MENSUAL_ESTADOS)[number];

export const NOVEDAD_MENSUAL_CATEGORIAS = [
  'haber_variable',
  'tiempo_trabajado_adicional',
  'ausencia_descuento_tiempo',
  'licencia_permiso',
  'anticipo_descuento_unico',
  'retroactivo_reintegro',
  'ajuste_manual_controlado',
] as const;

export type NovedadMensualCategoria = (typeof NOVEDAD_MENSUAL_CATEGORIAS)[number];

export const NOVEDAD_MENSUAL_ORIGENES = [
  'manual',
  'asistencia',
  'importacion',
  'integracion_externa',
  'ajuste_administrativo',
  'regularizacion',
  'sistema',
] as const;

export type NovedadMensualOrigen = (typeof NOVEDAD_MENSUAL_ORIGENES)[number];

export const NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO = ['haber', 'descuento', 'ajuste', 'informativo'] as const;

export type NovedadMensualTipoMovimiento = (typeof NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO)[number];

export interface NovedadMensual {
  idNovedad: number;
  periodo: string;
  idPersona: number;
  idContrato: number | null;
  idConcepto: number;
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
  cantidad: number | null;
  unidad: string | null;
  monto: number | null;
  moneda: string;
  origen: NovedadMensualOrigen;
  fechaEvento: string | null;
  estado: NovedadMensualEstado;
  observacion: string | null;
  referenciaExterna: string | null;
  creadoPor: string | null;
  aprobadoPor: string | null;
  fechaAprobacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearNovedadMensualInput {
  periodo: string;
  idPersona: number;
  idContrato?: number | null;
  idConcepto: number;
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
  cantidad?: number | null;
  unidad?: string | null;
  monto?: number | null;
  moneda?: string | null;
  origen?: NovedadMensualOrigen | null;
  fechaEvento?: string | null;
  observacion?: string | null;
  referenciaExterna?: string | null;
  creadoPor?: string | null;
}

export interface ActualizarNovedadMensualInput {
  periodo?: string;
  idPersona?: number;
  idContrato?: number | null;
  idConcepto?: number;
  categoria?: NovedadMensualCategoria;
  tipoMovimiento?: NovedadMensualTipoMovimiento;
  cantidad?: number | null;
  unidad?: string | null;
  monto?: number | null;
  moneda?: string | null;
  origen?: NovedadMensualOrigen | null;
  fechaEvento?: string | null;
  observacion?: string | null;
  referenciaExterna?: string | null;
}

export interface CambiarEstadoNovedadMensualInput {
  idNovedad: number;
  estado: NovedadMensualEstado;
  aprobadoPor?: string | null;
  observacion?: string | null;
}
