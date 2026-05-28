import type { IncidenciaPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import { limpiarCopyTecnicoNomina } from './proceso-mensual-copy-limpio.rules';
import {
  formatoMontoNomina,
} from '../containers/proceso-mensual-container/utils/proceso-mensual-presentacion.formato';
import type {
  LiquidacionCalculada,
  MotorCalculoPeriodoResultado,
  MotorCalculoTrazabilidad,
  NominaCalculoConceptoSnapshot,
  NominaCalculoTrazabilidadSnapshot,
  NominaCalculoTrabajadorSnapshot,
  NominaSnapshotCompletoView,
} from '../models/proceso-mensual.model';

interface TrazaPreview {
  codigo: string;
  formula: string;
  valorResultado: number | string | Record<string, unknown> | unknown[] | null;
  observacion: string | null;
}

export interface LiquidacionPreviewLinea {
  etiqueta: string;
  monto: string;
}

export interface LiquidacionPreviewSeccion {
  titulo: string;
  lineas: LiquidacionPreviewLinea[];
  subtotal: string | null;
}

export interface LiquidacionPreviewReferencia {
  titulo: string;
  detalle: string;
}

export interface LiquidacionPreviewTrabajadorVm {
  visible: boolean;
  periodoLabel: string;
  avisoPreliminar: string;
  totales: {
    estado: string;
    haberes: string;
    descuentos: string;
    liquido: string;
  };
  secciones: LiquidacionPreviewSeccion[];
  referencias: LiquidacionPreviewReferencia[];
}

export interface BuildLiquidacionPreviewTrabajadorInput {
  idPersona: number | string;
  periodo: string;
  estadoLabel: string;
  haberes: number | null;
  descuentos: number | null;
  liquido: number | null;
  monedaContrato?: string | null;
  calculo: MotorCalculoPeriodoResultado | null;
  snapshotCompleto: NominaSnapshotCompletoView | null;
  incidenciasInfo: IncidenciaPeriodo[];
}

const AVISO_PRELIMINAR =
  'Este detalle es una previsualización de la nómina del período. La liquidación oficial puede variar al cerrar y emitir liquidaciones.';
const MAX_REFERENCIAS_TRAZA = 8;

function clavePersona(idPersona: number | string): string {
  const raw = String(idPersona).trim();
  return raw.startsWith('omitido-') ? raw.slice('omitido-'.length) : raw;
}

function coincidePersona(idPersona: number | string, candidato: number | string): boolean {
  return clavePersona(idPersona) === clavePersona(candidato);
}

function montoPreview(valor: number | null | undefined, moneda?: string | null): string {
  if (valor == null || Number.isNaN(valor)) {
    return '—';
  }
  const etiqueta = formatoMontoNomina(valor);
  if (!moneda || moneda === 'CLP') {
    return etiqueta;
  }
  return `${etiqueta} (${moneda})`;
}

function lineaDesdeConcepto(concepto: NominaCalculoConceptoSnapshot, moneda?: string | null): LiquidacionPreviewLinea {
  return {
    etiqueta: limpiarCopyTecnicoNomina(concepto.nombreConceptoSnapshot) || 'Concepto',
    monto: montoPreview(concepto.monto, moneda),
  };
}

function lineasDesdeLiquidacion(
  liq: LiquidacionCalculada,
  moneda?: string | null,
): LiquidacionPreviewSeccion[] {
  const mapLineas = (items: LiquidacionCalculada['haberesImponibles']) =>
    items
      .filter((item) => item.monto !== 0)
      .map((item) => ({
        etiqueta: limpiarCopyTecnicoNomina(item.descripcion) || limpiarCopyTecnicoNomina(item.codigo),
        monto: montoPreview(item.monto, moneda),
      }));

  const haberes = [
    ...mapLineas(liq.haberesImponibles),
    ...mapLineas(liq.haberesNoImponibles),
  ];
  const descuentos = [
    ...mapLineas(liq.descuentosLegales),
    ...mapLineas(liq.descuentosVoluntarios),
  ];

  const secciones: LiquidacionPreviewSeccion[] = [];
  if (haberes.length) {
    secciones.push({
      titulo: 'Haberes',
      lineas: haberes,
      subtotal: montoPreview(liq.totalHaberes, moneda),
    });
  }
  if (descuentos.length) {
    secciones.push({
      titulo: 'Descuentos',
      lineas: descuentos,
      subtotal: montoPreview(liq.totalDescuentos, moneda),
    });
  }
  return secciones;
}

function lineasDesdeSnapshotTrabajador(
  trabajador: NominaCalculoTrabajadorSnapshot,
  moneda?: string | null,
): LiquidacionPreviewSeccion[] {
  const conceptos = trabajador.conceptos ?? [];
  const haberes = conceptos
    .filter((c) => c.tipo === 'haber' && c.monto !== 0)
    .map((c) => lineaDesdeConcepto(c, moneda));
  const descuentos = conceptos
    .filter((c) => (c.tipo === 'descuento' || c.tipo === 'impuesto') && c.afectaLiquido && c.monto !== 0)
    .map((c) => lineaDesdeConcepto(c, moneda));

  const secciones: LiquidacionPreviewSeccion[] = [];
  if (haberes.length) {
    secciones.push({
      titulo: 'Haberes',
      lineas: haberes,
      subtotal: montoPreview(
        trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles,
        moneda,
      ),
    });
  }
  if (descuentos.length) {
    secciones.push({
      titulo: 'Descuentos',
      lineas: descuentos,
      subtotal: montoPreview(
        trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios + trabajador.impuestoUnico,
        moneda,
      ),
    });
  }
  return secciones;
}

const TRAZA_LABELS: Record<string, string> = {
  SUELDO_BASE: 'Sueldo base considerado',
  BASE_IMPONIBLE_PREVISIONAL: 'Base imponible previsional',
  BASE_TRIBUTABLE: 'Base tributable',
  TOPE_IMPONIBLE_APLICADO: 'Tope imponible aplicado',
  AFP_TASA_APLICADA: 'Cotización AFP',
  SALUD_PARAMETRO_APLICADO: 'Cotización salud',
  AFC_PARAMETRO_APLICADO: 'Seguro de cesantía (AFC)',
  SIS_PARAMETRO_APLICADO: 'Seguro de invalidez y sobrevivencia (SIS)',
  HABER_IMPONIBLE_SUMADO: 'Haberes imponibles considerados',
  HABER_NO_IMPONIBLE_SUMADO: 'Haberes no imponibles considerados',
  IMPUESTO_UNICO: 'Impuesto único',
  GRATIFICACION_ART_50_BASE: 'Base de gratificación',
};

function etiquetaTraza(codigo: string): string {
  const normalizado = codigo.trim().toUpperCase();
  return TRAZA_LABELS[normalizado] ?? 'Referencia de cálculo';
}

function normalizarTraza(
  traza: MotorCalculoTrazabilidad | NominaCalculoTrazabilidadSnapshot,
): TrazaPreview {
  if ('tablaFuente' in traza) {
    return {
      codigo: traza.codigo,
      formula: traza.formula,
      valorResultado: traza.valorResultado,
      observacion: traza.observacion,
    };
  }
  return {
    codigo: traza.codigo,
    formula: traza.formula,
    valorResultado: traza.valorResultado,
    observacion: traza.observacion ?? null,
  };
}

function detalleTraza(traza: TrazaPreview, moneda?: string | null): string {
  // Preferimos una referencia legible, sin fórmulas ni nombres de tablas/campos.
  if (traza.observacion?.trim()) {
    return limpiarCopyTecnicoNomina(traza.observacion);
  }

  if (typeof traza.valorResultado === 'number') {
    return montoPreview(traza.valorResultado, moneda);
  }

  if (typeof traza.valorResultado === 'string') {
    const limpio = limpiarCopyTecnicoNomina(traza.valorResultado).trim();
    return limpio.length ? limpio : 'Dato del período.';
  }

  return 'Dato del período.';
}

function referenciasDesdeTrazas(
  trazas: Array<MotorCalculoTrazabilidad | NominaCalculoTrazabilidadSnapshot>,
  moneda?: string | null,
): LiquidacionPreviewReferencia[] {
  return trazas
    .slice(0, MAX_REFERENCIAS_TRAZA)
    .map((traza) => {
      const preview = normalizarTraza(traza);
      return {
        titulo: etiquetaTraza(preview.codigo),
        detalle: detalleTraza(preview, moneda),
      };
    });
}

function referenciasDesdeIncidencias(incidencias: IncidenciaPeriodo[]): LiquidacionPreviewReferencia[] {
  return incidencias.map((incidencia) => ({
    titulo: limpiarCopyTecnicoNomina(incidencia.titulo),
    detalle: limpiarCopyTecnicoNomina(incidencia.detalle),
  }));
}

function resolverLiquidacion(
  input: BuildLiquidacionPreviewTrabajadorInput,
): LiquidacionCalculada | null {
  const liquidaciones = input.calculo?.liquidaciones ?? [];
  return liquidaciones.find((liq) => coincidePersona(input.idPersona, liq.idPersona)) ?? null;
}

function resolverTrabajadorSnapshot(
  input: BuildLiquidacionPreviewTrabajadorInput,
): NominaCalculoTrabajadorSnapshot | null {
  const fuentes = [
    ...(input.snapshotCompleto?.trabajadores ?? []),
    ...(input.snapshotCompleto?.cabecera.trabajadores ?? []),
  ];
  return fuentes.find((trabajador) => coincidePersona(input.idPersona, trabajador.idPersona)) ?? null;
}

export function buildLiquidacionPreviewTrabajador(
  input: BuildLiquidacionPreviewTrabajadorInput,
): LiquidacionPreviewTrabajadorVm {
  const moneda = input.monedaContrato ?? null;
  const liquidacion = resolverLiquidacion(input);
  const trabajadorSnapshot = resolverTrabajadorSnapshot(input);

  const secciones = liquidacion
    ? lineasDesdeLiquidacion(liquidacion, moneda)
    : trabajadorSnapshot
      ? lineasDesdeSnapshotTrabajador(trabajadorSnapshot, moneda)
      : [];

  const haberesTotal = liquidacion?.totalHaberes
    ?? (trabajadorSnapshot
      ? trabajadorSnapshot.totalHaberesImponibles + trabajadorSnapshot.totalHaberesNoImponibles
      : input.haberes);
  const descuentosTotal = liquidacion?.totalDescuentos
    ?? (trabajadorSnapshot
      ? trabajadorSnapshot.totalDescuentosLegales
        + trabajadorSnapshot.totalDescuentosVoluntarios
        + trabajadorSnapshot.impuestoUnico
      : input.descuentos);
  const liquidoTotal = liquidacion?.liquidoAPago
    ?? trabajadorSnapshot?.liquidoPreliminar
    ?? input.liquido;

  const trazas = liquidacion?.trazabilidad ?? trabajadorSnapshot?.trazabilidad ?? [];
  const referencias = [
    ...referenciasDesdeIncidencias(input.incidenciasInfo),
    ...referenciasDesdeTrazas(trazas, moneda),
  ];

  const visible =
    secciones.length > 0
    || referencias.length > 0
    || haberesTotal != null
    || descuentosTotal != null
    || liquidoTotal != null;

  return {
    visible,
    periodoLabel: input.periodo,
    avisoPreliminar: AVISO_PRELIMINAR,
    totales: {
      estado: input.estadoLabel || '—',
      haberes: montoPreview(haberesTotal, moneda),
      descuentos: montoPreview(descuentosTotal, moneda),
      liquido: montoPreview(liquidoTotal, moneda),
    },
    secciones,
    referencias,
  };
}
