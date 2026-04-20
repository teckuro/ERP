import { TipoGratificacion } from '../models/empleado-form.model';
import { EmpleadoSelectOption } from './sexo.options';

export const TIPO_GRATIFICACION_OPTIONS: readonly EmpleadoSelectOption<TipoGratificacion>[] = [
  { value: 'LEGAL_ART_50', label: 'Legal art. 50' },
  { value: 'LEGAL_ART_47', label: 'Legal art. 47' },
  { value: 'VOLUNTARIA', label: 'Voluntaria' },
];
