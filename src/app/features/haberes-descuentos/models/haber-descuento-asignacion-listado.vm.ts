import type { HaberDescuentoAsignacionListado } from './haber-descuento-asignacion.model';
import type { EstadoVigenciaAsignacion } from '../rules/haber-descuento-vigencia.rules';

/** Fila del listado enriquecida para `app-data-grid`. */
export type FilaGridHaberDescuento = HaberDescuentoAsignacionListado & {
  estadoVigencia: EstadoVigenciaAsignacion;
  estadoVigenciaEtiqueta: string;
  valorAsignacion: string;
  busquedaAsignacion: string;
};

export interface VistaConceptoAsignacionModal {
  codigo: string;
  codigoLre: string | null;
  tipo: string | null;
  naturaleza: string | null;
}

export interface TrabajadorResumenModal {
  nombre: string;
  rut: string;
}
