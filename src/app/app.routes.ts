import { Routes } from '@angular/router';
import { adminSistemaGuard } from './core/auth/admin-sistema.guard';
import { authChildGuard } from './core/auth/auth.guard';
import {
  crearModuloPermisoGuard,
} from './core/auth/remuneraciones-permisos.guard';
import { LayoutShellComponent } from './layout/layout-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./pages/recuperar-contrasena.page').then((m) => m.RecuperarContrasenaPage),
  },
  {
    path: 'actualizar-contrasena',
    loadComponent: () =>
      import('./pages/actualizar-contrasena.page').then((m) => m.ActualizarContrasenaPage),
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
        canActivate: [crearModuloPermisoGuard('empleados')],
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
        redirectTo: '/remuneraciones/nominas',
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
            redirectTo: 'nominas',
          },
          {
            path: 'conceptos',
            canActivate: [crearModuloPermisoGuard('conceptos')],
            loadComponent: () =>
              import('./pages/conceptos-remuneracion.page').then((m) => m.ConceptosRemuneracionPage),
          },
          {
            path: 'haberes-descuentos',
            canActivate: [crearModuloPermisoGuard('movimientos')],
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
            canActivate: [crearModuloPermisoGuard('movimientos')],
            loadComponent: () =>
              import('./pages/novedades-mensuales.page').then((m) => m.NovedadesMensualesPage),
          },
          {
            path: 'proceso-mensual',
            pathMatch: 'full',
            redirectTo: 'nominas',
          },
          {
            path: 'nomina-mensual-v2',
            pathMatch: 'full',
            redirectTo: 'nominas',
          },
          {
            path: 'nominas',
            pathMatch: 'full',
            canActivate: [crearModuloPermisoGuard('nominas')],
            loadComponent: () =>
              import(
                './features/nomina-mensual/containers/administrador-nominas-container/administrador-nominas-container'
              ).then((m) => m.AdministradorNominasContainer),
          },
          {
            path: 'nominas/:nominaPeriodoId/generador',
            pathMatch: 'full',
            redirectTo: '/remuneraciones/nominas/:nominaPeriodoId',
          },
          {
            path: 'nominas/:nominaPeriodoId',
            // Solo consulta puede recorrer la nómina; las acciones se ocultan en la UI
            // y los servicios/RLS rechazan escrituras (SEC-08).
            canActivate: [crearModuloPermisoGuard('nominas')],
            loadComponent: () =>
              import(
                './features/nomina-mensual-v2/containers/nomina-mensual-v2-container/nomina-mensual-v2-container'
              ).then((m) => m.NominaMensualV2Container),
          },
          {
            path: 'plantillas-ciclos',
            pathMatch: 'full',
            redirectTo: 'nominas',
          },
          {
            path: 'liquidaciones',
            canActivate: [crearModuloPermisoGuard('liquidaciones')],
            loadComponent: () => import('./pages/liquidaciones.page').then((m) => m.LiquidacionesPage),
          },
          {
            path: 'previred',
            canActivate: [crearModuloPermisoGuard('liquidaciones')],
            loadComponent: () => import('./pages/previred.page').then((m) => m.PreviredPage),
          },
          {
            path: 'lre',
            canActivate: [crearModuloPermisoGuard('liquidaciones')],
            loadComponent: () => import('./pages/lre.page').then((m) => m.LrePage),
          },
          {
            path: 'liquidaciones-oficiales',
            pathMatch: 'full',
            redirectTo: 'liquidaciones',
          },
          {
            path: 'liquidaciones/:id',
            canActivate: [crearModuloPermisoGuard('liquidaciones')],
            loadComponent: () =>
              import('./pages/detalle-liquidacion.page').then((m) => m.DetalleLiquidacionPage),
          },
        ],
      },
      {
        path: 'licencias-medicas',
        canActivate: [crearModuloPermisoGuard('licencias')],
        loadComponent: () => import('./pages/licencias-medicas.page').then((m) => m.LicenciasMedicasPage),
      },
      {
        path: 'reportes',
        canActivate: [crearModuloPermisoGuard('reportes')],
        loadComponent: () => import('./pages/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'preguntor',
        loadComponent: () => import('./pages/preguntor.page').then((m) => m.PreguntorPage),
      },
      {
        path: 'parametros',
        canActivate: [crearModuloPermisoGuard('parametros')],
        loadComponent: () => import('./pages/parametros.page').then((m) => m.ParametrosPage),
      },
      {
        path: 'administracion',
        canActivate: [adminSistemaGuard],
        loadComponent: () => import('./pages/administracion.page').then((m) => m.AdministracionPage),
      },
      {
        path: 'empresas',
        canActivate: [crearModuloPermisoGuard('empresas')],
        loadChildren: () => import('./features/empresas/empresas.routes').then((m) => m.empresasRoutes),
      },
    ],
  },
];
