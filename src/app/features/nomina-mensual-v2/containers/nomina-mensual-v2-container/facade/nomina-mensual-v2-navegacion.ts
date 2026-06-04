import { payrollSteps } from '../../../data/nomina-mensual-v2.mock';
import type { PayrollStepId, PayrollStepStatus } from '../../../models/nomina-mensual-v2.models';

/**
 * Orden de pasos del Generador definitivo (NOM-REBUILD-NOMINA-MENSUAL-01 / F3 fusion).
 * Reemplaza el set de 8 pasos por 6 pasos.
 */
export const ORDEN_PASOS_NOMINA: PayrollStepId[] = [
  'parameters',
  'dotacion',
  'movements',
  'calculation',
  'validation',
  'closure',
];

export const PASOS_NOMINA = payrollSteps;

/**
 * Pasos sin lógica productiva todavía (placeholder hasta F6 motor productivo).
 * En F3 fusion todos los pasos están funcionales operativamente; el conjunto
 * queda vacío. Se preserva la API por compatibilidad con stepper / overlays.
 */
export const PASOS_CONGELADOS_V11: ReadonlySet<PayrollStepId> = new Set();

export function esPasoCongelado(stepId: PayrollStepId): boolean {
  return PASOS_CONGELADOS_V11.has(stepId);
}

export function tooltipPasoCongelado(): string {
  return 'Disponible al conectar el motor productivo final.';
}

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
    case 'dotacion':
      return 'Dotación del período';
    case 'movements':
      return 'Movimientos del período';
    case 'calculation':
      return 'Cálculo de la nómina';
    case 'validation':
      return 'Validación previa al cierre';
    case 'closure':
      return 'Cierre y liquidaciones';
  }
}

export function obtenerSubtituloPaso(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Configuración normativa y operativa requerida antes de generar la dotación.';
    case 'dotacion':
      return 'Trabajadores incluidos en este período. Trabaja por excepción: incidencias, segmentos y datos faltantes.';
    case 'movements':
      return 'Recurrentes aplicados, movimientos manuales y omisiones del mes.';
    case 'calculation':
      return 'Procesa el cálculo y revisa el snapshot antes de validar.';
    case 'validation':
      return 'Resumen de incidencias y guardias antes de cerrar la nómina.';
    case 'closure':
      return 'Aprueba el cierre operativo y genera las liquidaciones del período.';
  }
}

export function obtenerEtiquetaAccionPrincipal(paso: PayrollStepId): string {
  switch (paso) {
    case 'parameters':
      return 'Guardar parámetros';
    case 'dotacion':
      return 'Confirmar dotación';
    case 'movements':
      return 'Aplicar movimientos';
    case 'calculation':
      return 'Procesar cálculo';
    case 'validation':
      return 'Aprobar para cierre';
    case 'closure':
      return 'Cerrar nómina';
  }
}

export function obtenerIconoPaso(stepId: PayrollStepId): string {
  switch (stepId) {
    case 'parameters':
      return 'settings-2';
    case 'dotacion':
      return 'users';
    case 'movements':
      return 'list-plus';
    case 'calculation':
      return 'calculator';
    case 'validation':
      return 'shield-check';
    case 'closure':
      return 'lock';
  }
}
