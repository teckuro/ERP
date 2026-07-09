import { Routes } from '@angular/router';

import { crearModuloPermisoGuard } from '../../core/auth/remuneraciones-permisos.guard';

export const empleadosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/listado-empleados-container/listado-empleados-container').then(
        (m) => m.ListadoEmpleadosContainer,
      ),
  },
  {
    path: 'nuevo',
    canActivate: [crearModuloPermisoGuard('empleados', 'editar')],
    loadComponent: () =>
      import('./containers/crear-empleado-container/crear-empleado-container').then(
        (m) => m.CrearEmpleadoContainer,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./containers/ficha-empleado-container/ficha-empleado-container').then(
        (m) => m.FichaEmpleadoContainer,
      ),
  },
];
