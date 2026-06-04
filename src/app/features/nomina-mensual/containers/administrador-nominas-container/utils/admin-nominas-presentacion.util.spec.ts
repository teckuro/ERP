import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../../models/nomina-periodo.models';
import type { EstadoNomina, TipoNomina } from '../../../models/nomina-periodo.models';
import {
  calcularKpisAdminNominas,
  estadoNominaToBadge,
  formatearActualizada,
  tipoNominaToLabel,
} from './admin-nominas-presentacion.util';

describe('admin-nominas-presentacion.util — mapeos de badge', () => {
  it('Test 16 — estadoNominaToBadge mapea los 9 estados a una variante visible', () => {
    const estados: EstadoNomina[] = [
      'borrador',
      'dotacion_generada',
      'en_revision',
      'calculada',
      'validada',
      'aprobada',
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
    expect(estadoNominaToBadge('anulada').variant).toBe('danger');
    expect(estadoNominaToBadge('reabierta').variant).toBe('warning');
  });

  it('Test 17 — tipoNominaToLabel cubre los 4 tipos', () => {
    const tipos: TipoNomina[] = ['mensual', 'quincenal', 'semanal', 'extraordinaria'];
    const labels = tipos.map((t) => tipoNominaToLabel(t));
    expect(labels).toEqual(['Mensual', 'Quincenal', 'Semanal', 'Extraordinaria']);
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
