import { formatearClp, formatearClpDecimal } from '../../../shared/dominio/moneda';

/** Unidades con que se publican los parámetros mensuales (PreviRed, SII). */
export type UnidadParametro = 'CLP' | 'UF' | '%' | 'IMM';

/** Decimales mínimos y máximos al mostrar una cifra. */
export interface DecimalesCifra {
  min: number;
  max: number;
}

const DECIMALES_POR_UNIDAD: Record<UnidadParametro, DecimalesCifra> = {
  CLP: { min: 0, max: 0 },
  UF: { min: 0, max: 2 },
  '%': { min: 0, max: 3 },
  IMM: { min: 0, max: 2 },
};

const FORMATOS_NUMERO = new Map<string, Intl.NumberFormat>();

function formatoNumero({ min, max }: DecimalesCifra): Intl.NumberFormat {
  const clave = `${min}-${max}`;
  let formato = FORMATOS_NUMERO.get(clave);
  if (!formato) {
    formato = new Intl.NumberFormat('es-CL', { minimumFractionDigits: min, maximumFractionDigits: max });
    FORMATOS_NUMERO.set(clave, formato);
  }
  return formato;
}

export function numeroParametro(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Cifra de un formulario de parámetros, sin la unidad (salvo `$`, que va pegado
 * como en el resto del ERP): `$529.000`, `$41.439,89`, `87,8`, `0,6`.
 * Los porcentajes y topes usan decimales variables: en un formulario cada cifra se lee sola.
 * Las grillas, en cambio, fijan decimales para que la columna quede alineada.
 */
export function formatearCifraParametro(
  valor: unknown,
  unidad: UnidadParametro,
  decimales: DecimalesCifra = DECIMALES_POR_UNIDAD[unidad],
): string | null {
  const numero = numeroParametro(valor);
  if (numero === null) {
    return null;
  }
  if (unidad === 'CLP') {
    return decimales.max > 0 ? formatearClpDecimal(numero, decimales.max) : formatearClp(numero);
  }
  return formatoNumero(decimales).format(numero);
}

/**
 * Fecha a la que corresponde la UF de un período `AAAA-MM`.
 * La UF cargada desde PreviRed es la del último día del mes, no la del día de hoy.
 * Devuelve `null` si el período no es válido.
 */
export function fechaUfDelPeriodo(periodoYm: string | null | undefined): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(periodoYm ?? '');
  if (!match) {
    return null;
  }
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  if (mes < 1 || mes > 12) {
    return null;
  }

  // Día 0 del mes siguiente = último día de `mes`. Todo en UTC para que la zona horaria no lo corra.
  const ultimoDia = new Date(Date.UTC(anio, mes, 0));
  return FORMATO_FECHA_UF.format(ultimoDia).replaceAll('.', '');
}

const FORMATO_FECHA_UF = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const FORMATO_PERIODO = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** `2026-11` → `nov 2026`, para columnas de período en grillas. */
export function formatoPeriodoGridParametros(valor: unknown): string {
  const match = typeof valor === 'string' ? /^(\d{4})-(\d{2})/.exec(valor) : null;
  if (!match) {
    return valor ? String(valor) : '—';
  }
  const fecha = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return FORMATO_PERIODO.format(fecha).replace('.', '');
}
