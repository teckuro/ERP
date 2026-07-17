import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import { PanelRightOpen, TrendingDown, TrendingUp, X } from 'lucide-angular/src/icons';

import type { LiquidacionConcepto, LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';
import { LiquidacionDetallePanelComponent } from './liquidacion-detalle-panel';

function crearTrabajador(partial: Partial<LiquidacionTrabajador> = {}): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: 1,
    idPersona: 1,
    idContrato: 1,
    rut: '11.111.111-1',
    nombreTrabajador: 'Ana Pérez',
    cargo: 'Analista',
    centroCosto: 'RRHH',
    fechaIngreso: '2020-03-01',
    diasTrabajados: 30,
    baseImponible: 100,
    baseTributable: 90,
    totalHaberes: 100,
    totalDescuentos: 10,
    totalAportesEmpleadorReferencia: 5,
    liquidoPagar: 90,
    estado: 'generada',
    observaciones: [],
    metadata: {},
    ...partial,
  };
}

function crearConcepto(partial: Partial<LiquidacionConcepto>): LiquidacionConcepto {
  return {
    idLiquidacionConcepto: 1,
    idLiquidacionTrabajador: 1,
    idConcepto: 1,
    codigo: 'SUELDO',
    codigoLre: null,
    nombre: 'Sueldo base',
    tipo: 'haber',
    clasificacion: null,
    cantidad: null,
    base: null,
    tasa: null,
    monto: 100,
    orden: 1,
    metadata: {},
    ...partial,
  };
}

describe('LiquidacionDetallePanelComponent', () => {
  let fixture: ComponentFixture<LiquidacionDetallePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidacionDetallePanelComponent],
      providers: [
        importProvidersFrom(
          LucideAngularModule.pick({
            PanelRightOpen,
            TrendingDown,
            TrendingUp,
            X,
          }),
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidacionDetallePanelComponent);
  });

  it('muestra chip de estado y cuadratura cuando hay trabajador', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.componentInstance.estadoTrabajador = { label: 'Pendiente de autorizar', tono: 'review' };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Pendiente de autorizar');
    expect(text).toContain('Haberes − Descuentos =');
    expect(text).toContain('Líquido a pagar');
    expect(text).toContain('Amplíe para ver datos laborales');
    expect(fixture.componentInstance.cuadraturaOk()).toBe(true);
  });

  it('emite cerrarDetalle al pulsar X', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.cerrarDetalle, 'emit');
    const boton = fixture.nativeElement.querySelector('[aria-label="Cerrar detalle"]');
    expect(boton).toBeTruthy();
    boton.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('marca desajuste de cuadratura con nota de revisión', () => {
    fixture.componentInstance.trabajador = crearTrabajador({
      totalHaberes: 100,
      totalDescuentos: 10,
      liquidoPagar: 80,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.cuadraturaOk()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Revisar con nómina mensual');
  });

  it('placeholder accionable sin trabajador seleccionado', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Seleccione un trabajador');
  });

  it('emite expandirDetalle al pulsar ampliar', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.expandirDetalle, 'emit');
    const boton = fixture.nativeElement.querySelector('[aria-label="Ver ficha detallada"]');
    expect(boton).toBeTruthy();
    boton.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('oculta botón ampliar cuando permitirExpandir es false', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.componentInstance.permitirExpandir = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Ver ficha detallada"]')).toBeNull();
  });

  it('oculta botón cerrar cuando permitirCerrar es false', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.componentInstance.permitirCerrar = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Cerrar detalle"]')).toBeNull();
  });

  it('en modo detallado muestra ficha laboral, base/tasa y aportes', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.componentInstance.modo = 'detallado';
    fixture.componentInstance.conceptos = [
      crearConcepto({
        idLiquidacionConcepto: 1,
        nombre: 'Sueldo base',
        tipo: 'haber',
        base: 1000000,
        tasa: null,
        monto: 1000000,
      }),
      crearConcepto({
        idLiquidacionConcepto: 2,
        nombre: 'AFP',
        tipo: 'descuento',
        codigo: 'AFP',
        base: 1000000,
        tasa: 10.5,
        monto: 105000,
      }),
      crearConcepto({
        idLiquidacionConcepto: 3,
        nombre: 'SIS empleador',
        tipo: 'cotizacion',
        codigo: 'SIS',
        clasificacion: 'aporte_referencia',
        monto: 12000,
      }),
    ];
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Analista');
    expect(text).toContain('RRHH');
    expect(text).toContain('Días trabajados');
    expect(text).toContain('Base');
    expect(text).toContain('Tasa');
    expect(text).toContain('Aportes del empleador');
    expect(text).toContain('SIS');
    expect(text).not.toContain('Amplíe para ver datos laborales');
  });
});
