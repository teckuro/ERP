import type {
  LiquidacionPeriodo,
  LiquidacionesPeriodoEstadoUi,
} from '../models/liquidacion-oficial.model';

export interface LiquidacionesSnapshotPrevalidacion {
  idCalculoPeriodo?: number | null;
  totalTrabajadores: number;
  aprobadoOperativamente: boolean;
  cerradoOperativamente: boolean;
}

export function determinarEstadoLiquidaciones(params: {
  consultando?: boolean;
  generando?: boolean;
  error?: boolean;
  snapshot: LiquidacionesSnapshotPrevalidacion | null;
  liquidacion: LiquidacionPeriodo | null;
  advertencias?: readonly string[];
}): LiquidacionesPeriodoEstadoUi {
  if (params.error) return 'error';
  if (params.generando) return 'generando';
  if (params.liquidacion) {
    return (params.advertencias?.length ?? 0) > 0 ? 'generadas_con_advertencias' : 'generadas';
  }
  return puedeGenerarLiquidaciones(params.snapshot, params.liquidacion)
    ? 'lista_para_generar'
    : 'no_disponible';
}

export function puedeGenerarLiquidaciones(
  snapshot: LiquidacionesSnapshotPrevalidacion | null,
  liquidacion: LiquidacionPeriodo | null,
): boolean {
  return !obtenerMotivoNoPuedeGenerar(snapshot, liquidacion);
}

export function obtenerMotivoNoPuedeGenerar(
  snapshot: LiquidacionesSnapshotPrevalidacion | null,
  liquidacion: LiquidacionPeriodo | null,
): string | null {
  if (liquidacion) return 'Ya existen liquidaciones oficiales generadas para este periodo.';
  if (!snapshot?.idCalculoPeriodo) return 'No se pudo consultar el estado de la nomina cerrada.';
  if (!snapshot.aprobadoOperativamente || !snapshot.cerradoOperativamente) {
    return 'Primero debes cerrar operativamente la nomina del periodo.';
  }
  if (snapshot.totalTrabajadores <= 0) return 'No hay trabajadores calculados para generar liquidaciones.';
  return null;
}

export function clasificarAdvertenciasLiquidacion(params: {
  totalAdvertenciasSnapshot?: number;
  trabajadoresSinConceptos?: number;
  conceptosSinCodigoLre?: number;
}): string[] {
  const advertencias: string[] = [];
  if ((params.totalAdvertenciasSnapshot ?? 0) > 0) {
    advertencias.push('El snapshot cerrado tenia advertencias operativas visibles al aprobar.');
  }
  if ((params.trabajadoresSinConceptos ?? 0) > 0) {
    advertencias.push('Hay trabajadores sin conceptos materializados en la liquidacion.');
  }
  if ((params.conceptosSinCodigoLre ?? 0) > 0) {
    advertencias.push('Existen conceptos sin codigo LRE; LRE operativo queda para una fase posterior.');
  }
  return advertencias;
}
