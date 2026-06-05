import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaMensualV2PasoMovimientosComponent } from './nomina-mensual-v2-paso-movimientos.component';

function filaMock(parcial: Partial<FilaTrabajadorNominaResumen> = {}): FilaTrabajadorNominaResumen {
  return {
    trabajadorId: 'tr-1',
    nombre: 'Carlos Soto',
    rut: '17.222.333-4',
    estado: 'listo',
    totalIncidenciasCriticas: 0,
    totalAdvertencias: 0,
    totalMovimientos: 1,
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

describe('NominaMensualV2PasoMovimientosComponent (MOV-ID-03)', () => {
  let servicio: Record<string, unknown>;

  beforeEach(() => {
    servicio = {
      listarRecurrentes: vi.fn().mockResolvedValue([]),
      listarMovimientos: vi.fn().mockResolvedValue([]),
      filtrarDotacion: vi.fn().mockResolvedValue({
        filas: [
          filaMock({ trabajadorId: 'tr-1', nombre: 'Carlos Soto', rut: '17.222.333-4' }),
          filaMock({ trabajadorId: 'tr-2', nombre: 'María Rojas', rut: '18.444.555-6' }),
        ],
        total: 2,
      }),
      aplicarRecurrentesANomina: vi.fn().mockResolvedValue([]),
      omitirMovimiento: vi.fn().mockResolvedValue(undefined),
      aplicarMovimiento: vi.fn().mockResolvedValue(undefined),
      agregarMovimientoManual: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('hidrata el cache de identidades al cargar la dotación', async () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargar();

    expect(cmp.nombreTrabajador('tr-1')).toBe('Carlos Soto');
    expect(cmp.rutTrabajador('tr-1')).toBe('17.222.333-4');
    expect(cmp.nombreTrabajador('tr-2')).toBe('María Rojas');
    expect(cmp.rutTrabajador('tr-2')).toBe('18.444.555-6');
  });

  it('fallback explícito cuando el trabajador no está en cache', () => {
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    const cmp = fixture.componentInstance;

    expect(cmp.nombreTrabajador('tr-no-cargado')).toBe('Trabajador sin identificar');
    expect(cmp.rutTrabajador('tr-no-cargado')).toBe('');
  });

  it('buscarTrabajadores mergea identidades nuevas al cache', async () => {
    (servicio['filtrarDotacion'] as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      filas: [filaMock({ trabajadorId: 'tr-1' })],
      total: 1,
    });
    configurarTestBed(servicio);
    const fixture = TestBed.createComponent(NominaMensualV2PasoMovimientosComponent);
    fixture.componentRef.setInput('nominaPeriodoId', 'np-1');
    const cmp = fixture.componentInstance;

    await cmp.cargar();

    (servicio['filtrarDotacion'] as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      filas: [filaMock({ trabajadorId: 'tr-3', nombre: 'Luis Vera', rut: '19.111.222-3' })],
      total: 1,
    });

    await cmp.buscarTrabajadores('Luis');

    expect(cmp.nombreTrabajador('tr-3')).toBe('Luis Vera');
    expect(cmp.rutTrabajador('tr-3')).toBe('19.111.222-3');
    expect(cmp.nombreTrabajador('tr-1')).toBe('Carlos Soto');
  });
});
