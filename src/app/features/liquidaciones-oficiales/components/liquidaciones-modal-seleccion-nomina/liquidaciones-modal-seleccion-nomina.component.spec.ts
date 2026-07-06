import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, ArrowRight, CheckCircle } from 'lucide-angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { crearNominaResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import { LiquidacionesModalSeleccionNominaComponent } from './liquidaciones-modal-seleccion-nomina.component';

describe('LiquidacionesModalSeleccionNominaComponent', () => {
  let fixture: ComponentFixture<LiquidacionesModalSeleccionNominaComponent>;

  const nominaLiquidada = crearNominaResumen({
    id: 'nom-1',
    estado: 'liquidada',
    periodo: '2026-04',
    empresaNombre: 'Acme SpA',
    evidenciaCalculo: { idCalculoPeriodo: 1, versionCalculo: 1, calculoVigente: true },
  });

  const nominaCerrada = crearNominaResumen({
    id: 'nom-2',
    estado: 'cerrada',
    periodo: '2026-03',
    empresaNombre: 'Beta Ltda',
    evidenciaCalculo: { idCalculoPeriodo: 2, versionCalculo: 1, calculoVigente: true },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidacionesModalSeleccionNominaComponent],
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ ArrowRight, CheckCircle })),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidacionesModalSeleccionNominaComponent);
    fixture.componentRef.setInput('abierto', true);
    fixture.componentRef.setInput('nominas', [nominaLiquidada, nominaCerrada]);
    fixture.detectChanges();
  });

  it('muestra el modal con grilla de nóminas', () => {
    expect(fixture.nativeElement.textContent).toContain('Buscar nómina');
    expect(fixture.nativeElement.textContent).toContain('Acme SpA');
    expect(fixture.nativeElement.textContent).toContain('Beta Ltda');
  });

  it('emite seleccionar al pulsar acción de fila', () => {
    const spy = vi.fn();
    fixture.componentInstance.seleccionar.subscribe(spy);

    fixture.componentInstance.seleccionarNomina(nominaLiquidada);

    expect(spy).toHaveBeenCalledWith(nominaLiquidada);
  });

  it('emite cerrar al cerrar modal', () => {
    const spy = vi.fn();
    fixture.componentInstance.cerrar.subscribe(spy);

    fixture.componentInstance.cerrarModal();

    expect(spy).toHaveBeenCalled();
  });

  it('marca nómina activa cuando coincide nominaSeleccionadaId', () => {
    fixture.componentRef.setInput('nominaSeleccionadaId', 'nom-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.esNominaActiva(nominaLiquidada)).toBe(true);
    expect(fixture.componentInstance.esNominaActiva(nominaCerrada)).toBe(false);
  });
});
