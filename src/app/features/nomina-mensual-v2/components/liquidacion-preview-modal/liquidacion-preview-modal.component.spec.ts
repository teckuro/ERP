import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import type { LiquidacionCalculada } from '../../../nomina-mensual/models/proceso-mensual.model';
import { LiquidacionPreviewModalComponent } from './liquidacion-preview-modal.component';
import { liquidoEnPalabras } from './liquidacion-en-palabras';

function liquidacionMock(parcial: Partial<LiquidacionCalculada> = {}): LiquidacionCalculada {
  return {
    periodo: '2026-05',
    idPersona: 2,
    rut: '25050001',
    nombreCompleto: 'Dependiente Activo Auditoria',
    haberesImponibles: [
      { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 900000, origen: 'contrato', imponible: true, tributable: true },
      { codigo: 'GRATIFICACION_ART_50', descripcion: 'Gratificacion legal art. 50', monto: 189157, origen: 'motor', imponible: true, tributable: true },
    ],
    haberesNoImponibles: [
      { codigo: 'COLACION', descripcion: 'Colacion', monto: 20000, origen: 'haber_recurrente', imponible: false, tributable: false },
    ],
    descuentosLegales: [
      { codigo: 'AFP', descripcion: 'Cotizacion AFP trabajador', monto: 124600, origen: 'afp_vigencia' },
      { codigo: 'SALUD', descripcion: 'Cotizacion salud Fonasa', monto: 76241, origen: 'salud' },
      { codigo: 'AFC', descripcion: 'Seguro de cesantia trabajador', monto: 6535, origen: 'afc_parametro' },
    ],
    descuentosVoluntarios: [],
    baseImponiblePrevisional: 1089157,
    baseTributable: 901782,
    gratificacionLegal: 189157,
    asignacionFamiliar: 0,
    cotizacionAfp: 124600,
    cotizacionSalud: 76241,
    cotizacionAfc: 6535,
    cotizacionSis: 17645,
    cotizacionSanna: 32674,
    cotizacionLey16744: 10128,
    impuestoUnico: 0,
    totalHaberes: 1109157,
    totalDescuentos: 207376,
    liquidoAPago: 901782,
    issues: [],
    trazabilidad: [],
    estado: 'calculado_preliminar',
    ...parcial,
  };
}

describe('LiquidacionPreviewModalComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  it('renderiza cabecera empresa, periodo y datos del trabajador', () => {
    const fixture = TestBed.createComponent(LiquidacionPreviewModalComponent);
    fixture.componentRef.setInput('liquidacion', liquidacionMock());
    fixture.componentRef.setInput('empresa', {
      razonSocial: 'Empresa de Prueba S.A.',
      rut: '76.111.222-3',
      direccion: 'Av. Apoquindo 1000, Las Condes',
    });
    fixture.componentRef.setInput('nomina', { periodo: '2026-05', fechaPago: '2026-05-29' });
    fixture.componentRef.setInput('trabajadorMeta', {
      afp: 'Cuprum',
      salud: 'Fonasa',
      tipoContrato: 'Indefinido',
      sueldoBase: 900000,
    });
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Empresa de Prueba S.A.');
    expect(html).toContain('76.111.222-3');
    expect(html).toContain('mayo 2026');
    expect(html).toContain('2026-05-29');
    expect(html).toContain('Dependiente Activo Auditoria');
    expect(html).toContain('25050001');
    expect(html).toContain('Cuprum');
    expect(html).toContain('Fonasa');
    expect(html).toContain('Indefinido');
  });

  it('calcula los subtotales de haberes y descuentos', () => {
    const fixture = TestBed.createComponent(LiquidacionPreviewModalComponent);
    fixture.componentRef.setInput('liquidacion', liquidacionMock());
    fixture.componentRef.setInput('empresa', { razonSocial: 'Empresa de Prueba S.A.' });
    fixture.componentRef.setInput('nomina', { periodo: '2026-05' });
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.subtotalHaberesImponibles()).toBe(900000 + 189157);
    expect(cmp.subtotalHaberesNoImponibles()).toBe(20000);
    expect(cmp.subtotalDescuentosLegales()).toBe(124600 + 76241 + 6535);
    expect(cmp.subtotalDescuentosVoluntarios()).toBe(0);
  });

  it('expone el líquido en palabras', () => {
    const fixture = TestBed.createComponent(LiquidacionPreviewModalComponent);
    fixture.componentRef.setInput('liquidacion', liquidacionMock());
    fixture.componentRef.setInput('empresa', { razonSocial: 'Empresa de Prueba S.A.' });
    fixture.componentRef.setInput('nomina', { periodo: '2026-05' });
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.liquidoEnPalabras()).toMatch(/pesos$/);
  });

  it('emite cerrar al recibir Escape', () => {
    const fixture = TestBed.createComponent(LiquidacionPreviewModalComponent);
    fixture.componentRef.setInput('liquidacion', liquidacionMock());
    fixture.componentRef.setInput('empresa', { razonSocial: 'X' });
    fixture.componentRef.setInput('nomina', { periodo: '2026-05' });
    fixture.detectChanges();

    let cerrado = 0;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado += 1));

    fixture.componentInstance.onEscape(new KeyboardEvent('keydown', { key: 'Escape' }) as Event);
    expect(cerrado).toBe(1);
  });

  it('no cierra al simular click fuera del panel (sin handler de backdrop)', () => {
    const fixture = TestBed.createComponent(LiquidacionPreviewModalComponent);
    fixture.componentRef.setInput('liquidacion', liquidacionMock());
    fixture.componentRef.setInput('empresa', { razonSocial: 'X' });
    fixture.componentRef.setInput('nomina', { periodo: '2026-05' });
    fixture.detectChanges();

    let cerrado = 0;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado += 1));

    const backdrop = fixture.nativeElement.querySelector('.liq-preview__backdrop') as HTMLElement;
    backdrop.click();
    expect(cerrado).toBe(0);
  });

  it('expone el subtotal y el chip de aportes empleador (informativo)', () => {
    const fixture = TestBed.createComponent(LiquidacionPreviewModalComponent);
    fixture.componentRef.setInput('liquidacion', liquidacionMock());
    fixture.componentRef.setInput('empresa', { razonSocial: 'X' });
    fixture.componentRef.setInput('nomina', { periodo: '2026-05' });
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Aportes del empleador');
    expect(html).toContain('No afecta al líquido del trabajador');
    expect(html).toContain('SIS');
    expect(html).toContain('SANNA');
    expect(html).toContain('Mutual (Ley 16.744)');
  });
});

describe('liquidoEnPalabras', () => {
  it('convierte montos típicos a palabras', () => {
    expect(liquidoEnPalabras(0)).toBe('cero pesos');
    expect(liquidoEnPalabras(1)).toBe('uno pesos');
    expect(liquidoEnPalabras(100)).toBe('cien pesos');
    expect(liquidoEnPalabras(900000)).toContain('novecientos mil');
    expect(liquidoEnPalabras(1000000)).toContain('un millón');
    expect(liquidoEnPalabras(2623125)).toContain('dos millones');
  });

  it('maneja entradas inválidas devolviendo cadena vacía', () => {
    expect(liquidoEnPalabras(-1)).toBe('');
    expect(liquidoEnPalabras(Number.NaN)).toBe('');
    expect(liquidoEnPalabras(Number.POSITIVE_INFINITY)).toBe('');
  });
});
