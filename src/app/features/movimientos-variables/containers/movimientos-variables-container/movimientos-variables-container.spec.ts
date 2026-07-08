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
  Check,
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
import { vi } from 'vitest';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../services/movimientos-variables.service';
import { MovimientosVariablesContainer } from './movimientos-variables-container';

describe('MovimientosVariablesContainer', () => {
  let fixture: ComponentFixture<MovimientosVariablesContainer>;
  let component: MovimientosVariablesContainer;
  let periodoActivo: PeriodoActivoService;
  let movimientosService: {
    listarPorPeriodo: ReturnType<typeof vi.fn>;
    crear: ReturnType<typeof vi.fn>;
    anular: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    movimientosService = {
      listarPorPeriodo: vi.fn().mockResolvedValue([]),
      crear: vi.fn().mockResolvedValue({}),
      anular: vi.fn().mockResolvedValue({}),
    };
    await TestBed.configureTestingModule({
      imports: [MovimientosVariablesContainer],
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
            Check,
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
        {
          provide: MovimientosVariablesService,
          useValue: movimientosService,
        },
        {
          provide: EmpleadosService,
          useValue: {
            listar: async () => [],
          },
        },
        {
          provide: HaberesDescuentosService,
          useValue: {
            listarConceptos: async () => [],
          },
        },
      ],
    }).compileComponents();

    periodoActivo = TestBed.inject(PeriodoActivoService);
    periodoActivo.setPeriodoYm('2026-05');
    fixture = TestBed.createComponent(MovimientosVariablesContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra franja operativa y titulo de grilla (patron conceptos)', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.mv-franja-operativa .mv-lead')?.textContent).toContain(
      'montos puntuales',
    );
    expect(root.textContent).toContain('Movimientos del mes');
  });

  it('usa periodo global y no muestra selector mensual local', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[type="month"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Periodo activo');
    expect(fixture.nativeElement.textContent).toContain('Mayo 2026');
    expect(fixture.nativeElement.textContent).toContain('Cambia el periodo desde la cabecera global.');
  });

  it('buscar usa periodo global', async () => {
    periodoActivo.setPeriodoYm('2026-06');

    await component.buscar();

    expect(movimientosService.listarPorPeriodo).toHaveBeenCalledWith('2026-06');
  });

  it('guardarNuevo envia periodo global', async () => {
    periodoActivo.setPeriodoYm('2026-06');
    component.formPersonaId.set(10);
    component.formConceptoId.set(20);
    component.formMonto.set(50000);

    await component.guardarNuevo();

    expect(movimientosService.crear).toHaveBeenCalledWith(expect.objectContaining({ periodo: '2026-06' }));
  });
});
