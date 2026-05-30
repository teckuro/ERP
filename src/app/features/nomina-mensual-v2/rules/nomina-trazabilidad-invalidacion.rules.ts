import type { PayrollStepId } from '../models/nomina-mensual-v2.models';
import type { TipoEventoTrazabilidadNomina } from '../models/nomina-trazabilidad.models';

const ORDEN_PASOS: PayrollStepId[] = [
  'parameters',
  'scope',
  'employees',
  'movements',
  'calculation',
  'validation',
  'approval',
  'payslips',
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
    if (pasoOrigen === 'scope') return pasosPosterioresA('scope').filter((p) => p !== 'movements' || pasoOrigen === 'scope');
    if (pasoOrigen === 'employees') return pasosPosterioresA('employees');
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
