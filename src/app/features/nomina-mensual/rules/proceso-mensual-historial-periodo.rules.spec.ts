import { describe, expect, it } from 'vitest';
import { mergeSnapshotsHistorialPeriodo } from './proceso-mensual-historial-periodo.rules';
import type { NominaCalculoPeriodoSnapshot } from '../models/proceso-mensual.model';

function snapshot(partial: Partial<NominaCalculoPeriodoSnapshot> & { idCalculoPeriodo: number }): NominaCalculoPeriodoSnapshot {
  return {
    periodo: '2026-05',
    estado: 'preliminar',
    fechaGeneracion: '2026-05-01T10:00:00Z',
    usuarioGenerador: 'rrhh',
    hashSnapshot: `hash-${partial.idCalculoPeriodo}`,
    totalTrabajadores: 1,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    versionMotor: 'v1',
    ...partial,
  } as NominaCalculoPeriodoSnapshot;
}

describe('mergeSnapshotsHistorialPeriodo', () => {
  it('devuelve historial sin cambios si no hay snapshot activo', () => {
    const historial = [snapshot({ idCalculoPeriodo: 1 })];
    expect(mergeSnapshotsHistorialPeriodo(historial, null)).toEqual(historial);
  });

  it('agrega snapshot activo cuando no está en la lista', () => {
    const activo = snapshot({ idCalculoPeriodo: 9, hashSnapshot: 'hash-9' });
    const historial = [snapshot({ idCalculoPeriodo: 1 })];
    expect(mergeSnapshotsHistorialPeriodo(historial, activo)).toEqual([activo, ...historial]);
  });

  it('no duplica si el activo ya está en historial', () => {
    const activo = snapshot({ idCalculoPeriodo: 2 });
    const historial = [snapshot({ idCalculoPeriodo: 2 })];
    expect(mergeSnapshotsHistorialPeriodo(historial, activo)).toEqual(historial);
  });
});
