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
        loadChildren: () => import('./features/empleados/empleados.routes').then((m) => m.empleadosRoutes),
      },
      {
        path: 'haberes-descuentos',
        loadComponent: () => import('./pages/haberes-descuentos.page').then((m) => m.HaberesDescuentosPage),
      },
      {
        path: 'remuneraciones',
        loadComponent: () =>
          import('./layout/remuneraciones-outlet.component').then((m) => m.RemuneracionesOutletComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'conceptos',
          },
          {
            path: 'conceptos',
            loadComponent: () =>
              import('./pages/conceptos-remuneracion.page').then((m) => m.ConceptosRemuneracionPage),
          },
        ],
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
