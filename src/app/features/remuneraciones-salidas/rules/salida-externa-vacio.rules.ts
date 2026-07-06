export type SalidaExternaModulo = 'previred' | 'lre';

export interface SalidaExternaEmptyVm {
  chipLabel: string;
  kicker: string;
  title: string;
  description: string;
  primaryLabel: string;
  icon: 'upload' | 'file-spreadsheet';
}

export function construirEmptySalidaExterna(modulo: SalidaExternaModulo): SalidaExternaEmptyVm {
  if (modulo === 'previred') {
    return {
      chipLabel: 'Sin exportables',
      kicker: 'Acción recomendada',
      title: 'Sin nóminas exportables para Previred',
      description:
        'Genere liquidaciones oficiales desde una nómina cerrada o liquidada. Aquí podrá revisar advertencias y descargar el borrador.',
      primaryLabel: 'Ir a liquidaciones oficiales',
      icon: 'upload',
    };
  }

  return {
    chipLabel: 'Sin exportables',
    kicker: 'Acción recomendada',
    title: 'Sin nóminas exportables para el libro',
    description:
      'Genere liquidaciones oficiales desde una nómina cerrada o liquidada. Aquí podrá preparar el borrador CSV del libro de remuneraciones.',
    primaryLabel: 'Ir a liquidaciones oficiales',
    icon: 'file-spreadsheet',
  };
}
