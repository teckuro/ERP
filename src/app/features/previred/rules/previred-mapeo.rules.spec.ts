import {
  indexarCatalogoPrevired,
  listoParaEnvioPrevired,
  resolverCodigoPrevired,
} from './previred-mapeo.rules';

describe('previred-mapeo.rules', () => {
  const catalogo = indexarCatalogoPrevired([
    { codigoLre: '1101', codigoPrevired: '2101', glosaPrevired: 'Sueldo Previred' },
  ]);

  it('resuelve desde catálogo cuando existe entrada', () => {
    const resolucion = resolverCodigoPrevired('1101', catalogo, 'Sueldo base');
    expect(resolucion).toMatchObject({
      codigoMovimiento: '2101',
      glosa: 'Sueldo Previred',
      origenMapeo: 'catalogo_previred',
    });
  });

  it('usa fallback LRE cuando no hay entrada en catálogo', () => {
    const resolucion = resolverCodigoPrevired('3101', catalogo, 'Bono');
    expect(resolucion).toMatchObject({
      codigoMovimiento: '3101',
      glosa: 'Bono',
      origenMapeo: 'fallback_lre',
    });
  });

  it('determina listo para envío solo sin pendientes de mapeo', () => {
    expect(
      listoParaEnvioPrevired({
        lineas: 10,
        conceptosSinCodigo: 0,
        conceptosSinMapeoCatalogo: 0,
        tieneBloqueo: false,
      }),
    ).toBe(true);

    expect(
      listoParaEnvioPrevired({
        lineas: 10,
        conceptosSinCodigo: 0,
        conceptosSinMapeoCatalogo: 2,
        tieneBloqueo: false,
      }),
    ).toBe(false);
  });
});
