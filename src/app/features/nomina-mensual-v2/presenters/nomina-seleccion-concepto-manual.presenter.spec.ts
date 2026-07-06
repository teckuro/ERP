import { describe, expect, it } from 'vitest';

import {
  construirItemsPickerConceptoManual,
  filtrarItemsPickerConceptoManual,
} from './nomina-seleccion-concepto-manual.presenter';

describe('nomina-seleccion-concepto-manual.presenter', () => {
  it('construirItemsPickerConceptoManual incluye catálogo y registros operativos', () => {
    const items = construirItemsPickerConceptoManual([
      {
        idConcepto: 1,
        codigo: 'BONO',
        nombre: 'Bono',
        tipo: 'HABER',
        naturaleza: null,
        imponible: true,
        tributable: true,
        codigoLre: null,
      },
      {
        idConcepto: 2,
        codigo: 'PREST',
        nombre: 'Préstamo',
        tipo: 'DESCUENTO',
        naturaleza: null,
        imponible: false,
        tributable: false,
        codigoLre: null,
      },
    ]);

    expect(items.some((item) => item.origen === 'catalogo' && item.codigo === 'BONO')).toBe(true);
    expect(items.some((item) => item.origen === 'operativo' && item.categoria === 'ausencia')).toBe(
      true,
    );
  });

  it('filtrarItemsPickerConceptoManual respeta categoría y búsqueda', () => {
    const items = construirItemsPickerConceptoManual([
      {
        idConcepto: 1,
        codigo: 'BONO',
        nombre: 'Bono productividad',
        tipo: 'HABER',
        naturaleza: null,
        imponible: true,
        tributable: true,
        codigoLre: null,
      },
    ]);

    const haberes = filtrarItemsPickerConceptoManual(items, '', 'haber');
    expect(haberes.every((item) => item.categoria === 'haber')).toBe(true);

    const busqueda = filtrarItemsPickerConceptoManual(items, 'productividad', 'todos');
    expect(busqueda).toHaveLength(1);
    expect(busqueda[0]?.nombre).toContain('productividad');
  });
});
