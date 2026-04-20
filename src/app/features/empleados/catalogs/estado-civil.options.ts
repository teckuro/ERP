import { EmpleadoSelectOption } from './sexo.options';
import { TipoEstadoCivil } from '../models/empleado.model';

export const ESTADO_CIVIL_OPTIONS: readonly EmpleadoSelectOption<TipoEstadoCivil>[] = [
  { value: 'SOLTERO', label: 'Soltero/a' },
  { value: 'CASADO', label: 'Casado/a' },
  { value: 'CONVIVIENTE_CIVIL', label: 'Conviviente civil' },
  { value: 'SEPARADO', label: 'Separado/a' },
  { value: 'DIVORCIADO', label: 'Divorciado/a' },
  { value: 'VIUDO', label: 'Viudo/a' },
];
