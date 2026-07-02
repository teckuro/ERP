import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import type { PermisosNominaMensual } from './erp-rol-remuneraciones.models';
import { ErpPermisosRemuneracionesService } from './erp-permisos-remuneraciones.service';

export function crearRemuneracionesPermisosGuard(
  selector: (permisos: PermisosNominaMensual) => boolean,
): CanActivateFn {
  return () => {
    const permisos = inject(ErpPermisosRemuneracionesService);
    if (selector(permisos.permisosNomina())) return true;

    return inject(Router).createUrlTree(['/remuneraciones/nominas'], {
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
