/** Metadatos del stepper del Generador V2 (labels de pasos). No es fallback de datos de negocio. */

import type { PayrollStep } from '../models/nomina-mensual-v2.models';

export const payrollSteps: PayrollStep[] = [
  { id: 'parameters', number: 1, title: 'Parámetros', subtitle: 'Configurar' },
  { id: 'dotacion', number: 2, title: 'Dotación', subtitle: 'Revisar' },
  { id: 'movements', number: 3, title: 'Movimientos', subtitle: 'Registrar' },
  { id: 'calculation', number: 4, title: 'Cálculo', subtitle: 'Procesar' },
  { id: 'validation', number: 5, title: 'Validación', subtitle: 'Verificar' },
  { id: 'closure', number: 6, title: 'Cierre', subtitle: 'Autorizar' },
];
