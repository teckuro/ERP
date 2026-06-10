import { describe, expect, it } from 'vitest';

import type { EstadoNomina } from '../models/nomina-periodo.models';
import {
  accionesDisponibles,
  puedeEliminar,
  puedeReabrir,
  tieneLiquidaciones,
} from './admin-nominas.rules';

const TODOS_ESTADOS: EstadoNomina[] = [
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

describe('admin-nominas.rules — guardas por estado', () => {
  it('puedeEliminar habilita estados pre-productivos y el zombie anulada', () => {
    const habilitados: EstadoNomina[] = [
      'borrador',
      'dotacion_generada',
      'en_revision',
      'anulada',
    ];
    for (const estado of TODOS_ESTADOS) {
      expect(puedeEliminar(estado)).toBe(habilitados.includes(estado));
    }
  });

  it('puedeEliminar bloquea estados con datos productivos vigentes', () => {
    const bloqueados: EstadoNomina[] = [
      'calculada',
      'validada',
      'aprobada',
      'cerrada',
      'reabierta',
    ];
    for (const estado of bloqueados) {
      expect(puedeEliminar(estado)).toBe(false);
    }
  });

  it('puedeReabrir solo permite "cerrada"', () => {
    for (const estado of TODOS_ESTADOS) {
      expect(puedeReabrir(estado)).toBe(estado === 'cerrada');
    }
  });

  it('tieneLiquidaciones solo para nómina cerrada y trazable', () => {
    expect(tieneLiquidaciones('aprobada')).toBe(false);
    expect(tieneLiquidaciones('cerrada')).toBe(true);
    expect(tieneLiquidaciones('reabierta')).toBe(false);
    expect(tieneLiquidaciones('borrador')).toBe(false);
    expect(tieneLiquidaciones('calculada')).toBe(false);
    expect(tieneLiquidaciones('anulada')).toBe(false);
  });
});

describe('admin-nominas.rules — accionesDisponibles', () => {
  it('todas las filas incluyen "abrir-generador" y "ver-resumen"', () => {
    for (const estado of TODOS_ESTADOS) {
      const acciones = accionesDisponibles(estado);
      expect(acciones).toContain('abrir-generador');
      expect(acciones).toContain('ver-resumen');
    }
  });

  it('borrador incluye eliminar pero NO reabrir ni liquidaciones', () => {
    const acciones = accionesDisponibles('borrador');
    expect(acciones).toContain('eliminar');
    expect(acciones).not.toContain('reabrir');
    expect(acciones).not.toContain('ver-liquidaciones');
  });

  it('cerrada incluye reabrir + ver-liquidaciones y NO eliminar', () => {
    const acciones = accionesDisponibles('cerrada');
    expect(acciones).toContain('reabrir');
    expect(acciones).toContain('ver-liquidaciones');
    expect(acciones).not.toContain('eliminar');
  });

  it('anulada ofrece eliminar (para purgar y liberar el slot único)', () => {
    const acciones = accionesDisponibles('anulada');
    expect(acciones).toContain('eliminar');
    expect(acciones).not.toContain('reabrir');
    expect(acciones).not.toContain('ver-liquidaciones');
  });

  it('calculada/validada/aprobada/reabierta NO ofrecen eliminar', () => {
    for (const estado of ['calculada', 'validada', 'aprobada', 'reabierta'] as EstadoNomina[]) {
      expect(accionesDisponibles(estado)).not.toContain('eliminar');
    }
  });

  it('no expone más la acción legacy "anular" ni "eliminar-borrador"', () => {
    for (const estado of TODOS_ESTADOS) {
      const acciones = accionesDisponibles(estado);
      expect(acciones).not.toContain('anular' as never);
      expect(acciones).not.toContain('eliminar-borrador' as never);
    }
  });
});
