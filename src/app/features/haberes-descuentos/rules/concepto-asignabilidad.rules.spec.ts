import type { ConceptoAsignableInput } from './concepto-asignabilidad.rules';
import {
  clasificarVigenciaConcepto,
  esConceptoAsignable,
  vigenciasCoherentesConcepto,
} from './concepto-asignabilidad.rules';

const ref = new Date(2026, 4, 15); // 15 May 2026 local

function base(over: Partial<ConceptoAsignableInput> = {}): ConceptoAsignableInput {
  return {
    tipo: 'HABER',
    esSistema: false,
    calculoAutomatico: false,
    vigente: true,
    vigenciaInicio: '2026-01-01',
    vigenciaFin: '2026-12-31',
    ...over,
  };
}

describe('vigenciasCoherentesConcepto', () => {
  it('rechaza fin anterior a inicio', () => {
    expect(
      vigenciasCoherentesConcepto(
        base({ vigenciaInicio: '2026-06-01', vigenciaFin: '2026-01-01' }),
      ),
    ).toBe(false);
  });

  it('acepta rango válido', () => {
    expect(vigenciasCoherentesConcepto(base())).toBe(true);
  });
});

describe('esConceptoAsignable', () => {
  it('true para HABER vigente no sistema no automático en período', () => {
    expect(esConceptoAsignable(base(), ref)).toBe(true);
  });

  it('true para DESCUENTO vigente no sistema no automático', () => {
    expect(esConceptoAsignable(base({ tipo: 'DESCUENTO' }), ref)).toBe(true);
  });

  it('false para APORTE_EMPLEADOR', () => {
    expect(esConceptoAsignable(base({ tipo: 'APORTE_EMPLEADOR' }), ref)).toBe(false);
  });

  it('false para concepto automático', () => {
    expect(esConceptoAsignable(base({ calculoAutomatico: true }), ref)).toBe(false);
  });

  it('false para concepto sistema', () => {
    expect(esConceptoAsignable(base({ esSistema: true }), ref)).toBe(false);
  });

  it('false para vencido respecto a referencia', () => {
    expect(
      esConceptoAsignable(
        base({ vigenciaInicio: '2025-01-01', vigenciaFin: '2026-01-31', vigente: true }),
        ref,
      ),
    ).toBe(false);
  });

  it('false para futuro respecto a referencia', () => {
    expect(
      esConceptoAsignable(
        base({ vigenciaInicio: '2026-08-01', vigenciaFin: '2026-12-31', vigente: true }),
        ref,
      ),
    ).toBe(false);
  });

  it('false para sin vigencia válida (fechas incoherentes)', () => {
    expect(
      esConceptoAsignable(
        base({ vigenciaInicio: '2026-12-01', vigenciaFin: '2026-01-01', vigente: true }),
        ref,
      ),
    ).toBe(false);
  });

  it('false si no está vigente en catálogo', () => {
    expect(esConceptoAsignable(base({ vigente: false }), ref)).toBe(false);
  });
});

describe('clasificarVigenciaConcepto', () => {
  it('marca futuro antes de inicio', () => {
    expect(
      clasificarVigenciaConcepto(
        base({ vigenciaInicio: '2026-08-01', vigenciaFin: '2026-12-31' }),
        ref,
      ),
    ).toBe('FUTURO');
  });

  it('marca vencido después de fin', () => {
    expect(
      clasificarVigenciaConcepto(
        base({ vigenciaInicio: '2025-01-01', vigenciaFin: '2026-01-31' }),
        ref,
      ),
    ).toBe('VENCIDO');
  });
});
