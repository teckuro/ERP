import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
    estado: 'borrador',
    estadoFicha: 'BORRADOR',
    aptoParaRemuneraciones: false,
    pasoAltaAvanzada: null,
    ...over,
  };
}

describe('TablaEmpleadosComponent', () => {
  let component: TablaEmpleadosComponent;
  let fixture: ComponentFixture<TablaEmpleadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaEmpleadosComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaEmpleadosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
    const e = fila({ id: 7, pasoAltaAvanzada: null, estado: 'activo' });
    expect(component.primaryActionLink(e)).toEqual(['/empleados', 7]);
    expect(component.primaryActionQueryParams(e)).toEqual({});
    expect(component.rowPrimaryActionLabel(e)).toBe('Ver ficha');
  });
});
