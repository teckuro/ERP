import type { ModuloPermiso } from '../core/auth/erp-permisos-modulos.rules';

export type ShellNavItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  badgeKey?: 'periodoMes' | 'movimientosPendientes';
  /** Si se define, el ítem solo se muestra cuando el perfil permite `ver` (ADMIN-01 / SEC-04). */
  modulo?: ModuloPermiso;
};

export type ShellNavSection = {
  label: string;
  items: ShellNavItem[];
};

/** Ancho fijo del sidebar; el header y el main usan el mismo valor para alinear. */
export const SHELL_NAV_WIDTH_PX = 220;

/** Altura de la franja superior (marca sidebar + header). */
export const SHELL_HEADER_HEIGHT_PX = 52;

/** Padding horizontal compartido en marca sidebar y barra del header. */
export const SHELL_STRIP_PADDING_X_PX = 16;

export const SHELL_NAV_SECTIONS: ShellNavSection[] = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Resumen', icon: 'layout-dashboard', exact: true },
      { path: '/empleados', label: 'Empleados', icon: 'users', modulo: 'empleados' },
      {
        path: '/remuneraciones/nominas',
        label: 'Administrador de nóminas',
        icon: 'clipboard-list',
        modulo: 'nominas',
      },
      {
        path: '/remuneraciones/liquidaciones',
        label: 'Liquidaciones',
        icon: 'file-check-2',
        modulo: 'liquidaciones',
      },
      { path: '/remuneraciones/lre', label: 'Libro remuneraciones', icon: 'file-text', modulo: 'liquidaciones' },
      { path: '/parametros', label: 'Parámetros', icon: 'settings', modulo: 'parametros' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        path: '/remuneraciones/novedades-mensuales',
        label: 'Movimientos',
        icon: 'calendar-plus',
        modulo: 'movimientos',
      },
      { path: '/remuneraciones/conceptos', label: 'Conceptos', icon: 'tags', exact: true, modulo: 'conceptos' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { path: '/licencias-medicas', label: 'Licencias médicas', icon: 'heart-pulse', modulo: 'licencias' },
      { path: '/reportes', label: 'Reportes', icon: 'bar-chart-3', modulo: 'reportes' },
    ],
  },
];

/** Enlace del pie del sidebar; visible solo para el administrador del sistema. */
export const SHELL_NAV_FOOTER_CONFIG = {
  configuracionPath: '/administracion' as string | null,
  configuracionLabel: 'Administrador',
  soloAdminSistema: true,
};
