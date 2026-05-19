import type { NominaResumenSuperiorVm, NominaWorkspaceTab } from './proceso-mensual-container.vm';

/** Áreas operativas del período (orden único: franja KPI, tabs workspace, checklist focus). */
export type NominaAreaOperativa = 'parametros' | 'trabajadores' | 'movimientos' | 'recurrentes';

export const NOMINA_AREA_ORDEN: ReadonlyArray<{
  id: NominaAreaOperativa;
  label: string;
  workspaceTab: NominaWorkspaceTab;
  icon: 'sliders' | 'users' | 'list-checks' | 'repeat';
  ariaLabel: string;
  focusAreaLabel: string;
}> = [
  {
    id: 'parametros',
    label: 'Parámetros',
    workspaceTab: 'parametros',
    icon: 'sliders',
    ariaLabel: 'Ver parámetros del período',
    focusAreaLabel: 'Parámetros legales',
  },
  {
    id: 'trabajadores',
    label: 'Trabajadores',
    workspaceTab: 'trabajadores',
    icon: 'users',
    ariaLabel: 'Ver trabajadores considerados',
    focusAreaLabel: 'Trabajadores del período',
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    workspaceTab: 'movimientos',
    icon: 'list-checks',
    ariaLabel: 'Ver movimientos del período',
    focusAreaLabel: 'Movimientos del mes',
  },
  {
    id: 'recurrentes',
    label: 'Recurrentes',
    workspaceTab: 'recurrentes',
    icon: 'repeat',
    ariaLabel: 'Ver recurrentes del período',
    focusAreaLabel: 'Recurrentes vigentes',
  },
] as const;

export const NOMINA_WORKSPACE_TAIL_TABS: ReadonlyArray<{ id: NominaWorkspaceTab; label: string }> = [
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'historial', label: 'Historial' },
];

export function buildNominaWorkspaceTabs(): ReadonlyArray<{ id: NominaWorkspaceTab; label: string }> {
  return [
    ...NOMINA_AREA_ORDEN.map((area) => ({ id: area.workspaceTab, label: area.label })),
    ...NOMINA_WORKSPACE_TAIL_TABS,
  ];
}

export function valorFranjaArea(
  area: NominaAreaOperativa,
  resumen: NominaResumenSuperiorVm,
): string {
  switch (area) {
    case 'parametros':
      return resumen.parametros;
    case 'trabajadores':
      return resumen.trabajadores;
    case 'movimientos':
      return resumen.movimientos;
    case 'recurrentes':
      return resumen.recurrentes;
    default:
      return '';
  }
}
