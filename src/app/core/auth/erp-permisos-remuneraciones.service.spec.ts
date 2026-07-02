import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';
import {
  ErpPermisosRemuneracionesService,
  resolverRolRemuneracionesDesdeUser,
} from './erp-permisos-remuneraciones.service';
import { MENSAJE_SIN_PERMISO_ADMIN_NOMINA } from './erp-rol-remuneraciones.models';

describe('ErpPermisosRemuneracionesService', () => {
  function configurar(user: Record<string, unknown> | null) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ErpPermisosRemuneracionesService,
        {
          provide: AuthService,
          useValue: { currentUser: () => user },
        },
      ],
    });
    return TestBed.inject(ErpPermisosRemuneracionesService);
  }

  it('expone permisos admin desde app_metadata', () => {
    const service = configurar({ app_metadata: { role: 'admin' } });
    expect(service.esAdministradorRemuneraciones()).toBe(true);
    expect(service.puedeEscribirNomina()).toBe(true);
    expect(() => service.exigirPermisoAdminNomina()).not.toThrow();
  });

  it('bloquea acciones admin para operador', () => {
    const service = configurar({ user_metadata: { role: 'operador_remuneraciones' } });
    expect(service.esAdministradorRemuneraciones()).toBe(false);
    expect(() => service.exigirPermisoAdminNomina()).toThrow(MENSAJE_SIN_PERMISO_ADMIN_NOMINA);
  });

  it('bloquea escritura para consulta', () => {
    const service = configurar({ user_metadata: { role: 'consulta' } });
    expect(service.esSoloConsulta()).toBe(true);
    expect(service.puedeEscribirNomina()).toBe(false);
    expect(() => service.exigirPermisoEscrituraNomina()).toThrow();
  });
});

describe('resolverRolRemuneracionesDesdeUser', () => {
  it('sin usuario devuelve sin_sesion', () => {
    expect(resolverRolRemuneracionesDesdeUser(null)).toBe('sin_sesion');
  });
});
