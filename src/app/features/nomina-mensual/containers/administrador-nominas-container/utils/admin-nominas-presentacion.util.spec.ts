import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../../models/nomina-periodo.models';
import type { EstadoNomina, TipoNomina } from '../../../models/nomina-periodo.models';
import {
  calcularKpisAdminNominas,
  desgloseIncidencias,
  estadoNominaToBadge,
  etiquetaMaximoPasoCompletado,
  etiquetaMetaNomina,
  etiquetaPasoVisitado,
  formatearActualizada,
  formatearActualizadaCompleta,
  formatearRangoLegal,
  mostrarEnCurso,
  naturalezaNominaToLabel,
  proximoPasoToIcon,
  tipoNominaToLabel,
} from './admin-nominas-presentacion.util';
import type { PayrollStepId } from '../../../../nomina-mensual-v2/models/nomina-mensual-v2.models';

describe('admin-nominas-presentacion.util — mapeos de badge', () => {
  it('Test 16 — estadoNominaToBadge mapea los 10 estados a una variante visible', () => {
    const estados: EstadoNomina[] = [
      'borrador',
      'dotacion_generada',
      'en_revision',
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'cerrada',
      'reabierta',
      'anulada',
    ];
    for (const estado of estados) {
      const badge = estadoNominaToBadge(estado);
      expect(badge.label.length).toBeGreaterThan(0);
      expect(['neutral', 'info', 'warning', 'success', 'danger']).toContain(badge.variant);
    }
    expect(estadoNominaToBadge('borrador').variant).toBe('neutral');
    expect(estadoNominaToBadge('cerrada').variant).toBe('success');
    expect(estadoNominaToBadge('liquidada').label).toBe('Liquidada');
    expect(estadoNominaToBadge('anulada').variant).toBe('danger');
    expect(estadoNominaToBadge('reabierta').variant).toBe('warning');
  });

  it('Test 17 — tipoNominaToLabel cubre los 4 tipos', () => {
    const tipos: TipoNomina[] = ['mensual', 'quincenal', 'semanal', 'extraordinaria'];
    const labels = tipos.map((t) => tipoNominaToLabel(t));
    expect(labels).toEqual(['Mensual', 'Quincenal', 'Semanal', 'Extraordinaria']);
  });

  it('Test 17b — naturalezaNominaToLabel cubre las 4 naturalezas', () => {
    expect(naturalezaNominaToLabel('liquidacion_legal')).toBe('Liquidación legal');
    expect(naturalezaNominaToLabel('rectificacion')).toBe('Rectificación');
    expect(naturalezaNominaToLabel('anticipo')).toBe('Anticipo');
  });

  it('Test 17c — etiquetaMetaNomina solo cuando difiere del mensual legal', () => {
    expect(
      etiquetaMetaNomina({ tipo: 'mensual', naturaleza: 'liquidacion_legal' }),
    ).toBe('');
    expect(
      etiquetaMetaNomina({ tipo: 'mensual', naturaleza: 'rectificacion' }),
    ).toBe('Rectificación');
    expect(
      etiquetaMetaNomina({ tipo: 'extraordinaria', naturaleza: 'pago_extraordinario' }),
    ).toBe('Pago extraordinario · Extraordinaria');
  });

  it('Test 17d — formatearRangoLegal compacta fechas del ciclo', () => {
    expect(formatearRangoLegal('2026-06-01', '2026-06-30')).toBe('01–30/06/2026');
    expect(formatearRangoLegal('2026-05-16', '2026-05-31')).toBe('16–31/05/2026');
  });
});

describe('admin-nominas-presentacion.util — formatearActualizada', () => {
  const ahora = new Date('2026-06-04T10:00:00.000Z');

  it('Test 18 — fecha del mismo día devuelve "Hoy"', () => {
    expect(formatearActualizada('2026-06-04T08:00:00.000Z', ahora)).toBe('Hoy');
  });

  it('Test 19 — diferencia de varios días formatea como dd/mm/yyyy', () => {
    expect(formatearActualizada('2026-05-15T10:00:00.000Z', ahora)).toBe('15/05/2026');
  });

  it('Test 20 — entrada vacía o inválida retorna cadena vacía', () => {
    expect(formatearActualizada(undefined, ahora)).toBe('');
    expect(formatearActualizada('no-es-fecha', ahora)).toBe('');
  });
});

describe('admin-nominas-presentacion.util — calcularKpisAdminNominas', () => {
  it('Test 21 — KPIs identifican abiertas, en cálculo, pendientes de cierre y con críticas', () => {
    const resumenes = [
      crearNominaResumen({ id: '1', estado: 'dotacion_generada', totalIncidenciasCriticas: 2 }),
      crearNominaResumen({ id: '2', estado: 'calculada', totalIncidenciasCriticas: 0 }),
      crearNominaResumen({ id: '3', estado: 'aprobada', totalIncidenciasCriticas: 0 }),
      crearNominaResumen({ id: '4', estado: 'cerrada', totalIncidenciasCriticas: 0 }),
      crearNominaResumen({ id: '5', estado: 'borrador', totalIncidenciasCriticas: 0 }),
    ];
    const kpis = calcularKpisAdminNominas(resumenes);
    expect(kpis.total).toBe(5);
    expect(kpis.abiertas).toBe(3); // dotacion_generada, calculada, borrador
    expect(kpis.enCalculo).toBe(1); // calculada
    expect(kpis.pendientesCierre).toBe(1); // aprobada
    expect(kpis.conCriticas).toBe(1);
    expect(kpis.items).toHaveLength(4);
  });

  it('Test 22 — lista vacía produce KPIs en cero sin romper', () => {
    const kpis = calcularKpisAdminNominas([]);
    expect(kpis.total).toBe(0);
    expect(kpis.abiertas).toBe(0);
    expect(kpis.conCriticas).toBe(0);
    expect(kpis.items.every((item) => item.value === 0)).toBe(true);
  });
});

describe('admin-nominas-presentacion.util — proximoPasoToIcon', () => {
  it('Test 23 — devuelve un icono lucide por paso conocido', () => {
    expect(proximoPasoToIcon('parametros')).toBe('settings');
    expect(proximoPasoToIcon('dotacion')).toBe('users');
    expect(proximoPasoToIcon('movimientos')).toBe('repeat');
    expect(proximoPasoToIcon('calculo')).toBe('calculator');
    expect(proximoPasoToIcon('validacion')).toBe('shield-check');
    expect(proximoPasoToIcon('cierre')).toBe('lock');
    expect(proximoPasoToIcon('liquidaciones')).toBe('receipt');
    expect(proximoPasoToIcon('sin_accion')).toBe('minus');
  });

  it('Test 24 — null/undefined degradan a "minus" sin romper la celda', () => {
    expect(proximoPasoToIcon(null as never)).toBe('minus');
    expect(proximoPasoToIcon(undefined as never)).toBe('minus');
  });
});

describe('admin-nominas-presentacion.util — formatearActualizadaCompleta', () => {
  it('Test 25 — devuelve cadena dd/mm/yyyy HH:mm en zona local', () => {
    const fecha = new Date(2026, 5, 4, 9, 7, 0); // junio = mes 5
    const iso = fecha.toISOString();
    const formato = formatearActualizadaCompleta(iso);
    expect(formato).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it('Test 26 — entrada vacía/invalida devuelve cadena vacía', () => {
    expect(formatearActualizadaCompleta(undefined)).toBe('');
    expect(formatearActualizadaCompleta('')).toBe('');
    expect(formatearActualizadaCompleta('no-es-fecha')).toBe('');
  });
});

describe('admin-nominas-presentacion.util — desgloseIncidencias', () => {
  it('Test 27 — fila sin críticas ni avisos devuelve cadena vacía', () => {
    expect(desgloseIncidencias({ totalIncidenciasCriticas: 0, totalAdvertencias: 0 })).toBe('');
  });

  it('Test 28 — solo críticas: pluraliza correctamente', () => {
    expect(desgloseIncidencias({ totalIncidenciasCriticas: 1, totalAdvertencias: 0 })).toBe('1 crítica');
    expect(desgloseIncidencias({ totalIncidenciasCriticas: 3, totalAdvertencias: 0 })).toBe('3 críticas');
  });

  it('Test 29 — combina críticas y avisos en un solo string', () => {
    expect(
      desgloseIncidencias({ totalIncidenciasCriticas: 2, totalAdvertencias: 5 }),
    ).toBe('2 críticas · 5 avisos');
  });

  it('Test 30 — solo avisos pluraliza correctamente', () => {
    expect(desgloseIncidencias({ totalIncidenciasCriticas: 0, totalAdvertencias: 1 })).toBe('1 aviso');
    expect(desgloseIncidencias({ totalIncidenciasCriticas: 0, totalAdvertencias: 4 })).toBe('4 avisos');
  });
});

describe('admin-nominas-presentacion.util — sub-renglón "Avance"', () => {
  it('Test 31 — etiquetaMaximoPasoCompletado cubre los 5 PayrollStepId', () => {
    const pares: Array<[PayrollStepId, string]> = [
      ['parameters', 'Parámetros'],
      ['dotacion', 'Dotación'],
      ['movements', 'Movimientos'],
      ['calculation', 'Cálculo'],
      ['closure', 'Cierre'],
    ];
    for (const [paso, etiqueta] of pares) {
      expect(etiquetaMaximoPasoCompletado(paso)).toBe(etiqueta);
    }
  });

  it('Test 32 — etiquetaMaximoPasoCompletado devuelve cadena vacía para nulos/undefined', () => {
    expect(etiquetaMaximoPasoCompletado(null)).toBe('');
    expect(etiquetaMaximoPasoCompletado(undefined)).toBe('');
  });

  it('Test 32b — etiquetaPasoVisitado (deprecated alias) sigue funcionando', () => {
    expect(etiquetaPasoVisitado('calculation')).toBe('Cálculo');
    expect(etiquetaPasoVisitado(null)).toBe('');
  });

  it('Test 33 — mostrarEnCurso es false cuando no hay maximoPasoCompletado', () => {
    const fila = crearNominaResumen({ proximoPaso: 'dotacion', maximoPasoCompletado: null });
    expect(mostrarEnCurso(fila)).toBe(false);
  });

  it('Test 34 — mostrarEnCurso es false cuando el paso completado coincide con proximoPaso', () => {
    const fila = crearNominaResumen({
      proximoPaso: 'calculo',
      maximoPasoCompletado: 'calculation',
    });
    expect(mostrarEnCurso(fila)).toBe(false);
  });

  it('Test 35 — mostrarEnCurso es true cuando difiere del proximoPaso', () => {
    const fila = crearNominaResumen({
      proximoPaso: 'dotacion',
      maximoPasoCompletado: 'calculation',
    });
    expect(mostrarEnCurso(fila)).toBe(true);
  });

  it('Test 36 — mostrarEnCurso es true cuando proximoPaso es sin_accion y hay paso completado', () => {
    const fila = crearNominaResumen({
      proximoPaso: 'sin_accion',
      maximoPasoCompletado: 'closure',
    });
    expect(mostrarEnCurso(fila)).toBe(true);
  });
});
