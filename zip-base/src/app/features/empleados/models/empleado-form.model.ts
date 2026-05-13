import { FormControl, FormGroup } from '@angular/forms';

import { EmpleadoEstado } from './empleado-listado.model';
import {
  EmpleadoSexo,
  RelacionLaboral,
  TipoContrato,
  TipoEstadoCivil,
  TipoGratificacion,
  TipoRegimenPrevisional,
} from './empleado.model';

export type DatosPersonalesFormGroup = FormGroup<{
  rut: FormControl<string>;
  nombres: FormControl<string>;
  apellidoPaterno: FormControl<string>;
  apellidoMaterno: FormControl<string>;
  fechaNacimiento: FormControl<string>;
  sexo: FormControl<EmpleadoSexo | null>;
  pasaporte: FormControl<string>;
  idPais: FormControl<number | null>;
  estadoCivil: FormControl<TipoEstadoCivil | null>;
}>;

export type ContactoFormGroup = FormGroup<{
  email: FormControl<string>;
  telefono: FormControl<string>;
  direccion: FormControl<string>;
  numeroDireccion: FormControl<string>;
  departamentoDireccion: FormControl<string>;
  observacionesDireccion: FormControl<string>;
  idComuna: FormControl<number | null>;
}>;

export type ContratoFormGroup = FormGroup<{
  relacionLaboral: FormControl<RelacionLaboral>;
  idSucursal: FormControl<number | null>;
  idDepartamentoEmpresa: FormControl<number | null>;
  idCentroCosto: FormControl<number | null>;
  cargo: FormControl<string>;
  fechaContrato: FormControl<string>;
  tipoContrato: FormControl<TipoContrato | null>;
  idTipoTrabajador: FormControl<number | null>;
  idTipoJornada: FormControl<number | null>;
  seguroCesantia: FormControl<boolean>;
  fechaIngreso: FormControl<string>;
  fechaTermino: FormControl<string>;
  sueldoBase: FormControl<number | null>;
  idMoneda: FormControl<number | null>;
  sueldoVariable: FormControl<boolean>;
  horasSemanales: FormControl<number | null>;
  diasSemanales: FormControl<number | null>;
  distribucionJornada: FormControl<string>;
  tiempoColacionMinutos: FormControl<number | null>;
  tipoGratificacion: FormControl<TipoGratificacion | null>;
  gratificacionProporcional: FormControl<boolean>;
  semanaCorridaActiva: FormControl<boolean>;
  semanaCorridaDiasLaborables: FormControl<number[]>;
  zonaExtremaActiva: FormControl<boolean>;
  zonaExtremaTerritorio: FormControl<string>;
  zonaExtremaPorcentaje: FormControl<number | null>;
  estado: FormControl<EmpleadoEstado>;
  cargas: FormControl<number | null>;
  idTramoCarga: FormControl<number | null>;
}>;


export type PerfilLaboralFormGroup = FormGroup<{
  pensionado: FormControl<boolean>;
  pensionadoInvalidezParcial: FormControl<boolean>;
  pensionadoInvalidezTotal: FormControl<boolean>;
  exentoCotizacionPension: FormControl<boolean>;
  trabajadorAdolescenteProtegido: FormControl<boolean>;
  autorizacionMenorRegistrada: FormControl<boolean>;
  tecnicoExtranjeroExento: FormControl<boolean>;
  discapacidad: FormControl<boolean>;
  vigenciaInicio: FormControl<string>;
  vigenciaFin: FormControl<string>;
  respaldoRegistrado: FormControl<boolean>;
  observacion: FormControl<string>;
}>;

export type PrevisionSaludFormGroup = FormGroup<{
  tipoRegimenPrevisional: FormControl<TipoRegimenPrevisional | null>;
  idAfp: FormControl<number | null>;
  idMonedaCuenta2: FormControl<number | null>;
  valorCuenta2: FormControl<number | null>;
  idEntidadPrevisionalIps: FormControl<number | null>;
  idExCajaPrevisional: FormControl<number | null>;
  idRegimenExCaja: FormControl<number | null>;
  nombreExCaja: FormControl<string>;
  regimenExCaja: FormControl<string>;
  tasaExCaja: FormControl<number | null>;
  idSalud: FormControl<number | null>;
  idMonedaPlan: FormControl<number | null>;
  valorPlan: FormControl<number | null>;
  adicionalAugeGes: FormControl<number | null>;
  tieneApv: FormControl<boolean>;
  idInstitucionApv: FormControl<number | null>;
  idMonedaApv: FormControl<number | null>;
  montoApv: FormControl<number | null>;
  idFormaPagoApv: FormControl<number | null>;
  depositoConvenidoApvi: FormControl<number | null>;
}>;

export type BancarioFormGroup = FormGroup<{
  idBanco: FormControl<number | null>;
  idTipoCuentaBancaria: FormControl<number | null>;
  numeroCuenta: FormControl<string>;
}>;

export type EmpleadoFormGroup = FormGroup<{
  datosPersonales: DatosPersonalesFormGroup;
  contacto: ContactoFormGroup;
  contrato: ContratoFormGroup;
  perfilLaboral: PerfilLaboralFormGroup;
  previsionSalud: PrevisionSaludFormGroup;
  bancario: BancarioFormGroup;
}>;
