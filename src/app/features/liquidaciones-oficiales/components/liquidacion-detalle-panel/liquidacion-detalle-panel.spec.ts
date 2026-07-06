import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { LiquidacionTrabajador } from '../../models/liquidacion-oficial.model';
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
    fechaIngreso: null,
    diasTrabajados: 30,
    baseImponible: 100,
    baseTributable: 90,
    totalHaberes: 100,
    totalDescuentos: 10,
    totalAportesEmpleadorReferencia: 0,
    liquidoPagar: 90,
    estado: 'generada',
    observaciones: [],
    metadata: {},
    ...partial,
  };
}

describe('LiquidacionDetallePanelComponent', () => {
  let fixture: ComponentFixture<LiquidacionDetallePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidacionDetallePanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidacionDetallePanelComponent);
  });

  it('muestra chip de estado y cuadratura cuando hay trabajador', () => {
    fixture.componentInstance.trabajador = crearTrabajador();
    fixture.componentInstance.estadoTrabajador = { label: 'Pendiente de autorizar', tono: 'review' };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Pendiente de autorizar');
    expect(text).toContain('Haberes − Descuentos = Líquido');
    expect(fixture.componentInstance.cuadraturaOk()).toBe(true);
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
    expect(fixture.nativeElement.textContent).toContain('Selecciona un trabajador en la grilla');
  });
});
