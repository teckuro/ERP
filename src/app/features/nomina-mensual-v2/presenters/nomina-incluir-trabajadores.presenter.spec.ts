import { describe, expect, it } from 'vitest';

import {
  COLUMNAS_INCLUIR_TRABAJADORES,
  FILTROS_INCLUIR_TRABAJADORES,
  PERSISTENCIA_PICKER_TRABAJADORES,
  filtroTrabajadoresElegiblesDesdeGrid,
  type FilaTrabajadorElegible,
} from './nomina-incluir-trabajadores.presenter';

function fila(parcial: Partial<FilaTrabajadorElegible> = {}): FilaTrabajadorElegible {
  return {
    id: '1',
    nombre: 'Ana Pérez',
    rut: '12.345.678-9',
    cargo: 'Analista',
    departamento: 'TI',
    yaEnNomina: false,
    ...parcial,
  };
}

describe('nomina-incluir-trabajadores.presenter', () => {
  it('expone clave de persistencia estable para localStorage', () => {
    expect(PERSISTENCIA_PICKER_TRABAJADORES).toBe('nomina-v2-picker-trabajadores-v1');
  });

  it('columnas declaran Trabajador, RUT, Cargo, Centro de costo e Inclusión', () => {
    const ids = COLUMNAS_INCLUIR_TRABAJADORES.map((c) => c.id);
    expect(ids).toEqual(['nombre', 'rut', 'cargo', 'departamento', 'yaEnNomina']);
    const nombreCol = COLUMNAS_INCLUIR_TRABAJADORES.find((c) => c.id === 'nombre');
    expect(nombreCol?.hideable).toBe(false);
  });

  describe('filtros declarativos', () => {
    const filtros = FILTROS_INCLUIR_TRABAJADORES([]);
    const disponibilidad = filtros.find((f) => f.id === 'disponibilidad');

    it('expone filtro "Disponibilidad" con opciones elegible/ya en nómina', () => {
      expect(disponibilidad).toBeDefined();
      expect(disponibilidad?.options).toEqual([
        { label: 'Solo elegibles', value: 'no' },
        { label: 'Ya en nómina', value: 'si' },
      ]);
    });

    it('filtroTrabajadoresElegiblesDesdeGrid mapea búsqueda, solo elegibles y ya en nómina', () => {
      expect(
        filtroTrabajadoresElegiblesDesdeGrid({
          busqueda: ' ana ',
          disponibilidad: 'no',
        }),
      ).toEqual({ busqueda: 'ana', soloDisponibles: true });
      expect(filtroTrabajadoresElegiblesDesdeGrid({ disponibilidad: 'si' })).toEqual({
        soloEnNomina: true,
      });
    });
  });
});
