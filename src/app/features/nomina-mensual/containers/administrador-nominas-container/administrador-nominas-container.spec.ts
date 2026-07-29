import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';

import type { EventoAuditoriaNomina, NominaPeriodoResumen } from '../../models/nomina-periodo.models';
import { crearNominaResumen } from '../../models/nomina-periodo.models';
import { NominaPeriodoService } from '../../services/nomina-periodo.service';
import { NominaPeriodoCalculoAdapterService } from '../../services/nomina-periodo-calculo-adapter.service';
import { NominaMensualCapabilitiesService } from '../../services/nomina-mensual-capabilities.service';
import { NominaFeatureGatesService } from '../../services/nomina-feature-gates.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { AdministradorNominasContainer } from './administrador-nominas-container';
import { ADMIN_NOMINAS_LUCIDE_ICONS } from './lucide/admin-nominas-lucide.icons';

function resumenMock(overrides: Partial<NominaPeriodoResumen> = {}): NominaPeriodoResumen {
  return crearNominaResumen({
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
  });
}

interface ServicioMock {
  listarResumenes: ReturnType<typeof vi.fn>;
  obtenerResumenValidacionNomina: ReturnType<typeof vi.fn>;
  eliminarNomina?: ReturnType<typeof vi.fn>;
  reabrirNomina?: ReturnType<typeof vi.fn>;
  listarEventosAuditoria?: ReturnType<typeof vi.fn>;
}

function configurar(opts: {
  servicio: ServicioMock;
  navigate?: ReturnType<typeof vi.fn>;
  capabilities?: Partial<{
    esAdmin: () => boolean;
    puedeEscribirNomina: () => boolean;
  }>;
}) {
  const navigate = opts.navigate ?? vi.fn().mockResolvedValue(true);
  opts.servicio.listarEventosAuditoria ??= vi.fn().mockResolvedValue([]);
  const authService = { currentUser: () => null };
  const capabilities = {
    esAdmin: () => true,
    puedeEscribirNomina: () => true,
    puedeAccionesAdminNomina: () => true,
    puedeRectificarNomina: () => true,
    esSoloLectura: () => false,
    ...opts.capabilities,
  };
  const featureGates = {
    gates: () => ({ anticipos: false, extraordinaria: false, rectificacion: false }),
    cargar: vi.fn().mockResolvedValue({ anticipos: false, extraordinaria: false, rectificacion: false }),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      importProvidersFrom(LucideAngularModule.pick(ADMIN_NOMINAS_LUCIDE_ICONS)),
      { provide: Router, useValue: { navigate } },
      { provide: NominaPeriodoService, useValue: opts.servicio },
      { provide: AuthService, useValue: authService },
      {
        provide: NominaPeriodoCalculoAdapterService,
        useValue: { obtenerTotalesRectificacion: vi.fn().mockResolvedValue(null) },
      },
      { provide: NominaMensualCapabilitiesService, useValue: capabilities },
      { provide: NominaFeatureGatesService, useValue: featureGates },
    ],
  });
  return { navigate, authService, capabilities };
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
      eliminarNomina: vi.fn().mockResolvedValue(undefined),
      reabrirNomina: vi.fn().mockResolvedValue(undefined),
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

  it('Test 34 — expone la vista operativa inicial dentro de los filtros de la grilla', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const filtroVista = cmp.filtros().find((filtro) => filtro.id === 'vistaOperativa');
    expect(filtroVista?.initialValue).toBe('requiere-accion');
    expect(cmp.resumenesOrdenados()).toHaveLength(cmp.resumenes().length);

    fixture.detectChanges();
    const grid = fixture.debugElement.query(By.directive(DataGridComponent))
      .componentInstance as DataGridComponent<NominaPeriodoResumen>;
    expect(grid.draftFilterValues['vistaOperativa']).toBe('requiere-accion');
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

  it('no abre modal nueva nómina en perfil solo lectura', () => {
    configurar({
      servicio,
      capabilities: { puedeEscribirNomina: () => false, esAdmin: () => false },
    });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    cmp.abrirNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(false);
  });

  it('oculta eliminar/reabrir para operador sin rol admin', async () => {
    configurar({
      servicio,
      capabilities: { esAdmin: () => false, puedeEscribirNomina: () => true },
    });
    servicio.listarResumenes.mockReset().mockResolvedValue([
      resumenMock({ id: 'borrador', estado: 'borrador' }),
      resumenMock({ id: 'cerrada', estado: 'cerrada' }),
    ]);
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();

    expect(cmp.puedeEliminarFila(cmp.resumenes()[0]!)).toBe(false);
    expect(cmp.puedeReabrirFila(cmp.resumenes()[1]!)).toBe(false);
  });

  it('Test 36 — abrirResumen abre de inmediato y carga resumen desde el servicio', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = resumenMock({ id: 'nom-cerrada', estado: 'cerrada', proximoPaso: 'liquidaciones' });
    cmp.resumenes.set([fila]);

    const promesa = cmp.abrirResumen(fila);
    expect(cmp.nominaSeleccionada()?.id).toBe(fila.id);
    expect(cmp.resumenLoading()).toBe(true);
    await promesa;
    expect(servicio.obtenerResumenValidacionNomina).toHaveBeenCalledWith(fila.id);
    expect(cmp.resumenLoading()).toBe(false);
    expect(cmp.resumenSeleccionado()).not.toBeNull();
    expect(cmp.resumenError()).toBeNull();

    cmp.cerrarResumen();
    expect(cmp.nominaSeleccionada()).toBeNull();
    expect(cmp.resumenSeleccionado()).toBeNull();
  });

  it('Test 36b — abrirResumen no abre modal en estados previos al cierre', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    await cmp.abrirResumen(fila);

    expect(cmp.nominaSeleccionada()).toBeNull();
    expect(servicio.obtenerResumenValidacionNomina).not.toHaveBeenCalled();
  });

  it('Test 37 — abrirGenerador navega a la ruta canónica sin preservar query params', async () => {
    const { navigate } = configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.abrirGenerador(fila);

    expect(navigate).toHaveBeenCalledWith(
      ['/remuneraciones/nominas', fila.id],
      expect.objectContaining({ queryParams: {} }),
    );
  });

  it('Test 38 — onNominaCreada agrega el resumen y propaga el contexto F05 al generador', () => {
    const { navigate } = configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;

    cmp.abrirNuevaNomina();
    expect(cmp.modalNuevaAbierto()).toBe(true);

    const nuevoResumen = resumenMock({ id: 'nom-nuevo', periodo: '2026-07' });
    cmp.onNominaCreada({
      resumen: nuevoResumen,
      siguientePaso: 'dotacion',
      totalTrabajadoresIniciales: 24,
      reutilizada: false,
    });

    expect(cmp.resumenes()[0]?.id).toBe('nom-nuevo');
    expect(cmp.modalNuevaAbierto()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(
      ['/remuneraciones/nominas', 'nom-nuevo'],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          from: 'create',
          paso: 'dotacion',
          dotacion: 24,
        }),
      }),
    );
  });

  it('Test 39 — registra error cuando el servicio falla', async () => {
    servicio.listarResumenes.mockReset().mockRejectedValue(new Error('boom'));
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    expect(cmp.errorCarga()).toBe(
      'No se pudo cargar las nóminas. Intente de nuevo o contacte a soporte.',
    );
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

    cmp.solicitarAccion('eliminar', fila);
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

  it('Test 42 — confirmarAccion eliminar invoca eliminarNomina (hard-delete, sin motivo)', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.solicitarAccion('eliminar', fila);
    await cmp.confirmarAccion();

    expect(servicio.eliminarNomina).toHaveBeenCalledWith(fila.id);
    expect(cmp.accionPendiente()).toBeNull();
    expect(cmp.ejecutandoAccion()).toBe(false);
  });

  it('Test 42b — error en confirmarAccion cierra confirmación y deja solo el error', async () => {
    servicio.eliminarNomina = vi.fn().mockRejectedValueOnce(new Error('rpc falló'));
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.solicitarAccion('eliminar', fila);
    await cmp.confirmarAccion();

    expect(cmp.accionPendiente()).toBeNull();
    expect(cmp.errorAccion()).toBeTruthy();
    expect(cmp.ejecutandoAccion()).toBe(false);
  });

  it('Test 43 — confirmarAccion exige motivo solo para reabrir', async () => {
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

  it('Test 43b — eliminar NO exige motivo aunque el textarea quede vacío', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    const fila = cmp.resumenes()[0]!;

    cmp.solicitarAccion('eliminar', fila);
    cmp.motivoAccion.set('   ');
    await cmp.confirmarAccion();

    expect(servicio.eliminarNomina).toHaveBeenCalledWith(fila.id);
    expect(cmp.errorAccion()).toBeNull();
  });

  it('Test 44 — helpers de presentación del message-box son consistentes con el tipo de acción', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;

    expect(cmp.accionTituloModal('eliminar')).toBe('Eliminar nómina');
    expect(cmp.accionTituloModal('reabrir')).toBe('Reabrir nómina');

    expect(cmp.accionMessageBoxVariant('eliminar')).toBe('danger');
    expect(cmp.accionMessageBoxVariant('reabrir')).toBe('warning');

    expect(cmp.accionRequiereMotivo('eliminar')).toBe(false);
    expect(cmp.accionRequiereMotivo('reabrir')).toBe(true);

    expect(cmp.accionDetalle('eliminar')).toContain('no se puede deshacer');
    expect(cmp.accionDetalle('reabrir')).toBe('');
  });

  it('Test 45 — subtitulo prioriza incidencias críticas sin repetir el conteo de la grilla (NOIA)', async () => {
    servicio.listarResumenes.mockReset().mockResolvedValue([
      resumenMock({ id: 'a', estado: 'borrador', totalIncidenciasCriticas: 0, totalAdvertencias: 0 }),
      resumenMock({ id: 'b', estado: 'dotacion_generada', totalIncidenciasCriticas: 2 }),
      resumenMock({ id: 'c', estado: 'cerrada', totalIncidenciasCriticas: 0 }),
    ]);
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();

    expect(cmp.subtitulo()).toBe('1 nómina con incidencias críticas pendientes.');
  });

  it('Test 46 — subtitulo sin nominas en sistema orienta a crear la primera', async () => {
    servicio.listarResumenes.mockReset().mockResolvedValue([]);
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();

    expect(cmp.subtitulo()).toBe('Crea la primera nómina para iniciar el proceso del período.');
  });

  it('Test 47 — esFilaPrioritaria marca filas con criticas o que requieren accion', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;

    const conCriticas = resumenMock({ estado: 'cerrada', totalIncidenciasCriticas: 1 });
    const requiereAccion = resumenMock({ estado: 'borrador', totalIncidenciasCriticas: 0 });
    const limpia = resumenMock({ estado: 'cerrada', totalIncidenciasCriticas: 0, totalAdvertencias: 0 });

    expect(cmp.esFilaPrioritaria(conCriticas)).toBe(true);
    expect(cmp.esFilaPrioritaria(requiereAccion)).toBe(true);
    expect(cmp.esFilaPrioritaria(limpia)).toBe(false);
  });

  it('Test 48 — tooltipAvanceFila resume "Avance: X" cuando hay paso completado distinto (NOIA-ADM-NOM-BANDEJA-02)', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const fila = resumenMock({
      proximoPaso: 'dotacion',
      maximoPasoCompletado: 'calculation',
      totalIncidenciasCriticas: 0,
      totalAdvertencias: 0,
    });
    const tooltip = cmp.tooltipAvanceFila(fila);
    expect(tooltip).toContain('Avance');
    expect(tooltip).toContain('Cálculo');
  });

  it('Test 49 — tooltipAvanceFila combina avance e incidencias y omite cuando no hay nada relevante', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const conCriticas = resumenMock({
      proximoPaso: 'dotacion',
      maximoPasoCompletado: 'calculation',
      totalIncidenciasCriticas: 2,
      totalAdvertencias: 0,
    });
    expect(cmp.tooltipAvanceFila(conCriticas)).toContain('crítica');

    const limpia = resumenMock({
      proximoPaso: 'calculo',
      maximoPasoCompletado: 'calculation',
      totalIncidenciasCriticas: 0,
      totalAdvertencias: 0,
    });
    expect(cmp.tooltipAvanceFila(limpia)).toBe('');
  });

  it('Test 50 — abrirHistorial carga eventos y deja el modal en estado consultable', async () => {
    const eventos: EventoAuditoriaNomina[] = [
      {
        id: 'evt-1',
        nominaPeriodoId: 'nom-1',
        accion: 'creada',
        createdAt: '2026-06-04T10:00:00Z',
      },
    ];
    servicio.listarEventosAuditoria = vi.fn().mockResolvedValue(eventos);
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    const fila = resumenMock({ id: 'nom-1' });

    await cmp.abrirHistorial(fila);

    expect(cmp.historialNomina()?.id).toBe('nom-1');
    expect(cmp.historialEventos()).toHaveLength(1);
    expect(cmp.historialLoading()).toBe(false);
    expect(cmp.historialError()).toBeNull();
  });

  it('Test 51 — cerrarHistorial limpia el estado del modal de bitácora', () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;

    cmp.historialNomina.set(resumenMock({ id: 'nom-1' }));
    cmp.historialEventos.set([
      {
        id: 'evt-1',
        nominaPeriodoId: 'nom-1',
        accion: 'creada',
        createdAt: '2026-06-04T10:00:00Z',
      },
    ]);
    cmp.historialError.set('boom');

    cmp.cerrarHistorial();

    expect(cmp.historialNomina()).toBeNull();
    expect(cmp.historialEventos()).toHaveLength(0);
    expect(cmp.historialError()).toBeNull();
  });

  it('Test 52 — F18a: franja KPI operativa visible tras cargar resúmenes', async () => {
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    fixture.detectChanges();

    const kpis = fixture.nativeElement.querySelector('.adm-nom__kpis');
    expect(kpis).toBeTruthy();
    expect(cmp.kpis().items).toHaveLength(4);
  });

  it('Test 53 — F18a: sub-renglón Avance visible cuando mostrarEnCurso es true', async () => {
    servicio.listarResumenes.mockReset().mockResolvedValue([
      resumenMock({
        id: 'nom-avance',
        proximoPaso: 'dotacion',
        maximoPasoCompletado: 'calculation',
      }),
    ]);
    configurar({ servicio });
    const fixture = TestBed.createComponent(AdministradorNominasContainer);
    const cmp = fixture.componentInstance;
    await cmp.cargarResumenes();
    fixture.detectChanges();

    const avance = fixture.nativeElement.querySelector('.adm-nom__en-curso');
    expect(avance?.textContent).toContain('Avance');
    expect(avance?.textContent).toContain('Cálculo');
  });
});
