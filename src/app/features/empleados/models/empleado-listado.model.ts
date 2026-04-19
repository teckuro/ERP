export type EmpleadoEstado =
  | 'borrador'
  | 'en_proceso'
  | 'activo'
  | 'suspendido'
  | 'inactivo'
  | 'desvinculado'
  | 'bloqueado';

export interface EmpleadoListado {
  id: number;
  rut: string;
  nombre: string;
  cargo: string;
  departamento: string;
  fechaIngreso: string;
  sueldoBase: number;
  estado: EmpleadoEstado;
}
