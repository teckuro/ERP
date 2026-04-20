import { EmpleadoSexo } from '../models/empleado-form.model';

export interface EmpleadoSelectOption<T> {
  value: T;
  label: string;
}

export const SEXO_OPTIONS: readonly EmpleadoSelectOption<EmpleadoSexo>[] = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'O', label: 'Otro' },
];
