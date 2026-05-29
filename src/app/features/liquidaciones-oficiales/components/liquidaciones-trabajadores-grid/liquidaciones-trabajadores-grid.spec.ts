import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CheckCircle, DollarSign, FileText, Repeat, Send } from 'lucide-angular/src/icons';
import { beforeEach, describe, expect, it } from 'vitest';

import type { LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';
import { LiquidacionesTrabajadoresGridComponent } from './liquidaciones-trabajadores-grid';

describe('LiquidacionesTrabajadoresGridComponent', () => {
  let fixture: ComponentFixture<LiquidacionesTrabajadoresGridComponent>;
  let component: LiquidacionesTrabajadoresGridComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidacionesTrabajadoresGridComponent],
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ CheckCircle, DollarSign, FileText, Repeat, Send })),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidacionesTrabajadoresGridComponent);
    component = fixture.componentInstance;
    component.trabajadores = [trabajador(1)];
    fixture.detectChanges();
  });

  it('muestra autorizar y PDF deshabilitado en estado inicial', () => {
    const text = fixture.nativeElement.textContent as string;
    const pdfButton = fixture.nativeElement.querySelector(
      'button[aria-label="PDF pendiente de implementación"]',
    ) as HTMLButtonElement | null;

    expect(text).toContain('Pendiente de autorizar');
    expect(text).toContain('Autorizar');
    expect(pdfButton?.disabled).toBe(true);
  });

  it('cambia la accion principal cuando el estado visual avanza', () => {
    fixture.componentRef.setInput('estadosAccion', { 1: 'autorizada' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Autorizada');
    expect(fixture.nativeElement.textContent).toContain('Registrar pago');
    expect(fixture.nativeElement.textContent).toContain('Ver detalle');
  });

  it('emite la accion de flujo con id de trabajador', () => {
    const events: unknown[] = [];
    component.accionFlujo.subscribe((event) => events.push(event));

    const autorizar = fixture.nativeElement.querySelector(
      'button[aria-label="Autorizar liquidación"]',
    ) as HTMLButtonElement;
    autorizar.click();

    expect(events).toEqual([{ idLiquidacionTrabajador: 1, tipo: 'autorizar' }]);
  });

  it('muestra rectificacion como accion secundaria en estados avanzados', () => {
    fixture.componentRef.setInput('estadosAccion', { 1: 'documento_enviado' });
    fixture.detectChanges();

    const rectificar = fixture.nativeElement.querySelector(
      'button[aria-label="Solicitar rectificación de liquidación"]',
    ) as HTMLButtonElement | null;
    expect(fixture.nativeElement.textContent).toContain('Documento enviado');
    expect(rectificar).not.toBeNull();
  });
});

function trabajador(id: number): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: id,
    idPersona: id,
    idContrato: null,
    rut: '11.111.111-1',
    nombreTrabajador: 'Trabajador Prueba',
    cargo: null,
    centroCosto: null,
    fechaIngreso: null,
    diasTrabajados: null,
    baseImponible: 100,
    baseTributable: 100,
    totalHaberes: 100,
    totalDescuentos: 20,
    totalAportesEmpleadorReferencia: 0,
    liquidoPagar: 80,
    estado: 'generada',
    observaciones: [],
    metadata: {},
  };
}
