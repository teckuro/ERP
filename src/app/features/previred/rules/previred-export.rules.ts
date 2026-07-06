import type {
  LiquidacionConcepto,
  LiquidacionTrabajador,
} from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import type {
  PreviredAdvertencia,
  PreviredBorradorExport,
  PreviredLineaExport,
  PreviredTipoMovimiento,
} from '../models/previred-export.model';
import type { CatalogoPreviredEntrada } from './previred-mapeo.rules';
import {
  indexarCatalogoPrevired,
  listoParaEnvioPrevired,
  resolverCodigoPrevired,
} from './previred-mapeo.rules';

function esAporteReferenciaEmpleador(concepto: LiquidacionConcepto): boolean {
  return concepto.tipo === 'cotizacion' || concepto.clasificacion === 'aporte_referencia';
}

function clasificarTipoPrevired(concepto: LiquidacionConcepto): PreviredTipoMovimiento {
  if (concepto.tipo === 'haber') return 'haber';
  if (concepto.tipo === 'descuento' || concepto.tipo === 'impuesto') return 'descuento';
  return 'cotizacion';
}

export interface MapearTrabajadorPreviredInput {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  catalogoPrevired?: readonly CatalogoPreviredEntrada[];
}

export interface MapearTrabajadorPreviredResult {
  lineas: PreviredLineaExport[];
  omitidas: number;
  sinCodigo: number;
  sinMapeoCatalogo: number;
}

export function mapearTrabajadorAPrevired(
  input: MapearTrabajadorPreviredInput,
): MapearTrabajadorPreviredResult {
  const lineas: PreviredLineaExport[] = [];
  let omitidas = 0;
  let sinCodigo = 0;
  let sinMapeoCatalogo = 0;
  const rut = input.trabajador.rut?.trim() || '—';
  const indiceCatalogo = indexarCatalogoPrevired(input.catalogoPrevired ?? []);

  for (const concepto of input.conceptos) {
    if (concepto.monto === 0 || esAporteReferenciaEmpleador(concepto)) {
      omitidas++;
      continue;
    }

    const codigoLre = concepto.codigoLre?.trim();
    if (!codigoLre) {
      sinCodigo++;
      continue;
    }

    const resolucion = resolverCodigoPrevired(codigoLre, indiceCatalogo, concepto.nombre);
    if (!resolucion) {
      sinCodigo++;
      continue;
    }

    if (resolucion.origenMapeo === 'fallback_lre') {
      sinMapeoCatalogo++;
    }

    lineas.push({
      rut,
      nombreTrabajador: input.trabajador.nombreTrabajador,
      codigoMovimiento: resolucion.codigoMovimiento,
      glosa: resolucion.glosa ?? concepto.nombre,
      monto: concepto.monto,
      tipo: clasificarTipoPrevired(concepto),
      origenMapeo: resolucion.origenMapeo,
    });
  }

  return { lineas, omitidas, sinCodigo, sinMapeoCatalogo };
}

export interface ConstruirBorradorPreviredInput {
  periodo: string;
  empresaNombre: string;
  idNominaPeriodo: string | null;
  idLiquidacionPeriodo: number;
  versionLiquidacion: number;
  trabajadores: readonly {
    trabajador: LiquidacionTrabajador;
    conceptos: readonly LiquidacionConcepto[];
  }[];
  catalogoPrevired?: readonly CatalogoPreviredEntrada[];
}

export function construirBorradorPrevired(
  input: ConstruirBorradorPreviredInput,
): PreviredBorradorExport {
  const lineas: PreviredLineaExport[] = [];
  let lineasOmitidas = 0;
  let conceptosSinCodigo = 0;
  let conceptosSinMapeoCatalogo = 0;
  const advertencias: PreviredAdvertencia[] = [];

  for (const fila of input.trabajadores) {
    const resultado = mapearTrabajadorAPrevired({
      trabajador: fila.trabajador,
      conceptos: fila.conceptos,
      catalogoPrevired: input.catalogoPrevired,
    });
    lineas.push(...resultado.lineas);
    lineasOmitidas += resultado.omitidas;
    conceptosSinCodigo += resultado.sinCodigo;
    conceptosSinMapeoCatalogo += resultado.sinMapeoCatalogo;
  }

  const tieneBloqueo = lineas.length === 0;

  if (tieneBloqueo) {
    advertencias.push({
      nivel: 'bloqueo',
      mensaje:
        'No hay líneas exportables para este período. Revise que existan liquidaciones con conceptos codificados.',
    });
  } else {
    if (conceptosSinCodigo > 0) {
      advertencias.push({
        nivel: 'revision',
        mensaje: `${conceptosSinCodigo} concepto(s) con monto no tienen código base y quedarán fuera del archivo.`,
      });
    }
    if (conceptosSinMapeoCatalogo > 0) {
      advertencias.push({
        nivel: 'revision',
        mensaje: `${conceptosSinMapeoCatalogo} concepto(s) usan código provisional (sin mapeo Previred en catálogo).`,
      });
    }
  }

  return {
    periodo: input.periodo,
    empresaNombre: input.empresaNombre,
    idNominaPeriodo: input.idNominaPeriodo,
    idLiquidacionPeriodo: input.idLiquidacionPeriodo,
    versionLiquidacion: input.versionLiquidacion,
    totalTrabajadores: input.trabajadores.length,
    lineas,
    advertencias,
    lineasOmitidas,
    conceptosSinCodigo,
    conceptosSinMapeoCatalogo,
    listoParaEnvio: listoParaEnvioPrevired({
      lineas: lineas.length,
      conceptosSinCodigo,
      conceptosSinMapeoCatalogo,
      tieneBloqueo,
    }),
  };
}

export function puedeDescargarBorradorPrevired(borrador: PreviredBorradorExport | null): boolean {
  if (!borrador) return false;
  if (borrador.advertencias.some((a) => a.nivel === 'bloqueo')) return false;
  return borrador.lineas.length > 0;
}

function escaparCeldaCsv(valor: string): string {
  if (/[",\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function generarCsvPrevired(borrador: PreviredBorradorExport): string {
  const headers = ['RUT', 'Nombre', 'Código movimiento', 'Glosa', 'Tipo', 'Monto', 'Origen mapeo'];
  const filas = borrador.lineas.map((linea) =>
    [
      linea.rut,
      linea.nombreTrabajador,
      linea.codigoMovimiento,
      linea.glosa,
      linea.tipo,
      String(linea.monto),
      linea.origenMapeo === 'catalogo_previred' ? 'Catálogo' : 'Provisional',
    ]
      .map(escaparCeldaCsv)
      .join(','),
  );
  return [headers.join(','), ...filas].join('\r\n');
}

export function nombreArchivoBorradorPrevired(periodo: string): string {
  const safe = periodo.replace(/[^0-9-]/g, '');
  return `previred-borrador-${safe || 'periodo'}.csv`;
}

export function descargarCsvPrevired(borrador: PreviredBorradorExport): void {
  const csv = generarCsvPrevired(borrador);
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivoBorradorPrevired(borrador.periodo);
  enlace.click();
  URL.revokeObjectURL(url);
}
