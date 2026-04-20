import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmpleadosService } from '../../services/empleados.service';
import { ListadoEmpleadosPage } from './listado-empleados';

describe('ListadoEmpleadosPage', () => {
  let component: ListadoEmpleadosPage;
  let fixture: ComponentFixture<ListadoEmpleadosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoEmpleadosPage],
      providers: [
        provideRouter([]),
        {
          provide: EmpleadosService,
          useValue: {
            listar: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoEmpleadosPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
