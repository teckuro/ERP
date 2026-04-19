import { Routes } from '@angular/router';
import { LayoutShellComponent } from './layout/layout-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'empleados',
        loadComponent: () =>
          import('./features/empleados/pages/listado-empleados/listado-empleados').then(
            (m) => m.ListadoEmpleadosPage,
          ),
      },
      {
        path: 'empleados/nuevo',
        loadComponent: () =>
          import('./features/empleados/pages/crear-empleado/crear-empleado').then(
            (m) => m.CrearEmpleadoPage,
          ),
      },
      {
        path: 'empleados/:id',
        loadComponent: () =>
          import('./features/empleados/pages/ficha-empleado/ficha-empleado').then(
            (m) => m.FichaEmpleadoPage,
          ),
      },
      {
        path: 'haberes-descuentos',
        loadComponent: () => import('./pages/haberes-descuentos.page').then((m) => m.HaberesDescuentosPage),
      },
      {
        path: 'proceso-remuneraciones',
        loadComponent: () =>
          import('./pages/proceso-remuneraciones.page').then((m) => m.ProcesoRemuneracionesPage),
      },
      {
        path: 'liquidaciones',
        loadComponent: () => import('./pages/liquidaciones.page').then((m) => m.LiquidacionesPage),
      },
      {
        path: 'liquidaciones/:id',
        loadComponent: () => import('./pages/detalle-liquidacion.page').then((m) => m.DetalleLiquidacionPage),
      },
      {
        path: 'licencias-medicas',
        loadComponent: () => import('./pages/licencias-medicas.page').then((m) => m.LicenciasMedicasPage),
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'parametros',
        loadComponent: () => import('./pages/parametros.page').then((m) => m.ParametrosPage),
      },
    ],
  },
];
