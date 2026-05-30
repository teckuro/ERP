import type { EmpleadoEstado, EmpleadoEstadoFicha } from '../../empleados/models/empleado-listado.model';

export interface TrabajadorNominaPersonal {
  idPersona: number;
  idContrato: number | null;
  rut: string;
  nombreCompleto: string;
  cargo: string;
  centroCosto: string | null;
  jornada: string | null;
  horasSemanales: number | null;
  fechaIngreso: string | null;
  fechaRetiro: string | null;
  estado: EmpleadoEstado;
  estadoFicha: EmpleadoEstadoFicha;
  aptoParaRemuneraciones: boolean;
  pasoAltaAvanzada: number | null;
  estadoContrato: string | null;
  afpNombre: string | null;
  saludNombre: string | null;
  idAfp: number | null;
  idSalud: number | null;
  numeroCuentaBancaria: string | null;
  idBanco: number | null;
}
