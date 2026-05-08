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
      ],
    }).compileComponents();

    TestBed.inject(PeriodoActivoService).setPeriodoYm('2026-05');
    fixture = TestBed.createComponent(NovedadesMensualesContainer);
    component = fixture.componentInstance;
  });

  it('carga novedades por periodo al iniciar', async () => {
    service.listarNovedadesPeriodo.mockResolvedValue([novedad()]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.listarNovedadesPeriodo).toHaveBeenCalledWith('2026-05');
    expect(component.totalNovedades()).toBe(1);
  });

  it('muestra estado vacio cuando no hay novedades', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay novedades registradas para este periodo.');
  });

  it('crear novedad llama al service con datos del formulario', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirNuevo();
    component.actualizarForm('idPersona', 10);
    component.actualizarForm('idConcepto', 20);
    component.actualizarForm('monto', 80000);

    await component.guardarFormulario();

    const input = service.crearNovedad.mock.calls[0][0] as CrearNovedadMensualInput;
    expect(input.periodo).toBe('2026-05');
    expect(input.idPersona).toBe(10);
    expect(input.idConcepto).toBe(20);
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
