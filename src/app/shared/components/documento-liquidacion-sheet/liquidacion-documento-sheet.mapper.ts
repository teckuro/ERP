import type { LiquidacionCalculada } from '../../../features/nomina-mensual/models/proceso-mensual.model';
import type { VistaPreviaDocumentoLiquidacion } from '../../../features/administracion/rules/administracion.rules';
import { liquidoEnPalabras } from './liquidacion-en-palabras';
import { normalizarEtiquetaConceptoDocumento } from './liquidacion-documento-sheet-enriquecimiento.rules';
import { sanitizarLiquidacionDocumentoSheetVm } from './liquidacion-documento-sheet.presentacion.rules';
import type {
  LiquidacionDocumentoEmpresaVm,
  LiquidacionDocumentoLineaVm,
  LiquidacionDocumentoSheetPresentacionVm,
  LiquidacionDocumentoSheetVm,
  LiquidacionDocumentoTrabajadorVm,
} from './liquidacion-documento-sheet.model';

export interface LiquidacionDocumentoNominaInput {
  periodo: string;
  fechaPago?: string | null;
}

export interface LiquidacionDocumentoTrabajadorMetaInput {
  afp?: string | null;
  salud?: string | null;
  tipoContrato?: string | null;
  cargo?: string | null;
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

export interface LiquidacionDocumentoDetalleInput {
  diasBase?: number | null;
  ausencias?: number | null;
  diasTrabajados?: number | null;
  utm?: number | null;
  uf?: number | null;
  cargas?: number | null;
}

export interface LiquidacionDocumentoCierreInput {
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

function sumar(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v ?? 0;
  return total;
}

export function periodoHumanoDocumento(periodo: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return periodo;
  const [, anio, mes] = match;
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${meses[Number(mes) - 1]} ${anio}`;
}

export function periodoCortoDocumento(periodo: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return periodo.toUpperCase();
  const [, anio, mes] = match;
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `${meses[Number(mes) - 1]}-${anio.slice(-2)}`;
}

function mapLineas(
  lineas: readonly { descripcion: string; monto: number }[],
): LiquidacionDocumentoLineaVm[] {
  return lineas.map((linea) => ({
    descripcion: normalizarEtiquetaConceptoDocumento(linea.descripcion),
    monto: linea.monto,
  }));
}

function mapEmpresa(empresa: LiquidacionDocumentoEmpresaVm): LiquidacionDocumentoEmpresaVm {
  return {
    razonSocial: empresa.razonSocial,
    rut: empresa.rut ?? null,
    direccion: empresa.direccion ?? null,
    logoUrl: empresa.logoUrl ?? null,
    representanteLegal: empresa.representanteLegal ?? null,
    textoPie: empresa.textoPie ?? null,
    nombreFirmaEmpleador: empresa.nombreFirmaEmpleador ?? null,
    sitioWeb: empresa.sitioWeb ?? null,
  };
}

function mapTrabajador(
  liquidacion: LiquidacionCalculada,
  meta?: LiquidacionDocumentoTrabajadorMetaInput | null,
): LiquidacionDocumentoTrabajadorVm {
  return {
    nombre: liquidacion.nombreCompleto || liquidacion.rut,
    rut: liquidacion.rut,
    cargo: meta?.cargo ?? null,
    tipoContrato: meta?.tipoContrato ?? null,
    afp: meta?.afp ?? null,
    salud: meta?.salud ?? null,
    sueldoBase: meta?.sueldoBase ?? null,
    diasTrabajados: meta?.diasTrabajados ?? null,
    fechaIngreso: meta?.fechaIngreso ?? null,
    email: meta?.email ?? null,
    tasaAfp: meta?.tasaAfp ?? null,
    mutual: meta?.mutual ?? null,
    apv: meta?.apv ?? null,
    apvCotizacion: meta?.apvCotizacion ?? null,
    ccaf: meta?.ccaf ?? null,
  };
}

function mapDetalle(
  detalle: LiquidacionDocumentoDetalleInput | null | undefined,
  trabajadorMeta?: LiquidacionDocumentoTrabajadorMetaInput | null,
): LiquidacionDocumentoDetalleInput | null {
  if (!detalle && !trabajadorMeta?.diasTrabajados) return detalle ?? null;
  return {
    diasBase: detalle?.diasBase ?? trabajadorMeta?.diasTrabajados ?? null,
    ausencias: detalle?.ausencias ?? 0,
    diasTrabajados: detalle?.diasTrabajados ?? trabajadorMeta?.diasTrabajados ?? null,
    utm: detalle?.utm ?? null,
    uf: detalle?.uf ?? null,
    cargas: detalle?.cargas ?? null,
  };
}

export function buildLiquidacionDocumentoSheetFromCalculada(input: {
  liquidacion: LiquidacionCalculada;
  empresa: LiquidacionDocumentoEmpresaVm;
  nomina: LiquidacionDocumentoNominaInput;
  trabajadorMeta?: LiquidacionDocumentoTrabajadorMetaInput | null;
  detalle?: LiquidacionDocumentoDetalleInput | null;
  cierre?: LiquidacionDocumentoCierreInput | null;
  numeroDocumento?: string | null;
  fechaEmision?: string | null;
}): LiquidacionDocumentoSheetPresentacionVm {
  const { liquidacion, empresa, nomina, trabajadorMeta, detalle, cierre, numeroDocumento, fechaEmision } = input;
  const haberesImponibles = mapLineas(liquidacion.haberesImponibles);
  const haberesNoImponibles = mapLineas(liquidacion.haberesNoImponibles);
  const descuentosLegales = mapLineas(liquidacion.descuentosLegales);
  const descuentosVoluntarios = mapLineas(liquidacion.descuentosVoluntarios);

  return sanitizarLiquidacionDocumentoSheetVm({
    periodoLabel: periodoHumanoDocumento(nomina.periodo),
    periodoCorto: periodoCortoDocumento(nomina.periodo),
    numeroDocumento: numeroDocumento ?? null,
    fechaPago: nomina.fechaPago ?? null,
    fechaEmision: fechaEmision ?? null,
    empresa: mapEmpresa(empresa),
    trabajador: mapTrabajador(liquidacion, trabajadorMeta),
    detalle: mapDetalle(detalle, trabajadorMeta),
    cierre: cierre ?? null,
    bonificacionesDescuentos: [],
    haberesImponibles,
    haberesNoImponibles,
    descuentosLegales,
    descuentosVoluntarios,
    subtotalHaberesImponibles: sumar(haberesImponibles.map((h) => h.monto)),
    subtotalHaberesNoImponibles: sumar(haberesNoImponibles.map((h) => h.monto)),
    subtotalDescuentosLegales: sumar(descuentosLegales.map((d) => d.monto)),
    subtotalDescuentosVoluntarios: sumar(descuentosVoluntarios.map((d) => d.monto)),
    totalHaberes: liquidacion.totalHaberes,
    totalDescuentos: liquidacion.totalDescuentos,
    baseImponiblePrevisional: liquidacion.baseImponiblePrevisional,
    baseTributable: liquidacion.baseTributable,
    cotizacionSis: liquidacion.cotizacionSis,
    cotizacionSanna: liquidacion.cotizacionSanna,
    cotizacionLey16744: liquidacion.cotizacionLey16744,
    liquidoAPago: liquidacion.liquidoAPago,
    liquidoEnPalabras: liquidoEnPalabras(liquidacion.liquidoAPago),
  });
}

/** Datos de ejemplo para el editor de Administración (encabezado/pie reales, cuerpo fijo). */
export function buildLiquidacionDocumentoSheetEjemplo(
  vista: VistaPreviaDocumentoLiquidacion,
): LiquidacionDocumentoSheetPresentacionVm {
  return sanitizarLiquidacionDocumentoSheetVm({
    periodoLabel: 'Julio 2026',
    periodoCorto: 'FEB-21',
    numeroDocumento: 'S-0024-21',
    fechaEmision: '11/02/2021',
    empresa: mapEmpresa(vista),
    trabajador: {
      nombre: 'Immanuel Soto de la Carrera',
      rut: '11.111.111-1',
      cargo: 'Project Manager',
      diasTrabajados: 30,
      tipoContrato: 'Indefinido',
      afp: 'ProVida',
      tasaAfp: 11.45,
      salud: 'Cruz del Norte',
      mutual: 'ACHS',
      apv: null,
      apvCotizacion: null,
      ccaf: null,
      fechaIngreso: '06/06/2020',
      email: 'immanuel@demo.cl',
    },
    detalle: {
      diasBase: 30,
      ausencias: 0,
      diasTrabajados: 30,
      utm: 50_978,
      uf: 29_123.74,
      cargas: 3,
    },
    cierre: {
      anticipos: 0,
      prestamos: 0,
      otrosDescuentos: 0,
      autorizadoPor: vista.nombreFirmaEmpleador ?? vista.representanteLegal ?? 'Jeremias Vergara D.',
      unidadNegocio: 'Operaciones',
      categoria: 'Profesional',
      proyecto: 'ERP',
      emitidoPor: 'ERP',
      textoCopyright: `© ${new Date().getFullYear()} Licenciada a ${vista.razonSocial}`,
    },
    bonificacionesDescuentos: [],
    totalBonificaciones: 0,
    haberesImponibles: [
      { descripcion: 'Sueldo base', monto: 4_500_000 },
      { descripcion: 'Grat. legal', monto: 629_240 },
    ],
    haberesNoImponibles: [],
    descuentosLegales: [
      { descripcion: 'Previsión', monto: 587_298 },
      { descripcion: 'Salud', monto: 359_047 },
      { descripcion: 'Seguro de cesantía', monto: 26_003 },
    ],
    descuentosVoluntarios: [],
    subtotalHaberesImponibles: 5_129_240,
    subtotalHaberesNoImponibles: 0,
    subtotalDescuentosLegales: 972_348,
    subtotalDescuentosVoluntarios: 0,
    totalHaberes: 5_129_240,
    totalDescuentos: 972_348,
    baseImponiblePrevisional: 5_129_240,
    baseTributable: 4_668_798,
    cotizacionSis: 0,
    cotizacionSanna: 0,
    cotizacionLey16744: 0,
    liquidoAPago: 4_156_892,
    liquidoEnPalabras: 'Cuatro millones ciento cincuenta y seis mil ochocientos noventa y dos pesos',
  });
}
