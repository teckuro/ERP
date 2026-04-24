import {
  EmpleadoSexo,
  TipoContrato,
  TipoEstadoCivil,
  TipoGratificacion,
  TipoRegimenPrevisional,
} from './empleado.model';

export interface EmpleadoCatalogOption {
  value: number;
  label: string;
}

export interface EmpleadoStringCatalogOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface EmpleadoSucursalOption extends EmpleadoCatalogOption {}

export interface EmpleadoDepartamentoOption extends EmpleadoCatalogOption {
  idSucursal: number | null;
}

export interface RegimenExCajaCatalogOption extends EmpleadoCatalogOption {
  idExCajaPrevisional: number;
  tasaCotizacionReferencia: number | null;
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
  sexos: EmpleadoStringCatalogOption<EmpleadoSexo>[];
  estadosCivil: EmpleadoStringCatalogOption<TipoEstadoCivil>[];
  comunas: EmpleadoCatalogOption[];
  paises: EmpleadoCatalogOption[];
  centrosCosto: EmpleadoCatalogOption[];
  sucursales: EmpleadoSucursalOption[];
  departamentos: EmpleadoDepartamentoOption[];
  tiposTrabajador: EmpleadoCatalogOption[];
  tiposJornada: EmpleadoCatalogOption[];
  tiposContrato: EmpleadoStringCatalogOption<TipoContrato>[];
  tiposGratificacion: EmpleadoStringCatalogOption<TipoGratificacion>[];
  tiposRegimenPrevisional: EmpleadoStringCatalogOption<TipoRegimenPrevisional>[];
  regimenesPrevisionales: EmpleadoCatalogOption[];
  entidadesPrevisionalesIps: EmpleadoCatalogOption[];
  exCajasPrevisionales: EmpleadoCatalogOption[];
  regimenesExCaja: RegimenExCajaCatalogOption[];
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
  sexos: [],
  estadosCivil: [],
  comunas: [],
  paises: [],
  centrosCosto: [],
  sucursales: [],
  departamentos: [],
  tiposTrabajador: [],
  tiposJornada: [],
  tiposContrato: [],
  tiposGratificacion: [],
  tiposRegimenPrevisional: [],
  regimenesPrevisionales: [],
  entidadesPrevisionalesIps: [],
  exCajasPrevisionales: [],
  regimenesExCaja: [],
  afps: [],
  entidadesSalud: [],
  monedas: [],
  tramosCarga: [],
  institucionesApv: [],
  formasPagoApv: [],
  bancos: [],
  tiposCuentaBancaria: [],
};
