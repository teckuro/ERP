import { describe, expect, it } from 'vitest';

import {
  ORDEN_PASOS_NOMINA,
  PASOS_CONGELADOS_V11,
  esPasoCongelado,
  esRetrocesoAPaso,
  obtenerEtiquetaAccionPrincipal,
  obtenerTituloPaso,
} from './nomina-mensual-v2-navegacion';

describe('nomina-mensual-v2-navegacion (F3 fusion — 6 pasos)', () => {
  it('expone exactamente 6 pasos en el orden definido por la fase F3', () => {
    expect(ORDEN_PASOS_NOMINA).toEqual([
      'parameters',
      'dotacion',
      'movements',
      'calculation',
      'validation',
      'closure',
    ]);
  });

  it('incluye dotacion entre parameters y movements', () => {
    const indiceParametros = ORDEN_PASOS_NOMINA.indexOf('parameters');
    const indiceDotacion = ORDEN_PASOS_NOMINA.indexOf('dotacion');
    const indiceMovimientos = ORDEN_PASOS_NOMINA.indexOf('movements');

    expect(indiceDotacion).toBe(indiceParametros + 1);
    expect(indiceMovimientos).toBe(indiceDotacion + 1);
  });

  it('expone copy del paso Dotación', () => {
    expect(obtenerTituloPaso('dotacion')).toBe('Dotación del período');
    expect(obtenerEtiquetaAccionPrincipal('dotacion')).toBe('Confirmar dotación');
  });

  it('expone copy del paso Cierre', () => {
    expect(obtenerTituloPaso('closure')).toBe('Cierre y liquidaciones');
    expect(obtenerEtiquetaAccionPrincipal('closure')).toBe('Cerrar nómina');
  });

  it('detecta retroceso al paso Parametros desde Dotación', () => {
    expect(esRetrocesoAPaso('dotacion', 'parameters')).toBe(true);
    expect(esRetrocesoAPaso('parameters', 'dotacion')).toBe(false);
  });

  it('no congela ningún paso en F3 fusion: PASOS_CONGELADOS_V11 está vacío', () => {
    expect(PASOS_CONGELADOS_V11.size).toBe(0);
    expect(esPasoCongelado('movements')).toBe(false);
    expect(esPasoCongelado('closure')).toBe(false);
  });
});
