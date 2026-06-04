import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { NominaPeriodoResumen } from '../../models/nomina-periodo.models';
import { NominaPeriodoService } from '../../services/nomina-periodo.service';
import { AdministradorNominasContainer } from './administrador-nominas-container';

function resumenMock(overrides: Partial<NominaPeriodoResumen> = {}): NominaPeriodoResumen {
  return {
    id: 'nom-1',
    periodo: '2026-06',
    empresaId: '7',
    empresaNombre: 'Demo',
    tipo: 'mensual',
    estado: 'dotacion_generada',
    totalTrabajadores: 12,
    totalSegmentos: 1,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    totalIncidenciasCriticas: 1,
    totalAdvertencias: 2,
    createdAt: '2026-06-04T00:00:00Z',
    updatedAt: '2026-06-04T00:00:00Z',
    ...overrides,
  };
}

interface ServicioMock {
  listarResumenes: ReturnType<typeof vi.fn>;
  obtenerResumenValidacionNomina: ReturnType<typeof vi.fn>;
}

function configurar(opts: { servicio: ServicioMock; navigate?: ReturnType<typeof vi.fn> }) {
  const navigate = opts.navigate ?? vi.fn().mockResolvedValue(true);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: Router, useValue: { navigate } },
      { provide: NominaPeriodoService, useValue: opts.servicio },
    ],
  });
  return { navigate };
}

describe('AdministradorNominasContainer (smoke F3c)', () => {
  let servicio: ServicioMock;

  beforeEach(() => {
    servicio = {
      listarResumenes: vi.fn().mockResolvedValue([resumenMock(), resumenMock({ id: 'nom-2' })]),
      obtenerResumenValidacionNomina: vi.fn().mockResolvedValue({
        totalTrabajadores: 12,
        listosParaCalculo: 10,
        conIncidenciasCriticas: 1,
        conAdvertencias: 2,
        conMovimientosEspeciales: 0,
        puedeCalcular: false,
        puedeCerrar: false,
        incidenciasCriticas: [],
        advertencias: [],
      }),
    };
  });

  it('Test 33 — se instancia y carga resúmenes desde NominaPeriodoService', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    expect(cmp.resumenes()).toHaveLength(2);
    expect(servicio.listarResumenes).toHaveBeenCalled();
  });

  it('Test 34 — los KPIs reflejan la carga inicial del servicio', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const kpis = cmp.kpis();
    expect(kpis.total).toBe(cmp.resumenes().length);
    expect(kpis.items).toHaveLength(4);
  });

  it('Test 35 — abrirNuevaNomina / cerrarNuevaNomina alternan el flag del modal', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    expect(cmp.modalNuevaAbierto()).toBe(false);
    cmp.abrirNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(true);
    cmp.cerrarNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(false);
  });

  it('Test 36 — abrirResumen llama servicio.obtenerResumenValidacionNomina', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    await cmp.abrirResumen(fila);
    expect(servicio.obtenerResumenValidacionNomina).toHaveBeenCalledWith(fila.id);
    expect(cmp.resumenSeleccionado()).not.toBeNull();
    expect(cmp.nominaSeleccionada()?.id).toBe(fila.id);

    cmp.cerrarResumen();
    expect(cmp.resumenSeleccionado()).toBeNull();
    expect(cmp.nominaSeleccionada()).toBeNull();
  });

  it('Test 37 — abrirGenerador navega a la ruta definitiva /remuneraciones/nominas/:id/generador', async () => {
    const { navigate } = configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.abrirGenerador(fila);

    expect(navigate).toHaveBeenCalledWith(['/remuneraciones/nominas', fila.id, 'generador']);
  });

  it('Test 38 — onNominaCreada agrega un resumen nuevo al inicio y cierra el modal', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;

    cmp.abrirNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(true);

    const nuevoResumen = resumenMock({ id: 'nom-nuevo', periodo: '2026-07' });
    cmp.onNominaCreada(nuevoResumen);

    expect(cmp.resumenes()[0]?.id).toBe('nom-nuevo');
    expect(cmp.modalNuevaAbierto()).toBe(false);
  });

  it('Test 39 — registra error cuando el servicio falla', async () => {
    servicio.listarResumenes.mockReset().mockRejectedValue(new Error('boom'));
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    expect(cmp.errorCarga()).toBe('boom');
    expect(cmp.resumenes()).toHaveLength(0);
  });
});
