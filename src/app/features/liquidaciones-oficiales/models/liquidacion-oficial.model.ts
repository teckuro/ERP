export type LiquidacionOficialEstado = 'generada';

import type { LiquidacionAccionUiEstado } from '../rules/liquidaciones-acciones-ui.rules';

export type LiquidacionesPeriodoEstadoUi =
  | 'no_disponible'
  | 'lista_para_generar'
  | 'generando'
  | 'generadas'
  | 'generadas_con_advertencias'
  | 'error';

export interface LiquidacionPeriodo {
  idLiquidacionPeriodo: number;
  idCalculoPeriodo: number;
  periodo: string;
  estado: LiquidacionOficialEstado;
  fechaGeneracion: string;
  usuarioGeneracionId: string | null;
  usuarioGeneracionLabel: string | null;
  totalTrabajadores: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalLiquido: number;
  metadata: Record<string, unknown>;
}

export interface LiquidacionTrabajador {
  idLiquidacionTrabajador: number;
  idPersona: number | null;
  idContrato: number | null;
  rut: string | null;
  nombreTrabajador: string;
  cargo: string | null;
  centroCosto: string | null;
  fechaIngreso: string | null;
  diasTrabajados: number | null;
  baseImponible: number;
  baseTributable: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalAportesEmpleadorReferencia: number;
  liquidoPagar: number;
  estado: LiquidacionOficialEstado;
  /** Estado de revisión RRHH (autorización, pago, documento). */
  estadoRevision?: LiquidacionAccionUiEstado | null;
  observaciones: unknown[];
  metadata: Record<string, unknown>;
}

export interface LiquidacionConcepto {
  idLiquidacionConcepto: number;
  idLiquidacionTrabajador: number;
  idConcepto: number | null;
  codigo: string | null;
  codigoLre: string | null;
  nombre: string;
  tipo: string;
  clasificacion: string | null;
  cantidad: number | null;
  base: number | null;
  tasa: number | null;
  monto: number;
  orden: number;
  metadata: Record<string, unknown>;
}

export interface LiquidacionesEstadoPeriodo {
  estado: LiquidacionesPeriodoEstadoUi;
  periodo: string;
  snapshot: {
    idCalculoPeriodo: number;
    totalTrabajadores: number;
    totalHaberes: number;
    totalDescuentos: number;
    totalLiquido: number;
    totalAdvertencias: number;
    versionMotor: string;
    hashSnapshot: string | null;
    aprobadoOperativamente: boolean;
    cerradoOperativamente: boolean;
  } | null;
  liquidacion: LiquidacionPeriodo | null;
  trabajadores: LiquidacionTrabajador[];
  motivoNoPuedeGenerar: string | null;
  advertencias: string[];
}

export interface GenerarLiquidacionesParams {
  idCalculoPeriodo: number;
  periodo: string;
  metadata?: Record<string, unknown>;
}
