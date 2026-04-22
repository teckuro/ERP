import { TipoRegimenPrevisional } from '../models/empleado.model';

export interface TipoRegimenOption {
  value: TipoRegimenPrevisional;
  label: string;
}

export const TIPO_REGIMEN_OPTIONS: readonly TipoRegimenOption[] = [
  {
    value: 'AFP',
    label: 'AFP',
  },
  {
    value: 'IPS',
    label: 'IPS (Ex INP)',
  },
  {
    value: 'NINGUNA',
    label: 'Sin Prevision',
  },
];
