import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle,
  DollarSign,
  FileCheck2,
  FileText,
  LayoutDashboard,
  RefreshCw,
  PanelRightOpen,
  Repeat,
  Search,
  Send,
  Upload,
  Users,
  X,
} from 'lucide-angular/src/icons';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';
import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';
import { crearNomina, crearNominaResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import { LiquidacionesOficialesContainer } from './liquidaciones-oficiales-container';
import { PreviredExportService } from '../../../previred/services/previred-export.service';

describe('LiquidacionesOficialesContainer', () => {
  let fixture: ComponentFixture<LiquidacionesOficialesContainer>;
  let service: {
    consultarEstadoPeriodo: ReturnType<typeof vi.fn>;
    generarLiquidaciones: ReturnType<typeof vi.fn>;
    obtenerDetalleTrabajador: ReturnType<typeof vi.fn>;
    listarTrabajadoresLiquidacion: ReturnType<typeof vi.fn>;
    guardarEstadoRevisionTrabajador: ReturnType<typeof vi.fn>;
  };
  let nominaService: {
    obtenerNomina: ReturnType<typeof vi.fn>;
    listarLiquidacionesNomina: ReturnType<typeof vi.fn>;
    generarLiquidacionesNomina: ReturnType<typeof vi.fn>;
    listarResumenes: ReturnType<typeof vi.fn>;
  };

  async function configurar(
    queryParams: Record<string, string> = {},
    opts: {
      resumenes?: ReturnType<typeof crearNominaResumen>[];
      nomina?: ReturnType<typeof crearNomina> | null;
      liquidacionesNomina?: unknown[];
      trabajadoresLiquidacion?: unknown[];
    } = {},
  ) {
    service = {
      consultarEstadoPeriodo: vi.fn(),
      generarLiquidaciones: vi.fn(),
      obtenerDetalleTrabajador: vi.fn().mockResolvedValue([]),
      listarTrabajadoresLiquidacion: vi.fn().mockResolvedValue(opts.trabajadoresLiquidacion ?? []),
      guardarEstadoRevisionTrabajador: vi.fn().mockResolvedValue({}),
    };
    nominaService = {
      obtenerNomina: vi.fn().mockResolvedValue(opts.nomina ?? null),
      listarLiquidacionesNomina: vi.fn().mockResolvedValue(opts.liquidacionesNomina ?? []),
      generarLiquidacionesNomina: vi.fn().mockResolvedValue(undefined),
      listarResumenes: vi.fn().mockResolvedValue(opts.resumenes ?? []),
    };

    await TestBed.configureTestingModule({
      imports: [LiquidacionesOficialesContainer],
      providers: [
        provideRouter([
          { path: 'remuneraciones/liquidaciones', component: LiquidacionesOficialesContainer },
        ]),
        importProvidersFrom(
          LucideAngularModule.pick({
            ArrowLeft,
            ArrowRight,
            Banknote,
            CalendarClock,
            CheckCircle,
            DollarSign,
            FileCheck2,
            FileText,
            LayoutDashboard,
            RefreshCw,
            Repeat,
            Search,
            Send,
            Upload,
            Users,
            PanelRightOpen,
            X,
          }),
        ),
        PeriodoActivoService,
        { provide: LiquidacionesOficialesService, useValue: service },
        { provide: NominaPeriodoService, useValue: nominaService },
        {
          provide: PreviredExportService,
          useValue: {
            construirBorradorDesdeNomina: vi.fn().mockResolvedValue(null),
            registrarDescarga: vi.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of(queryParams) },
        },
      ],
    }).compileComponents();

    const periodoActivo = TestBed.inject(PeriodoActivoService);
    periodoActivo.setPeriodoYm('2026-04');
    fixture = TestBed.createComponent(LiquidacionesOficialesContainer);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('sin nominaPeriodoId carga listado de nóminas con liquidaciones', async () => {
    await configurar(
      {},
      {
        resumenes: [
          crearNominaResumen({
            id: 'nom-1',
            estado: 'liquidada',
            periodo: '2026-04',
            evidenciaCalculo: { idCalculoPeriodo: 10, versionCalculo: 1, calculoVigente: true },
          }),
          crearNominaResumen({ id: 'nom-2', estado: 'borrador', periodo: '2026-03' }),
        ],
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nominaService.listarResumenes).toHaveBeenCalled();
    expect(service.consultarEstadoPeriodo).not.toHaveBeenCalled();
    expect(fixture.componentInstance.nominasConLiquidaciones().length).toBe(1);
    expect(fixture.componentInstance.modalSeleccionNominaAbierto()).toBe(false);
    expect(fixture.nativeElement.querySelector('[aria-label^="Abrir liquidaciones"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Empresa de prueba');
  });

  it('cerrar modal y abrir desde disparador', async () => {
    const resumen = crearNominaResumen({
      id: 'nom-1',
      estado: 'liquidada',
      periodo: '2026-04',
      evidenciaCalculo: { idCalculoPeriodo: 10, versionCalculo: 1, calculoVigente: true },
    });
    await configurar({}, { resumenes: [resumen] });
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.cerrarModalSeleccionNomina();
    fixture.detectChanges();
    expect(fixture.componentInstance.modalSeleccionNominaAbierto()).toBe(false);

    fixture.componentInstance.abrirModalSeleccionNomina();
    fixture.detectChanges();
    expect(fixture.componentInstance.modalSeleccionNominaAbierto()).toBe(true);
  });

  it('seleccionar nómina en modal cierra el modal', async () => {
    const resumen = crearNominaResumen({
      id: 'nom-1',
      estado: 'liquidada',
      periodo: '2026-04',
      evidenciaCalculo: { idCalculoPeriodo: 10, versionCalculo: 1, calculoVigente: true },
    });
    await configurar({}, { resumenes: [resumen] });
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.onNominaSeleccionadaEnModal(resumen);
    expect(fixture.componentInstance.modalSeleccionNominaAbierto()).toBe(false);
  });

  it('sin nóminas elegibles muestra acta vacía sin_nominas', async () => {
    await configurar();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aún no hay liquidaciones materializadas');
    expect(fixture.nativeElement.textContent).toContain('Crear nómina en administrador');
    expect(fixture.nativeElement.textContent).not.toContain('Liquidaciones por nómina');
    expect(fixture.componentInstance.actaVacia().escenario).toBe('sin_nominas');
  });

  it('con nóminas en preparación muestra acta contextual', async () => {
    await configurar(
      {},
      {
        resumenes: [
          crearNominaResumen({ id: 'nom-b', estado: 'borrador', periodo: '2026-06' }),
        ],
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.actaVacia().escenario).toBe('nominas_en_preparacion');
    expect(fixture.componentInstance.actaVacia().chipLabel).toBe('Nóminas en preparación');
    expect(fixture.nativeElement.textContent).toContain('Aún no hay comprobantes listos');
    expect(fixture.nativeElement.textContent).toContain('en preparación');
  });

  it('con nominaPeriodoId carga liquidaciones internas y trabajadores de la versión vigente', async () => {
    await configurar(
      { nominaPeriodoId: 'nom-99', periodo: '2026-04' },
      {
        nomina: crearNomina({ id: 'nom-99', empresaNombre: 'Acme', estado: 'liquidada', trabajadorIds: ['1'] }),
        liquidacionesNomina: [
          {
            idLiquidacionPeriodo: 1,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 1,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: null,
            fechaGeneracion: '2026-04-01T00:00:00Z',
            totalTrabajadores: 2,
            totalHaberes: 100,
            totalDescuentos: 10,
            totalLiquido: 90,
          },
        ],
        trabajadoresLiquidacion: [
          {
            idLiquidacionTrabajador: 5,
            idLiquidacionPeriodo: 1,
            idTrabajador: 1,
            nombreTrabajador: 'Ana Pérez',
            rut: '11.111.111-1',
            cargo: 'Analista',
            centroCosto: 'RRHH',
            totalHaberes: 100,
            totalDescuentos: 10,
            liquidoPagar: 90,
            baseImponible: 100,
            baseTributable: 90,
            observaciones: [],
          },
        ],
      },
    );
    await fixture.whenStable();
    await vi.waitUntil(() => service.listarTrabajadoresLiquidacion.mock.calls.length > 0);
    fixture.detectChanges();

    expect(nominaService.obtenerNomina).toHaveBeenCalledWith('nom-99');
    expect(nominaService.listarLiquidacionesNomina).toHaveBeenCalledWith('nom-99');
    expect(service.listarTrabajadoresLiquidacion).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.modoNominaInterna()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Historial de versiones');
    expect(fixture.nativeElement.textContent).toContain('Trabajadores');
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.querySelector('[title="Administrador de nóminas"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Ver detalle"]')).toBeNull();
    expect(service.consultarEstadoPeriodo).not.toHaveBeenCalled();
  });

  it('toolbar icon-first expone export Previred con title accesible', async () => {
    await configurar(
      { nominaPeriodoId: 'nom-99', periodo: '2026-04' },
      {
        nomina: crearNomina({ id: 'nom-99', estado: 'liquidada', trabajadorIds: ['1'] }),
        liquidacionesNomina: [
          {
            idLiquidacionPeriodo: 1,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 1,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: null,
            fechaGeneracion: '2026-04-01T00:00:00Z',
            totalTrabajadores: 1,
            totalHaberes: 100,
            totalDescuentos: 10,
            totalLiquido: 90,
          },
        ],
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[title="Descargar archivo Previred"]')).toBeTruthy();
  });

  it('feedback de acción de trabajador incluye tono según estado', async () => {
    await configurar(
      { nominaPeriodoId: 'nom-99', periodo: '2026-04' },
      {
        nomina: crearNomina({ id: 'nom-99', empresaNombre: 'Acme', estado: 'liquidada', trabajadorIds: ['1'] }),
        liquidacionesNomina: [
          {
            idLiquidacionPeriodo: 1,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 1,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: null,
            fechaGeneracion: '2026-04-01T00:00:00Z',
            totalTrabajadores: 1,
            totalHaberes: 100,
            totalDescuentos: 10,
            totalLiquido: 90,
          },
        ],
        trabajadoresLiquidacion: [
          {
            idLiquidacionTrabajador: 5,
            idLiquidacionPeriodo: 1,
            idTrabajador: 1,
            nombreTrabajador: 'Ana Pérez',
            rut: '11.111.111-1',
            cargo: 'Analista',
            centroCosto: 'RRHH',
            totalHaberes: 100,
            totalDescuentos: 10,
            liquidoPagar: 90,
            baseImponible: 100,
            baseTributable: 90,
            observaciones: [],
          },
        ],
      },
    );
    await fixture.whenStable();
    await vi.waitUntil(() => fixture.componentInstance.trabajadoresLiquidacion().length > 0);

    fixture.componentInstance.ejecutarAccionTrabajador({
      idLiquidacionTrabajador: 5,
      tipo: 'autorizar',
    });
    fixture.detectChanges();

    const feedback = fixture.componentInstance.feedbackAccionTrabajador();
    expect(feedback?.mensaje).toContain('autorizada');
    expect(feedback?.tono).toBe('info');
  });

  it('confirmar regeneración muestra evidencia de versión generada', async () => {
    await configurar(
      { nominaPeriodoId: 'nom-99', periodo: '2026-04' },
      {
        nomina: crearNomina({
          id: 'nom-99',
          empresaNombre: 'Acme',
          estado: 'reabierta',
          trabajadorIds: ['1'],
          evidenciaCalculo: { idCalculoPeriodo: 10, versionCalculo: 1, calculoVigente: true },
        }),
        liquidacionesNomina: [
          {
            idLiquidacionPeriodo: 1,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 1,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: null,
            fechaGeneracion: '2026-04-01T00:00:00Z',
            totalTrabajadores: 2,
            totalHaberes: 100,
            totalDescuentos: 10,
            totalLiquido: 90,
          },
          {
            idLiquidacionPeriodo: 2,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 2,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: 1,
            fechaGeneracion: '2026-04-02T00:00:00Z',
            totalTrabajadores: 2,
            totalHaberes: 120,
            totalDescuentos: 12,
            totalLiquido: 108,
          },
        ],
        trabajadoresLiquidacion: [],
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.puedeRegenerarInterna()).toBe(true);
    await fixture.componentInstance.confirmarRegeneracionInterna();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nominaService.generarLiquidacionesNomina).toHaveBeenCalledWith('nom-99');
    expect(fixture.componentInstance.evidenciaRegeneracion()).toContain('Versión v');
    expect(fixture.componentInstance.evidenciaRegeneracion()).toContain('trabajadores');
  });

  it('confirmación de regeneración expone secciones de acta guiada', async () => {
    await configurar(
      { nominaPeriodoId: 'nom-99', periodo: '2026-04' },
      {
        nomina: crearNomina({
          id: 'nom-99',
          estado: 'reabierta',
          evidenciaCalculo: { idCalculoPeriodo: 10, versionCalculo: 1, calculoVigente: true },
        }),
        liquidacionesNomina: [
          {
            idLiquidacionPeriodo: 1,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 1,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: null,
            fechaGeneracion: '2026-04-01T00:00:00Z',
            totalTrabajadores: 1,
            totalHaberes: 100,
            totalDescuentos: 10,
            totalLiquido: 90,
          },
        ],
      },
    );
    await fixture.whenStable();

    const secciones = fixture.componentInstance.seccionesConfirmacionRegeneracionInterna();
    expect(secciones.map((s) => s.title)).toEqual([
      'Qué se hará',
      'Condición',
      'Qué queda registrado',
      'Qué sigue',
    ]);
  });

  it('no regenera liquidaciones cuando la nómina está liquidada', async () => {
    await configurar(
      { nominaPeriodoId: 'nom-99', periodo: '2026-04' },
      {
        nomina: crearNomina({
          id: 'nom-99',
          estado: 'liquidada',
          evidenciaCalculo: { idCalculoPeriodo: 10, versionCalculo: 1, calculoVigente: true },
        }),
        liquidacionesNomina: [
          {
            idLiquidacionPeriodo: 1,
            idNominaPeriodo: 'nom-99',
            periodo: '2026-04',
            version: 1,
            estado: 'generada',
            activo: true,
            idLiquidacionReemplazada: null,
            fechaGeneracion: '2026-04-01T00:00:00Z',
            totalTrabajadores: 1,
            totalHaberes: 100,
            totalDescuentos: 10,
            totalLiquido: 90,
          },
        ],
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.puedeRegenerarInterna()).toBe(false);
    await fixture.componentInstance.confirmarRegeneracionInterna();
    expect(nominaService.generarLiquidacionesNomina).not.toHaveBeenCalled();
  });
});
