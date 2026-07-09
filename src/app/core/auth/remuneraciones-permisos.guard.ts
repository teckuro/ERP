import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import type { ModuloPermiso } from './erp-permisos-modulos.rules';
import type { PermisosNominaMensual } from './erp-rol-remuneraciones.models';
import { ErpPermisosRemuneracionesService } from './erp-permisos-remuneraciones.service';

export function crearRemuneracionesPermisosGuard(
  selector: (permisos: PermisosNominaMensual) => boolean,
  redirectPath = '/remuneraciones/nominas',
): CanActivateFn {
  return () => {
    const permisos = inject(ErpPermisosRemuneracionesService);
    if (selector(permisos.permisosNomina())) return true;

    return inject(Router).createUrlTree([redirectPath], {
      queryParams: { acceso: 'denegado' },
    });
  };
}

/** Bloquea perfiles de solo consulta en rutas que requieren escritura operativa. */
export const remuneracionesEscrituraGuard = crearRemuneracionesPermisosGuard(
  (permisos) => permisos.puedeEditarNomina,
);

/** Reservado a administradores de remuneraciones (eliminar, reabrir, cierre). */
export const remuneracionesAdminNominaGuard = crearRemuneracionesPermisosGuard(
  (permisos) => permisos.puedeEliminarNomina,
);

/** Guard por módulo (ADMIN-01 / SEC-04): respeta `permisosModulos` del perfil. */
export function crearModuloPermisoGuard(
  modulo: ModuloPermiso,
  modo: 'ver' | 'editar' = 'ver',
  redirectPath = '/',
): CanActivateFn {
  return async () => {
    const permisosSvc = inject(ErpPermisosRemuneracionesService);
    const router = inject(Router);
    await permisosSvc.asegurarPermisosPerfil();

    const permiso = permisosSvc.permisosModulos()[modulo];
    const permitido = modo === 'editar' ? permiso.editar : permiso.ver;
    if (permitido) return true;

    return router.createUrlTree([redirectPath], {
      queryParams: { acceso: 'denegado' },
    });
  };
}
