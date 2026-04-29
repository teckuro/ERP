/**
 * Dominio del mantenedor haberdescuento_persona + join concepto.
 * Columnas alineadas a database.types (sin vigencias: la tabla no las tiene en DDL v11).
 */

export interface ConceptoListado {
  idConcepto: number;
  codigo: string;
  nombre: string;
  tipo: string | null;
  naturaleza: string | null;
  imponible: boolean;
  tributable: boolean;
}

export interface HaberDescuentoAsignacionListado {
  idAsignacion: number;
  idPersona: number;
  idConcepto: number;
  codigoConcepto: string;
  nombreConcepto: string;
  tipoConcepto: string | null;
  naturalezaConcepto: string | null;
  imponible: boolean;
  tributable: boolean;
  monto: number | null;
  porcentaje: number | null;
  /** Valores típicos en BD: FIJO | PORCENTAJE */
  tipoValor: string | null;
  tipohaber: string | null;
  estado: boolean;
}

export type HaberDescuentoTipoValor = 'FIJO' | 'PORCENTAJE';

export interface HaberDescuentoAsignacionPayload {
  idPersona: number;
  idConcepto: number;
  tipoValor: HaberDescuentoTipoValor;
  monto: number | null;
  porcentaje: number | null;
  tipohaber: string | null;
  estado: boolean;
}
