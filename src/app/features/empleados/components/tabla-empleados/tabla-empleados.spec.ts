import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid';
import { EmpleadoListado } from '../../models/empleado-listado.model';
import { TablaEmpleadosComponent } from './tabla-empleados';

function fila(over: Partial<EmpleadoListado>): EmpleadoListado {
  return {
    id: 1,
    idContrato: null,
    rut: '1-9',
    nombre: 'Test',
    cargo: 'Cargo',
    departamento: 'CC',
    fechaIngreso: '2020-01-01',
    sueldoBase: 0,
    monedaContrato: null,
    estado: 'borrador',
    estadoFicha: 'BORRADOR',
    aptoParaRemuneraciones: false,
    pasoAltaAvanzada: null,
    ...over,
  };
}

describe('TablaEmpleadosComponent', () => {
  const persistenceKey = 'empleados.data-grid.preferences';
  let component: TablaEmpleadosComponent;
  let fixture: ComponentFixture<TablaEmpleadosComponent>;

  beforeEach(async () => {
    localStorage.removeItem(persistenceKey);

    await TestBed.configureTestingModule({
      imports: [TablaEmpleadosComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaEmpleadosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem(persistenceKey);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Continuar alta: ruta nuevo + idPersona y etiqueta cuando hay paso guardado', () => {
    const e = fila({ id: 42, pasoAltaAvanzada: 3 });
    expect(component.primaryActionLink(e)).toEqual(['/empleados', 'nuevo']);
    expect(component.primaryActionQueryParams(e)).toEqual({ idPersona: '42' });
    expect(component.rowPrimaryActionLabel(e)).toBe('Continuar alta');
  });

  it('sin paso avanzado: accion primaria va a ficha del empleado', () => {
    const e = fila({
      id: 7,
      pasoAltaAvanzada: null,
      estado: 'activo',
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
    });
    expect(component.primaryActionLink(e)).toEqual(['/empleados', 7]);
    expect(component.primaryActionQueryParams(e)).toEqual({});
    expect(component.rowPrimaryActionLabel(e)).toBe('Ver ficha');
  });

  it('En proceso muestra Completar ficha sin paso avanzado', () => {
    const e = fila({
      estado: 'en_proceso',
      estadoFicha: 'INCOMPLETO',
      aptoParaRemuneraciones: false,
      pasoAltaAvanzada: null,
    });

    expect(component.labelEstadoVisual(e)).toBe('En proceso');
    expect(component.rowPrimaryActionLabel(e)).toBe('Completar ficha');
    expect(component.primaryActionLink(e)).toEqual(['/empleados', 1]);
  });

  it('Apto muestra Ver ficha y estado Activo / Apto', () => {
    const e = fila({
      estado: 'activo',
      estadoFicha: 'VALIDO',
      aptoParaRemuneraciones: true,
      pasoAltaAvanzada: null,
    });

    expect(component.labelEstadoVisual(e)).toBe('Activo / Apto');
    expect(component.rowPrimaryActionLabel(e)).toBe('Ver ficha');
  });

  it('popover: Continuar alta o Ver ficha segun paso avanzado', () => {
    expect(component.menuPrimaryActionLabel(fila({ pasoAltaAvanzada: 2 }))).toBe('Continuar alta');
    expect(component.menuPrimaryActionLabel(fila({ estadoFicha: 'INCOMPLETO' }))).toBe('Ver ficha');
    expect(component.menuPrimaryActionLabel(fila({ estado: 'activo', estadoFicha: 'VALIDO' }))).toBe(
      'Ver ficha',
    );
  });

  it('Activo no apto muestra Revisar pendientes', () => {
    const e = fila({
      estado: 'activo',
      estadoFicha: 'INCOMPLETO',
      aptoParaRemuneraciones: false,
      pasoAltaAvanzada: null,
    });

    expect(component.labelEstadoVisual(e)).toBe('Activo / No apto');
    expect(component.rowPrimaryActionLabel(e)).toBe('Revisar pendientes');
    expect(component.pendingLabel(e)).toBe('No apto');
  });

  it('deja filtros persistidos como borrador cuando no hay empleados', async () => {
    fixture.destroy();
    localStorage.setItem(
      persistenceKey,
      JSON.stringify({
        filterValues: { nombre: 'Ana', estado: 'activo' },
        pageSize: 10,
        sortColumnId: '',
        sortDirection: 'asc',
        visibleColumnIds: [],
      }),
    );

    fixture = TestBed.createComponent(TablaEmpleadosComponent);
    component = fixture.componentInstance;
    component.empleados = [];
    component.loading = false;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const grid = fixture.debugElement.query(By.directive(DataGridComponent))
      .componentInstance as DataGridComponent<EmpleadoListado>;

    expect(grid.hasActiveFilters).toBeFalsy();
    expect(grid.hasActiveDraftFilters).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.data-grid-filter-panel')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay empleados registrados.');
  });
});
