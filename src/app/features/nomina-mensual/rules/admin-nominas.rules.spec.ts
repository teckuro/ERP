import { describe, expect, it } from 'vitest';

import type { EstadoNomina } from '../models/nomina-periodo.models';
import {
  accionesDisponibles,
  puedeAnular,
  puedeEliminarBorrador,
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
  it('Test 8 — puedeEliminarBorrador solo permite "borrador"', () => {
    for (const estado of TODOS_ESTADOS) {
      expect(puedeEliminarBorrador(estado)).toBe(estado === 'borrador');
    }
  });

  it('Test 9 — puedeReabrir solo permite "cerrada"', () => {
    for (const estado of TODOS_ESTADOS) {
      expect(puedeReabrir(estado)).toBe(estado === 'cerrada');
    }
  });

  it('Test 10 — tieneLiquidaciones solo para nómina cerrada y trazable', () => {
    expect(tieneLiquidaciones('aprobada')).toBe(false);
    expect(tieneLiquidaciones('cerrada')).toBe(true);
    expect(tieneLiquidaciones('reabierta')).toBe(false);
    expect(tieneLiquidaciones('borrador')).toBe(false);
    expect(tieneLiquidaciones('calculada')).toBe(false);
    expect(tieneLiquidaciones('anulada')).toBe(false);
  });

  it('Test 11 — puedeAnular excluye "anulada" y "cerrada"', () => {
    expect(puedeAnular('anulada')).toBe(false);
    expect(puedeAnular('cerrada')).toBe(false);
    expect(puedeAnular('borrador')).toBe(true);
    expect(puedeAnular('aprobada')).toBe(true);
  });
});

describe('admin-nominas.rules — accionesDisponibles', () => {
  it('Test 12 — todas las filas incluyen "abrir-generador" y "ver-resumen"', () => {
    for (const estado of TODOS_ESTADOS) {
      const acciones = accionesDisponibles(estado);
      expect(acciones).toContain('abrir-generador');
      expect(acciones).toContain('ver-resumen');
    }
  });

  it('Test 13 — borrador incluye eliminar pero NO reabrir ni liquidaciones', () => {
    const acciones = accionesDisponibles('borrador');
    expect(acciones).toContain('eliminar-borrador');
    expect(acciones).not.toContain('reabrir');
    expect(acciones).not.toContain('ver-liquidaciones');
  });

  it('Test 14 — cerrada incluye reabrir + ver-liquidaciones y NO anular ni eliminar', () => {
    const acciones = accionesDisponibles('cerrada');
    expect(acciones).toContain('reabrir');
    expect(acciones).toContain('ver-liquidaciones');
    expect(acciones).not.toContain('anular');
    expect(acciones).not.toContain('eliminar-borrador');
  });

  it('Test 15 — anulada NO ofrece eliminar, reabrir, anular ni liquidaciones', () => {
    const acciones = accionesDisponibles('anulada');
    expect(acciones).toEqual(['abrir-generador', 'ver-resumen']);
  });
});
