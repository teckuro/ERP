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

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../services/movimientos-variables.service';
import { MovimientosVariablesContainer } from './movimientos-variables-container';

describe('MovimientosVariablesContainer', () => {
  let fixture: ComponentFixture<MovimientosVariablesContainer>;
  let component: MovimientosVariablesContainer;

  beforeEach(async () => {
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
          useValue: {
            listarPorPeriodo: async () => [],
            crear: async () => ({}),
            anular: async () => ({}),
          },
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

    fixture = TestBed.createComponent(MovimientosVariablesContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose remuneraciones breadcrumb', () => {
    expect(component.breadcrumbItems[0].label).toBe('Remuneraciones');
    expect(component.breadcrumbItems[0].link).toBe('/remuneraciones');
    expect(component.breadcrumbItems[1].label).toBe('Movimientos variables');
  });
});
