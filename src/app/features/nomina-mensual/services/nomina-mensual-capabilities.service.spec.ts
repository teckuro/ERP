import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { NominaMensualCapabilitiesService } from './nomina-mensual-capabilities.service';

describe('NominaMensualCapabilitiesService', () => {
  it('habilita acciones admin solo con rol admin y modo pruebas', () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualCapabilitiesService,
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ app_metadata: { role: 'admin' } }),
          },
        },
      ],
    });
    const service = TestBed.inject(NominaMensualCapabilitiesService);
    expect(service.esAdmin()).toBe(true);
    expect(service.modoPruebas()).toBe(true);
    expect(service.puedeAccionesAdminNomina()).toBe(true);
  });

  it('no habilita acciones admin sin rol admin', () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualCapabilitiesService,
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ user_metadata: { role: 'rrhh' } }),
          },
        },
      ],
    });
    const service = TestBed.inject(NominaMensualCapabilitiesService);
    expect(service.puedeAccionesAdminNomina()).toBe(false);
  });
});
