export const ENTRADA_MENSUAL_ORIGENES = [
  'recurrente',
  'novedad_mensual',
  'legacy_movimiento_variable',
] as const;

export type EntradaMensualOrigen = (typeof ENTRADA_MENSUAL_ORIGENES)[number];

export const ENTRADA_MENSUAL_TIPOS = [
  'haber',
  'descuento',
  'ausencia',
  'licencia',
  'anticipo',
  'ajuste',
  'retroactivo',
  'reintegro',
  'otro',
] as const;

export type EntradaMensualTipo = (typeof ENTRADA_MENSUAL_TIPOS)[number];

export const ENTRADA_MENSUAL_ESTADOS = [
  'borrador',
  'pendiente_revision',
  'observada',
  'aprobada',
  'rechazada',
  'incorporada_a_pre_nomina',
  'calculada',
  'anulada',
  'legacy_validado',
  'legacy_bloqueado',
] as const;

export type EntradaMensualEstado = (typeof ENTRADA_MENSUAL_ESTADOS)[number];

export interface EntradaMensualPeriodo {
  idEntrada: string | number;
  origen: EntradaMensualOrigen;
  origenId: string | number | null;
  periodo: string;
  idPersona: number;
  idContrato: number | null;
  idConcepto: number;
  tipoEntrada: EntradaMensualTipo;
  categoria: string | null;
  tipoMovimiento: string | null;
  cantidad: number | null;
  unidad: string | null;
  monto: number | null;
  moneda: string | null;
  estado: EntradaMensualEstado;
  fechaEvento: string | null;
  observacion: string | null;
  referenciaExterna: string | null;
  requiereRevision: boolean;
  bloqueaProceso: boolean;
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface ResumenEntradasMensualesPeriodo {
  total: number;
  recurrentes: number;
  novedadesMensuales: number;
  legacyMovimientos: number;
  aprobadas: number;
  pendientesRevision: number;
  observadas: number;
  rechazadas: number;
  anuladas: number;
  bloqueantes: number;
  conWarnings: number;
}
