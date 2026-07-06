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

export type VarianteEtiquetaPasoHonorarios = 'corta' | 'larga' | 'descripcion' | 'etapa';

const ETIQUETAS_CORTAS_PASO_HONORARIOS: Partial<Record<number, string>> = {
  2: 'Servicio',
  3: 'Monto',
  7: 'Pago',
  8: 'Condiciones',
  9: 'Resumen',
};

const ETIQUETAS_LARGAS_PASO_HONORARIOS: Partial<Record<number, string>> = {
  2: 'Servicio',
  3: 'Monto',
  4: 'Asignaciones laborales',
  5: 'Previsión y salud',
  6: 'APVI',
  7: 'Pago',
  8: 'Condiciones',
  9: 'Resumen',
};

const DESCRIPCIONES_PASO_HONORARIOS: Partial<Record<number, string>> = {
  2: 'Completa servicio, fecha y ubicación administrativa.',
  3: 'Informa monto y moneda.',
  4: 'No requerido para honorarios.',
  5: 'No requerido para honorarios.',
  6: 'No requerido para honorarios.',
  7: 'Completa datos de pago.',
  8: 'No requerido para honorarios.',
  9: 'Revisa y finaliza el registro.',
};

const ETIQUETAS_ETAPA_PASO_HONORARIOS: Partial<Record<number, string>> = {
  2: 'Registro del servicio',
  3: 'Monto',
  7: 'Pago',
  9: 'Resumen',
};

/** Etiquetas de paso del asistente en modalidad honorarios (evita Records duplicados en el componente). */
export function etiquetaPasoHonorarios(
  indicePaso: number,
  variante: VarianteEtiquetaPasoHonorarios,
  opciones: {
    indicePasoPerfilLaboral: number;
    etiquetasCortasAsistente: readonly string[];
    etiquetasLargasAsistente: readonly string[];
    descripcionesPasosAsistente: readonly string[];
  },
): string {
  const pasosNoAplica = new Set([
    4,
    5,
    6,
    opciones.indicePasoPerfilLaboral,
  ]);

  if (variante === 'corta' && pasosNoAplica.has(indicePaso)) {
    return opciones.etiquetasCortasAsistente[indicePaso] ?? '';
  }

  switch (variante) {
    case 'corta':
      return (
        ETIQUETAS_CORTAS_PASO_HONORARIOS[indicePaso] ??
        opciones.etiquetasCortasAsistente[indicePaso] ??
        ''
      );
    case 'larga':
      return (
        ETIQUETAS_LARGAS_PASO_HONORARIOS[indicePaso] ??
        opciones.etiquetasLargasAsistente[indicePaso] ??
        ''
      );
    case 'descripcion':
      return (
        DESCRIPCIONES_PASO_HONORARIOS[indicePaso] ??
        opciones.descripcionesPasosAsistente[indicePaso] ??
        ''
      );
    case 'etapa':
      return ETIQUETAS_ETAPA_PASO_HONORARIOS[indicePaso] ?? 'Registro administrativo';
  }
}
