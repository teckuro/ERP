import {
  ORDEN_PASOS_NOMINA,
  obtenerEtiquetaAccionPrincipal,
  obtenerTituloPaso,
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
});
