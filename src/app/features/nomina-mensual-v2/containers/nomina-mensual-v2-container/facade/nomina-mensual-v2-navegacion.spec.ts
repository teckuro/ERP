import { describe, expect, it } from 'vitest';

import {
  ORDEN_PASOS_NOMINA,
  PASOS_CONGELADOS_V11,
  esPasoCongelado,
  esRetrocesoAPaso,
  obtenerEtiquetaAccionPrincipal,
  obtenerTituloPaso,
  tooltipPasoCongelado,
} from './nomina-mensual-v2-navegacion';

describe('nomina-mensual-v2-navegacion', () => {
  it('incluye scope entre parameters y employees', () => {
    const indiceParametros = ORDEN_PASOS_NOMINA.indexOf('parameters');
    const indiceAlcance = ORDEN_PASOS_NOMINA.indexOf('scope');
    const indiceEmpleados = ORDEN_PASOS_NOMINA.indexOf('employees');

    expect(indiceAlcance).toBe(indiceParametros + 1);
    expect(indiceEmpleados).toBe(indiceAlcance + 1);
  });

  it('expone copy del paso Alcance', () => {
    expect(obtenerTituloPaso('scope')).toBe('Alcance de generación');
    expect(obtenerEtiquetaAccionPrincipal('scope')).toBe('Validar alcance');
  });

  it('expone Preparar nómina en parámetros', () => {
    expect(obtenerEtiquetaAccionPrincipal('parameters')).toBe('Preparar nómina');
  });

  it('detecta retroceso al paso Parametros desde Alcance', () => {
    expect(esRetrocesoAPaso('scope', 'parameters')).toBe(true);
    expect(esRetrocesoAPaso('parameters', 'scope')).toBe(false);
  });

  it('congela los pasos posteriores a Empleados hasta V11', () => {
    expect(PASOS_CONGELADOS_V11.has('movements')).toBe(true);
    expect(PASOS_CONGELADOS_V11.has('calculation')).toBe(true);
    expect(PASOS_CONGELADOS_V11.has('validation')).toBe(true);
    expect(PASOS_CONGELADOS_V11.has('approval')).toBe(true);
    expect(PASOS_CONGELADOS_V11.has('payslips')).toBe(true);
    expect(PASOS_CONGELADOS_V11.has('parameters')).toBe(false);
    expect(PASOS_CONGELADOS_V11.has('scope')).toBe(false);
    expect(PASOS_CONGELADOS_V11.has('employees')).toBe(false);
  });

  it('expone helpers `esPasoCongelado` y `tooltipPasoCongelado`', () => {
    expect(esPasoCongelado('movements')).toBe(true);
    expect(esPasoCongelado('employees')).toBe(false);
    expect(tooltipPasoCongelado().toLowerCase()).toContain('versión 11');
  });
});
