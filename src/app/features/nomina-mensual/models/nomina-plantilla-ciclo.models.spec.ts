import { describe, expect, it } from 'vitest';

import {
  describirPoliticaFinSemana,
  describirReglaAnticipo,
  describirReglaFechaPago,
  esReglaAnticipoValida,
  esReglaFechaPagoValida,
  type ReglaFechaPago,
} from './nomina-plantilla-ciclo.models';

describe('nomina-plantilla-ciclo.models — helpers de validación y descripción', () => {
  it('esReglaFechaPagoValida acepta ultimo_dia_habil y ultimo_dia_corrido sin campos extra', () => {
    expect(esReglaFechaPagoValida({ tipo: 'ultimo_dia_habil' })).toBe(true);
    expect(esReglaFechaPagoValida({ tipo: 'ultimo_dia_corrido' })).toBe(true);
  });

  it('esReglaFechaPagoValida acepta dia_fijo con dia entre 1 y 31', () => {
    expect(esReglaFechaPagoValida({ tipo: 'dia_fijo', dia: 1 })).toBe(true);
    expect(esReglaFechaPagoValida({ tipo: 'dia_fijo', dia: 15 })).toBe(true);
    expect(esReglaFechaPagoValida({ tipo: 'dia_fijo', dia: 31 })).toBe(true);
  });

  it('esReglaFechaPagoValida rechaza dia_fijo con dia fuera de rango o sin dia', () => {
    expect(esReglaFechaPagoValida({ tipo: 'dia_fijo' })).toBe(false);
    expect(esReglaFechaPagoValida({ tipo: 'dia_fijo', dia: 0 })).toBe(false);
    expect(esReglaFechaPagoValida({ tipo: 'dia_fijo', dia: 32 })).toBe(false);
  });

  it('esReglaFechaPagoValida acepta dia_habil_n entre 1 y 23', () => {
    expect(esReglaFechaPagoValida({ tipo: 'dia_habil_n', n_habil: 1 })).toBe(true);
    expect(esReglaFechaPagoValida({ tipo: 'dia_habil_n', n_habil: 5 })).toBe(true);
    expect(esReglaFechaPagoValida({ tipo: 'dia_habil_n', n_habil: 23 })).toBe(true);
    expect(esReglaFechaPagoValida({ tipo: 'dia_habil_n', n_habil: 24 })).toBe(false);
  });

  it('esReglaFechaPagoValida rechaza tipos desconocidos y valores no objeto', () => {
    expect(esReglaFechaPagoValida({ tipo: 'inventado' })).toBe(false);
    expect(esReglaFechaPagoValida(null)).toBe(false);
    expect(esReglaFechaPagoValida('texto')).toBe(false);
    expect(esReglaFechaPagoValida({})).toBe(false);
  });

  it('esReglaAnticipoValida exige modo + valor positivo y porcentaje <= 100', () => {
    expect(esReglaAnticipoValida({ modo: 'porcentaje', valor: 50 })).toBe(true);
    expect(esReglaAnticipoValida({ modo: 'porcentaje', valor: 100 })).toBe(true);
    expect(esReglaAnticipoValida({ modo: 'monto_fijo', valor: 50000 })).toBe(true);
    expect(esReglaAnticipoValida({ modo: 'porcentaje', valor: 0 })).toBe(false);
    expect(esReglaAnticipoValida({ modo: 'porcentaje', valor: 101 })).toBe(false);
    expect(esReglaAnticipoValida({ modo: 'invalido', valor: 10 })).toBe(false);
  });

  it('describirReglaFechaPago entrega texto humano por cada tipo soportado', () => {
    const casos: Array<{ regla: ReglaFechaPago; esperado: string }> = [
      { regla: { tipo: 'dia_fijo', dia: 15 }, esperado: 'Día 15 del mes' },
      {
        regla: { tipo: 'siguiente_mes_dia_fijo', dia: 5 },
        esperado: 'Día 5 del mes siguiente',
      },
      { regla: { tipo: 'dia_habil_n', n_habil: 5 }, esperado: 'Día hábil 5 del mes' },
      { regla: { tipo: 'ultimo_dia_habil' }, esperado: 'Último día hábil del mes' },
      {
        regla: { tipo: 'ultimo_dia_corrido' },
        esperado: 'Último día calendario del mes',
      },
    ];
    for (const { regla, esperado } of casos) {
      expect(describirReglaFechaPago(regla)).toBe(esperado);
    }
  });

  it('describirPoliticaFinSemana traduce las tres opciones', () => {
    expect(describirPoliticaFinSemana('adelantar')).toBe('Adelantar al viernes anterior');
    expect(describirPoliticaFinSemana('atrasar')).toBe('Atrasar al lunes siguiente');
    expect(describirPoliticaFinSemana('mantener')).toBe('Mantener fecha calendario');
  });

  it('describirReglaAnticipo formatea porcentaje, monto fijo y null', () => {
    expect(describirReglaAnticipo({ modo: 'porcentaje', valor: 50 })).toBe(
      '50% del líquido proyectado',
    );
    expect(describirReglaAnticipo({ modo: 'monto_fijo', valor: 100000 })).toContain('fijo');
    expect(describirReglaAnticipo(null)).toBe('');
  });
});
