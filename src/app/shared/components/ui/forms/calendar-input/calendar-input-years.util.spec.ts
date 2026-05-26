import { describe, expect, it } from 'vitest';

import {
  buildCalendarYearOptions,
  resolveCalendarYearBounds,
} from './calendar-input-years.util';

describe('calendar-input-years.util', () => {
  const ref = new Date(2026, 4, 19);

  it('sin max usa año actual como tope (no +20 / 2046)', () => {
    const bounds = resolveCalendarYearBounds('', '', ref);
    expect(bounds.maxYear).toBe(2026);
    expect(bounds.minYear).toBe(1926);

    const years = buildCalendarYearOptions(bounds);
    expect(years[0]).toBe(1926);
    expect(years[years.length - 1]).toBe(2026);
    expect(years).not.toContain(2046);
  });

  it('con max ISO respeta el tope del input', () => {
    const bounds = resolveCalendarYearBounds('', '2026-05-19', ref);
    expect(bounds.maxYear).toBe(2026);

    const years = buildCalendarYearOptions(bounds);
    expect(years[years.length - 1]).toBe(2026);
    expect(years).not.toContain(2047);
  });

  it('con min y max acota el rango ascendente', () => {
    const bounds = resolveCalendarYearBounds('2024-01-01', '2026-12-31', ref);
    const years = buildCalendarYearOptions(bounds);
    expect(years).toEqual([2024, 2025, 2026]);
  });
});
