import { describe, expect, it } from 'vitest';

import type { FilaTrabajadorNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import {
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
});
