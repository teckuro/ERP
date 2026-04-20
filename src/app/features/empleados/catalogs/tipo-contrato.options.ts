import { EmpleadoSelectOption } from './sexo.options';
import { TipoContrato } from '../models/empleado-form.model';

export const TIPO_CONTRATO_OPTIONS: readonly EmpleadoSelectOption<TipoContrato>[] = [
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'PLAZO_FIJO', label: 'Plazo fijo' },
  { value: 'OBRA_SERVICIO', label: 'Obra o servicio' },
];
