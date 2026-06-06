import { describe, expect, it } from 'vitest';

import type { FilaMovimientoConfigurado } from '../../nomina-mensual/models/movimiento-nomina.models';
import {
  calcularStatsMovimientosConfigurados,
  COLUMNAS_CONFIGURADOS,
  etiquetaEstadoConfigurado,
  FILTROS_CONFIGURADOS,
  PERSISTENCIA_GRILLA_CONFIGURADOS,
} from './nomina-movimientos-configurados.presenter';

function fila(parcial: Partial<FilaMovimientoConfigurado> = {}): FilaMovimientoConfigurado {
  return {
    filaId: 'tr-1::rec-1::BONO',
    trabajadorId: 'tr-1',
    trabajadorNombre: 'Carlos Soto',
    rut: '17.222.333-4',
    recurrenteId: 'rec-1',
    concepto: 'BONO',
    categoria: 'haber',
    monto: 50000,
    frecuencia: 'mensual',
    vigenciaDesde: '2026-01-01',
    estadoEnNomina: 'pendiente',
    ...parcial,
  };
}

describe('nomina-movimientos-configurados.presenter', () => {
  describe('calcularStatsMovimientosConfigurados', () => {
    it('cuenta total, pendientes, ya-cargados y omitidos', () => {
      const filas = [
        fila({ filaId: 'a', estadoEnNomina: 'pendiente' }),
        fila({ filaId: 'b', estadoEnNomina: 'pendiente' }),
        fila({ filaId: 'c', estadoEnNomina: 'ya-cargado' }),
        fila({ filaId: 'd', estadoEnNomina: 'omitido-este-mes' }),
      ];
      expect(calcularStatsMovimientosConfigurados(filas)).toEqual({
        total: 4,
        pendientes: 2,
        yaCargados: 1,
        omitidos: 1,
      });
    });

    it('lista vacía produce ceros', () => {
      expect(calcularStatsMovimientosConfigurados([])).toEqual({
        total: 0,
        pendientes: 0,
        yaCargados: 0,
        omitidos: 0,
      });
    });
  });

  describe('etiquetaEstadoConfigurado', () => {
    it('mapea cada estado a su copy humano (lenguaje RRHH)', () => {
      expect(etiquetaEstadoConfigurado('pendiente')).toBe('Pendiente de cargar');
      expect(etiquetaEstadoConfigurado('ya-cargado')).toBe('Ya cargado este mes');
      expect(etiquetaEstadoConfigurado('omitido-este-mes')).toBe('Omitido este mes');
    });
  });

  describe('COLUMNAS_CONFIGURADOS', () => {
    it('expone las columnas mínimas para la matriz NOIA', () => {
      const ids = COLUMNAS_CONFIGURADOS.map((c) => c.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          'trabajadorNombre',
          'rut',
          'concepto',
          'categoria',
          'monto',
          'vigencia',
          'estado',
        ]),
      );
    });

    it('mantiene "Trabajador" como columna primaria no ocultable', () => {
      const trabajador = COLUMNAS_CONFIGURADOS.find((c) => c.id === 'trabajadorNombre');
      expect(trabajador?.hideable).toBe(false);
      expect(trabajador?.priorityResponsive).toBe('primary');
    });
  });

  describe('FILTROS_CONFIGURADOS', () => {
    it('expone los 3 filtros pedidos por la matriz NOIA', () => {
      const filtros = FILTROS_CONFIGURADOS([]);
      expect(filtros.map((f) => f.id)).toEqual(['estado', 'categoria', 'buscar']);
    });

    it('el filtro "estado" cubre los 3 estados posibles', () => {
      const filtros = FILTROS_CONFIGURADOS([]);
      const estado = filtros.find((f) => f.id === 'estado');
      expect(estado).toBeDefined();
      const valores = estado!.options!.map((o) => (typeof o === 'string' ? o : o.value));
      expect(valores).toEqual(['pendiente', 'ya-cargado', 'omitido-este-mes']);
    });

    it('"buscar" matchea por nombre con tokens y normaliza acentos', () => {
      const filtros = FILTROS_CONFIGURADOS([]);
      const buscar = filtros.find((f) => f.id === 'buscar');
      expect(buscar?.predicate).toBeDefined();
      const muestra = fila({ trabajadorNombre: 'María Rojas', rut: '18.444.555-6' });
      // Con acento removido y minúsculas, los tokens "ROJAS" "maria" matchean.
      expect(buscar!.predicate!(muestra, 'maria ROJAS')).toBe(true);
      // Token RUT en formato plano.
      expect(buscar!.predicate!(muestra, '18.444')).toBe(true);
      // Token que no aparece.
      expect(buscar!.predicate!(muestra, 'pedro')).toBe(false);
    });

    it('"buscar" sin valor deja pasar todas las filas', () => {
      const filtros = FILTROS_CONFIGURADOS([]);
      const buscar = filtros.find((f) => f.id === 'buscar');
      expect(buscar!.predicate!(fila(), '')).toBe(true);
      expect(buscar!.predicate!(fila(), '   ')).toBe(true);
    });

    it('"buscar" también revisa el concepto', () => {
      const filtros = FILTROS_CONFIGURADOS([]);
      const buscar = filtros.find((f) => f.id === 'buscar');
      const muestra = fila({ trabajadorNombre: 'Otro', rut: '11', concepto: 'PRESTAMO' });
      expect(buscar!.predicate!(muestra, 'PRESTAMO')).toBe(true);
    });
  });

  describe('PERSISTENCIA_GRILLA_CONFIGURADOS', () => {
    it('es una clave estable v1 (rompe migración intencionalmente si cambia)', () => {
      expect(PERSISTENCIA_GRILLA_CONFIGURADOS).toBe('nomina-v2-movimientos-configurados-grid-v1');
    });
  });
});
