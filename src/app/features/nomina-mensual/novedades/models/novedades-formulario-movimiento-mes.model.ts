import type {
  NovedadMensualCategoria,
  NovedadMensualOrigen,
  NovedadMensualTipoMovimiento,
} from '../models/novedad-mensual.model';

/** Campos compartidos entre formulario individual y masivo. */
export interface FormularioMovimientoMesValores {
  idPersona?: number | null;
  idContrato?: number | null;
  idConcepto: number | null;
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
  cantidad?: number | null;
  unidad?: string;
  monto: number | null;
  moneda?: string;
  origen: NovedadMensualOrigen;
  fechaEvento: string;
  observacion?: string;
  referenciaExterna?: string;
}

export type FormularioMovimientoMesCampo = keyof FormularioMovimientoMesValores;

export interface ResumenFormularioMensualUi {
  principal: string;
  pendientes: string[];
  visible: boolean;
  mostrarPeriodo: boolean;
  periodo: string;
}
