import type { ConceptoMantenimientoFila } from '../models/haber-descuento-asignacion.model';

export type ConceptoLreEstadoUi =
  | 'directo_con_codigo'
  | 'requiere_asignacion'
  | 'pendiente_normativo'
  | 'deriva_operativa'
  | 'no_exportable';

export type ConceptoLreFiltroUi =
  | 'CON'
  | 'SIN'
  | 'PENDIENTE'
  | 'DERIVA'
  | 'NO_EXPORTA';

export type ConceptoLreEstadoInput = Pick<
  ConceptoMantenimientoFila,
  | 'idCatalogoLre'
  | 'codigoLre'
  | 'estrategiaLre'
  | 'requiereExportacionLre'
>;

const ESTRATEGIAS_PENDIENTE: ReadonlySet<string> = new Set([
  'PENDIENTE_NORMATIVO',
  'DESCOMPONER_CONCEPTO',
]);

const ESTRATEGIAS_DERIVA: ReadonlySet<string> = new Set([
  'DERIVA_DIAS_TRABAJADOS',
  'DERIVA_REBAJA_TRIBUTARIA',
]);

export function clasificarEstadoLreConcepto(row: ConceptoLreEstadoInput): ConceptoLreEstadoUi {
  const estrategia = (row.estrategiaLre ?? 'DIRECTO').trim().toUpperCase();

  if (!row.requiereExportacionLre || estrategia === 'NO_EXPORTABLE') {
    return 'no_exportable';
  }

  if (ESTRATEGIAS_DERIVA.has(estrategia)) {
    return 'deriva_operativa';
  }

  if (ESTRATEGIAS_PENDIENTE.has(estrategia)) {
    return 'pendiente_normativo';
  }

  if ((row.codigoLre ?? '').trim() || row.idCatalogoLre != null) {
    return 'directo_con_codigo';
  }

  if (estrategia === 'DIRECTO') {
    return 'requiere_asignacion';
  }

  return 'pendiente_normativo';
}

export function etiquetaEstadoLreConcepto(estado: ConceptoLreEstadoUi): string {
  switch (estado) {
    case 'directo_con_codigo':
      return 'Listo para exportar';
    case 'requiere_asignacion':
      return 'Requiere código LRE';
    case 'pendiente_normativo':
      return 'Pendiente normativo';
    case 'deriva_operativa':
      return 'Deriva operativa';
    case 'no_exportable':
      return 'No exportable';
    default:
      return '—';
  }
}

export function filtroLreDesdeEstado(estado: ConceptoLreEstadoUi): ConceptoLreFiltroUi {
  switch (estado) {
    case 'directo_con_codigo':
      return 'CON';
    case 'requiere_asignacion':
      return 'SIN';
    case 'pendiente_normativo':
      return 'PENDIENTE';
    case 'deriva_operativa':
      return 'DERIVA';
    case 'no_exportable':
      return 'NO_EXPORTA';
    default:
      return 'SIN';
  }
}

export function conceptoRequiereCodigoLreAntesDeGuardar(row: ConceptoLreEstadoInput): boolean {
  return clasificarEstadoLreConcepto({
    ...row,
    idCatalogoLre: row.idCatalogoLre,
    codigoLre: row.codigoLre,
  }) === 'requiere_asignacion' || (
    (row.estrategiaLre ?? 'DIRECTO') === 'DIRECTO'
    && row.requiereExportacionLre
    && row.idCatalogoLre == null
  );
}

export function contarConceptosPendientesExportacionLre(
  filas: readonly ConceptoLreEstadoInput[],
): number {
  return filas.filter((f) => clasificarEstadoLreConcepto(f) === 'requiere_asignacion').length;
}
