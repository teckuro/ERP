import type { MovimientoVariableListadoFila } from './movimiento-variable.model';

/** Fila del listado enriquecida para `app-data-grid`. */
export type FilaGridMovimientoVariable = MovimientoVariableListadoFila & {
  trabajadorEtiqueta: string;
  conceptoEtiqueta: string;
  tipoConceptoEtiqueta: string;
  busqueda: string;
};

export type EstadoAltaMovimientoVariable = 'BORRADOR' | 'VALIDADO';

export interface FormularioAltaMovimientoVariable {
  idPersona: number | null;
  idConcepto: number | null;
  monto: number | null;
  estadoAlta: EstadoAltaMovimientoVariable;
  observacion: string;
}
