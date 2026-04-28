export type ParametrosTabId =
  | 'valores'
  | 'remuneraciones'
  | 'ccafConfig'
  | 'ccafLista'
  | 'mutualesLey'
  | 'tramosCarga'
  | 'tramosRenta'
  | 'isapre'
  | 'afp'
  | 'reforma';

export interface ParametrosGeneralesFiltro {
  periodo?: string;
}

export interface ParametroGeneral {
  periodo: string;
  uf: number | null;
  utm: number | null;
  uta: number | null;
  sueldoMinimo: number | null;
  sueldoMinimo18a65: number | null;
  sueldoMinimoMenor18Mayor65: number | null;
  sueldoMinimoCasaParticular: number | null;
  ingresoMinimoNoRemuneracional: number | null;
  topeAfpUf: number | null;
  gratificacion: boolean;
  immGratificacion: number | null;
  topeAfp: number | null;
  topeIpsUf: number | null;
  topeIps: number | null;
  topeCesantiaUf: number | null;
  topeCesantia: number | null;
  topeApvMensualUf: number | null;
  topeApvMensual: number | null;
  topeApvAnualUf: number | null;
  topeApvAnual: number | null;
  topeDepositoConvenidoAnualUf: number | null;
  topeDepositoConvenidoAnual: number | null;
  topeAfpVoluntario: number | null;
  sis: number | null;
  sanna: number | null;
  seguroSocialExpectativaVida: number | null;
  aporteEmpleadorAfp: number | null;
  saludObligatoria: number | null;
  saludCcaf: number | null;
  saludFonasaConCcaf: number | null;
  descuentosBasePorDia: boolean;
  afcTrabajadorIndefinido: number | null;
  afcEmpleadorIndefinido: number | null;
  afcEmpleadorPlazo: number | null;
  afcEmpleadorIndefinidoOnceAnosMas: number | null;
  afcEmpleadorCasaParticular: number | null;
  trabajoPesadoEmpleador: number | null;
  trabajoPesadoTrabajador: number | null;
  trabajoMenosPesadoEmpleador: number | null;
  trabajoMenosPesadoTrabajador: number | null;
  fechaActualizacion: string | null;
}

export type ParametroGeneralUpsert = ParametroGeneral;

export interface AfpParametro {
  idAfp: number;
  codigo: string | null;
  nombre: string;
  tasaObligatoria: number | null;
  comision: number | null;
  sis: number | null;
  tasaEmpleador: number | null;
  vigente: boolean;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
}

export interface IsapreParametro {
  idSalud: number;
  codigo: string | null;
  nombre: string;
  tipo: string | null;
  porcentajeCotizacion: number | null;
  vigente: boolean;
  vigenciaInicio: string | null;
  vigenciaFin: string | null;
}

export interface TramoCargaParametro {
  idTramo: number;
  periodo: string;
  tramo: string | null;
  desde: number | null;
  hasta: number | null;
  valor: number | null;
}

export interface TramoImpuestoParametro {
  idTramo: number;
  periodo: string;
  desde: number | null;
  hasta: number | null;
  factor: number | null;
  rebaja: number | null;
}

export interface TablaImpuestoUnicoParametro {
  id: number;
  tramo: number;
  desde: number;
  hasta: number | null;
  factor: number;
  rebaja: number;
  vigenciaInicio: string;
  vigenciaFin: string | null;
}

export interface ParametroLegal {
  idParametro: number;
  nombre: string;
  valorDecimal: number | null;
  valorEntero: number | null;
  vigenciaInicio: string;
  vigenciaFin: string | null;
}

export interface AfcParametro {
  idAfcParametro: number;
  codigoTipoContrato: string;
  aplicaSeguro: boolean;
  aplicaTrabajador: boolean;
  tasaTrabajador: number;
  tasaEmpleador: number;
  vigenciaInicio: string;
  vigenciaFin: string | null;
  observacion: string | null;
}

export interface TrabajoPesadoParametro {
  idTrabajoPesadoParametro: number;
  codigo: string;
  nombre: string;
  tasaTrabajador: number;
  tasaEmpleador: number;
  tasaTotal: number;
  requiereDictamenCen: boolean;
  fuente: string | null;
  vigente: boolean;
  vigenciaInicio: string;
  vigenciaFin: string | null;
}

export interface ReformaPrevisionalParametro {
  idReformaPrevisionalParametro: number;
  vigenciaInicio: string;
  vigenciaFin: string | null;
  aporteEmpleadorTotal: number;
  cuentaCapitalizacionIndividual: number;
  fappSeguroSocial: number;
  fuente: string | null;
}

export interface Ley16744Parametro {
  idLey16744Parametro: number;
  codigo: string;
  cotizacionBasicaEmpleador: number;
  descripcionTasaAdicional: string | null;
  fuenteFinanciamiento: string | null;
  fuenteOrganismos: string | null;
  vigente: boolean;
  vigenciaInicio: string;
  vigenciaFin: string | null;
}

export interface OrganismoLey16744 {
  idOrganismoAdministradorLey16744: number;
  codigo: string;
  nombre: string;
  tipo: string;
  vigente: boolean;
}

export interface CcafEntidad {
  idCcafEntidad: number;
  codigo: string;
  nombre: string;
  vigente: boolean;
  fuente: string | null;
}

export interface ApvApvcInstitucion {
  idInstitucionApv: number;
  codigo: string | null;
  nombre: string;
  vigente: boolean;
}

export interface ApvApvcFormaPago {
  idFormaPagoApv: number;
  codigo: string | null;
  nombre: string;
  vigente: boolean;
}

export interface ParametrosGeneralesCatalogos {
  afp: AfpParametro[];
  isapres: IsapreParametro[];
  saludInstituciones: IsapreParametro[];
  tramosCarga: TramoCargaParametro[];
  tramosImpuesto: TramoImpuestoParametro[];
  tablaImpuestoUnico: TablaImpuestoUnicoParametro[];
  reformaPensiones: ParametroLegal[];
  trabajosPesados: TrabajoPesadoParametro[];
  reformaPrevisional: ReformaPrevisionalParametro[];
  ley16744Parametros: Ley16744Parametro[];
  organismosLey16744: OrganismoLey16744[];
  ccafEntidades: CcafEntidad[];
  apvInstituciones: ApvApvcInstitucion[];
  apvFormasPago: ApvApvcFormaPago[];
  afcParametros: AfcParametro[];
}

export { PARAMETRO_GENERAL_FORM_KEYS, PARAMETROS_CATALOGO_ARRAY_KEYS } from './parametros-generales.manifest';
