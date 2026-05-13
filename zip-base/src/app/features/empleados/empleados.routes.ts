import { Routes } from '@angular/router';

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
