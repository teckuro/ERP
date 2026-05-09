import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
  fixture.detectChanges();
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
  };

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
    };

    await TestBed.configureTestingModule({
      imports: [NovedadesMensualesContainer],
      providers: [
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

    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-05');
    fixture = TestBed.createComponent(NovedadesMensualesContainer);
    component = fixture.componentInstance;
  });

  it('carga datos de apoyo y movimientos por periodo al iniciar', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad()]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    expect(empleadosService.listar).toHaveBeenCalled();
    expect(haberesDescuentosService.listarConceptos).toHaveBeenCalled();
    expect(service.listarNovedadesPeriodo).toHaveBeenCalledWith('2026-05');
    expect(component.totalNovedades()).toBe(1);
  });

  it('muestra estado vacio cuando no hay movimientos del mes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay movimientos registrados para este periodo.');
  });

  it('no muestra labels tecnicos para identificar trabajador, contrato ni concepto', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Selecciona trabajador');
    expect(text).toContain('Selecciona concepto');
    expect(text).not.toContain('Trabajador / idPersona');
    expect(text).not.toContain('Contrato / idContrato');
    expect(text).not.toContain('Concepto / idConcepto');
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
    expect(component.mensaje()?.title).toBe('Movimiento guardado');
    expect(component.mensaje()?.message).not.toContain('Novedad');
  });

  it('grilla muestra trabajador y concepto por nombre operativo', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad()]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Perez');
    expect(text).toContain('11.111.111-1');
    expect(text).toContain('Bono puntual (BONO)');
    expect(text).not.toContain('Persona 10');
    expect(text).not.toContain('Concepto 20');
  });

  it('fallback de grilla no expone ids tecnicos cuando no encuentra datos visibles', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad({ idPersona: 999, idConcepto: 999 })]);

    fixture.detectChanges();
    await esperarCargaInicial(fixture);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Trabajador sin ficha visible');
    expect(text).toContain('Concepto no disponible');
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

  it('errores del service muestran mensaje contextual', async () => {
    service.listarNovedadesPeriodo.mockRejectedValue(new Error('Fallo remoto'));
    component.periodoFiltro.set('2026-05');

    await component.cargarNovedades();

    expect(component.mensaje()?.variant).toBe('error');
    expect(component.mensaje()?.message).toBe('Fallo remoto');
  });
});
