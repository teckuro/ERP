import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PeriodoMensualInputComponent } from './periodo-mensual-input.component';

describe('PeriodoMensualInputComponent', () => {
  it('emite YYYY-MM al elegir un mes del panel', () => {
    const fixture = TestBed.createComponent(PeriodoMensualInputComponent);
    const cmp = fixture.componentInstance;
    let emitido = '';
    cmp.valueChange.subscribe((valor) => { emitido = valor; });

    cmp.writeValue('2026-05');
    cmp.seleccionarPeriodo('2026-07');
    expect(emitido).toBe('2026-07');
    expect(cmp.etiquetaVisible).toMatch(/Julio 2026/);
  });

  it('construye grilla de 12 meses para el año visible', () => {
    const fixture = TestBed.createComponent(PeriodoMensualInputComponent);
    const cmp = fixture.componentInstance;
    cmp.writeValue('2026-07');
    expect(cmp.mesesPanel).toHaveLength(12);
    expect(cmp.mesesPanel[6]?.value).toBe('2026-07');
    expect(cmp.mesesPanel[6]?.labelCorto).toBe('JUL');
  });

  it('al elegir año cierra el desplegable y mantiene el panel de meses', () => {
    const fixture = TestBed.createComponent(PeriodoMensualInputComponent);
    const cmp = fixture.componentInstance;
    cmp.writeValue('2026-07');
    cmp.abierto = true;
    cmp.anioSelectAbierto = true;
    cmp.seleccionarAnio(2024, new MouseEvent('click'));
    expect(cmp.anioPanel).toBe(2024);
    expect(cmp.anioSelectAbierto).toBe(false);
    expect(cmp.abierto).toBe(true);
    expect(cmp.mesesPanel[0]?.value).toBe('2024-01');
  });

  it('filtra años al buscar en el desplegable del select de año', () => {
    const fixture = TestBed.createComponent(PeriodoMensualInputComponent);
    const cmp = fixture.componentInstance;
    cmp.writeValue('2026-07');
    cmp.toggleSelectorAnio(new MouseEvent('click'));
    expect(cmp.anioSelectAbierto).toBe(true);
    cmp.onBusquedaAnio({ target: { value: '2024' } } as unknown as Event);
    expect(cmp.aniosFiltrados).toContain(2024);
    expect(cmp.aniosFiltrados.every((anio) => String(anio).includes('2024'))).toBe(true);
  });
});
