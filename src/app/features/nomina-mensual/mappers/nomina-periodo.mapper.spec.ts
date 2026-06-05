import { describe, expect, it } from 'vitest';

import {
  ensamblarNominaPeriodo,
  rowToNominaPeriodoResumen,
  type NominaPeriodoRow,
} from './nomina-periodo.mapper';

const FILA_BASE: NominaPeriodoRow = {
  id: 'nom-1',
  id_empresa: 7,
  empresa_nombre: 'Demo',
  periodo: '2026-06',
  tipo: 'mensual',
  estado: 'en_revision',
  total_trabajadores: 12,
  total_segmentos: 1,
  total_haberes: 0,
  total_descuentos: 0,
  total_liquido: 0,
  total_incidencias_criticas: 0,
  total_advertencias: 0,
  fecha_pago: null,
  closed_at: null,
  created_at: '2026-06-04T00:00:00.000Z',
  updated_at: '2026-06-04T00:00:00.000Z',
  id_calculo_periodo_vigente: null,
  version_calculo: 0,
  calculo_vigente: false,
  calculado_at: null,
  validado_at: null,
  aprobado_at: null,
  ultimo_paso_visitado: null,
  paso_visitado_at: null,
  maximo_paso_completado: null,
  maximo_paso_completado_at: null,
};

describe('rowToNominaPeriodoResumen', () => {
  it('mapea ultimoPasoVisitado a null cuando la BD trae null', () => {
    const resumen = rowToNominaPeriodoResumen({ ...FILA_BASE });
    expect(resumen.ultimoPasoVisitado).toBeNull();
    expect(resumen.pasoVisitadoAt).toBeNull();
  });

  it('mapea cada PayrollStepId válido desde la BD', () => {
    const valores = [
      'parameters',
      'dotacion',
      'movements',
      'calculation',
      'validation',
      'closure',
    ] as const;
    for (const v of valores) {
      const resumen = rowToNominaPeriodoResumen({
        ...FILA_BASE,
        ultimo_paso_visitado: v,
        paso_visitado_at: '2026-06-05T12:00:00.000Z',
      });
      expect(resumen.ultimoPasoVisitado).toBe(v);
      expect(resumen.pasoVisitadoAt).toBe('2026-06-05T12:00:00.000Z');
    }
  });

  it('degrada a null cuando la BD trae un valor desconocido (defensa frente a legacy)', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      ultimo_paso_visitado: 'legacy-step',
    });
    expect(resumen.ultimoPasoVisitado).toBeNull();
  });

  it('ignora la cadena vacía como si fuera null', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      ultimo_paso_visitado: '',
    });
    expect(resumen.ultimoPasoVisitado).toBeNull();
  });

  it('mapea maximoPasoCompletado y maximoPasoCompletadoAt desde la BD', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      maximo_paso_completado: 'calculation',
      maximo_paso_completado_at: '2026-06-05T09:00:00.000Z',
    });
    expect(resumen.maximoPasoCompletado).toBe('calculation');
    expect(resumen.maximoPasoCompletadoAt).toBe('2026-06-05T09:00:00.000Z');
  });

  it('degrada maximo_paso_completado a null si la BD trae un valor desconocido', () => {
    const resumen = rowToNominaPeriodoResumen({
      ...FILA_BASE,
      maximo_paso_completado: 'legacy-step',
    });
    expect(resumen.maximoPasoCompletado).toBeNull();
  });
});

describe('ensamblarNominaPeriodo', () => {
  it('incluye ultimoPasoVisitado y pasoVisitadoAt de la cabecera', () => {
    const nomina = ensamblarNominaPeriodo({
      cabecera: {
        ...FILA_BASE,
        ultimo_paso_visitado: 'calculation',
        paso_visitado_at: '2026-06-05T08:30:00.000Z',
      },
      segmentos: [],
      movimientos: [],
      incidencias: [],
    });
    expect(nomina.ultimoPasoVisitado).toBe('calculation');
    expect(nomina.pasoVisitadoAt).toBe('2026-06-05T08:30:00.000Z');
  });

  it('cuando la cabecera no tiene paso visitado, deja null', () => {
    const nomina = ensamblarNominaPeriodo({
      cabecera: { ...FILA_BASE },
      segmentos: [],
      movimientos: [],
      incidencias: [],
    });
    expect(nomina.ultimoPasoVisitado).toBeNull();
    expect(nomina.pasoVisitadoAt).toBeNull();
    expect(nomina.maximoPasoCompletado).toBeNull();
    expect(nomina.maximoPasoCompletadoAt).toBeNull();
  });

  it('incluye maximoPasoCompletado/maximoPasoCompletadoAt de la cabecera', () => {
    const nomina = ensamblarNominaPeriodo({
      cabecera: {
        ...FILA_BASE,
        maximo_paso_completado: 'validation',
        maximo_paso_completado_at: '2026-06-05T10:00:00.000Z',
      },
      segmentos: [],
      movimientos: [],
      incidencias: [],
    });
    expect(nomina.maximoPasoCompletado).toBe('validation');
    expect(nomina.maximoPasoCompletadoAt).toBe('2026-06-05T10:00:00.000Z');
  });
});
