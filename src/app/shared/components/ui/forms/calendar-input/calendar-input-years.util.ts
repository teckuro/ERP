/** Límites del selector de año del calendario (sin +20 por defecto). */
export interface CalendarYearBounds {
  minYear: number;
  maxYear: number;
}

export function resolveCalendarYearBounds(
  minIso: string,
  maxIso: string,
  referenceDate: Date = new Date(),
): CalendarYearBounds {
  const currentYear = referenceDate.getFullYear();
  const minYear = minIso.trim()
    ? parseIsoYear(minIso)
    : currentYear - 100;
  const maxYear = maxIso.trim()
    ? parseIsoYear(maxIso)
    : currentYear;

  return {
    minYear: Math.min(minYear, maxYear),
    maxYear: Math.max(minYear, maxYear),
  };
}

export function buildCalendarYearOptions(bounds: CalendarYearBounds): number[] {
  const years: number[] = [];
  for (let year = bounds.minYear; year <= bounds.maxYear; year += 1) {
    years.push(year);
  }
  return years;
}

function parseIsoYear(iso: string): number {
  const match = iso.trim().match(/^(\d{4})-\d{2}-\d{2}$/);
  if (!match) {
    return new Date().getFullYear();
  }
  return Number(match[1]);
}
