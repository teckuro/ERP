export interface LiquidacionDocumentoEmpresaVm {
  razonSocial: string;
  rut?: string | null;
  direccion?: string | null;
  logoUrl?: string | null;
  representanteLegal?: string | null;
  textoPie?: string | null;
  nombreFirmaEmpleador?: string | null;
  sitioWeb?: string | null;
}

export interface LiquidacionDocumentoTrabajadorVm {
  nombre: string;
  rut: string;
  cargo?: string | null;
  tipoContrato?: string | null;
  afp?: string | null;
  salud?: string | null;
  sueldoBase?: number | null;
  diasTrabajados?: number | null;
  fechaIngreso?: string | null;
  email?: string | null;
  tasaAfp?: number | null;
  mutual?: string | null;
  apv?: string | null;
  apvCotizacion?: number | null;
  ccaf?: string | null;
}

export interface LiquidacionDocumentoDetalleVm {
  diasBase?: number | null;
  ausencias?: number | null;
  diasTrabajados?: number | null;
  utm?: number | null;
  uf?: number | null;
  cargas?: number | null;
}

export interface LiquidacionDocumentoCierreVm {
  anticipos?: number | null;
  prestamos?: number | null;
  otrosDescuentos?: number | null;
  autorizadoPor?: string | null;
  unidadNegocio?: string | null;
  categoria?: string | null;
  proyecto?: string | null;
  emitidoPor?: string | null;
  textoLegal?: string | null;
  textoCopyright?: string | null;
}

export interface LiquidacionDocumentoLineaVm {
  descripcion: string;
  monto: number;
}

export interface LiquidacionDocumentoSheetVm {
  periodoLabel: string;
  periodoCorto?: string | null;
  numeroDocumento?: string | null;
  fechaPago?: string | null;
  fechaEmision?: string | null;
  empresa: LiquidacionDocumentoEmpresaVm;
  trabajador: LiquidacionDocumentoTrabajadorVm;
  detalle?: LiquidacionDocumentoDetalleVm | null;
  cierre?: LiquidacionDocumentoCierreVm | null;
  bonificacionesDescuentos?: LiquidacionDocumentoLineaVm[];
  haberesImponibles: LiquidacionDocumentoLineaVm[];
  haberesNoImponibles: LiquidacionDocumentoLineaVm[];
  descuentosLegales: LiquidacionDocumentoLineaVm[];
  descuentosVoluntarios: LiquidacionDocumentoLineaVm[];
  totalBonificaciones?: number | null;
  subtotalHaberesImponibles: number;
  subtotalHaberesNoImponibles: number;
  subtotalDescuentosLegales: number;
  subtotalDescuentosVoluntarios: number;
  totalHaberes: number;
  totalDescuentos: number;
  baseImponiblePrevisional: number;
  baseTributable: number;
  cotizacionSis: number;
  cotizacionSanna: number;
  cotizacionLey16744: number;
  liquidoAPago: number;
  liquidoEnPalabras: string;
}

/** VM listo para render: líneas en $0 ocultas y valores de presentación Gael. */
export interface LiquidacionDocumentoSheetPresentacionVm extends LiquidacionDocumentoSheetVm {
  mostrarSubtotalImponibles: boolean;
  mostrarSubtotalNoImponibles: boolean;
  mostrarSubtotalLegales: boolean;
  mostrarSubtotalVoluntarios: boolean;
  mostrarBloqueHaberes: boolean;
  mostrarBloqueDescuentos: boolean;
  cuerpoUnaColumna: boolean;
  mostrarBaseImponiblePrevisional: boolean;
  mostrarBaseTributable: boolean;
  mostrarBasesLegales: boolean;
  mostrarAportesEmpleador: boolean;
  mostrarFranjaResumen: boolean;
  mostrarEtiquetaImponibles: boolean;
  mostrarEtiquetaNoImponibles: boolean;
  mostrarEtiquetaLegales: boolean;
  mostrarEtiquetaVoluntarios: boolean;
  mostrarFechaIngreso: boolean;
  mostrarDetalle: boolean;
  mostrarNumeroDocumento: boolean;
  mostrarEmail: boolean;
  mostrarTasaAfp: boolean;
  mostrarMutual: boolean;
  mostrarUtm: boolean;
  mostrarUf: boolean;
  mostrarCargas: boolean;
  mostrarTotalesEnHaberes: boolean;
  mostrarLiquidoEnDescuentos: boolean;
  mostrarCajaLiquido: boolean;
  mostrarBonificacionesVacias: boolean;
  textoAfpDetalle: string | null;
  textoApvDetalle: string | null;
  textoAportesEmpleador: string | null;
  valorDiasBase: string;
  valorAusencias: string;
  valorDiasTrabajados: string;
  valorUtm: string;
  valorUf: string;
  valorCargas: string;
  valorSalud: string;
  valorMutual: string;
  valorCcaf: string;
  valorAutorizadoPor: string;
  valorFirmaEmpleador: string;
  valorUnidadNegocio: string;
  valorCategoria: string;
  valorProyecto: string;
  valorEmitidoPor: string;
  valorTextoLegal: string;
  valorTextoCopyright: string;
  montoAnticipos: number;
  montoPrestamos: number;
  montoOtrosDescuentos: number;
  montoTotalBonificaciones: number;
  /** @deprecated Usar mostrarFranjaResumen */
  mostrarSecundario: boolean;
  mostrarSueldoBase: boolean;
  mostrarDiasTrabajados: boolean;
  aporteSis: number | null;
  aporteSanna: number | null;
  aporteMutual: number | null;
}

export const ERP_DOC_SHEET_PRINTING_CLASS = 'erp-doc-sheet-printing';

export const TEXTO_LEGAL_LIQUIDACION_DEFAULT =
  'Recibí a plena conformidad el monto indicado en la presente liquidación de sueldo, por concepto de remuneraciones correspondientes al período indicado, no teniendo cargo ni cobro alguno que hacer por otro concepto.';
