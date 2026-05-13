import type { EstadoVigenciaAsignacion } from '../rules/haber-descuento-vigencia.rules';

/**
 * Dominio del mantenedor haberdescuento_persona + join concepto + catalogo_lre.
 * Columnas alineadas a database.types (v11).
 */

export type PeriodicidadHd =
  | 'MENSUAL'
  | 'QUINCENAL'
  | 'OCASIONAL'
  | 'UNICA';

export const PERIODICIDADES_HD: readonly PeriodicidadHd[] = [
  'MENSUAL',
  'QUINCENAL',
  'OCASIONAL',
  'UNICA',
] as const;

/** Opción para selector LRE (sin códigos hardcodeados en UI). */
export interface CatalogoLreOpcion {
  idCatalogoLre: number;
  codigoLre: string;
  nombreLre: string;
  moduloLre: string;
  grupoLre: string | null;
  clasificacionLre: string | null;
}

export interface ConceptoListado {
  idConcepto: number;
  codigo: string;
  nombre: string;
  tipo: string | null;
  naturaleza: string | null;
  imponible: boolean;
  tributable: boolean;
  /** Desde catálogo LRE vinculado al concepto. */
  codigoLre: string | null;
}

/** Fila catálogo / mantenedor `concepto` (todos los tipos). */
export interface ConceptoMantenimientoFila {
  idConcepto: number;
  codigo: string;
  codigoMotor: string | null;
  nombre: string;
  tipo: string | null;
  naturaleza: string | null;
  idCatalogoLre: number | null;
  codigoLre: string | null;
  nombreLre: string | null;
  moduloLre: string | null;
  grupoLre: string | null;
  clasificacionLre: string | null;
  imponible: boolean;
  tributable: boolean;
  afectaAfp: boolean;
  afectaSalud: boolean;
  afectaAfc: boolean;
  afectaSis: boolean;
  afectaLiquido: boolean;
  esSistema: boolean;
  vigente: boolean;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  ordenImpresion: number;
  calculoAutomatico: boolean;
}

export interface ConceptoMantenimientoPayload {
  codigo: string;
  codigoMotor: string | null;
  nombre: string;
  tipo: string;
  naturaleza: string | null;
  idCatalogoLre: number | null;
  imponible: boolean;
  tributable: boolean;
  afectaAfp: boolean;
  afectaSalud: boolean;
  afectaAfc: boolean;
  afectaSis: boolean;
  afectaLiquido: boolean;
  vigente: boolean;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  ordenImpresion: number;
  calculoAutomatico: boolean;
}

export interface HaberDescuentoAsignacionListado {
  idAsignacion: number;
  idPersona: number;
  idConcepto: number;
  idContrato: number | null;
  codigoConcepto: string;
  nombreConcepto: string;
  tipoConcepto: string | null;
  naturalezaConcepto: string | null;
  codigoLre: string | null;
  esSistemaConcepto: boolean;
  calculoAutomaticoConcepto: boolean;
  imponible: boolean;
  tributable: boolean;
  monto: number | null;
  porcentaje: number | null;
  /** Valores típicos en BD: FIJO | PORCENTAJE */
  tipoValor: string | null;
  tipohaber: string | null;
  periodicidad: string | null;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  observacion: string | null;
  estado: boolean;
  estadoVigencia?: EstadoVigenciaAsignacion;
  estadoVigenciaEtiqueta?: string;
}

/** Enriquecido para prevalidacion proceso mensual (9.5B); no calcula liquidaciones. */
export interface HaberDescuentoAsignacionPrevalidacionMensualFila {
  asignacion: HaberDescuentoAsignacionListado;
  estadoVigencia: EstadoVigenciaAsignacion;
  intersectaPeriodo: boolean;
}

export interface HaberDescuentoAsignacionVigencia {
  idAsignacion: number;
  idPersona: number;
  idConcepto: number;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  estado: boolean;
}

export interface HaberDescuentoAsignacionCierrePayload {
  vigenciaFin: string | null;
  estado: boolean;
}

export type HaberDescuentoTipoValor = 'FIJO' | 'PORCENTAJE';

export interface HaberDescuentoAsignacionPayload {
  idPersona: number;
  idConcepto: number;
  idContrato: number | null;
  tipoValor: HaberDescuentoTipoValor;
  monto: number | null;
  porcentaje: number | null;
  tipohaber: string | null;
  periodicidad: PeriodicidadHd | null;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
  observacion: string | null;
  estado: boolean;
}

export interface ContratoResumenPersona {
  idContrato: number;
  etiqueta: string;
}
