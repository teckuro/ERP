import { RelacionLaboral } from '../models/empleado.model';
import { EmpleadoSelectOption } from './sexo.options';

export const RELACION_LABORAL_OPTIONS: readonly EmpleadoSelectOption<RelacionLaboral>[] = [
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'HONORARIOS', label: 'Boleta de honorarios' },
];
