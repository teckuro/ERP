import { Routes } from '@angular/router';

export const empleadosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/listado-empleados/listado-empleados').then((m) => m.ListadoEmpleadosPage),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./containers/crear-empleado/crear-empleado').then((m) => m.CrearEmpleadoPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./containers/ficha-empleado/ficha-empleado').then((m) => m.FichaEmpleadoPage),
  },
];
