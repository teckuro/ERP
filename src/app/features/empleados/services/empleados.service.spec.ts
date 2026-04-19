import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../../../core/services/supabase.service';
import { EmpleadosService } from './empleados.service';

describe('EmpleadosService', () => {
  let service: EmpleadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: {} }],
    });
    service = TestBed.inject(EmpleadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
