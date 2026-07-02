import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { ErpPermisosRemuneracionesService } from '../../../core/auth/erp-permisos-remuneraciones.service';
import { NominaMensualCapabilitiesService } from './nomina-mensual-capabilities.service';

describe('NominaMensualCapabilitiesService', () => {
  it('habilita acciones admin con rol admin en app_metadata (sin gate de modo pruebas)', () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualCapabilitiesService,
        ErpPermisosRemuneracionesService,
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
    expect(service.puedeAccionesAdminNomina()).toBe(true);
  });

  it('no eleva admin desde user_metadata', () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualCapabilitiesService,
        ErpPermisosRemuneracionesService,
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ user_metadata: { role: 'admin' } }),
          },
        },
      ],
    });
    const service = TestBed.inject(NominaMensualCapabilitiesService);
    expect(service.esAdmin()).toBe(false);
    expect(service.puedeAccionesAdminNomina()).toBe(false);
  });

  it('marca consulta como solo lectura', () => {
    TestBed.configureTestingModule({
      providers: [
        NominaMensualCapabilitiesService,
        ErpPermisosRemuneracionesService,
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ user_metadata: { role: 'consulta_remuneraciones' } }),
          },
        },
      ],
    });
    const service = TestBed.inject(NominaMensualCapabilitiesService);
    expect(service.esSoloLectura()).toBe(true);
    expect(service.puedeEscribirNomina()).toBe(false);
  });
});
