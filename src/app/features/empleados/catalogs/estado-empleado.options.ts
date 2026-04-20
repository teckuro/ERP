import { EmpleadoEstado } from '../models/empleado-listado.model';
import { EmpleadoSelectOption } from './sexo.options';

export const ESTADO_EMPLEADO_OPTIONS: readonly EmpleadoSelectOption<EmpleadoEstado>[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'desvinculado', label: 'Desvinculado' },
  { value: 'bloqueado', label: 'Bloqueado' },
];
