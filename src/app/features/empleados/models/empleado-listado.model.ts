export type EmpleadoEstado =
  | 'borrador'
  | 'en_proceso'
  | 'activo'
  | 'suspendido'
  | 'inactivo'
  | 'desvinculado'
  | 'bloqueado';

export type EmpleadoEstadoFicha = 'BORRADOR' | 'INCOMPLETO' | 'VALIDO';
export type EmpleadoHistorialOperacion = 'INSERT' | 'UPDATE' | 'DELETE' | string;

export interface EmpleadoListado {
  id: number;
  idContrato: number | null;
  rut: string;
  nombre: string;
  cargo: string;
  departamento: string;
  fechaIngreso: string;
  sueldoBase: number;
  estado: EmpleadoEstado;
  estadoFicha: EmpleadoEstadoFicha;
  aptoParaRemuneraciones: boolean;
}

export interface EmpleadoFichaDetalle extends EmpleadoListado {
  historial: EmpleadoHistorialCambio[];
  formValue: {
    datosPersonales: Record<string, unknown>;
    contacto: Record<string, unknown>;
    contrato: Record<string, unknown>;
    previsionSalud: Record<string, unknown>;
    bancario: Record<string, unknown>;
  };
}

export interface EmpleadoHistorialCambio {
  id: number;
  idPersona: number;
  idContrato: number | null;
  seccion: string;
  evento: string;
  tablaOrigen: string;
  idRegistro: number | null;
  operacion: EmpleadoHistorialOperacion;
  camposModificados: string[];
  usuario: string;
  fecha: string;
  detalle: string;
}
