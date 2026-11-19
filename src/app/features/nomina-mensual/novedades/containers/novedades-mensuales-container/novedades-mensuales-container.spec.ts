import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { buildNominaFlowQueryParams } from '../../../rules/proceso-mensual-flow-nav.rules';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Home,
  Info,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  TriangleAlert,
  X,
} from 'lucide-angular/src/icons';

import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import { EmpleadosService } from '../../../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../../../haberes-descuentos/services/haberes-descuentos.service';
import type { CrearNovedadMensualInput, NovedadMensual } from '../../models/novedad-mensual.model';
import { NovedadesMensualesService } from '../../services/novedades-mensuales.service';
import { NovedadesMensualesContainer } from './novedades-mensuales-container';
import { provideErpPermisosStub } from '../../../../../core/auth/testing/erp-permisos.stub';

function novedad(over: Partial<NovedadMensual> = {}): NovedadMensual {
  return {
    idNovedad: 1,
    periodo: '2026-05',
    idPersona: 10,
    idContrato: null,
    idConcepto: 20,
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: null,
    monto: 80000,
    moneda: 'CLP',
    origen: 'manual',
    fechaEvento: null,
    estado: 'borrador',
    observacion: null,
    referenciaExterna: null,
    codigoMotivoAusencia: null,
    idLicencia: null,
    creadoPor: null,
    aprobadoPor: null,
    fechaAprobacion: null,
    fechaCreacion: '2026-05-01T00:00:00.000Z',
    fechaActualizacion: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}

async function esperarCargaInicial(fixture: ComponentFixture<NovedadesMensualesContainer>): Promise<void> {
  await fixture.whenStable();
  await fixture.whenStable();
  await fixture.componentInstance.cargarNovedades();
  fixture.detectChanges();
}

function clickAccionTrabajadorGrilla(root: HTMLElement): void {
  (root.querySelector('.nm-grid-icon-btn') as HTMLButtonElement | null)?.click();
}

describe('NovedadesMensualesContainer', () => {
  let fixture: ComponentFixture<NovedadesMensualesContainer>;
  let component: NovedadesMensualesContainer;
  let service: {
    listarNovedadesPeriodo: ReturnType<typeof vi.fn>;
    crearNovedad: ReturnType<typeof vi.fn>;
    actualizarNovedad: ReturnType<typeof vi.fn>;
    enviarARevision: ReturnType<typeof vi.fn>;
    aprobarNovedad: ReturnType<typeof vi.fn>;
    rechazarNovedad: ReturnType<typeof vi.fn>;
    anularNovedad: ReturnType<typeof vi.fn>;
    eliminarSoloBorrador: ReturnType<typeof vi.fn>;
  };
  let empleadosService: {
    listar: ReturnType<typeof vi.fn>;
  };
  let haberesDescuentosService: {
    listarConceptos: ReturnType<typeof vi.fn>;
    listarContratosPersona: ReturnType<typeof vi.fn>;
    listarAsignacionesParaPrevalidacionMensual: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
  };
  let periodoActivo: PeriodoActivoService;

  beforeEach(async () => {
    service = {
      listarNovedadesPeriodo: vi.fn().mockResolvedValue([]),
      crearNovedad: vi.fn().mockResolvedValue(novedad()),
      actualizarNovedad: vi.fn().mockResolvedValue(novedad()),
      enviarARevision: vi.fn().mockResolvedValue(novedad({ estado: 'pendiente_revision' })),
      aprobarNovedad: vi.fn().mockResolvedValue(novedad({ estado: 'aprobada' })),
      rechazarNovedad: vi.fn().mockResolvedValue(novedad({ estado: 'rechazada' })),
      anularNovedad: vi.fn().mockResolvedValue(novedad({ estado: 'anulada' })),
      eliminarSoloBorrador: vi.fn().mockResolvedValue(undefined),
    };
    empleadosService = {
      listar: vi.fn().mockResolvedValue([
        {
          id: 10,
          idContrato: 100,
          rut: '11.111.111-1',
          nombre: 'Ana Perez',
          cargo: 'Analista',
          departamento: 'RRHH',
          fechaIngreso: '2026-01-01',
          sueldoBase: 800000,
          estado: 'activo',
          estadoFicha: 'VALIDO',
          aptoParaRemuneraciones: true,
          pasoAltaAvanzada: null,
        },
      ]),
    };
    haberesDescuentosService = {
      listarConceptos: vi.fn().mockResolvedValue([
        {
          idConcepto: 20,
          codigo: 'BONO',
          nombre: 'Bono puntual',
          tipo: 'HABER',
          naturaleza: 'IMPONIBLE',
          imponible: true,
          tributable: true,
          codigoLre: '1001',
        },
      ]),
      listarContratosPersona: vi.fn().mockResolvedValue([{ idContrato: 100, etiqueta: 'Contrato indefinido' }]),
      listarAsignacionesParaPrevalidacionMensual: vi.fn().mockResolvedValue([]),
      crear: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [NovedadesMensualesContainer],
      providers: [
        provideErpPermisosStub(),
        provideRouter([]),
        importProvidersFrom(
          LucideAngularModule.pick({
            AlertCircle,
            ArrowDown,
            ArrowLeft,
            ArrowUp,
            ArrowUpDown,
            Calendar,
            CheckCircle,
            CheckCircle2,
            ChevronDown,
            ChevronLeft,
            ChevronRight,
            Download,
            Filter,
            Home,
            Info,
            LoaderCircle,
            Plus,
            RefreshCw,
            Search,
            Settings,
            TriangleAlert,
            X,
          }),
        ),
        PeriodoActivoService,
        { provide: NovedadesMensualesService, useValue: service },
        { provide: EmpleadosService, useValue: empleadosService },
        { provide: HaberesDescuentosService, useValue: haberesDescuentosService },
      ],
    }).compileComponents();

    periodoActivo = TestBed.inject(PeriodoActivoService);
    periodoActivo.setPeriodoYm('2026-05');
    fixture = TestBed.createComponent(NovedadesMensualesContainer);
    component = fixture.componentInstance;
  });

  describe('deep link desde nomina mensual', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [NovedadesMensualesContainer],
        providers: [
          provideErpPermisosStub(),
          provideRouter([]),
          importProvidersFrom(
            LucideAngularModule.pick({
              AlertCircle,
              ArrowDown,
              ArrowLeft,
              ArrowUp,
              ArrowUpDown,
              Calendar,
              CheckCircle,
              CheckCircle2,
              ChevronDown,
              ChevronLeft,
              ChevronRight,
              Download,
              Filter,
              Home,
              Info,
              LoaderCircle,
              Plus,
              RefreshCw,
              Search,
              Settings,
              TriangleAlert,
              X,
            }),
          ),
          PeriodoActivoService,
          { provide: NovedadesMensualesService, useValue: service },
          { provide: EmpleadosService, useValue: empleadosService },
          { provide: HaberesDescuentosService, useValue: haberesDescuentosService },
          {
            provide: ActivatedRoute,
            useValue: {
              queryParams: of(buildNominaFlowQueryParams('2026-05', 10)),
            },
          },
        ],
      }).compileComponents();
      periodoActivo = TestBed.inject(PeriodoActivoService);
      periodoActivo.setPeriodoYm('2026-05');
    });

    it('con idPersona en query abre detalle del trabajador al iniciar', async () => {
      const localFixture = TestBed.createComponent(NovedadesMensualesContainer);
      localFixture.detectChanges();
      await esperarCargaInicial(localFixture);

      expect(localFixture.componentInstance.trabajadorDetalle()?.row.idPersona).toBe(10);
      expect(localFixture.componentInstance.trabajadorDetalle()?.row.trabajador).toContain('Ana Perez');
    });
  });

  it('carga datos de apoyo y movimientos por periodo al iniciar', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad()]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    expect(empleadosService.listar).toHaveBeenCalled();
    expect(haberesDescuentosService.listarConceptos).toHaveBeenCalledWith(
      expect.objectContaining({ getFullYear: expect.any(Function) }),
    );
    const refConceptos = haberesDescuentosService.listarConceptos.mock.calls[0][0] as Date;
    expect(refConceptos.getFullYear()).toBe(2026);
    expect(refConceptos.getMonth()).toBe(4);
    expect(haberesDescuentosService.listarAsignacionesParaPrevalidacionMensual).toHaveBeenCalledWith('2026-05');
    expect(service.listarNovedadesPeriodo).toHaveBeenCalledWith('2026-05');
    expect(component.totalNovedades()).toBe(1);
  });

  it('recarga conceptos al cambiar el periodo activo', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);
    haberesDescuentosService.listarConceptos.mockClear();

    periodoActivo.setPeriodoYm('2026-06');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(haberesDescuentosService.listarConceptos).toHaveBeenCalled();
    const refConceptos = haberesDescuentosService.listarConceptos.mock.calls.at(-1)?.[0] as Date;
    expect(refConceptos.getMonth()).toBe(5);
  });

  it('muestra grilla de trabajadores cuando no hay movimientos del periodo', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    expect(fixture.nativeElement.textContent).toContain('Movimientos de remuneración');
    expect(fixture.nativeElement.textContent).toContain('Ana Perez');
    expect(fixture.nativeElement.textContent).toContain('Sin movimientos');
  });

  it('renderiza lead operativo sin titulo duplicado ni lenguaje legacy', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent as string;
    expect(root.querySelector('.nm-lead')?.textContent).toContain('movimientos del mes');
    expect(root.querySelector('.nm-page')?.getAttribute('aria-label')).toBe('Movimientos de remuneración');
    expect(text).toContain('Movimientos de remuneración');
    expect(fixture.nativeElement.querySelector('.nm-view-tabs')).toBeNull();
    expect(text).not.toContain('Este mes');
    expect(text).not.toContain('Todos');
    expect(text).not.toContain('Novedades mensuales');
    expect(text).not.toContain('Movimiento variable');
    expect(text).not.toContain('Movimientos variables');
  });

  it('usa encabezado compacto sin franja de estado ni selector local', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="month"]') as HTMLInputElement | null;
    const text = root.textContent as string;

    expect(input).toBeNull();
    expect(root.querySelector('.nm-period-global')).toBeNull();
    expect(root.querySelector('.nm-periodo-estado')).toBeNull();
    expect(root.querySelector('.nm-grid-shell')).toBeTruthy();
    expect(text).toContain('Trabajadores');
    expect(text).not.toContain('Periodo (YYYY-MM)');
    expect(text).not.toContain('Actualizar');
  });

  it('no muestra labels tecnicos para identificar trabajador, contrato ni concepto', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Selecciona trabajador');
    expect(text).toContain('Selecciona concepto');
    expect(text).toContain('Movimiento puntual del período activo.');
    expect(text).not.toContain('Trabajador / idPersona');
    expect(text).not.toContain('Contrato / idContrato');
    expect(text).not.toContain('Concepto / idConcepto');
  });

  it('selector de tipo de registro muestra pista según modo activo', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tipo de registro');
    expect(fixture.nativeElement.textContent).toContain('ajuste puntual');

    component.cambiarModoFormularioMensual('ausencia_licencia');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('licencia médica');
    expect(fixture.nativeElement.querySelector('#nm-registro-mes-ausencia')?.getAttribute('aria-selected')).toBe('true');
  });

  it('accion por trabajador abre gestion y permite agregar movimiento del mes', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    clickAccionTrabajadorGrilla(fixture.nativeElement);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gestionar movimientos');

    const modalButtons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    modalButtons.find((button) => button.textContent?.includes('Movimiento del mes'))?.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.nm-modal-movimiento') as HTMLElement | null;
    expect(modal).not.toBeNull();
    expect(modal?.getAttribute('role')).toBe('dialog');
    expect(modal?.textContent).toContain('Registrar movimiento del mes');
    expect(modal?.textContent).toContain('Volver a gestión');
    expect(fixture.componentInstance.periodoActivo.etiqueta()).toBe('Mayo 2026');
    expect(
      modal?.querySelector('button[aria-label="Ayuda: fecha de referencia"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="month"]')).toBeNull();
  });

  it('agregar recurrente abre modal local con trabajador preseleccionado', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    clickAccionTrabajadorGrilla(fixture.nativeElement);
    fixture.detectChanges();

    const modalButtons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    modalButtons.find((button) => button.textContent?.trim() === 'Recurrente')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.nm-modal-movimiento--recurrente') as HTMLElement | null;
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(modal).not.toBeNull();
    expect(modal?.textContent).toContain('Registrar recurrente');
    expect(modal?.textContent).toContain('Ana Perez');
    expect(modal?.textContent).toContain('Volver a gestión');
    expect(modal?.textContent).toContain('Desde');
    expect(component.trabajadorDetalle()).not.toBeNull();
  });

  it('guardar recurrente llama al servicio de asignaciones y recarga periodo', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);
    service.listarNovedadesPeriodo.mockClear();

    const row = component.trabajadoresMovimientos()[0];
    component.abrirRecurrenteParaTrabajador(row);
    await fixture.whenStable();
    component.onConceptoRecurrenteChange(20);
    component.actualizarRecurrenteMonto(120000);

    await component.guardarRecurrente();

    expect(haberesDescuentosService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        idPersona: 10,
        idContrato: 100,
        idConcepto: 20,
        tipoValor: 'FIJO',
        monto: 120000,
        periodicidad: 'MENSUAL',
        vigenciaInicio: '2026-05-01',
      }),
    );
    expect(component.recurrenteFormAbierto()).toBe(false);
    expect(service.listarNovedadesPeriodo).toHaveBeenCalledWith('2026-05');
  });

  it('Cancelar cierra modal si no hay cambios', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    fixture.detectChanges();

    component.cerrarFormulario();
    fixture.detectChanges();

    expect(component.formAbierto()).toBe(false);
    expect(fixture.nativeElement.querySelector('.nm-modal-movimiento')).toBeNull();
  });

  it('Cancelar pide confirmacion si hay cambios sin guardar', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    component.actualizarForm('monto', 1000);

    component.cerrarFormulario();
    fixture.detectChanges();

    expect(component.formAbierto()).toBe(true);
    expect(component.confirmarCancelarAbierto()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Descartar cambios');
  });

  it('seleccionar trabajador carga contratos y preselecciona contrato unico', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await component.onTrabajadorChange(10);

    expect(haberesDescuentosService.listarContratosPersona).toHaveBeenCalledWith(10);
    expect(component.form().idContrato).toBe(100);
  });

  it('crear movimiento llama al service con ids internos del formulario operativo', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    await component.onTrabajadorChange(10);
    component.onConceptoChange(20);
    component.actualizarForm('monto', 80000);

    await component.guardarFormulario();

    const input = service.crearNovedad.mock.calls[0][0] as CrearNovedadMensualInput;
    expect(input.periodo).toBe('2026-05');
    expect(input.idPersona).toBe(10);
    expect(input.idContrato).toBe(100);
    expect(input.idConcepto).toBe(20);
    expect(component.formAbierto()).toBe(false);
    expect(component.mensaje()).toBeNull();
  });

  it('guardar exitoso cierra modal, limpia formulario y recarga datos', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    await component.onTrabajadorChange(10);
    component.onConceptoChange(20);
    component.actualizarForm('monto', 80000);
    service.listarNovedadesPeriodo.mockClear();

    await component.guardarFormulario();

    expect(service.crearNovedad).toHaveBeenCalled();
    expect(component.formAbierto()).toBe(false);
    expect(component.form().idPersona).toBeNull();
    expect(service.listarNovedadesPeriodo).toHaveBeenCalledWith('2026-05');
  });

  it('errores de validacion mantienen modal abierto, muestran errores por campo y aviso', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();

    await component.guardarFormulario();
    fixture.detectChanges();

    expect(component.formAbierto()).toBe(true);
    expect(service.crearNovedad).not.toHaveBeenCalled();
    expect(component.errorCampo('idPersona')).toContain('trabajador');
    expect(component.errorCampo('idConcepto')).toContain('concepto');
    expect(component.avisoFormularioPendiente()?.titulo).toBe('Faltan datos obligatorios');
    expect(component.avisoFormularioPendiente()?.secciones[0]?.items).toEqual([
      'Trabajador',
      'Concepto',
      'Monto',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Debe indicar un trabajador valido.');
  });

  it('guardar usa periodo global aunque el form tenga otro periodo accidental', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    component.actualizarForm('periodo', '2020-01');
    await component.onTrabajadorChange(10);
    component.onConceptoChange(20);
    component.actualizarForm('monto', 80000);

    await component.guardarFormulario();

    const input = service.crearNovedad.mock.calls[0][0] as CrearNovedadMensualInput;
    expect(input.periodo).toBe('2026-05');
  });

  it('al cambiar periodo global cierra formulario y recarga sin filas stale', async () => {
    service.listarNovedadesPeriodo.mockResolvedValueOnce([novedad()]);
    fixture.detectChanges();
    await esperarCargaInicial(fixture);
    component.abrirNuevo();
    service.listarNovedadesPeriodo.mockResolvedValueOnce([]);

    periodoActivo.setPeriodoYm('2026-06');
    await fixture.whenStable();

    expect(component.formAbierto()).toBe(false);
    expect(service.listarNovedadesPeriodo).toHaveBeenCalledWith('2026-06');
    expect(component.filas()).toEqual([]);
  });

  it('grilla muestra trabajador y detalle filtrado por nombre operativo', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad()]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Perez');
    expect(text).toContain('11.111.111-1');
    expect(text).not.toContain('Persona 10');
    expect(text).not.toContain('Concepto 20');

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('1 movimientos'))?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gestionar movimientos');
    expect(fixture.nativeElement.textContent).toContain('Mensual');
    expect(fixture.nativeElement.textContent).toContain('Bono puntual (BONO)');
  });

  it('muestra conteos operativos del periodo por estado', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([
      novedad({ idNovedad: 1, estado: 'borrador' }),
      novedad({ idNovedad: 2, estado: 'pendiente_revision' }),
      novedad({ idNovedad: 3, estado: 'aprobada' }),
      novedad({ idNovedad: 4, estado: 'rechazada' }),
    ]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    expect(component.resumenPeriodo()).toEqual([
      { label: 'Trabajadores activos', total: 1 },
      { label: 'Con movimientos', total: 1 },
      { label: 'Con recurrentes', total: 0 },
      { label: 'Por revisar', total: 1 },
    ]);
  });

  it('grilla por trabajador no expone ids tecnicos de movimientos sin ficha visible', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad({ idPersona: 999, idConcepto: 999 })]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Perez');
    expect(text).not.toContain('Persona 999');
    expect(text).not.toContain('Concepto 999');
  });

  it('enviar a revision llama al service', async () => {
    await component.enviarRevision(novedad());

    expect(service.enviarARevision).toHaveBeenCalledWith(1);
  });

  it('aprobar llama al service', async () => {
    await component.aprobar(novedad({ estado: 'pendiente_revision' }));

    expect(service.aprobarNovedad).toHaveBeenCalledWith(1, '00000000-0000-0000-0000-000000000000');
  });

  it('rechazar llama al service con observacion', async () => {
    component.observacionAccion.set('Documento corregido');

    await component.rechazar(novedad({ estado: 'pendiente_revision' }));

    expect(service.rechazarNovedad).toHaveBeenCalledWith(1, 'Documento corregido');
  });

  it('anular llama al service', async () => {
    component.observacionAccion.set('Duplicada');

    await component.anular(novedad({ estado: 'aprobada' }));

    expect(service.anularNovedad).toHaveBeenCalledWith(1, 'Duplicada');
  });

  it('novedad calculada no muestra accion editar', () => {
    expect(component.puedeEditar(novedad({ estado: 'calculada' }))).toBe(false);
  });

  it('novedad anulada no muestra accion aprobar', () => {
    expect(component.puedeAprobar(novedad({ estado: 'anulada' }))).toBe(false);
  });

  it('filtra filas unificadas por ambito y revision', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([
      novedad({ idNovedad: 1, estado: 'pendiente_revision' }),
      novedad({ idNovedad: 2, estado: 'aprobada' }),
    ]);
    haberesDescuentosService.listarAsignacionesParaPrevalidacionMensual.mockResolvedValue([
      {
        asignacion: {
          idAsignacion: 50,
          idPersona: 10,
          idConcepto: 20,
          idContrato: 100,
          nombreConcepto: 'Bono fijo',
          tipoConcepto: 'HABER',
          tipoValor: 'FIJO',
          monto: 50000,
          porcentaje: null,
          periodicidad: 'MENSUAL',
          vigenciaInicio: '2026-05-01',
          vigenciaFin: null,
          observacion: null,
          estado: true,
          estadoVigenciaEtiqueta: 'Activa',
        },
        intersectaPeriodo: true,
        estadoVigencia: 'ACTIVA',
      },
    ]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const row = component.trabajadoresMovimientos()[0];
    component.abrirDetalleTrabajador(row, 'revision');
    expect(component.filasGestionUnificada(row.idPersona, 'revision')).toHaveLength(1);
    expect(component.filasGestionUnificada(row.idPersona, 'recurrente')).toHaveLength(1);
    expect(component.filasGestionUnificada(row.idPersona, 'todos')).toHaveLength(3);
  });

  it('errores del service muestran mensaje contextual', async () => {
    service.listarNovedadesPeriodo.mockRejectedValue(new Error('Fallo remoto'));

    await component.cargarNovedades();

    expect(component.mensaje()?.variant).toBe('error');
    expect(component.mensaje()?.message).toBe('Fallo remoto');
  });

  it('prioriza accion revisar pendientes en encabezado del periodo', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([
      novedad({ idNovedad: 1, estado: 'pendiente_revision' }),
      novedad({ idNovedad: 2, estado: 'pendiente_revision' }),
    ]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    expect(component.estadoPeriodoPresentacion().accionRecomendada.tipo).toBe('revisar_pendientes');
    expect(fixture.nativeElement.textContent).toContain('Revisar pendientes');
  });

  it('abre modal de detalle al pulsar icono en gestion unificada', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad()]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const row = component.trabajadoresMovimientos()[0];
    component.abrirDetalleTrabajador(row, 'todos');
    fixture.detectChanges();

    const fila = component.filasGestionUnificada(row.idPersona, 'todos')[0];
    component.abrirDetalleMovimiento(fila);
    fixture.detectChanges();

    expect(component.detalleMovimientoUi()?.titulo).toContain('Detalle del movimiento del mes');
    expect(fixture.nativeElement.textContent).toContain('Bono puntual (BONO)');
  });

  it('modal mensual muestra breadcrumb de retorno a gestion', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const row = component.trabajadoresMovimientos()[0];
    component.abrirNuevoParaTrabajador(row, 'mensual');
    fixture.detectChanges();

    expect(component.breadcrumbModalMensual()).toContain('Gestionar · Ana Perez · Registrar movimiento del mes');
  });

  it('observar exige motivo antes de rechazar', async () => {
    await component.pedirObservarDesdeDetalle(novedad({ estado: 'pendiente_revision' }));
    await component.confirmarObservar();

    expect(service.rechazarNovedad).not.toHaveBeenCalled();
    expect(component.observacionMotivoError()).toContain('motivo');

    component.observacionMotivo.set('Falta respaldo');
    await component.confirmarObservar();

    expect(service.rechazarNovedad).toHaveBeenCalledWith(1, 'Falta respaldo');
  });

  it('bloquea seleccion masiva para trabajadores incompletos', async () => {
    empleadosService.listar.mockResolvedValue([
      {
        id: 10,
        idContrato: 100,
        rut: '11.111.111-1',
        nombre: 'Ana Perez',
        cargo: 'Analista',
        departamento: 'RRHH',
        fechaIngreso: '2026-01-01',
        sueldoBase: 800000,
        estado: 'activo',
        estadoFicha: 'VALIDO',
        aptoParaRemuneraciones: true,
        pasoAltaAvanzada: null,
      },
      {
        id: 11,
        idContrato: null,
        rut: '22.222.222-2',
        nombre: 'Incompleta QA',
        cargo: 'Analista',
        departamento: 'RRHH',
        fechaIngreso: '2026-01-01',
        sueldoBase: 800000,
        estado: 'activo',
        estadoFicha: 'BORRADOR',
        aptoParaRemuneraciones: false,
        pasoAltaAvanzada: null,
      },
    ]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const incompleta = component.trabajadoresMovimientos().find((row) => row.idPersona === 11);
    expect(incompleta?.estado).toBe('Incompleto');
    expect(component.trabajadorSeleccionBloqueado(incompleta!)).toBe(true);
  });

  it('abre modal masivo al ejecutar accion bulk de asignacion', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const row = component.trabajadoresMovimientos()[0];
    component.manejarAsignacionMasiva({
      action: 'asignar-movimiento-mes',
      rows: [row],
      label: 'Asignar movimiento del mes',
    });
    fixture.detectChanges();

    expect(component.asignacionMasivaAbierta()).toBe(true);
    expect(component.asignacionMasivaTrabajadores()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Registrar para seleccionados');
  });

  it('guardar asignacion masiva crea novedad por trabajador seleccionado', async () => {
    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const row = component.trabajadoresMovimientos()[0];
    component.manejarAsignacionMasiva({
      action: 'asignar-movimiento-mes',
      rows: [row],
      label: 'Asignar movimiento del mes',
    });
    component.actualizarFormMasivo('idConcepto', 20);
    component.actualizarFormMasivo('monto', 75000);
    component.actualizarFormMasivo('fechaEvento', '2026-05-01');

    await component.guardarAsignacionMasiva();

    expect(service.crearNovedad).toHaveBeenCalledTimes(1);
    expect(service.crearNovedad).toHaveBeenCalledWith(
      expect.objectContaining({
        idPersona: 10,
        idConcepto: 20,
        monto: 75000,
      }),
    );
    expect(component.asignacionMasivaAbierta()).toBe(false);
    expect(component.mensaje()?.title).toContain('Asignación completada');
  });
});
