import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ErpPermisosRemuneracionesService } from './erp-permisos-remuneraciones.service';

/** Reservado al administrador del sistema (módulo Administrador: usuarios, perfiles, documento). */
export const adminSistemaGuard: CanActivateFn = () => {
  const permisos = inject(ErpPermisosRemuneracionesService);
  if (permisos.rol() === 'admin_sistema') return true;

  return inject(Router).createUrlTree(['/'], {
    queryParams: { acceso: 'denegado' },
  });
};
