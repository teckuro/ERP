import { describe, expect, it } from 'vitest';

import type {
  FilaTrabajadorMovimientos,
  ItemMovimientoTrabajador,
} from '../../nomina-mensual/models/movimiento-nomina.models';
import {
  COLUMNAS_MOVIMIENTOS_POR_TRABAJADOR,
  FILTROS_MOVIMIENTOS_POR_TRABAJADOR,
  PERSISTENCIA_GRILLA_MOVIMIENTOS_POR_TRABAJADOR,
  calcularStatsMovimientosPorTrabajador,
  etiquetaEstadoItem,
  etiquetaOrigenItem,
  itemAdmiteEliminacion,
  itemsPendientes,
} from './nomina-movimientos-por-trabajador.presenter';

function item(parcial: Partial<ItemMovimientoTrabajador> = {}): ItemMovimientoTrabajador {
  return {
    itemId: 'item-1',
    origen: 'configurado',
    estado: 'pendiente',
    concepto: 'BONO_X',
    categoria: 'haber',
    monto: 1000,
    ...parcial,
  };
}

function fila(parcial: Partial<FilaTrabajadorMovimientos> = {}): FilaTrabajadorMovimientos {
  return {
    trabajadorId: '10',
    nombre: 'Juan Pérez',
    rut: '12.345.678-9',
    cargo: 'Operario',
    centroCosto: 'CC-PROD',
    totalHaberes: 0,
    totalDescuentos: 0,
    cuentaAusencias: 0,
    cuentaInformativos: 0,
    cuentaPendientes: 0,
    cuentaAplicados: 0,
    cuentaOmitidos: 0,
    cuentaManualesAplicados: 0,
    items: [],
    ...parcial,
  };
}

describe('nomina-movimientos-por-trabajador.presenter', () => {
  it('columnas: 6 columnas en orden esperado, acciones al final no hideable', () => {
    expect(COLUMNAS_MOVIMIENTOS_POR_TRABAJADOR.map((c) => c.id)).toEqual([
      'trabajador',
      'haberes',
      'descuentos',
      'ausencias',
      'informativos',
      'acciones',
    ]);
    const acciones = COLUMNAS_MOVIMIENTOS_POR_TRABAJADOR.find((c) => c.id === 'acciones');
    expect(acciones?.hideable).toBe(false);
    expect(acciones?.sortable).toBe(false);
  });

  it('persistencia tiene clave estable versionada', () => {
    expect(PERSISTENCIA_GRILLA_MOVIMIENTOS_POR_TRABAJADOR).toBe(
      'nomina-v2-movimientos-por-trabajador-grid-v1',
    );
  });

  describe('etiquetas humanas (RRHH)', () => {
    it('estado pendiente → "Pendiente de cargar"', () => {
      expect(etiquetaEstadoItem('pendiente')).toBe('Pendiente de cargar');
    });
    it('estado aplicado → "Aplicado este mes"', () => {
      expect(etiquetaEstadoItem('aplicado')).toBe('Aplicado este mes');
    });
    it('estado omitido → "Omitido este mes"', () => {
      expect(etiquetaEstadoItem('omitido')).toBe('Omitido este mes');
    });
    it('origen configurado → "Configurado en ficha"', () => {
      expect(etiquetaOrigenItem('configurado')).toBe('Configurado en ficha');
    });
    it('origen manual → "Manual del período"', () => {
      expect(etiquetaOrigenItem('manual')).toBe('Manual del período');
    });
  });

  describe('filtro estado (predicate)', () => {
    const filtros = FILTROS_MOVIMIENTOS_POR_TRABAJADOR([]);
    const fEstado = filtros.find((f) => f.id === 'estado')!;

    it('con-pendientes selecciona solo trabajadores con cuentaPendientes > 0', () => {
      expect(fEstado.predicate!(fila({ cuentaPendientes: 1 }), 'con-pendientes')).toBe(true);
      expect(fEstado.predicate!(fila({ cuentaPendientes: 0 }), 'con-pendientes')).toBe(false);
    });

    it('solo-aplicados requiere aplicados > 0 y sin pendientes ni omitidos', () => {
      expect(
        fEstado.predicate!(
          fila({ cuentaAplicados: 2, cuentaPendientes: 0, cuentaOmitidos: 0 }),
          'solo-aplicados',
        ),
      ).toBe(true);
      expect(
        fEstado.predicate!(fila({ cuentaAplicados: 2, cuentaPendientes: 1 }), 'solo-aplicados'),
      ).toBe(false);
    });

    it('con-omitidos selecciona solo trabajadores con cuentaOmitidos > 0', () => {
      expect(fEstado.predicate!(fila({ cuentaOmitidos: 1 }), 'con-omitidos')).toBe(true);
      expect(fEstado.predicate!(fila({ cuentaOmitidos: 0 }), 'con-omitidos')).toBe(false);
    });
  });

  describe('filtro categoria (predicate)', () => {
    const filtros = FILTROS_MOVIMIENTOS_POR_TRABAJADOR([]);
    const fCat = filtros.find((f) => f.id === 'categoria')!;

    it('con-haberes detecta totalHaberes > 0 o items haber (pendientes)', () => {
      expect(fCat.predicate!(fila({ totalHaberes: 1000 }), 'con-haberes')).toBe(true);
      expect(
        fCat.predicate!(
          fila({ totalHaberes: 0, items: [item({ categoria: 'haber', estado: 'pendiente' })] }),
          'con-haberes',
        ),
      ).toBe(true);
      expect(fCat.predicate!(fila(), 'con-haberes')).toBe(false);
    });

    it('con-ausencias usa cuentaAusencias', () => {
      expect(fCat.predicate!(fila({ cuentaAusencias: 1 }), 'con-ausencias')).toBe(true);
      expect(fCat.predicate!(fila(), 'con-ausencias')).toBe(false);
    });
  });

  describe('filtro buscar (predicate)', () => {
    const filtros = FILTROS_MOVIMIENTOS_POR_TRABAJADOR([]);
    const fBuscar = filtros.find((f) => f.id === 'buscar')!;

    it('matchea por nombre (case-insensitive, sin tildes)', () => {
      expect(fBuscar.predicate!(fila({ nombre: 'María Pérez' }), 'maria perez')).toBe(true);
    });

    it('matchea por RUT', () => {
      expect(fBuscar.predicate!(fila({ rut: '25.050.001-7' }), '25050001')).toBe(true);
    });

    it('matchea por concepto dentro del expandible', () => {
      const f = fila({
        items: [item({ concepto: 'MOVILIZACION', glosa: 'mensual' })],
      });
      expect(fBuscar.predicate!(f, 'movilizacion')).toBe(true);
    });

    it('exige todos los tokens (AND)', () => {
      const f = fila({ nombre: 'Juan Pérez', rut: '12.345.678-9' });
      expect(fBuscar.predicate!(f, 'juan 12345')).toBe(true);
      expect(fBuscar.predicate!(f, 'juan ausente')).toBe(false);
    });

    it('valor vacío deja pasar todo', () => {
      expect(fBuscar.predicate!(fila(), '')).toBe(true);
    });
  });

  describe('calcularStatsMovimientosPorTrabajador', () => {
    it('cuenta trabajadores con items, con pendientes y suma haberes/descuentos', () => {
      const filas = [
        fila({ items: [item()], cuentaPendientes: 1 }),
        fila({
          trabajadorId: '11',
          items: [item({ itemId: 'b' })],
          cuentaAplicados: 1,
          totalHaberes: 5000,
          totalDescuentos: 1000,
        }),
        fila({ trabajadorId: '12' }), // sin movimientos
      ];
      const stats = calcularStatsMovimientosPorTrabajador(filas);

      expect(stats.trabajadoresConMovimientos).toBe(2);
      expect(stats.trabajadoresConPendientes).toBe(1);
      expect(stats.totalHaberes).toBe(5000);
      expect(stats.totalDescuentos).toBe(1000);
      expect(stats.totalPendientes).toBe(1);
    });

    it('dataset vacío devuelve ceros', () => {
      const stats = calcularStatsMovimientosPorTrabajador([]);
      expect(stats).toEqual({
        trabajadoresConMovimientos: 0,
        trabajadoresConPendientes: 0,
        totalHaberes: 0,
        totalDescuentos: 0,
        totalPendientes: 0,
      });
    });
  });

  describe('helpers de items', () => {
    it('itemsPendientes filtra correctamente', () => {
      const items = [
        item({ itemId: 'a', estado: 'pendiente' }),
        item({ itemId: 'b', estado: 'aplicado' }),
        item({ itemId: 'c', estado: 'omitido' }),
      ];
      expect(itemsPendientes(items).map((i) => i.itemId)).toEqual(['a']);
    });

    it('itemAdmiteEliminacion solo admite manuales', () => {
      expect(itemAdmiteEliminacion(item({ origen: 'manual' }))).toBe(true);
      expect(itemAdmiteEliminacion(item({ origen: 'configurado' }))).toBe(false);
    });
  });
});
