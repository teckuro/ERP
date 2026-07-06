export type ShellNavItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  badgeKey?: 'periodoMes' | 'movimientosPendientes';
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
      { path: '/empleados', label: 'Empleados', icon: 'users' },
      {
        path: '/remuneraciones/nominas',
        label: 'Administrador de nóminas',
        icon: 'clipboard-list',
      },
      { path: '/remuneraciones/liquidaciones', label: 'Liquidaciones', icon: 'file-check-2' },
      { path: '/remuneraciones/previred', label: 'Previred', icon: 'upload' },
      { path: '/parametros', label: 'Parámetros', icon: 'settings' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { path: '/remuneraciones/novedades-mensuales', label: 'Movimientos', icon: 'calendar-plus' },
      { path: '/remuneraciones/haberes-descuentos', label: 'Recurrentes', icon: 'repeat' },
      { path: '/remuneraciones/conceptos', label: 'Conceptos', icon: 'tags', exact: true },
      {
        path: '/remuneraciones/plantillas-ciclos',
        label: 'Plantillas de ciclos',
        icon: 'calendar-days',
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      { path: '/licencias-medicas', label: 'Licencias médicas', icon: 'heart-pulse' },
      { path: '/empresas', label: 'Empresas', icon: 'building-2' },
      { path: '/reportes', label: 'Reportes', icon: 'bar-chart-3' },
      { path: '/preguntor', label: 'Preguntor', icon: 'message-circle' },
    ],
  },
];

export const SHELL_NAV_FOOTER_CONFIG = {
  configuracionPath: '/parametros' as string | null,
  configuracionLabel: 'Configuración',
};
