import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Filter,
  Home,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-angular/src/icons';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../services/haberes-descuentos.service';
import { HaberesDescuentosContainer } from './haberes-descuentos-container';

describe('HaberesDescuentosContainer', () => {
  let fixture: ComponentFixture<HaberesDescuentosContainer>;
  let component: HaberesDescuentosContainer;
  let empleadosService: { listar: ReturnType<typeof vi.fn> };
  let haberesDescuentosService: {
    listarConceptos: ReturnType<typeof vi.fn>;
    listarContratosPersona: ReturnType<typeof vi.fn>;
    listarPorPersona: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
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
          codigo: 'PREST-01',
          nombre: 'Prestamo empresa',
          tipo: 'DESCUENTO',
          naturaleza: 'NO_IMPONIBLE',
          codigoLre: null,
        },
      ]),
      listarContratosPersona: vi.fn().mockResolvedValue([]),
      listarPorPersona: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [HaberesDescuentosContainer],
      providers: [
        provideRouter([
          {
            path: 'remuneraciones/haberes-descuentos',
            component: HaberesDescuentosContainer,
          },
        ]),
        importProvidersFrom(
          LucideAngularModule.pick({
            ArrowDown,
            ArrowUp,
            ArrowUpDown,
            ChevronDown,
            ChevronLeft,
            ChevronRight,
            Download,
            Edit,
            Filter,
            Home,
            LoaderCircle,
            Plus,
            RefreshCw,
            Search,
            Settings,
          }),
        ),
        PeriodoActivoService,
        { provide: EmpleadosService, useValue: empleadosService },
        { provide: HaberesDescuentosService, useValue: haberesDescuentosService },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/remuneraciones/haberes-descuentos');

    fixture = TestBed.createComponent(HaberesDescuentosContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();
  });

  it('renderiza titulo visible sin tabbar legacy', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Movimientos de remuneración');
    expect(fixture.nativeElement.querySelector('.hd-view-tabs')).toBeNull();
    expect(text).not.toContain('Este mes');
    expect(text).not.toContain('Todos');
  });

  it('aplica query param persona al cargar', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/remuneraciones/haberes-descuentos?persona=10');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.personaIdSeleccionada()).toBe(10);
  });

  it('abre modal registrar con accion=registrar y persona', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/remuneraciones/haberes-descuentos?persona=10&accion=registrar');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.personaIdSeleccionada()).toBe(10);
    expect(component.dialogAbierto()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Registrar recurrente');
  });
});
