import { describe, expect, it } from 'vitest';

import { claseSegmentNavActivo } from './proceso-mensual-segment-nav.rules';

describe('proceso-mensual-segment-nav.rules', () => {
  it('claseSegmentNavActivo agrega modificador active', () => {
    expect(claseSegmentNavActivo(false)).toBe('payroll-segment-nav__btn');
    expect(claseSegmentNavActivo(true)).toBe('payroll-segment-nav__btn payroll-segment-nav__btn--active');
    expect(claseSegmentNavActivo(true, 'stat')).toBe('payroll-segment-nav__btn payroll-segment-nav__btn--active');
  });
});
