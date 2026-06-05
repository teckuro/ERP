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
  eliminarBorrador?: ReturnType<typeof vi.fn>;
  reabrirNomina?: ReturnType<typeof vi.fn>;
  anularNomina?: ReturnType<typeof vi.fn>;
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
      eliminarBorrador: vi.fn().mockResolvedValue(undefined),
      reabrirNomina: vi.fn().mockResolvedValue(undefined),
      anularNomina: vi.fn().mockResolvedValue(undefined),
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

  it('Test 40 — solicitarAccion abre el diálogo y limpia motivo/error', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const fila = resumenMock({ id: 'nom-x' });

    cmp.motivoAccion.set('texto previo');
    cmp.errorAccion.set('error previo');
    cmp.solicitarAccion('reabrir', fila);

    expect(cmp.accionPendiente()?.tipo).toBe('reabrir');
    expect(cmp.accionPendiente()?.nomina.id).toBe('nom-x');
    expect(cmp.motivoAccion()).toBe('');
    expect(cmp.errorAccion()).toBeNull();
  });

  it('Test 41 — cancelarAccion limpia el estado y respeta ejecutandoAccion', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const fila = resumenMock({ id: 'nom-y' });

    cmp.solicitarAccion('anular', fila);
    cmp.motivoAccion.set('motivo escrito');
    cmp.cancelarAccion();

    expect(cmp.accionPendiente()).toBeNull();
    expect(cmp.motivoAccion()).toBe('');
    expect(cmp.errorAccion()).toBeNull();

    cmp.solicitarAccion('reabrir', fila);
    cmp.ejecutandoAccion.set(true);
    cmp.cancelarAccion();
    expect(cmp.accionPendiente()).not.toBeNull();
  });

  it('Test 42 — confirmarAccion ejecuta el servicio y recarga (caso eliminar sin motivo)', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.solicitarAccion('eliminar', fila);
    await cmp.confirmarAccion();

    expect(servicio.eliminarBorrador).toHaveBeenCalledWith(fila.id);
    expect(cmp.accionPendiente()).toBeNull();
    expect(cmp.ejecutandoAccion()).toBe(false);
  });

  it('Test 43 — confirmarAccion exige motivo para reabrir/anular y muestra error', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.solicitarAccion('reabrir', fila);
    cmp.motivoAccion.set('   ');
    await cmp.confirmarAccion();

    expect(cmp.errorAccion()).toBe('Debes indicar el motivo de la acción.');
    expect(servicio.reabrirNomina).not.toHaveBeenCalled();
    expect(cmp.accionPendiente()).not.toBeNull();

    cmp.motivoAccion.set('Motivo válido');
    await cmp.confirmarAccion();
    expect(servicio.reabrirNomina).toHaveBeenCalledWith(fila.id, { motivo: 'Motivo válido' });
  });

  it('Test 44 — helpers de presentación del message-box son consistentes con el tipo de acción', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;

    expect(cmp.accionTituloModal('eliminar')).toBe('Eliminar borrador');
    expect(cmp.accionTituloModal('reabrir')).toBe('Reabrir nómina');
    expect(cmp.accionTituloModal('anular')).toBe('Anular nómina');

    expect(cmp.accionMessageBoxVariant('eliminar')).toBe('danger');
    expect(cmp.accionMessageBoxVariant('reabrir')).toBe('warning');
    expect(cmp.accionMessageBoxVariant('anular')).toBe('danger');

    expect(cmp.accionRequiereMotivo('eliminar')).toBe(false);
    expect(cmp.accionRequiereMotivo('reabrir')).toBe(true);
    expect(cmp.accionRequiereMotivo('anular')).toBe(true);

    expect(cmp.accionDetalle('eliminar')).toContain('no se puede deshacer');
    expect(cmp.accionDetalle('reabrir')).toBe('');
    expect(cmp.accionDetalle('anular')).toBe('');
  });
});
