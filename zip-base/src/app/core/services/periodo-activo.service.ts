import { Injectable, computed, signal } from '@angular/core';

const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Formato visual localizado (ej. Abril 2026). */
export function etiquetaPeriodoDesdeYm(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym?.trim() ?? '');
  if (!m) {
    return ym || '—';
  }
  const y = Number(m[1]);
  const idx = Number(m[2]) - 1;
  if (!Number.isInteger(y) || idx < 0 || idx > 11) {
    return ym;
  }
  return `${MESES_ES[idx]} ${y}`;
}

/** Primer día del mes en formato SQL (YYYY-MM-01). */
export function primerDiaSqlDesdeYm(ym: string): string {
  if (!/^\d{4}-\d{2}$/.test(ym?.trim() ?? '')) {
    return `${ym}-01`.slice(0, 10);
  }
  return `${ym}-01`;
}

/** Último día del mes en formato SQL (YYYY-MM-DD). */
export function ultimoDiaSqlDesdeYm(ym: string): string {
  const t = ym?.trim() ?? '';
  if (!/^\d{4}-\d{2}$/.test(t)) {
    return `${t}-01`.slice(0, 10);
  }
  const [ys, ms] = t.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const last = new Date(Date.UTC(y, m, 0));
  return `${last.getUTCFullYear()}-${String(last.getUTCMonth() + 1).padStart(2, '0')}-${String(last.getUTCDate()).padStart(2, '0')}`;
}

/** Indica si el rango [vigInicio, vigFin] intersecta el mes `ym` (YYYY-MM). */
export function vigenciaIntersecaMes(
  vigInicio: string | null,
  vigFin: string | null,
  ym: string,
): boolean {
  const iniMes = primerDiaSqlDesdeYm(ym);
  const finMes = ultimoDiaSqlDesdeYm(ym);
  const ini = vigInicio?.trim() || null;
  const fin = vigFin?.trim() || null;
  if (ini && ini > finMes) {
    return false;
  }
  if (fin && fin < iniMes) {
    return false;
  }
  return true;
}

@Injectable({ providedIn: 'root' })
export class PeriodoActivoService {
  /** Período activo global (YYYY-MM). Fuente única para módulos de remuneraciones. */
  readonly periodoYm = signal<string>(PeriodoActivoService.mesActual());

  /** Etiqueta para UI (ej. Abril 2026). */
  readonly etiqueta = computed(() => etiquetaPeriodoDesdeYm(this.periodoYm()));

  /** Alias de {@link etiqueta} (mismo valor que `periodoLabel` en requerimientos). */
  readonly periodoLabel = computed(() => this.etiqueta());

  /** Primer día del mes para RPC/SQL. */
  readonly primerDiaSql = computed(() => primerDiaSqlDesdeYm(this.periodoYm()));

  getPeriodo(): string {
    return this.periodoYm();
  }

  /** Establece el período global (YYYY-MM). */
  setPeriodo(ym: string): void {
    this.setPeriodoYm(ym);
  }

  setPeriodoYm(ym: string): void {
    const t = ym?.trim() ?? '';
    if (!/^\d{4}-\d{2}$/.test(t)) {
      return;
    }
    if (this.periodoYm() === t) {
      return;
    }
    this.periodoYm.set(t);
  }

  private static mesActual(): string {
    return PeriodoActivoService.dateToYm(new Date());
  }

  private static dateToYm(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
