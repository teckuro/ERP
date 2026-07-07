import { primerDiaSqlDesdeYm, ultimoDiaSqlDesdeYm } from '../../../../core/services/periodo-activo.service';

const MILISEGUNDOS_POR_DIA = 86_400_000;

function parseSqlDate(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((value ?? '').trim());
  if (!match) {
    return null;
  }
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function formatSqlDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/** Días calendario inclusivos entre dos fechas SQL (YYYY-MM-DD). */
export function calcularDiasInclusiveSql(
  fechaDesde: string | null | undefined,
  fechaHasta: string | null | undefined,
): number | null {
  const desde = parseSqlDate(fechaDesde);
  const hasta = parseSqlDate(fechaHasta);
  if (!desde || !hasta || hasta.getTime() < desde.getTime()) {
    return null;
  }
  return Math.floor((hasta.getTime() - desde.getTime()) / MILISEGUNDOS_POR_DIA) + 1;
}

/** Intersección del rango con el mes del período; devuelve días del mes que aplica. */
export function calcularDiasAusenciaEnPeriodo(
  fechaDesde: string | null | undefined,
  fechaHasta: string | null | undefined,
  periodoYm: string,
): number | null {
  if (!fechaDesde?.trim() || !fechaHasta?.trim()) {
    return null;
  }
  const iniMes = primerDiaSqlDesdeYm(periodoYm);
  const finMes = ultimoDiaSqlDesdeYm(periodoYm);
  const clipDesde = fechaDesde.trim() > iniMes ? fechaDesde.trim() : iniMes;
  const clipHasta = fechaHasta.trim() < finMes ? fechaHasta.trim() : finMes;
  if (clipDesde > clipHasta) {
    return 0;
  }
  return calcularDiasInclusiveSql(clipDesde, clipHasta);
}

/** Fecha fin inclusiva a partir de inicio + cantidad de días. */
export function fechaHastaDesdeCantidad(
  fechaDesde: string | null | undefined,
  cantidad: number | null | undefined,
): string {
  const inicio = parseSqlDate(fechaDesde);
  if (!inicio || cantidad == null || !Number.isFinite(cantidad) || cantidad <= 0) {
    return '';
  }
  const fin = new Date(inicio.getTime() + (cantidad - 1) * MILISEGUNDOS_POR_DIA);
  return formatSqlDate(fin);
}

export function rangoFechasValido(
  fechaDesde: string | null | undefined,
  fechaHasta: string | null | undefined,
): boolean {
  const desde = parseSqlDate(fechaDesde);
  const hasta = parseSqlDate(fechaHasta);
  return !!desde && !!hasta && hasta.getTime() >= desde.getTime();
}

export function formatearRangoFechasUi(
  fechaDesde: string | null | undefined,
  fechaHasta: string | null | undefined,
): string {
  const fmt = (value: string | null | undefined): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((value ?? '').trim());
    if (!match) {
      return '';
    }
    return `${match[3]}/${match[2]}/${match[1]}`;
  };
  const desde = fmt(fechaDesde);
  const hasta = fmt(fechaHasta);
  if (desde && hasta) {
    return `${desde} – ${hasta}`;
  }
  return desde || hasta;
}
