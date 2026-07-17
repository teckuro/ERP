import type {
  LiquidacionConcepto,
  LiquidacionTrabajador,
} from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import type { LreBorradorExport, LreLineaExport } from '../models/lre-export.model';

function esAporteReferencia(concepto: LiquidacionConcepto): boolean {
  return concepto.tipo === 'cotizacion' || concepto.clasificacion === 'aporte_referencia';
}

export function mapearTrabajadorALre(input: {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
}): { lineas: LreLineaExport[]; sinCodigo: number } {
  const lineas: LreLineaExport[] = [];
  let sinCodigo = 0;
  const rut = input.trabajador.rut?.trim() || '—';

  for (const concepto of input.conceptos) {
    if (concepto.monto === 0 || esAporteReferencia(concepto)) continue;
    const codigo = concepto.codigoLre?.trim();
    if (!codigo) {
      sinCodigo++;
      continue;
    }
    lineas.push({
      rut,
      nombreTrabajador: input.trabajador.nombreTrabajador,
      codigoLre: codigo,
      nombreConcepto: concepto.nombre,
      monto: concepto.monto,
      tipo: concepto.tipo,
    });
  }
  return { lineas, sinCodigo };
}

export function construirBorradorLre(input: {
  periodo: string;
  empresaNombre: string;
  idNominaPeriodo?: string | null;
  idLiquidacionPeriodo: number;
  versionLiquidacion: number;
  trabajadores: readonly {
    trabajador: LiquidacionTrabajador;
    conceptos: readonly LiquidacionConcepto[];
  }[];
}): LreBorradorExport {
  const lineas: LreLineaExport[] = [];
  let conceptosSinCodigoLre = 0;
  for (const fila of input.trabajadores) {
    const r = mapearTrabajadorALre(fila);
    lineas.push(...r.lineas);
    conceptosSinCodigoLre += r.sinCodigo;
  }
  return {
    periodo: input.periodo,
    empresaNombre: input.empresaNombre,
    idNominaPeriodo: input.idNominaPeriodo ?? null,
    idLiquidacionPeriodo: input.idLiquidacionPeriodo,
    versionLiquidacion: input.versionLiquidacion,
    totalTrabajadores: input.trabajadores.length,
    lineas,
    conceptosSinCodigoLre,
    listoParaEnvio: lineas.length > 0 && conceptosSinCodigoLre === 0,
  };
}

export function puedeDescargarLre(borrador: LreBorradorExport | null): boolean {
  return (borrador?.lineas.length ?? 0) > 0;
}

export function generarCsvLre(borrador: LreBorradorExport): string {
  const headers = ['RUT', 'Trabajador', 'Código LRE', 'Concepto', 'Tipo', 'Monto'];
  const filas = borrador.lineas.map((l) =>
    [l.rut, l.nombreTrabajador, l.codigoLre, l.nombreConcepto, l.tipo, String(l.monto)].join(','),
  );
  return [headers.join(','), ...filas].join('\r\n');
}

export function descargarCsvLre(borrador: LreBorradorExport): void {
  const csv = generarCsvLre(borrador);
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lre-borrador-${borrador.periodo.replace(/[^0-9-]/g, '')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
