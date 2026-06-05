import { describe, expect, it } from 'vitest';

import type { FilaTrabajadorNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import {
  COLUMNAS_DOTACION,
  FILTROS_DOTACION,
  PERSISTENCIA_GRILLA_DOTACION,
  calcularStatsDotacion,
  etiquetaEstadoDotacion,
  hayFiltrosActivos,
  listaEstadosDotacion,
} from './nomina-dotacion-grid.presenter';

function filaEjemplo(
  override: Partial<FilaTrabajadorNominaResumen> = {},
): FilaTrabajadorNominaResumen {
  return {
    trabajadorId: '1',
    nombre: 'Persona Demo',
    rut: '11111111-1',
    estado: 'listo',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 0,
    tieneDatosBancarios: true,
    tieneDatosPrevisionales: true,
    ...override,
  };
}

describe('nomina-dotacion-grid.presenter', () => {
  it('calcula los contadores agrupados por estado', () => {
    const stats = calcularStatsDotacion([
      filaEjemplo({ estado: 'listo' }),
      filaEjemplo({ estado: 'listo' }),
      filaEjemplo({ estado: 'advertencia' }),
      filaEjemplo({ estado: 'critico' }),
      filaEjemplo({ estado: 'bloqueado' }),
    ]);

    expect(stats).toEqual({
      total: 5,
      listos: 2,
      conAdvertencias: 1,
      conCriticos: 1,
      bloqueados: 1,
    });
  });

  it('detecta filtros activos sólo cuando hay criterios reales', () => {
    expect(hayFiltrosActivos({})).toBe(false);
    expect(hayFiltrosActivos({ busqueda: '' })).toBe(false);
    expect(hayFiltrosActivos({ busqueda: '   ' })).toBe(false);
    expect(hayFiltrosActivos({ busqueda: 'pé' })).toBe(true);
    expect(hayFiltrosActivos({ estado: 'critico' })).toBe(true);
    expect(hayFiltrosActivos({ conIncidencias: true })).toBe(true);
    expect(hayFiltrosActivos({ conMovimientos: false })).toBe(true);
  });

  it('expone etiquetas operativas para cada estado de dotación', () => {
    expect(etiquetaEstadoDotacion('listo')).toBe('Listo');
    expect(etiquetaEstadoDotacion('advertencia')).toBe('Con advertencia');
    expect(etiquetaEstadoDotacion('critico')).toBe('Con incidencia crítica');
    expect(etiquetaEstadoDotacion('bloqueado')).toBe('Bloqueado');
  });

  it('lista los estados ordenados de menor a mayor gravedad operativa', () => {
    expect(listaEstadosDotacion()).toEqual(['listo', 'advertencia', 'critico', 'bloqueado']);
  });

  describe('Contrato declarativo para app-data-grid', () => {
    it('expone clave de persistencia estable y columnas tipadas', () => {
      expect(PERSISTENCIA_GRILLA_DOTACION).toBe('nomina-v2-dotacion-grid-v1');
      const ids = COLUMNAS_DOTACION.map((c) => c.id);
      expect(ids).toEqual([
        'nombre',
        'rut',
        'cargo',
        'estado',
        'totalIncidenciasCriticas',
        'totalMovimientos',
        'acciones',
      ]);
    });

    it('filtro de estado deja pasar solo el estado coincidente', () => {
      const filtros = FILTROS_DOTACION([]);
      const filtroEstado = filtros.find((f) => f.id === 'estado');
      expect(filtroEstado).toBeDefined();
      expect(filtroEstado?.predicate?.(filaEjemplo({ estado: 'critico' }), 'critico')).toBe(true);
      expect(filtroEstado?.predicate?.(filaEjemplo({ estado: 'listo' }), 'critico')).toBe(false);
      expect(filtroEstado?.predicate?.(filaEjemplo({ estado: 'listo' }), '')).toBe(true);
    });

    it('filtro de incidencias suma críticas y advertencias para decidir', () => {
      const filtros = FILTROS_DOTACION([]);
      const filtro = filtros.find((f) => f.id === 'incidencias');
      const conIncidencia = filaEjemplo({ totalIncidenciasCriticas: 1 });
      const sinIncidencia = filaEjemplo({ totalIncidenciasCriticas: 0, totalAdvertencias: 0 });
      expect(filtro?.predicate?.(conIncidencia, 'con')).toBe(true);
      expect(filtro?.predicate?.(sinIncidencia, 'con')).toBe(false);
      expect(filtro?.predicate?.(sinIncidencia, 'sin')).toBe(true);
    });

    it('filtro de movimientos discrimina filas con/sin movimientos', () => {
      const filtros = FILTROS_DOTACION([]);
      const filtro = filtros.find((f) => f.id === 'movimientos');
      expect(filtro?.predicate?.(filaEjemplo({ totalMovimientos: 0 }), 'con')).toBe(false);
      expect(filtro?.predicate?.(filaEjemplo({ totalMovimientos: 2 }), 'con')).toBe(true);
      expect(filtro?.predicate?.(filaEjemplo({ totalMovimientos: 0 }), 'sin')).toBe(true);
    });
  });
});
