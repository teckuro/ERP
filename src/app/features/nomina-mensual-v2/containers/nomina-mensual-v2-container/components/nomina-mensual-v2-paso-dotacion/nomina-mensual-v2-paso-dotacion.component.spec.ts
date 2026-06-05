import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoDotacionComponent } from './nomina-mensual-v2-paso-dotacion.component';

function filaMock(parcial: Partial<FilaTrabajadorNominaResumen> = {}): FilaTrabajadorNominaResumen {
  return {
    trabajadorId: 'tr-1',
    nombre: 'Ana Pérez',
    rut: '12.345.678-9',
    estado: 'listo',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 0,
    tieneDatosBancarios: true,
    tieneDatosPrevisionales: true,
    ...parcial,
  };
}

function configurarTestBed(servicio: Record<string, unknown>): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: NominaPeriodoService, useValue: servicio }],
  });
}

describe('NominaMensualV2PasoDotacionComponent (DOT-DET-04)', () => {
  let servicio: Record<string, unknown>;

  beforeEach(() => {
    servicio = {
      filtrarDotacion: vi.fn().mockResolvedValue({ filas: [], total: 0 }),
      previsualizarAccionMasiva: vi.fn().mockResolvedValue(null),
      aplicarAccionMasiva: vi.fn().mockResolvedValue(undefined),
      confirmarDotacion: vi.fn().mockResolvedValue(undefined),
      obtenerDetalleTrabajador: vi.fn().mockResolvedValue({
        trabajadorId: 'tr-1',
        movimientos: [],
        incidencias: [],
      }),
    };
  });

  it('al abrir detalle conserva nombre + RUT de la fila ya cargada', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock({ trabajadorId: 'tr-1', nombre: 'Ana Pérez', rut: '12.345.678-9' })], total: 1 });

    await cmp.abrirDetalle('tr-1');

    expect(cmp.detalleTrabajadorIdentidad()).toEqual({
      nombre: 'Ana Pérez',
      rut: '12.345.678-9',
    });
    expect(cmp.trabajadorSeleccionado()).toBe('tr-1');
  });

  it('detalleTrabajadorIdentidad es null si la fila no está en la página actual', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock({ trabajadorId: 'tr-1' })], total: 1 });

    await cmp.abrirDetalle('tr-no-cargado');

    expect(cmp.detalleTrabajadorIdentidad()).toBeNull();
    expect(cmp.trabajadorSeleccionado()).toBe('tr-no-cargado');
  });

  it('cerrarDetalle limpia identidad y selección', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock()], total: 1 });
    await cmp.abrirDetalle('tr-1');
    expect(cmp.detalleTrabajadorIdentidad()).not.toBeNull();

    cmp.cerrarDetalle();
    expect(cmp.detalleTrabajadorIdentidad()).toBeNull();
    expect(cmp.detalleTrabajador()).toBeNull();
    expect(cmp.trabajadorSeleccionado()).toBeNull();
  });

  it('cerrarDetalle restaura el foco al elemento que disparó la apertura (QA-FOC-01)', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoDotacionComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    cmp.vista.set({ filas: [filaMock()], total: 1 });

    const trigger = document.createElement('button');
    trigger.textContent = 'Ver detalle';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await cmp.abrirDetalle('tr-1');
    cmp.cerrarDetalle();

    // queueMicrotask programa el foco; resolvemos la promesa para esperar el tick
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });
});
