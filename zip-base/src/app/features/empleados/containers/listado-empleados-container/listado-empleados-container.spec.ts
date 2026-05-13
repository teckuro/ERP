import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRight, Home } from 'lucide-angular/src/icons';

import { EmpleadosService } from '../../services/empleados.service';
import { ListadoEmpleadosContainer } from './listado-empleados-container';

describe('ListadoEmpleadosContainer', () => {
  let component: ListadoEmpleadosContainer;
  let fixture: ComponentFixture<ListadoEmpleadosContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoEmpleadosContainer],
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Home, ChevronRight })),
        {
          provide: EmpleadosService,
          useValue: {
            listar: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoEmpleadosContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
