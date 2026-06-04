import type { PayrollStepId } from '../models/nomina-mensual-v2.models';
import type { TipoEventoTrazabilidadNomina } from '../models/nomina-trazabilidad.models';

const ORDEN_PASOS: PayrollStepId[] = [
  'parameters',
  'dotacion',
  'movements',
  'calculation',
  'validation',
  'closure',
];

export function pasosPosterioresA(paso: PayrollStepId): PayrollStepId[] {
  const idx = ORDEN_PASOS.indexOf(paso);
  if (idx < 0) return [];
  return ORDEN_PASOS.slice(idx + 1);
}

export function pasosInvalidadosPorEvento(
  pasoOrigen: PayrollStepId,
  tipo: TipoEventoTrazabilidadNomina,
): PayrollStepId[] {
  if (tipo !== 'SNAPSHOT_INVALIDADO' && tipo !== 'RECALCULO_SOLICITADO') {
    if (pasoOrigen === 'parameters') return pasosPosterioresA('parameters');
    if (pasoOrigen === 'dotacion') return pasosPosterioresA('dotacion');
  }
  if (tipo === 'SNAPSHOT_INVALIDADO' || tipo === 'RECALCULO_SOLICITADO') {
    return pasosPosterioresA(pasoOrigen);
  }
  return [];
}

export function debeInvalidarPorRevalidacionParametros(
  hayAlcanceConfirmado: boolean,
  hayEmpleadosValidados: boolean,
): boolean {
  return hayAlcanceConfirmado || hayEmpleadosValidados;
}

export function debeInvalidarPorCambioAlcance(hayEmpleadosValidados: boolean): boolean {
  return hayEmpleadosValidados;
}
