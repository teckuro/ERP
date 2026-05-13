export type ParametrosTabId =
  | 'configCliente'
  | 'valores'
  | 'remuneraciones'
  | 'ccafMutual'
  | 'tramosCarga'
  | 'impuestoUnico'
  | 'salud'
  | 'prevision'
  | 'reforma';

export interface ParametrosGeneralesFiltro {
  periodo?: string;
}

export type PeriodoRemuneracionEstado =
  | 'pendiente'
  | 'parcial'
  | 'cargado'
  | 'corregido'
  | 'cerrado'
  | 'error';

export interface PeriodoRemuneracionEstadoInfo {
  codigo: string;
  estado: PeriodoRemuneracionEstado;
  fechaInicio: string;
  fechaFin: string;
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

export type ParametrosReconciliacionOficialEstado =
  | 'pendiente'
  | 'actualizado_con_oficiales'
  | 'cliente_confirmado'
  | 'revisar_despues';

export type ParametrosReconciliacionOrigen =
  | 'actualizar_con_oficiales'
  | 'mantener_configuracion'
  | 'revisar_despues'
  | 'edicion_cliente'
  | null;

export interface ParametrosGeneralesClienteConfig
  extends Partial<Omit<ParametroGeneral, 'periodo' | 'fechaActualizacion' | 'descuentosBasePorDia' | 'gratificacion'>> {
  periodo: string;
  descuentosBasePorDia: boolean | null;
  gratificacion: boolean | null;
  immGratificacion: number | null;
  idCcafEntidad: number | null;
  idOrganismoAdministradorLey16744: number | null;
  estadoReconciliacionOficial: ParametrosReconciliacionOficialEstado;
  fechaReconciliacionOficial: string | null;
  origenReconciliacion: ParametrosReconciliacionOrigen;
  observacionReconciliacion: string | null;
  fechaActualizacion: string | null;
}

export type ParametrosGeneralesClienteConfigUpsert = Omit<
  ParametrosGeneralesClienteConfig,
  | 'fechaActualizacion'
  | 'estadoReconciliacionOficial'
  | 'fechaReconciliacionOficial'
  | 'origenReconciliacion'
  | 'observacionReconciliacion'
> &
  Partial<
    Pick<
      ParametrosGeneralesClienteConfig,
      | 'estadoReconciliacionOficial'
      | 'fechaReconciliacionOficial'
      | 'origenReconciliacion'
      | 'observacionReconciliacion'
    >
  >;

export interface AfpParametro {
  idAfp: number;
  codigo: string | null;
  nombre: string;
  /** YYYY-MM alineado a vigencia; NULL = catálogo global. */
  periodo: string | null;
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
  periodo: string | null;
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
  /** YYYY-MM derivado de vigencia_inicio en BD. */
  periodo?: string;
}

export interface ParametroLegal {
  idParametro: number;
  nombre: string;
  valorDecimal: number | null;
  valorEntero: number | null;
  periodo: string | null;
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
  periodo: string | null;
  vigenciaInicio: string;
  vigenciaFin: string | null;
  observacion: string | null;
}

export interface TrabajoPesadoParametro {
  idTrabajoPesadoParametro: number;
  codigo: string;
  periodo: string;
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
  periodo: string | null;
  vigenciaInicio: string;
  vigenciaFin: string | null;
  aporteEmpleadorTotal: number;
  cuentaCapitalizacionIndividual: number;
  cotizacionRentabilidadProtegida: number;
  seguroSocialSisCev: number;
  fappSeguroSocial: number;
  fuente: string | null;
}

export interface Ley16744Parametro {
  idLey16744Parametro: number;
  codigo: string;
  periodo: string;
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
  periodo: string | null;
}

export interface CcafEntidad {
  idCcafEntidad: number;
  codigo: string;
  nombre: string;
  vigente: boolean;
  fuente: string | null;
  periodo: string | null;
}

export interface ApvApvcInstitucion {
  idInstitucionApv: number;
  codigo: string | null;
  nombre: string;
  vigente: boolean;
  periodo: string | null;
}

export interface ApvApvcFormaPago {
  idFormaPagoApv: number;
  codigo: string | null;
  nombre: string;
  vigente: boolean;
  periodo: string | null;
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

export interface ParametrosReferenciaMensualInfo {
  parametrosGenerales: string | null;
  tramosCarga: string | null;
  tramosImpuesto: string | null;
  tablaImpuestoUnico: string | null;
  ley16744Parametros: string | null;
}

export interface ParametrosReferenciaVisualMensual {
  parametroGeneral: ParametroGeneral | null;
  catalogos: ParametrosGeneralesCatalogos;
  referencias: ParametrosReferenciaMensualInfo;
}

export { PARAMETRO_GENERAL_FORM_KEYS, PARAMETROS_CATALOGO_ARRAY_KEYS } from './parametros-generales.manifest';
