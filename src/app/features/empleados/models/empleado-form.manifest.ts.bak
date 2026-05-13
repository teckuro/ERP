/**
 * Inventario del flujo de alta (orden de pestañas, etiquetas UX y bloques HTML por paso).
 * Mantener alineado con `@if (isBlockVisible(..))` en cada seccion.
 */

export const EMPLEADO_FORM_TAB_ORDER = [
  'datosPersonales',
  'contrato',
  'previsionSalud',
  'bancario',
] as const;

export type EmpleadoFormTabId = (typeof EMPLEADO_FORM_TAB_ORDER)[number];

/** Pasos del asistente en creacion avanzada (9 etapas). */
export const EMPLEADO_ADVANCED_WIZARD_LABELS = [
  'Datos personales',
  'Domicilio particular',
  'Contrato y organización',
  'Jornada y remuneración',
  'Asignaciones y condiciones especiales',
  'Previsión y salud',
  'APVI',
  'Bancario',
  'Resumen final',
] as const;

export const EMPLEADO_ADVANCED_WIZARD_STEP_COUNT = EMPLEADO_ADVANCED_WIZARD_LABELS.length;

/** Bloques visibles por pestaña (ids usados en templates de sección). */
export const EMPLEADO_FORM_STEP_BLOCK_IDS: Record<EmpleadoFormTabId, readonly string[]> = {
  datosPersonales: ['identificacion', 'nombre', 'base', 'contacto'],
  contrato: [
    'relacion',
    'contratoBase',
    'remuneracion',
    'cargas',
    'zonaExtrema',
    'semanaCorrida',
    'centroCosto',
  ],
  previsionSalud: ['regimen', 'afp', 'ips', 'salud', 'apvi'],
  bancario: ['cuenta'],
} as const;

export type EmpleadoFormBlockId =
  (typeof EMPLEADO_FORM_STEP_BLOCK_IDS)[EmpleadoFormTabId][number];
