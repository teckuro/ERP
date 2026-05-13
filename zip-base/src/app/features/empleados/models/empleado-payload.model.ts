import { EmpleadoEstado } from './empleado-listado.model';
import { CondicionTrabajadorPayload } from './empleado-perfil-laboral.model';
import {
  EmpleadoSexo,
  TipoContrato,
  TipoEstadoCivil,
  TipoGratificacion,
  TipoRegimenPrevisional,
} from './empleado.model';

export interface CrearEmpleadoPayload {
  origenCreacion: 'basico' | 'avanzado';
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: EmpleadoSexo;
  estadoCivil: TipoEstadoCivil;
  pasaporte: string | null;
  cargas: number;
  email: string;
  telefono: string;
  direccion: string;
  numeroDireccion: string | null;
  departamentoDireccion: string | null;
  observacionesDireccion: string | null;
  idComuna: number | null;
  idPais: number;
  idSucursal: number | null;
  idDepartamentoEmpresa: number | null;
  idCentroCosto: number | null;
  cargo: string;
  fechaContrato: string;
  tipoContrato: TipoContrato;
  idTipoTrabajador: number;
  idTipoJornada: number;
  seguroCesantia: boolean;
  fechaIngreso: string;
  fechaTermino: string | null;
  sueldoBase: number;
  idMoneda: number | null;
  sueldoVariable: boolean;
  horasSemanales: number;
  diasSemanales: number;
  distribucionJornada: string | null;
  tiempoColacionMinutos: number | null;
  tipoGratificacion: TipoGratificacion;
  gratificacionProporcional: boolean;
  semanaCorridaActiva: boolean;
  semanaCorridaDiasLaborables: number[];
  zonaExtremaActiva: boolean;
  zonaExtremaTerritorio: string | null;
  zonaExtremaPorcentaje: number | null;
  estado: EmpleadoEstado;
  idTramoCarga: number | null;
  condicionesTrabajador: CondicionTrabajadorPayload[];
  tipoPrevision: TipoRegimenPrevisional;
  idRegimenPrevisional: number | null;
  idAfp: number | null;
  idMonedaCuenta2: number | null;
  valorCuenta2: number | null;
  idEntidadPrevisionalIps: number | null;
  idExCajaPrevisional: number | null;
  idRegimenExCaja: number | null;
  nombreExCaja: string | null;
  regimenExCaja: string | null;
  tasaExCaja: number | null;
  idSalud: number | null;
  idMonedaPlan: number | null;
  valorPlan: number | null;
  adicionalAugeGes: number | null;
  tieneApv: boolean;
  idInstitucionApv: number | null;
  idMonedaApv: number | null;
  montoApv: number | null;
  idFormaPagoApv: number | null;
  depositoConvenidoApvi: number | null;
  idBanco: number;
  idTipoCuentaBancaria: number;
  numeroCuenta: string;
}
