import type { ShellBreadcrumbItem } from './shell-page-context.service';

export type ShellRouteContextEntry = {
  /** Prefijo de URL (sin query); la coincidencia es la entrada más específica. */
  match: string;
  breadcrumbs: ShellBreadcrumbItem[];
};

/** Breadcrumbs por defecto cuando la ruta no registra contexto explícito. */
export const SHELL_ROUTE_CONTEXT_ENTRIES: readonly ShellRouteContextEntry[] = [
  { match: '/', breadcrumbs: [{ label: 'Resumen' }] },
  { match: '/empleados/nuevo', breadcrumbs: [{ label: 'Empleados', path: '/empleados' }, { label: 'Nuevo empleado' }] },
  { match: '/empleados', breadcrumbs: [{ label: 'Empleados' }] },
  {
    match: '/remuneraciones/proceso-mensual',
    breadcrumbs: [
      { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
      { label: 'Nómina mensual' },
    ],
  },
  {
    match: '/remuneraciones/novedades-mensuales',
    breadcrumbs: [
      { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
      { label: 'Movimientos' },
    ],
  },
  {
    match: '/remuneraciones/haberes-descuentos',
    breadcrumbs: [
      { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
      { label: 'Recurrentes' },
    ],
  },
  {
    match: '/remuneraciones/conceptos',
    breadcrumbs: [
      { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
      { label: 'Conceptos' },
    ],
  },
  {
    match: '/remuneraciones/liquidaciones',
    breadcrumbs: [
      { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
      { label: 'Liquidaciones' },
    ],
  },
  {
    match: '/remuneraciones/movimientos-variables',
    breadcrumbs: [
      { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
      { label: 'Movimientos' },
    ],
  },
  { match: '/parametros', breadcrumbs: [{ label: 'Parámetros' }] },
  { match: '/licencias-medicas', breadcrumbs: [{ label: 'Licencias médicas' }] },
  { match: '/reportes', breadcrumbs: [{ label: 'Reportes' }] },
];

export function resolveShellRouteBreadcrumbs(url: string): ShellBreadcrumbItem[] {
  const path = url.split('?')[0]?.split('#')[0] ?? '/';
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  if (normalized.startsWith('/empleados/') && normalized !== '/empleados/nuevo') {
    return [{ label: 'Empleados', path: '/empleados' }, { label: 'Ficha empleado' }];
  }

  const sorted = [...SHELL_ROUTE_CONTEXT_ENTRIES].sort((a, b) => b.match.length - a.match.length);
  for (const entry of sorted) {
    if (entry.match === '/') {
      if (normalized === '/') {
        return [...entry.breadcrumbs];
      }
      continue;
    }
    if (normalized === entry.match || normalized.startsWith(`${entry.match}/`)) {
      return [...entry.breadcrumbs];
    }
  }

  return [];
}
