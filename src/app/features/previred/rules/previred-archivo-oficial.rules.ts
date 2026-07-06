import type { PreviredBorradorExport, PreviredLineaExport, PreviredTipoMovimiento } from '../models/previred-export.model';

export const PREVIRED_FORMATO_ARCHIVO_OFICIAL = 'PREVIRED-REM-v1' as const;

export type PreviredTipoArchivoMovimiento = 'H' | 'D' | 'C';

export interface PreviredResumenTrabajadorArchivo {
  rut: string;
  nombreTrabajador: string;
  totalHaberes: number;
  totalDescuentos: number;
  totalCotizaciones: number;
  cantidadMovimientos: number;
}

export interface PreviredTotalesArchivoOficial {
  trabajadores: number;
  movimientos: number;
  haberes: number;
  descuentos: number;
  cotizaciones: number;
  checksumMontos: number;
}

export interface PreviredArchivoOficialGenerado {
  formato: typeof PREVIRED_FORMATO_ARCHIVO_OFICIAL;
  periodo: string;
  empresaNombre: string;
  versionLiquidacion: number;
  resumenTrabajadores: PreviredResumenTrabajadorArchivo[];
  totales: PreviredTotalesArchivoOficial;
  contenido: string;
}

export function normalizarRutPrevired(rut: string): string {
  return rut.replace(/\./g, '').trim();
}

export function tipoArchivoDesdeMovimiento(tipo: PreviredTipoMovimiento): PreviredTipoArchivoMovimiento {
  if (tipo === 'haber') return 'H';
  if (tipo === 'descuento') return 'D';
  return 'C';
}

export function resumirTrabajadoresArchivoPrevired(
  lineas: readonly PreviredLineaExport[],
): PreviredResumenTrabajadorArchivo[] {
  const porRut = new Map<string, PreviredResumenTrabajadorArchivo>();

  for (const linea of lineas) {
    const rut = normalizarRutPrevired(linea.rut);
    const actual = porRut.get(rut) ?? {
      rut,
      nombreTrabajador: linea.nombreTrabajador,
      totalHaberes: 0,
      totalDescuentos: 0,
      totalCotizaciones: 0,
      cantidadMovimientos: 0,
    };

    if (linea.tipo === 'haber') actual.totalHaberes += linea.monto;
    else if (linea.tipo === 'descuento') actual.totalDescuentos += linea.monto;
    else actual.totalCotizaciones += linea.monto;

    actual.cantidadMovimientos += 1;
    porRut.set(rut, actual);
  }

  return [...porRut.values()].sort((a, b) => a.nombreTrabajador.localeCompare(b.nombreTrabajador));
}

export function calcularTotalesArchivoPrevired(
  lineas: readonly PreviredLineaExport[],
  resumenTrabajadores: readonly PreviredResumenTrabajadorArchivo[],
): PreviredTotalesArchivoOficial {
  let haberes = 0;
  let descuentos = 0;
  let cotizaciones = 0;

  for (const linea of lineas) {
    if (linea.tipo === 'haber') haberes += linea.monto;
    else if (linea.tipo === 'descuento') descuentos += linea.monto;
    else cotizaciones += linea.monto;
  }

  return {
    trabajadores: resumenTrabajadores.length,
    movimientos: lineas.length,
    haberes,
    descuentos,
    cotizaciones,
    checksumMontos: haberes + descuentos + cotizaciones,
  };
}

function escaparCampoArchivo(valor: string): string {
  return valor.replace(/\|/g, '/').replace(/\r?\n/g, ' ').trim();
}

export function generarArchivoOficialPrevired(
  borrador: PreviredBorradorExport,
): PreviredArchivoOficialGenerado {
  const resumenTrabajadores = resumirTrabajadoresArchivoPrevired(borrador.lineas);
  const totales = calcularTotalesArchivoPrevired(borrador.lineas, resumenTrabajadores);
  const filas: string[] = [];

  filas.push(
    [
      'H',
      PREVIRED_FORMATO_ARCHIVO_OFICIAL,
      borrador.periodo,
      escaparCampoArchivo(borrador.empresaNombre),
      String(borrador.versionLiquidacion),
      String(totales.trabajadores),
      String(totales.movimientos),
    ].join('|'),
  );

  for (const trabajador of resumenTrabajadores) {
    filas.push(
      [
        'T',
        trabajador.rut,
        escaparCampoArchivo(trabajador.nombreTrabajador),
        String(trabajador.totalHaberes),
        String(trabajador.totalDescuentos),
        String(trabajador.totalCotizaciones),
        String(trabajador.cantidadMovimientos),
      ].join('|'),
    );
  }

  for (const linea of borrador.lineas) {
    filas.push(
      [
        'M',
        normalizarRutPrevired(linea.rut),
        linea.codigoMovimiento,
        tipoArchivoDesdeMovimiento(linea.tipo),
        String(linea.monto),
        escaparCampoArchivo(linea.glosa),
      ].join('|'),
    );
  }

  filas.push(
    [
      'C',
      String(totales.movimientos),
      String(totales.trabajadores),
      String(totales.checksumMontos),
      String(totales.haberes),
      String(totales.descuentos),
      String(totales.cotizaciones),
    ].join('|'),
  );

  return {
    formato: PREVIRED_FORMATO_ARCHIVO_OFICIAL,
    periodo: borrador.periodo,
    empresaNombre: borrador.empresaNombre,
    versionLiquidacion: borrador.versionLiquidacion,
    resumenTrabajadores,
    totales,
    contenido: `${filas.join('\r\n')}\r\n`,
  };
}

export function puedeDescargarArchivoOficialPrevired(borrador: PreviredBorradorExport | null): boolean {
  return !!borrador?.listoParaEnvio && borrador.lineas.length > 0;
}

export function nombreArchivoOficialPrevired(periodo: string): string {
  const safe = periodo.replace(/[^0-9-]/g, '');
  return `previred-remuneraciones-${safe || 'periodo'}.txt`;
}

export function descargarArchivoOficialPrevired(borrador: PreviredBorradorExport): PreviredArchivoOficialGenerado {
  const archivo = generarArchivoOficialPrevired(borrador);
  const blob = new Blob([archivo.contenido], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivoOficialPrevired(borrador.periodo);
  enlace.click();
  URL.revokeObjectURL(url);
  return archivo;
}
