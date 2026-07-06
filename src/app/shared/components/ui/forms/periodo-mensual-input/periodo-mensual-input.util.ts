import { etiquetaPeriodoDesdeYm } from '../../../../../core/services/periodo-activo.service';

export interface PeriodoMensualMesOpcion {
  value: string;
  label: string;
}

export const MESES_PERIODO_OPCIONES: readonly PeriodoMensualMesOpcion[] = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

/** Abreviaturas compactas para grilla 3×4 del panel (orden calendario). */
export const MESES_PERIODO_CORTO: readonly { value: string; corto: string }[] = [
  { value: '01', corto: 'ENER' },
  { value: '02', corto: 'FEBR' },
  { value: '03', corto: 'MARZ' },
  { value: '04', corto: 'ABRL' },
  { value: '05', corto: 'MAY' },
  { value: '06', corto: 'JUN' },
  { value: '07', corto: 'JUL' },
  { value: '08', corto: 'AGOS' },
  { value: '09', corto: 'SEPT' },
  { value: '10', corto: 'OCT' },
  { value: '11', corto: 'NOV' },
  { value: '12', corto: 'DIC' },
];

export interface PeriodoMensualPanelMes {
  value: string;
  label: string;
  labelCorto: string;
  habilitado: boolean;
}

export function normalizePeriodoYm(value: string | null | undefined): string {
  const t = (value ?? '').trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(t) ? t : '';
}

export function periodoYmActual(referenceDate: Date = new Date()): string {
  return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
}

export function splitPeriodoYm(ym: string): { anio: string; mes: string } | null {
  const normalizado = normalizePeriodoYm(ym);
  if (!normalizado) return null;
  return { anio: normalizado.slice(0, 4), mes: normalizado.slice(5, 7) };
}

export function mergePeriodoYm(anio: string, mes: string): string {
  const mesNormalizado = mes.padStart(2, '0');
  if (!/^\d{4}$/.test(anio) || !/^(0[1-9]|1[0-2])$/.test(mesNormalizado)) {
    return '';
  }
  return `${anio}-${mesNormalizado}`;
}

export function etiquetaPeriodoMensualInput(ym: string): string {
  return etiquetaPeriodoDesdeYm(normalizePeriodoYm(ym));
}

export interface PeriodoMensualGrupoAnio {
  anio: string;
  meses: readonly { value: string; label: string }[];
}

export function buildPeriodoMensualGrupos(
  selectedYm: string,
  minYm = '',
  maxYm = '',
  referenceDate: Date = new Date(),
): PeriodoMensualGrupoAnio[] {
  const years = buildPeriodoYearOptions(selectedYm, minYm, maxYm, referenceDate);
  const grupos: PeriodoMensualGrupoAnio[] = [];

  for (const year of years) {
    const meses: { value: string; label: string }[] = [];
    for (let index = MESES_PERIODO_OPCIONES.length - 1; index >= 0; index -= 1) {
      const mes = MESES_PERIODO_OPCIONES[index];
      const ym = `${year}-${mes.value}`;
      if (!periodoYmDentroDeRango(ym, minYm, maxYm)) {
        continue;
      }
      meses.push({ value: ym, label: mes.label });
    }
    if (meses.length > 0) {
      grupos.push({ anio: String(year), meses });
    }
  }

  const seleccion = normalizePeriodoYm(selectedYm);
  if (seleccion && periodoYmDentroDeRango(seleccion, minYm, maxYm)) {
    const yaIncluido = grupos.some((grupo) =>
      grupo.meses.some((mes) => mes.value === seleccion),
    );
    if (!yaIncluido) {
      const partes = splitPeriodoYm(seleccion);
      if (partes) {
        const mesLabel = MESES_PERIODO_OPCIONES.find((m) => m.value === partes.mes)?.label
          ?? partes.mes;
        const existente = grupos.find((g) => g.anio === partes.anio);
        if (existente) {
          grupos[grupos.indexOf(existente)] = {
            ...existente,
            meses: [{ value: seleccion, label: mesLabel }, ...existente.meses],
          };
        } else {
          grupos.unshift({
            anio: partes.anio,
            meses: [{ value: seleccion, label: mesLabel }],
          });
        }
      }
    }
  }

  return grupos;
}

export function buildPeriodoYearOptions(
  selectedYm: string,
  minYm = '',
  maxYm = '',
  referenceDate: Date = new Date(),
): number[] {
  const nowYear = referenceDate.getFullYear();
  let minYear = nowYear - 10;
  let maxYear = nowYear + 3;

  const minPartes = splitPeriodoYm(minYm);
  if (minPartes) {
    minYear = Math.min(minYear, Number(minPartes.anio));
  }

  const maxPartes = splitPeriodoYm(maxYm);
  if (maxPartes) {
    maxYear = Math.max(maxYear, Number(maxPartes.anio));
  }

  const seleccion = splitPeriodoYm(selectedYm);
  if (seleccion) {
    const ySel = Number(seleccion.anio);
    minYear = Math.min(minYear, ySel);
    maxYear = Math.max(maxYear, ySel);
  }

  if (minYear > maxYear) {
    maxYear = minYear;
  }

  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year);
  }
  return years;
}

export function anioInicialPanel(
  selectedYm: string,
  minYm = '',
  maxYm = '',
  referenceDate: Date = new Date(),
): number {
  const seleccion = splitPeriodoYm(selectedYm);
  if (seleccion) {
    return Number(seleccion.anio);
  }
  const years = buildPeriodoYearOptions(selectedYm, minYm, maxYm, referenceDate);
  return years[0] ?? referenceDate.getFullYear();
}

export function limitesAnioPanel(
  selectedYm: string,
  minYm = '',
  maxYm = '',
  referenceDate: Date = new Date(),
): { min: number; max: number } {
  const years = buildPeriodoYearOptions(selectedYm, minYm, maxYm, referenceDate);
  if (years.length === 0) {
    const y = referenceDate.getFullYear();
    return { min: y, max: y };
  }

  let min = Math.min(...years);
  let max = Math.max(...years);

  const minPartes = splitPeriodoYm(minYm);
  if (minPartes) {
    min = Math.max(min, Number(minPartes.anio));
  }

  const maxPartes = splitPeriodoYm(maxYm);
  if (maxPartes) {
    max = Math.min(max, Number(maxPartes.anio));
  }

  if (min > max) {
    max = min;
  }

  return { min, max };
}

export function buildAniosPanelLista(
  selectedYm: string,
  minYm = '',
  maxYm = '',
  referenceDate: Date = new Date(),
): number[] {
  const limites = limitesAnioPanel(selectedYm, minYm, maxYm, referenceDate);
  const years = buildPeriodoYearOptions(selectedYm, minYm, maxYm, referenceDate);
  return years.filter((year) => year >= limites.min && year <= limites.max);
}

export function filtrarAniosDisponibles(
  anios: readonly number[],
  busqueda: string,
): number[] {
  const termino = busqueda.trim();
  if (!termino) {
    return [...anios];
  }
  return anios.filter((anio) => String(anio).includes(termino));
}

export function buildPeriodoMensualPanelMeses(
  anio: number | string,
  minYm = '',
  maxYm = '',
): PeriodoMensualPanelMes[] {
  const anioTexto = String(anio);
  if (!/^\d{4}$/.test(anioTexto)) {
    return [];
  }

  return MESES_PERIODO_CORTO.map((mes) => {
    const value = `${anioTexto}-${mes.value}`;
    const label =
      MESES_PERIODO_OPCIONES.find((opcion) => opcion.value === mes.value)?.label ?? mes.value;
    return {
      value,
      label,
      labelCorto: mes.corto,
      habilitado: periodoYmDentroDeRango(value, minYm, maxYm),
    };
  });
}

export function periodoYmDentroDeRango(ym: string, minYm = '', maxYm = ''): boolean {
  const normalizado = normalizePeriodoYm(ym);
  if (!normalizado) return false;
  if (minYm && normalizePeriodoYm(minYm) && normalizado < normalizePeriodoYm(minYm)) {
    return false;
  }
  if (maxYm && normalizePeriodoYm(maxYm) && normalizado > normalizePeriodoYm(maxYm)) {
    return false;
  }
  return true;
}
