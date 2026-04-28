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

export const EMPLEADO_FORM_CONCEPTUAL_STEP_LABELS = [
  'Identificacion y contacto',
  'Informacion laboral',
  'Prevision y salud',
  'Pago y cierre',
] as const;

/** Bloques visibles por pestaña (ids usados en templates de sección). */
export const EMPLEADO_FORM_STEP_BLOCK_IDS: Record<EmpleadoFormTabId, readonly string[]> = {
  datosPersonales: ['identificacion', 'nombre', 'base', 'ubicacion'],
  contrato: [
    'relacion',
    'contrato',
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
