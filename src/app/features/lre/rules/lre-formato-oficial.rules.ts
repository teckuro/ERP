import type { LreBorradorExport, LreLineaExport } from '../models/lre-export.model';
import {
  LRE_COLUMNAS_OFICIALES,
  esCodigoMontoLre,
} from './lre-columnas-oficiales';

/** Identificador de formato oficial DT (carga masiva Mi DT). */
export const LRE_FORMATO_OFICIAL_DT = 'LRE-OFICIAL-DT-v1';

export interface LreFormatoOficialOpciones {
  /** RUT empleador para nombre de archivo (`rutempleador_aaaamm`). */
  rutEmpleador?: string | null;
}

const COTIZACIONES_TRABAJADOR = new Set([
  '3141', '3143', '3144', '3146', '3147', '3151', '3154', '3155', '3156', '3157', '3158',
]);
const IMPUESTOS_REMUNERACIONES = new Set([
  '3161', '3163', '3164', '3165', '3166', '3167',
]);
const IMPUESTOS_INDEMNIZACIONES = new Set(['3162']);

/**
 * Genera CSV oficial LRE: 1 fila por trabajador, headers = códigos DT, delimitador `;`.
 * LRE-02a: pivotea montos liquidados; identificación 11xx queda vacía salvo RUT (1101).
 * Totales 5xxx se calculan desde las columnas de monto.
 */
export function generarFormatoOficialLre(borrador: LreBorradorExport): string {
  const porTrabajador = agruparLineasPorTrabajador(borrador.lineas);
  const headers = LRE_COLUMNAS_OFICIALES.join(';');
  const filas = [...porTrabajador.values()].map((grupo) =>
    construirFilaTrabajador(grupo.rut, grupo.montos).join(';'),
  );
  return [headers, ...filas].join('\r\n');
}

export function nombreArchivoOficialLre(
  periodoYm: string,
  rutEmpleador?: string | null,
): string {
  const periodo = periodoYm.replace(/[^0-9]/g, '').slice(0, 6);
  const rut = normalizarRutLre(rutEmpleador ?? '') || 'empleador';
  return `${rut}_${periodo || '000000'}.csv`;
}

export function descargarFormatoOficialLre(
  borrador: LreBorradorExport,
  opciones?: LreFormatoOficialOpciones,
): void {
  const contenido = generarFormatoOficialLre(borrador);
  const bytes = codificarAnsiLatin1(contenido);
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: 'text/csv;charset=windows-1252;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivoOficialLre(borrador.periodo, opciones?.rutEmpleador);
  a.click();
  URL.revokeObjectURL(url);
}

export function normalizarRutLre(rut: string): string {
  const limpio = (rut ?? '').trim().replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  if (!limpio) return '';
  if (limpio.includes('-')) return limpio;
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

function agruparLineasPorTrabajador(
  lineas: readonly LreLineaExport[],
): Map<string, { rut: string; montos: Map<string, number> }> {
  const mapa = new Map<string, { rut: string; montos: Map<string, number> }>();
  for (const linea of lineas) {
    const rut = normalizarRutLre(linea.rut) || linea.rut.trim() || '—';
    let grupo = mapa.get(rut);
    if (!grupo) {
      grupo = { rut, montos: new Map() };
      mapa.set(rut, grupo);
    }
    const codigo = (linea.codigoLre ?? '').trim();
    if (!codigo || !esCodigoMontoLre(codigo)) continue;
    const monto = Math.max(0, Math.round(Number(linea.monto) || 0));
    grupo.montos.set(codigo, (grupo.montos.get(codigo) ?? 0) + monto);
  }
  return mapa;
}

function construirFilaTrabajador(rut: string, montos: Map<string, number>): string[] {
  const totales = calcularTotales(montos);
  return LRE_COLUMNAS_OFICIALES.map((codigo) => {
    if (codigo === '1101') return rut;
    if (totales.has(codigo)) {
      const valor = totales.get(codigo)!;
      return valor === 0 ? '' : String(valor);
    }
    if (montos.has(codigo)) {
      const valor = montos.get(codigo)!;
      return valor === 0 ? '' : String(valor);
    }
    return '';
  });
}

function calcularTotales(montos: Map<string, number>): Map<string, number> {
  let t21 = 0;
  let t22 = 0;
  let t23 = 0;
  let t24 = 0;
  let cotiz = 0;
  let impRem = 0;
  let impInd = 0;
  let otrosDesc = 0;
  let aportes = 0;
  let indemnizaciones = 0;

  for (const [codigo, monto] of montos) {
    const n = Number(codigo);
    if (n >= 2101 && n <= 2199) t21 += monto;
    else if (n >= 2201 && n <= 2299) t22 += monto;
    else if (n >= 2301 && n <= 2399) {
      t23 += monto;
      if (['2313', '2314', '2315', '2316', '2331'].includes(codigo)) {
        indemnizaciones += monto;
      }
    } else if (n >= 2401 && n <= 2499) {
      t24 += monto;
      indemnizaciones += monto;
    } else if (COTIZACIONES_TRABAJADOR.has(codigo)) cotiz += monto;
    else if (IMPUESTOS_REMUNERACIONES.has(codigo)) impRem += monto;
    else if (IMPUESTOS_INDEMNIZACIONES.has(codigo)) impInd += monto;
    else if (n >= 3100 && n < 4100) otrosDesc += monto;
    else if (n >= 4100 && n < 5200) aportes += monto;
  }

  const haberes = t21 + t22 + t23 + t24;
  const descuentos = cotiz + impRem + impInd + otrosDesc;
  const liquido = Math.max(0, haberes - descuentos);

  return new Map<string, number>([
    ['5210', t21],
    ['5220', t22],
    ['5230', t23],
    ['5240', t24],
    ['5201', haberes],
    ['5341', cotiz],
    ['5361', impRem],
    ['5362', impInd],
    ['5302', otrosDesc],
    ['5301', descuentos],
    ['5410', aportes],
    ['5501', liquido],
    ['5502', indemnizaciones],
    ['5564', 0],
    ['5565', 0],
  ]);
}

/** Codifica a bytes Latin-1/ANSI para carga DT (montos y RUT son ASCII). */
function codificarAnsiLatin1(texto: string): Uint8Array {
  const out = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) {
    const code = texto.charCodeAt(i);
    out[i] = code <= 0xff ? code : 0x3f; // '?' si hay carácter fuera de Latin-1
  }
  return out;
}
