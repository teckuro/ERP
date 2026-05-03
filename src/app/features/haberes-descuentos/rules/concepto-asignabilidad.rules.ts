import type { ConceptoMantenimientoFila } from '../models/haber-descuento-asignacion.model';

/** Valores de filtro / chip de vigencia respecto a una fecha de referencia. */
export type VigenciaConceptoPeriodo =
  | 'NO_OPERATIVO'
  | 'VIGENTE_PERIODO'
  | 'FUTURO'
  | 'VENCIDO'
  | 'SIN_FECHAS';

export type ConceptoAsignableInput = Pick<
  ConceptoMantenimientoFila,
  'tipo' | 'esSistema' | 'calculoAutomatico' | 'vigente' | 'vigenciaInicio' | 'vigenciaFin'
>;

function parseIsoDateOnly(value: string | null | undefined): Date | null {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const s = String(value).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Inicio del día local de `ref` (solo fecha civil). */
export function inicioDiaReferencia(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
}

/**
 * `vigencia_fin` ≥ `vigencia_inicio` cuando ambas existen.
 */
export function vigenciasCoherentesConcepto(row: ConceptoAsignableInput): boolean {
  const ini = parseIsoDateOnly(row.vigenciaInicio);
  const fin = parseIsoDateOnly(row.vigenciaFin);
  if (ini && fin && fin.getTime() < ini.getTime()) {
    return false;
  }
  return true;
}

/**
 * Clasificación de vigencia para listado (fecha de referencia típica: hoy).
 */
export function clasificarVigenciaConcepto(row: ConceptoAsignableInput, ref: Date): VigenciaConceptoPeriodo {
  if (!row.vigente) {
    return 'NO_OPERATIVO';
  }
  const refDay = inicioDiaReferencia(ref);
  const ini = parseIsoDateOnly(row.vigenciaInicio);
  const fin = parseIsoDateOnly(row.vigenciaFin);
  if (!ini && !fin) {
    return 'SIN_FECHAS';
  }
  if (ini && refDay.getTime() < ini.getTime()) {
    return 'FUTURO';
  }
  if (fin && refDay.getTime() > fin.getTime()) {
    return 'VENCIDO';
  }
  return 'VIGENTE_PERIODO';
}

/**
 * Regla oficial asignación recurrente Haberes/descuentos (catálogo maestro).
 * No considera `regla_concepto_calculo` en UI: si existiera fila de regla sin motor aprobado, aquí no se infiere;
 * los flags `es_sistema` y `calculo_automatico` cubren el candado operativo.
 */
export function esConceptoAsignable(row: ConceptoAsignableInput, ref: Date): boolean {
  if (!vigenciasCoherentesConcepto(row)) {
    return false;
  }
  const tipo = row.tipo?.trim() ?? '';
  if (tipo !== 'HABER' && tipo !== 'DESCUENTO') {
    return false;
  }
  if (row.esSistema || row.calculoAutomatico) {
    return false;
  }
  if (!row.vigente) {
    return false;
  }
  const periodo = clasificarVigenciaConcepto(row, ref);
  if (periodo === 'FUTURO' || periodo === 'VENCIDO' || periodo === 'NO_OPERATIVO') {
    return false;
  }
  return true;
}

export function etiquetaVigenciaConcepto(periodo: VigenciaConceptoPeriodo): string {
  switch (periodo) {
    case 'NO_OPERATIVO':
      return 'No vigente';
    case 'FUTURO':
      return 'Futuro';
    case 'VENCIDO':
      return 'Vencido';
    case 'SIN_FECHAS':
      return 'Vigente';
    case 'VIGENTE_PERIODO':
      return 'Vigente';
    default:
      return '—';
  }
}
