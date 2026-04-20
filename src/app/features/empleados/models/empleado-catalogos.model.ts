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
