import { describe, expect, it } from 'vitest';

import { crearNominaResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import {
  PERSISTENCIA_SELECCION_NOMINA_LRE,
  PERSISTENCIA_SELECCION_NOMINA_PREVIRED,
  construirContextoOrigenSalidaExterna,
  etiquetaNominaActivaSalidaExport,
  rutaLiquidacionesNomina,
  rutaPreviredNomina,
} from './salida-externa-layout.presenter';

describe('salida-externa-layout.presenter', () => {
  const nomina = crearNominaResumen({
    id: 'nom-1',
    estado: 'liquidada',
    periodo: '2026-04',
    empresaNombre: 'Acme SpA',
    evidenciaCalculo: { idCalculoPeriodo: 1, versionCalculo: 1, calculoVigente: true },
  });

  it('expone claves de persistencia distintas por módulo', () => {
    expect(PERSISTENCIA_SELECCION_NOMINA_PREVIRED).not.toBe(PERSISTENCIA_SELECCION_NOMINA_LRE);
  });

  it('arma etiqueta de nómina activa con periodo, empresa y estado', () => {
    const etiqueta = etiquetaNominaActivaSalidaExport([nomina], 'nom-1');
    expect(etiqueta).toContain('Acme SpA');
    expect(etiqueta).toContain('Liquidada');
  });

  it('devuelve copy de sin selección cuando no hay id', () => {
    expect(etiquetaNominaActivaSalidaExport([nomina], null)).toBe('Seleccionar nómina');
  });

  it('construye contexto origen desde borrador y nómina', () => {
    const ctx = construirContextoOrigenSalidaExterna({
      borrador: {
        periodo: '2026-04',
        empresaNombre: 'Acme SpA',
        versionLiquidacion: 2,
        totalTrabajadores: 12,
        lineasCount: 48,
      },
      nomina,
    });

    expect(ctx.eyebrow).toBe('Origen · Liquidación oficial');
    expect(ctx.titulo).toContain('Acme SpA');
    expect(ctx.versionLabel).toBe('v2');
    expect(ctx.metricas).toHaveLength(3);
    expect(ctx.metricas[1].value).toBe('48');
  });

  it('arma ruta a liquidaciones con query de nómina cuando aplica', () => {
    expect(rutaLiquidacionesNomina('nom-1')).toEqual({
      path: '/remuneraciones/liquidaciones',
      queryParams: { nominaPeriodoId: 'nom-1' },
    });
    expect(rutaLiquidacionesNomina(null)).toEqual({
      path: '/remuneraciones/liquidaciones',
    });
  });

  it('arma ruta a Previred con query de nómina cuando aplica', () => {
    expect(rutaPreviredNomina('nom-1')).toEqual({
      path: '/remuneraciones/previred',
      queryParams: { nominaPeriodoId: 'nom-1' },
    });
    expect(rutaPreviredNomina(null)).toEqual({
      path: '/remuneraciones/previred',
    });
  });
});
