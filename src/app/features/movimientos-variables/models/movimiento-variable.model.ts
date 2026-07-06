/**
 * Movimientos variables mensuales: modelo de dominio (9.4B) y forma alineada a persistencia (9.4C).
 * Los tipos no importan Supabase; el mapeo fila <-> modelo vive en data-access. Ver modelo-tecnico-9-4B.md y persistencia-9-4C.md en docs/codex/modulos/movimientos-variables/
 */

export const MOVIMIENTO_VARIABLE_ESTADOS = [
  'BORRADOR',
  'VALIDADO',
  'OBSERVADO',
  'ANULADO',
  'BLOQUEADO',
  'INCLUIDO_EN_PROCESO',
] as const;

export type MovimientoVariableEstado = (typeof MOVIMIENTO_VARIABLE_ESTADOS)[number];

export const MOVIMIENTO_VARIABLE_ORIGENES = ['MANUAL', 'IMPORTADO', 'SISTEMA'] as const;

export type MovimientoVariableOrigen = (typeof MOVIMIENTO_VARIABLE_ORIGENES)[number];

/** Fila de negocio / persistencia (v1 mínimo). */
export interface MovimientoVariable {
  idMovimiento?: number;
  idPersona: number;
  idConcepto: number;
  /** Periodo remuneracion YYYY-MM */
  periodo: string;
  /** Monto positivo; haber/descuento segun tipo de concepto en catalogo */
  monto: number;
  estado: MovimientoVariableEstado;
  origen?: MovimientoVariableOrigen | null;
  observacion?: string | null;
  fechaRegistro?: string | null;
  fechaActualizacion?: string | null;
  /** Solo poblado cuando estado es ANULADO o hubo intento de anulacion (persistencia 9.4C). */
  fechaAnulacion?: string | null;
  motivoAnulacion?: string | null;
}

/**
 * Snapshot del concepto para `validarMovimientoVariableInput` (tipo, automatico, sistema).
 * CHILE-FIX-01: en crear/actualizar el servicio lo resuelve desde catalogo (primer dia del periodo);
 * el campo `concepto` en el payload queda solo por compatibilidad con la UI y no es fuente de verdad.
 */
export interface MovimientoVariableConceptoSnapshot {
  tipo: string | null;
  calculoAutomatico?: boolean;
  esSistema?: boolean;
  codigo?: string | null;
  nombre?: string | null;
}

export interface MovimientoVariableCrearPayload {
  idPersona: number;
  idConcepto: number;
  periodo: string;
  monto: number;
  estado?: MovimientoVariableEstado;
  origen?: MovimientoVariableOrigen | null;
  observacion?: string | null;
  /** Legacy / UI: el servicio ignora esto para candados; ver `MovimientoVariableConceptoSnapshot`. */
  concepto?: MovimientoVariableConceptoSnapshot | null;
}

export interface MovimientoVariableActualizarPayload {
  idMovimiento: number;
  idPersona?: number;
  idConcepto?: number;
  periodo?: string;
  monto?: number;
  estado?: MovimientoVariableEstado;
  observacion?: string | null;
  /** Legacy / UI: el servicio ignora esto para candados; ver `MovimientoVariableConceptoSnapshot`. */
  concepto?: MovimientoVariableConceptoSnapshot | null;
}

export interface MovimientoVariableAnularPayload {
  idMovimiento: number;
  motivo?: string | null;
}

/** Fila minima para listados futuros (sin UI en 9.4D). `origen` requerido para vista estable. */
export interface MovimientoVariableListadoFila {
  idMovimiento: number;
  idPersona: number;
  idConcepto: number;
  periodo: string;
  monto: number;
  estado: MovimientoVariableEstado;
  origen: MovimientoVariableOrigen;
  observacion?: string | null;
}
