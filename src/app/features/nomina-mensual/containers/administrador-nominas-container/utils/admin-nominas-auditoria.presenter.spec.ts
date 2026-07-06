import { describe, expect, it } from 'vitest';

import type { EventoAuditoriaNomina } from '../../../models/nomina-periodo.models';
import {
  etiquetaAccionAuditoria,
  mapearHistorialAdministrativo,
} from './admin-nominas-auditoria.presenter';

function eventoMock(overrides: Partial<EventoAuditoriaNomina> = {}): EventoAuditoriaNomina {
  return {
    id: 'evt-1',
    nominaPeriodoId: 'nom-1',
    accion: 'creada',
    usuarioId: undefined,
    motivo: undefined,
    createdAt: '2026-06-10T10:00:00Z',
    ...overrides,
  };
}

describe('admin-nominas-auditoria.presenter — etiquetas y mapper', () => {
  it('Test 1 — etiquetaAccionAuditoria cubre todas las acciones canónicas de la BD', () => {
    const acciones: EventoAuditoriaNomina['accion'][] = [
      'creada',
      'dotacion_confirmada',
      'movimientos_actualizados',
      'calculo_invalidado',
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'cerrada',
      'reabierta',
      'anulada',
    ];
    for (const accion of acciones) {
      const etiqueta = etiquetaAccionAuditoria(accion);
      expect(etiqueta).toBeTruthy();
      expect(etiqueta).not.toContain('_');
    }
  });

  it('Test 2 — mapearHistorialAdministrativo ordena desc por createdAt y resuelve usuario actual', () => {
    const eventos = [
      eventoMock({ id: 'a', createdAt: '2026-06-10T10:00:00Z', usuarioId: 'u-self' }),
      eventoMock({ id: 'b', createdAt: '2026-06-11T11:00:00Z', usuarioId: 'u-other', usuarioNombre: 'Pedro Ríos' }),
      eventoMock({
        id: 'c',
        createdAt: '2026-06-12T09:00:00Z',
        accion: 'reabierta',
        motivo: 'Corrección de movimientos',
      }),
    ];
    const resolver = (id: string | undefined): string | null => (id === 'u-self' ? 'María Soto' : null);
    const filas = mapearHistorialAdministrativo(eventos, resolver);
    expect(filas.map((f) => f.id)).toEqual(['c', 'b', 'a']);
    expect(filas[2].usuario).toBe('María Soto');
    expect(filas[1].usuario).toBe('Pedro Ríos');
    expect(filas[0].motivo).toBe('Corrección de movimientos');
    expect(filas[2].motivo).toBeNull();
  });

  it('Test 3 — fecha corta y larga se generan a partir del ISO', () => {
    const filas = mapearHistorialAdministrativo([
      eventoMock({ createdAt: '2026-06-15T13:42:00Z' }),
    ]);
    expect(filas).toHaveLength(1);
    expect(filas[0].fechaCorta).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
    expect(filas[0].fechaLarga.length).toBeGreaterThan(0);
  });

  it('Test 4 — cada fila expone icono y tono según la acción', () => {
    const filas = mapearHistorialAdministrativo([
      eventoMock({ id: 'cerr', accion: 'cerrada' }),
      eventoMock({ id: 'reab', accion: 'reabierta' }),
      eventoMock({ id: 'anu', accion: 'anulada' }),
    ]);
    expect(filas.find((f) => f.id === 'cerr')).toMatchObject({ icono: 'lock', tono: 'ok' });
    expect(filas.find((f) => f.id === 'reab')).toMatchObject({ icono: 'refresh-cw', tono: 'warning' });
    expect(filas.find((f) => f.id === 'anu')).toMatchObject({ icono: 'octagon-x', tono: 'danger' });
  });
});
