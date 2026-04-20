import { FormControl, FormGroup } from '@angular/forms';

import { Enums } from '../../../core/models/database.types';
import { EmpleadoEstado } from './empleado-listado.model';

export type EmpleadoSexo = 'M' | 'F' | 'O';
export type TipoContrato = Enums<'tipo_contrato_enum'>;
export type TipoGratificacion = Enums<'tipo_gratificacion_enum'>;
export type TipoEstadoCivil = Enums<'tipo_estado_civil_enum' >;
export type TipoRegimenPrevisional = 'AFP' | 'IPS' | 'NINGUNA';
export type RelacionLaboral = 'CONTRATO' | 'HONORARIOS';



export interface EmpleadoCatalogOption {
  value: number;
  label: string;
}

export interface EmpleadoSucursalOption extends EmpleadoCatalogOption {}

export interface EmpleadoDepartamentoOption extends EmpleadoCatalogOption {
  idSucursal: number | null;
}

export interface TramoCargaCatalogOption {
  value: number;
  tramo: string | null;
  valor: number | null;
  desde: number | null;
  hasta: number | null;
  periodo: string;
}

export interface EmpleadoFormCatalogos {
  comunas: EmpleadoCatalogOption[];
  paises: EmpleadoCatalogOption[];
  centrosCosto: EmpleadoCatalogOption[];
  sucursales: EmpleadoSucursalOption[];
  departamentos: EmpleadoDepartamentoOption[];
  tiposTrabajador: EmpleadoCatalogOption[];
  tiposJornada: EmpleadoCatalogOption[];
  regimenesPrevisionales: EmpleadoCatalogOption[];
  afps: EmpleadoCatalogOption[];
  entidadesSalud: EmpleadoCatalogOption[];
  monedas: EmpleadoCatalogOption[];
  tramosCarga: TramoCargaCatalogOption[];
  institucionesApv: EmpleadoCatalogOption[];
  formasPagoApv: EmpleadoCatalogOption[];
  bancos: EmpleadoCatalogOption[];
  tiposCuentaBancaria: EmpleadoCatalogOption[];
}

export const EMPTY_EMPLEADO_FORM_CATALOGOS: EmpleadoFormCatalogos = {
  comunas: [],
  paises: [],
  centrosCosto: [],
  sucursales: [],
  departamentos: [],
  tiposTrabajador: [],
  tiposJornada: [],
  regimenesPrevisionales: [],
  afps: [],
  entidadesSalud: [],
  monedas: [],
  tramosCarga: [],
  institucionesApv: [],
  formasPagoApv: [],
  bancos: [],
  tiposCuentaBancaria: [],
};

export interface DatosPersonalesValue {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: EmpleadoSexo;
  pasaporte: string;
  idPais: number | null;
  estadoCivil : TipoEstadoCivil;
}

export interface ContactoValue {
  email: string;
  telefono: string;
  direccion: string;
  numeroDireccion: string;
  departamentoDireccion: string;
  observacionesDireccion: string;
  idComuna: number | null;
}

export interface ContratoValue {
  relacionLaboral: RelacionLaboral;
  idSucursal: number | null;
  idDepartamentoEmpresa: number | null;
  idCentroCosto: number | null;
  cargo: string;
  fechaContrato: string;
  tipoContrato: TipoContrato;
  idTipoTrabajador: number | null;
  idTipoJornada: number | null;
  seguroCesantia: boolean;
  fechaIngreso: string;
  fechaTermino: string;
  sueldoBase: number | null;
  idMoneda: number | null;
  sueldoVariable: boolean;
  horasSemanales: number | null;
  diasSemanales: number | null;
  distribucionJornada: string;
  tiempoColacionMinutos: number | null;
  tipoGratificacion: TipoGratificacion;
  gratificacionProporcional: boolean;
  semanaCorridaActiva: boolean;
  semanaCorridaDiasLaborables: number[];
  zonaExtremaActiva: boolean;
  zonaExtremaTerritorio: string;
  zonaExtremaPorcentaje: number | null;
  estado: EmpleadoEstado;
  cargas: number | null;
  idTramoCarga: number | null;
}

export interface PrevisionSaludValue {
  tipoRegimenPrevisional: TipoRegimenPrevisional | null;
  idAfp: number | null;
  idMonedaCuenta2: number | null;
  valorCuenta2: number | null;
  nombreExCaja: string;
  regimenExCaja: string;
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
}

export interface BancarioValue {
  idBanco: number | null;
  idTipoCuentaBancaria: number | null;
  numeroCuenta: string;
}


export interface EmpleadoFormValue {
  datosPersonales: DatosPersonalesValue;
  contacto: ContactoValue;
  contrato: ContratoValue;
  previsionSalud: PrevisionSaludValue;
  bancario: BancarioValue;
}

export interface EmpleadoCreacion {
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
  idComuna: number;
  idPais : number;
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
  tipoPrevision: TipoRegimenPrevisional;
  idRegimenPrevisional: number | null;
  idAfp: number | null;
  idMonedaCuenta2: number | null;
  valorCuenta2: number | null;
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

export type DatosPersonalesFormGroup = FormGroup<{
  rut: FormControl<string>;
  nombres: FormControl<string>;
  apellidoPaterno: FormControl<string>;
  apellidoMaterno: FormControl<string>;
  fechaNacimiento: FormControl<string>;
  sexo: FormControl<EmpleadoSexo>;
  pasaporte: FormControl<string>;
  idPais: FormControl<number | null>;
  estadoCivil: FormControl<TipoEstadoCivil>;
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
  tipoContrato: FormControl<TipoContrato>;
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
  tipoGratificacion: FormControl<TipoGratificacion>;
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

export type PrevisionSaludFormGroup = FormGroup<{
  tipoRegimenPrevisional: FormControl<TipoRegimenPrevisional | null>;
  idAfp: FormControl<number | null>;
  idMonedaCuenta2: FormControl<number | null>;
  valorCuenta2: FormControl<number | null>;
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
  previsionSalud: PrevisionSaludFormGroup;
  bancario: BancarioFormGroup;
}>;
