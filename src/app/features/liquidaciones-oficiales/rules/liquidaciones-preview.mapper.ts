import type { EmpleadoFichaDetalle } from '../../empleados/models/empleado-listado.model';
import type {
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
} from '../../parametros-generales/models/parametro-general.model';
import type {
  LiquidacionCalculada,
  LineaLiquidacionCalculada,
} from '../../nomina-mensual/models/proceso-mensual.model';
import type {
  LiquidacionConcepto,
  LiquidacionEmision,
  LiquidacionTrabajador,
} from '../models/liquidacion-oficial.model';
import type {
  LiquidacionDocumentoCierreInput,
  LiquidacionDocumentoDetalleInput,
  LiquidacionDocumentoTrabajadorMetaInput,
} from '../../../shared/components/documento-liquidacion-sheet/liquidacion-documento-sheet.mapper';
import type { LiquidacionDocumentoEmpresaVm } from '../../../shared/components/documento-liquidacion-sheet/liquidacion-documento-sheet.model';
import {
  enriquecerDocumentoDesdeLiquidacionOficial,
  mapTrabajadorMetaEnriquecida,
  normalizarEtiquetaConceptoDocumento,
  type ParametrosPeriodoDocumentoInput,
} from '../../../shared/components/documento-liquidacion-sheet/liquidacion-documento-sheet-enriquecimiento.rules';

export interface MapLiquidacionPreviewOficialInput {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  periodo: string;
}

function lineaDesdeConcepto(concepto: LiquidacionConcepto): LineaLiquidacionCalculada {
  let descripcion = normalizarEtiquetaConceptoDocumento(concepto.nombre);
  if (concepto.tasa != null && concepto.tasa > 0) {
    descripcion += ` (${concepto.tasa.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%)`;
  }
  return {
    codigo: concepto.codigo ?? concepto.codigoLre ?? 'CONCEPTO',
    descripcion,
    monto: concepto.monto,
    origen: 'liquidacion_oficial',
    imponible: concepto.clasificacion?.includes('imponible') ?? undefined,
    tributable: concepto.clasificacion?.includes('tributable') ?? undefined,
  };
}

function esAporteReferenciaEmpleador(concepto: LiquidacionConcepto): boolean {
  return concepto.tipo === 'cotizacion' || concepto.clasificacion === 'aporte_referencia';
}

function esDescuentoLegal(concepto: LiquidacionConcepto): boolean {
  if (concepto.tipo === 'impuesto') return true;
  const texto = `${concepto.codigo ?? ''} ${concepto.codigoLre ?? ''} ${concepto.nombre}`.toLowerCase();
  return /afp|salud|fonasa|isapre|afc|cesant|impuesto|sanna|ley\s*16|sis\b|previsi/.test(texto);
}

function numeroMetadata(metadata: Record<string, unknown>, clave: string): number {
  const raw = metadata[clave];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

function textoConcepto(concepto: LiquidacionConcepto): string {
  return `${concepto.codigo ?? ''} ${concepto.codigoLre ?? ''} ${concepto.nombre}`.toLowerCase();
}

function clasificarAporteEmpleador(
  concepto: LiquidacionConcepto,
): 'afc_empleador' | 'sis' | 'sanna' | 'mutual' | null {
  const texto = textoConcepto(concepto);
  if (/\b4151\b|afc empleador/.test(texto)) return 'afc_empleador';
  if (/\bsis\b/.test(texto)) return 'sis';
  if (/sanna/.test(texto)) return 'sanna';
  if (/ley\s*16|mutual/.test(texto)) return 'mutual';
  return null;
}

function acumularAportesEmpleador(conceptos: readonly LiquidacionConcepto[]): {
  cotizacionAfcEmpleador: number;
  cotizacionSis: number;
  cotizacionSanna: number;
  cotizacionLey16744: number;
} {
  let cotizacionAfcEmpleador = 0;
  let cotizacionSis = 0;
  let cotizacionSanna = 0;
  let cotizacionLey16744 = 0;

  for (const concepto of conceptos) {
    if (!esAporteReferenciaEmpleador(concepto) || concepto.monto === 0) continue;
    const tipo = clasificarAporteEmpleador(concepto);
    if (tipo === 'afc_empleador') cotizacionAfcEmpleador += concepto.monto;
    else if (tipo === 'sis') cotizacionSis += concepto.monto;
    else if (tipo === 'sanna') cotizacionSanna += concepto.monto;
    else if (tipo === 'mutual') cotizacionLey16744 += concepto.monto;
  }

  return { cotizacionAfcEmpleador, cotizacionSis, cotizacionSanna, cotizacionLey16744 };
}

/** Metadatos del trabajador para la hoja compartida (liquidaciones oficiales). */
export function mapTrabajadorMetaDesdeLiquidacionOficial(
  trabajador: LiquidacionTrabajador,
  conceptos: readonly LiquidacionConcepto[] = [],
): LiquidacionDocumentoTrabajadorMetaInput {
  return mapTrabajadorMetaEnriquecida(trabajador, conceptos);
}

export function mapDocumentoExtrasDesdeLiquidacionOficial(input: {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  periodo: string;
  empresa?: LiquidacionDocumentoEmpresaVm | null;
  parametros?: ParametrosPeriodoDocumentoInput | null;
  emision?: LiquidacionEmision | null;
  ficha?: EmpleadoFichaDetalle | null;
  configCliente?: ParametrosGeneralesClienteConfig | null;
  catalogos?: ParametrosGeneralesCatalogos | null;
}): {
  trabajadorMeta: LiquidacionDocumentoTrabajadorMetaInput;
  detalle: LiquidacionDocumentoDetalleInput;
  cierre: LiquidacionDocumentoCierreInput;
  numeroDocumento: string;
  fechaEmision: string | null;
} {
  return enriquecerDocumentoDesdeLiquidacionOficial(input);
}

export function mapLiquidacionOficialAPreview(
  input: MapLiquidacionPreviewOficialInput,
): LiquidacionCalculada {
  const { trabajador, conceptos, periodo } = input;
  const haberesImponibles: LineaLiquidacionCalculada[] = [];
  const haberesNoImponibles: LineaLiquidacionCalculada[] = [];
  const descuentosLegales: LineaLiquidacionCalculada[] = [];
  const descuentosVoluntarios: LineaLiquidacionCalculada[] = [];

  for (const concepto of conceptos) {
    if (concepto.monto === 0 || esAporteReferenciaEmpleador(concepto)) continue;
    const linea = lineaDesdeConcepto(concepto);
    if (concepto.tipo === 'haber') {
      if (concepto.clasificacion === 'haber_no_imponible') {
        haberesNoImponibles.push(linea);
      } else {
        haberesImponibles.push(linea);
      }
      continue;
    }
    if (esDescuentoLegal(concepto)) {
      descuentosLegales.push(linea);
    } else {
      descuentosVoluntarios.push(linea);
    }
  }

  const meta = trabajador.metadata ?? {};
  const aportes = acumularAportesEmpleador(conceptos);

  return {
    periodo,
    idPersona: trabajador.idPersona ?? trabajador.idLiquidacionTrabajador,
    rut: trabajador.rut ?? '—',
    nombreCompleto: trabajador.nombreTrabajador,
    haberesImponibles,
    haberesNoImponibles,
    descuentosLegales,
    descuentosVoluntarios,
    baseImponiblePrevisional: trabajador.baseImponible,
    baseTributable: trabajador.baseTributable,
    gratificacionLegal: 0,
    asignacionFamiliar: 0,
    cotizacionAfp: numeroMetadata(meta, 'cotizacionAfp'),
    cotizacionSalud: numeroMetadata(meta, 'cotizacionSalud'),
    cotizacionAfc: numeroMetadata(meta, 'cotizacionAfc'),
    cotizacionAfcEmpleador: aportes.cotizacionAfcEmpleador,
    cotizacionSis: aportes.cotizacionSis,
    cotizacionSanna: aportes.cotizacionSanna,
    cotizacionLey16744: aportes.cotizacionLey16744,
    impuestoUnico: descuentosLegales
      .filter((d) => /impuesto/i.test(d.descripcion))
      .reduce((sum, d) => sum + d.monto, 0),
    totalHaberes: trabajador.totalHaberes,
    totalDescuentos: trabajador.totalDescuentos,
    liquidoAPago: trabajador.liquidoPagar,
    issues: [],
    trazabilidad: [],
    estado: 'calculado_preliminar',
  };
}
