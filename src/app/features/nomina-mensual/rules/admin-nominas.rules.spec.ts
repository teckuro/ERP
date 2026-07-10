import { describe, expect, it } from 'vitest';

import type { EstadoNomina } from '../models/nomina-periodo.models';
import {
  accionesDisponibles,
  filaTieneAccion,
  puedeEliminar,
  puedeReabrir,
  puedeVerResumenNomina,
  tieneLiquidaciones,
} from './admin-nominas.rules';

const TODOS_ESTADOS: EstadoNomina[] = [
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
      'liquidada',
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

  it('tieneLiquidaciones para nómina liquidada o cerrada', () => {
    expect(tieneLiquidaciones('aprobada')).toBe(false);
    expect(tieneLiquidaciones('liquidada')).toBe(true);
    expect(tieneLiquidaciones('cerrada')).toBe(true);
    expect(tieneLiquidaciones('reabierta')).toBe(false);
    expect(tieneLiquidaciones('borrador')).toBe(false);
    expect(tieneLiquidaciones('calculada')).toBe(false);
    expect(tieneLiquidaciones('anulada')).toBe(false);
  });
});

describe('admin-nominas.rules — puedeVerResumenNomina', () => {
  it('habilita resumen solo en cerrada, liquidada o paso liquidaciones', () => {
    expect(puedeVerResumenNomina({ estado: 'cerrada', proximoPaso: 'liquidaciones' })).toBe(true);
    expect(puedeVerResumenNomina({ estado: 'liquidada', proximoPaso: 'cierre' })).toBe(true);
    expect(puedeVerResumenNomina({ estado: 'borrador', proximoPaso: 'parametros' })).toBe(false);
    expect(puedeVerResumenNomina({ estado: 'calculada', proximoPaso: 'validacion' })).toBe(false);
    expect(puedeVerResumenNomina({ estado: 'aprobada', proximoPaso: 'cierre' })).toBe(false);
  });
});

describe('admin-nominas.rules — accionesDisponibles', () => {
  it('todas las filas incluyen "abrir-generador"', () => {
    for (const estado of TODOS_ESTADOS) {
      const acciones = accionesDisponibles(estado);
      expect(acciones).toContain('abrir-generador');
    }
  });

  it('ver-resumen solo en cerrada o liquidada', () => {
    for (const estado of TODOS_ESTADOS) {
      const acciones = accionesDisponibles(estado);
      if (estado === 'cerrada' || estado === 'liquidada') {
        expect(acciones).toContain('ver-resumen');
      } else {
        expect(acciones).not.toContain('ver-resumen');
      }
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

  it('calculada/validada/aprobada/liquidada/reabierta NO ofrecen eliminar', () => {
    for (const estado of [
      'calculada',
      'validada',
      'aprobada',
      'liquidada',
      'reabierta',
    ] as EstadoNomina[]) {
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

describe('admin-nominas.rules — filaTieneAccion', () => {
  it('eliminar exige permiso admin además del estado', () => {
    expect(
      filaTieneAccion({ estado: 'borrador', proximoPaso: 'dotacion' }, 'eliminar', { esAdmin: false }),
    ).toBe(false);
    expect(
      filaTieneAccion({ estado: 'borrador', proximoPaso: 'dotacion' }, 'eliminar', { esAdmin: true }),
    ).toBe(true);
  });

  it('reabrir exige permiso admin en cerrada', () => {
    expect(
      filaTieneAccion({ estado: 'cerrada', proximoPaso: 'liquidaciones' }, 'reabrir', { esAdmin: false }),
    ).toBe(false);
    expect(
      filaTieneAccion({ estado: 'cerrada', proximoPaso: 'liquidaciones' }, 'reabrir', { esAdmin: true }),
    ).toBe(true);
  });
});
