import { describe, expect, it } from 'vitest';

import {
  clasificarAdvertenciasLiquidacion,
  determinarEstadoLiquidaciones,
  obtenerMotivoNoPuedeGenerar,
  puedeGenerarLiquidaciones,
} from './liquidaciones-oficiales.rules';

describe('liquidaciones-oficiales.rules', () => {
  // Orden del flujo: aprobar -> emitir -> cerrar. Se emite con la nómina aprobada y sin cerrar.
  const snapshot = {
    idCalculoPeriodo: 15,
    totalTrabajadores: 2,
    aprobadoOperativamente: true,
    cerradoOperativamente: false,
  };

  it('queda no disponible sin nómina mensual aprobada', () => {
    expect(determinarEstadoLiquidaciones({ snapshot: null, liquidacion: null })).toBe('no_disponible');
    expect(obtenerMotivoNoPuedeGenerar(null, null)).toBe('No se pudo consultar una nómina mensual aprobada para este período.');
  });

  it('bloquea si la nomina mensual aun no esta aprobada', () => {
    const motivo = obtenerMotivoNoPuedeGenerar({ ...snapshot, aprobadoOperativamente: false }, null);
    expect(motivo).toBe('Primero aprueba la nómina mensual del período.');
  });

  it('bloquea la emision si la nomina ya esta cerrada', () => {
    const motivo = obtenerMotivoNoPuedeGenerar({ ...snapshot, cerradoOperativamente: true }, null);
    expect(motivo).toBe('La nómina del período ya está cerrada; no se pueden emitir nuevas liquidaciones.');
  });

  it('habilita generacion con snapshot aprobado, sin cerrar y sin liquidaciones', () => {
    expect(puedeGenerarLiquidaciones(snapshot, null)).toBe(true);
    expect(determinarEstadoLiquidaciones({ snapshot, liquidacion: null })).toBe('lista_para_generar');
  });

  it('detecta liquidaciones ya generadas', () => {
    const liquidacion = {
      idLiquidacionPeriodo: 1,
      idCalculoPeriodo: 15,
      idNominaPeriodo: null,
      periodo: '2026-04',
      version: 1,
      estado: 'generada' as const,
      fechaGeneracion: '2026-05-10T10:00:00.000Z',
      usuarioGeneracionId: '00000000-0000-0000-0000-000000000001',
      usuarioGeneracionLabel: 'rrhh@empresa.cl',
      totalTrabajadores: 2,
      totalHaberes: 100,
      totalDescuentos: 20,
      totalLiquido: 80,
      metadata: {},
    };
    expect(determinarEstadoLiquidaciones({ snapshot, liquidacion })).toBe('generadas');
    expect(obtenerMotivoNoPuedeGenerar(snapshot, liquidacion)).toBe(
      'Ya existen liquidaciones oficiales generadas para este periodo.',
    );
  });

  it('clasifica advertencias informativas', () => {
    expect(clasificarAdvertenciasLiquidacion({
      totalAdvertenciasSnapshot: 1,
      trabajadoresSinConceptos: 1,
      conceptosSinCodigoLre: 1,
    })).toEqual([
      'La nómina mensual aprobada tenía advertencias visibles al aprobar.',
      'Hay trabajadores sin conceptos materializados en la liquidacion.',
      'Existen conceptos sin codigo LRE. LRE operativo queda para una fase posterior.',
    ]);
  });
});
