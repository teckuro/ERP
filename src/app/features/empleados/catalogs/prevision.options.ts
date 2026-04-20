import { TipoRegimenPrevisional } from '../models/empleado-form.model';

export interface TipoRegimenOption {
  value: TipoRegimenPrevisional;
  label: string;
  description: string;
}

export const TIPO_REGIMEN_OPTIONS: readonly TipoRegimenOption[] = [
  {
    value: 'AFP',
    label: 'AFP',
    description: 'Muestra AFP, salud, Cuenta 2 y APVI.',
  },
  {
    value: 'IPS',
    label: 'IPS (Ex INP)',
    description: 'Muestra los datos de Ex-Caja y salud.',
  },
  {
    value: 'NINGUNA',
    label: 'Sin Prevision',
    description: 'Oculta salud y no registra previsiones asociadas.',
  },
];
