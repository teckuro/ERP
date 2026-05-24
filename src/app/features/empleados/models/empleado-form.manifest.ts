/**
 * Inventario del flujo de alta (orden de pestañas, etiquetas UX y bloques HTML por paso).
 * Mantener alineado con `@if (esBloqueVisible(..))` en cada seccion.
 */

export const ordenPestanasFormularioEmpleado = [
  'datosPersonales',
  'contrato',
  'previsionSalud',
  'bancario',
] as const;

export type EmpleadoFormTabId = (typeof ordenPestanasFormularioEmpleado)[number];

/** Pasos del asistente en creacion avanzada (10 etapas). */
export const etiquetasAsistenteAvanzadoEmpleado = [
  'Datos personales',
  'Domicilio particular',
  'Contrato y organización',
  'Jornada y remuneración',
  'Asignaciones laborales',
  'Previsión y salud',
  'APVI',
  'Bancario',
  'Condiciones especiales',
  'Resumen final',
] as const;

export const cantidadPasosAsistenteAvanzadoEmpleado = etiquetasAsistenteAvanzadoEmpleado.length;

/** Bloques visibles por pestaña (ids usados en templates de sección). */
export const idsBloquesPasoFormularioEmpleado: Record<EmpleadoFormTabId, readonly string[]> = {
  datosPersonales: ['identificacion', 'nombre', 'base', 'contacto'],
  contrato: [
    'relacion',
    'contratoBase',
    'remuneracion',
    'cargas',
    'zonaExtrema',
    'semanaCorrida',
    'perfilLaboral',
    'centroCosto',
  ],
  previsionSalud: ['regimen', 'afp', 'ips', 'salud', 'apvi'],
  bancario: ['cuenta'],
} as const;

export type EmpleadoFormBlockId =
  (typeof idsBloquesPasoFormularioEmpleado)[EmpleadoFormTabId][number];
