import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { ErpPermisosRemuneracionesService } from './erp-permisos-remuneraciones.service';
import {
  crearModuloPermisoGuard,
  remuneracionesAdminNominaGuard,
  remuneracionesEscrituraGuard,
} from './remuneraciones-permisos.guard';
import { permisosPorDefectoDesdeRol } from './erp-permisos-modulos.rules';

function ejecutarGuard(
  guard: typeof remuneracionesEscrituraGuard,
  permisos: ReturnType<ErpPermisosRemuneracionesService['permisosNomina']>,
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: ErpPermisosRemuneracionesService,
        useValue: { permisosNomina: () => permisos },
      },
    ],
  });

  return TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, { url: '/x' } as RouterStateSnapshot),
  );
}

describe('remuneraciones-permisos.guard', () => {
  const permisosOperador = {
    puedeVerNomina: true,
    puedeCrearNomina: true,
    puedeEditarNomina: true,
    puedeEliminarNomina: false,
    puedeReabrirNomina: false,
    puedeCerrarNomina: false,
    puedeRecargarParametrosBase: false,
    puedeValidarNomina: true,
    puedeAprobarNomina: true,
    puedeConsolidarNomina: true,
    puedeGenerarLiquidaciones: true,
    puedeRectificarNomina: true,
  };

  const permisosAdmin = {
    ...permisosOperador,
    puedeEliminarNomina: true,
    puedeReabrirNomina: true,
    puedeCerrarNomina: true,
    puedeRecargarParametrosBase: true,
  };

  const permisosConsulta = {
    puedeVerNomina: true,
    puedeCrearNomina: false,
    puedeEditarNomina: false,
    puedeEliminarNomina: false,
    puedeReabrirNomina: false,
    puedeCerrarNomina: false,
    puedeRecargarParametrosBase: false,
    puedeValidarNomina: false,
    puedeAprobarNomina: false,
    puedeConsolidarNomina: false,
    puedeGenerarLiquidaciones: false,
    puedeRectificarNomina: false,
  };

  it('remuneracionesEscrituraGuard permite operador y bloquea consulta', async () => {
    const allowed = await ejecutarGuard(remuneracionesEscrituraGuard, permisosOperador);
    expect(allowed).toBe(true);

    const denied = await ejecutarGuard(remuneracionesEscrituraGuard, permisosConsulta);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(denied as ReturnType<Router['createUrlTree']>)).toBe(
      '/remuneraciones/nominas?acceso=denegado',
    );
  });

  it('remuneracionesAdminNominaGuard permite solo admin', async () => {
    const allowed = await ejecutarGuard(remuneracionesAdminNominaGuard, permisosAdmin);
    expect(allowed).toBe(true);

    const denied = await ejecutarGuard(remuneracionesAdminNominaGuard, permisosOperador);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(denied as ReturnType<Router['createUrlTree']>)).toContain(
      'acceso=denegado',
    );
  });

  it('crearModuloPermisoGuard bloquea parametros para consulta', async () => {
    const guard = crearModuloPermisoGuard('parametros', 'editar');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ErpPermisosRemuneracionesService,
          useValue: {
            permisosNomina: () => permisosConsulta,
            permisosModulos: () => permisosPorDefectoDesdeRol('consulta_remuneraciones'),
            asegurarPermisosPerfil: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    const denied = await TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/parametros' } as RouterStateSnapshot),
    );
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(denied as ReturnType<Router['createUrlTree']>)).toBe(
      '/?acceso=denegado',
    );
  });
});
