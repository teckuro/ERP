import { payrollSteps } from '../../../data/nomina-mensual-v2.mock';
import type { PayrollStepId, PayrollStepStatus } from '../../../models/nomina-mensual-v2.models';

export const ORDEN_PASOS_NOMINA: PayrollStepId[] = [
  'parameters',
  'scope',
  'employees',
  'movements',
  'calculation',
  'validation',
  'approval',
  'payslips',
];

export const PASOS_NOMINA = payrollSteps;

export type AyudaAvanceTono = 'bloqueo' | 'revision' | null;

export function obtenerEstadoPaso(stepId: PayrollStepId, pasoActual: PayrollStepId): PayrollStepStatus {
  const indiceActual = ORDEN_PASOS_NOMINA.indexOf(pasoActual);
  const indicePaso = ORDEN_PASOS_NOMINA.indexOf(stepId);
  if (indicePaso < indiceActual) return 'completed';
  if (indicePaso === indiceActual) return 'active';
  return 'pending';
}

export function esAvanceHaciaAdelante(pasoActual: PayrollStepId, destinoPaso: PayrollStepId): boolean {
  return ORDEN_PASOS_NOMINA.indexOf(destinoPaso) > ORDEN_PASOS_NOMINA.indexOf(pasoActual);
}

export function esRetrocesoAPaso(pasoActual: PayrollStepId, destinoPaso: PayrollStepId): boolean {
  return ORDEN_PASOS_NOMINA.indexOf(destinoPaso) < ORDEN_PASOS_NOMINA.indexOf(pasoActual);
}

export function obtenerTituloPaso(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Parámetros de nómina';
    case 'scope':
      return 'Alcance de generación';
    case 'employees':
      return 'Empleados incluidos en el alcance';
    case 'movements':
      return 'Novedades del período';
    case 'calculation':
      return 'Cálculo de prenómina';
    case 'validation':
      return 'Validación de prenómina';
    case 'approval':
      return 'Aprobación de nómina';
    case 'payslips':
      return 'Liquidaciones generadas';
  }
}

export function obtenerSubtituloPaso(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Mayo 2026 · Configuración normativa y operativa requerida para calcular remuneraciones.';
    case 'scope':
      return 'Mayo 2026 · Define qué trabajadores serán preparados antes de revisar empleados.';
    case 'employees':
      return 'Mayo 2026 · Revisa bloqueos, advertencias y datos críticos del alcance seleccionado.';
    case 'movements':
      return 'Registra los eventos del mes que afectan la remuneración de los trabajadores.';
    case 'calculation':
      return 'Revisa el cálculo preliminar y guarda el snapshot antes de validar.';
    case 'validation':
      return 'El sistema verifica consistencia, bloqueos, advertencias y trazabilidad antes de aprobar.';
    case 'approval':
      return 'La nómina validada puede ser autorizada y bloqueada para el período Mayo 2026.';
    case 'payslips':
      return 'La nómina fue aprobada y las liquidaciones están listas para distribución.';
  }
}

export function obtenerEtiquetaAccionPrincipal(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Preparar nómina';
    case 'scope':
      return 'Validar alcance';
    case 'employees':
      return 'Validar empleados';
    case 'movements':
      return 'Registrar novedades';
    case 'calculation':
      return 'Procesar cálculo';
    case 'validation':
      return 'Validar nómina';
    case 'approval':
      return 'Aprobar nómina';
    case 'payslips':
      return 'Generar liquidaciones';
  }
}

export function obtenerIconoPaso(stepId: PayrollStepId): string {
  switch (stepId) {
    case 'parameters':
      return 'settings-2';
    case 'scope':
      return 'git-branch';
    case 'employees':
      return 'users';
    case 'movements':
      return 'list-plus';
    case 'calculation':
      return 'calculator';
    case 'validation':
      return 'shield-check';
    case 'approval':
      return 'badge-check';
    case 'payslips':
      return 'file-check-2';
  }
}
