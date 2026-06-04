import { Routes } from '@angular/router';
import { authChildGuard } from './core/auth/auth.guard';
import { LayoutShellComponent } from './layout/layout-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: LayoutShellComponent,
    canActivateChild: [authChildGuard],
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
        path: 'movimientos-variables',
        pathMatch: 'full',
        redirectTo: '/remuneraciones/novedades-mensuales',
      },
      {
        path: 'haberes-descuentos',
        pathMatch: 'full',
        redirectTo: '/remuneraciones/haberes-descuentos',
      },
      {
        path: 'proceso-remuneraciones',
        pathMatch: 'full',
        redirectTo: '/remuneraciones/proceso-mensual',
      },
      {
        path: 'liquidaciones/:id',
        pathMatch: 'full',
        redirectTo: '/remuneraciones/liquidaciones/:id',
      },
      {
        path: 'liquidaciones',
        pathMatch: 'full',
        redirectTo: '/remuneraciones/liquidaciones',
      },
      {
        path: 'remuneraciones',
        loadComponent: () =>
          import('./layout/remuneraciones-outlet.component').then((m) => m.RemuneracionesOutletComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'proceso-mensual',
          },
          {
            path: 'conceptos',
            loadComponent: () =>
              import('./pages/conceptos-remuneracion.page').then((m) => m.ConceptosRemuneracionPage),
          },
          {
            path: 'haberes-descuentos',
            loadComponent: () =>
              import('./pages/haberes-descuentos.page').then((m) => m.HaberesDescuentosPage),
          },
          {
            path: 'movimientos',
            pathMatch: 'full',
            redirectTo: 'novedades-mensuales',
          },
          {
            path: 'movimientos-variables',
            pathMatch: 'full',
            redirectTo: 'novedades-mensuales',
          },
          {
            path: 'novedades-mensuales',
            loadComponent: () =>
              import('./pages/novedades-mensuales.page').then((m) => m.NovedadesMensualesPage),
          },
          {
            path: 'proceso-mensual',
            loadComponent: () =>
              import('./pages/proceso-remuneraciones.page').then((m) => m.ProcesoRemuneracionesPage),
          },
          {
            path: 'nomina-mensual-v2',
            loadComponent: () =>
              import('./pages/nomina-mensual-v2.page').then((m) => m.NominaMensualV2Page),
          },
          {
            path: 'nominas',
            loadComponent: () =>
              import('./pages/administrador-nominas.page').then((m) => m.AdministradorNominasPage),
          },
          {
            path: 'msgbox-lab',
            loadComponent: () =>
              import('./pages/nomina-msgbox-lab.page').then((m) => m.NominaMsgboxLabPage),
          },
          {
            path: 'liquidaciones',
            loadComponent: () => import('./pages/liquidaciones.page').then((m) => m.LiquidacionesPage),
          },
          {
            path: 'liquidaciones-oficiales',
            pathMatch: 'full',
            redirectTo: 'liquidaciones',
          },
          {
            path: 'liquidaciones/:id',
            loadComponent: () =>
              import('./pages/detalle-liquidacion.page').then((m) => m.DetalleLiquidacionPage),
          },
        ],
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
        path: 'preguntor',
        loadComponent: () => import('./pages/preguntor.page').then((m) => m.PreguntorPage),
      },
      {
        path: 'parametros',
        loadComponent: () => import('./pages/parametros.page').then((m) => m.ParametrosPage),
      },
      {
        path: 'empresas',
        loadChildren: () => import('./features/empresas/empresas.routes').then((m) => m.empresasRoutes),
      },
    ],
  },
];
