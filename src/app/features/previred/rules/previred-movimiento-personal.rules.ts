import type { NovedadMensual } from '../../nomina-mensual/novedades/models/novedad-mensual.model';

export interface PreviredMovimientoPersonalResult {
  codigoMovimientoPersonal: number;
  fechaDesde: string;
  fechaHasta: string;
  diasLicencia: number;
}

export interface PreviredRimaInput {
  movimientoPersonal: number;
  diasLicencia: number;
  rentaImponibleMesAnterior: number | null;
  diasMesAnterior?: number;
}

const NOVEDADES_APROBADAS = new Set([
  'aprobada',
  'incorporada_a_pre_nomina',
  'calculada',
]);

export function resolverMovimientoPersonalPrevired(
  novedades: readonly NovedadMensual[],
): PreviredMovimientoPersonalResult {
  const licencias = novedades.filter(
    (n) =>
      n.categoria === 'licencia_permiso'
      && NOVEDADES_APROBADAS.has(n.estado),
  );

  if (licencias.length === 0) {
    return {
      codigoMovimientoPersonal: 0,
      fechaDesde: '',
      fechaHasta: '',
      diasLicencia: 0,
    };
  }

  const esAccidente = licencias.some((n) =>
    (n.observacion ?? '').toLowerCase().includes('accidente'),
  );
  const codigo = esAccidente ? 6 : 3;
  const diasLicencia = licencias.reduce(
    (acc, n) => acc + Math.max(0, Number(n.cantidad ?? 0)),
    0,
  );

  const fechas = licencias
    .map((n) => n.fechaEvento)
    .filter((f): f is string => !!f?.trim())
    .sort();

  return {
    codigoMovimientoPersonal: codigo,
    fechaDesde: formatearFechaPrevired(fechas[0]),
    fechaHasta: formatearFechaPrevired(fechas[fechas.length - 1]),
    diasLicencia,
  };
}

export function calcularRimaPrevired(input: PreviredRimaInput): number {
  if (input.movimientoPersonal !== 3 && input.movimientoPersonal !== 6) {
    return 0;
  }
  if (!input.rentaImponibleMesAnterior || input.diasLicencia <= 0) {
    return 0;
  }
  const diasBase = input.diasMesAnterior && input.diasMesAnterior > 0 ? input.diasMesAnterior : 30;
  return Math.round((input.rentaImponibleMesAnterior / diasBase) * input.diasLicencia);
}

export function periodoAnteriorErp(periodo: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(periodo.trim());
  if (!match) return null;
  let anio = Number(match[1]);
  let mes = Number(match[2]) - 1;
  if (mes === 0) {
    mes = 12;
    anio -= 1;
  }
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

function formatearFechaPrevired(fechaIso: string | undefined): string {
  if (!fechaIso?.trim()) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaIso.trim());
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}
