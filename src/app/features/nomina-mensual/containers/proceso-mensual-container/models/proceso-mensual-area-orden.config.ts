import type {
  NominaResumenSuperiorVm,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
} from './proceso-mensual-container.vm';

/** Áreas de la franja lateral (requisitos del período). */
export type NominaAreaOperativa = 'parametros' | 'trabajadores' | 'movimientos' | 'liquidaciones';

export const NOMINA_FRANJA_AREAS: ReadonlyArray<{
  id: NominaAreaOperativa;
  label: string;
  detalleVista: 'trabajadores' | 'movimientos' | 'liquidaciones' | null;
  icon: 'sliders' | 'users' | 'list-checks' | 'receipt';
  ariaLabel: string;
  focusAreaLabel: string;
}> = [
  {
    id: 'parametros',
    label: 'Parámetros',
    detalleVista: null,
    icon: 'sliders',
    ariaLabel: 'Revisar parámetros del período',
    focusAreaLabel: 'Parámetros legales',
  },
  {
    id: 'trabajadores',
    label: 'Trabajadores',
    detalleVista: 'trabajadores',
    icon: 'users',
    ariaLabel: 'Ver trabajadores del período',
    focusAreaLabel: 'Trabajadores del período',
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    detalleVista: 'trabajadores',
    icon: 'list-checks',
    ariaLabel: 'Ver trabajadores con movimientos',
    focusAreaLabel: 'Movimientos y recurrentes',
  },
  {
    id: 'liquidaciones',
    label: 'Liquidaciones',
    detalleVista: 'liquidaciones',
    icon: 'receipt',
    ariaLabel: 'Ver liquidaciones del período',
    focusAreaLabel: 'Liquidaciones',
  },
] as const;

/** Compatibilidad: áreas del focus hero (sin liquidaciones en lista corta). */
export const NOMINA_AREA_ORDEN = NOMINA_FRANJA_AREAS.filter((area) => area.id !== 'liquidaciones');

/** Tabs legacy del workspace (modal, tests, alias). */
export const NOMINA_AREA_ORDEN_LEGACY: ReadonlyArray<{
  id: 'parametros' | 'trabajadores' | 'movimientos' | 'recurrentes';
  label: string;
  workspaceTab: NominaWorkspaceTab;
}> = [
  { id: 'parametros', label: 'Parámetros', workspaceTab: 'parametros' },
  { id: 'trabajadores', label: 'Trabajadores', workspaceTab: 'trabajadores' },
  { id: 'movimientos', label: 'Movimientos', workspaceTab: 'movimientos' },
  { id: 'recurrentes', label: 'Recurrentes', workspaceTab: 'recurrentes' },
];

export const NOMINA_WORKSPACE_TAIL_TABS: ReadonlyArray<{ id: NominaWorkspaceTab; label: string }> = [
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'historial', label: 'Historial' },
];

export function buildNominaWorkspaceTabs(): ReadonlyArray<{ id: NominaWorkspaceTab; label: string }> {
  return [
    ...NOMINA_AREA_ORDEN_LEGACY.map((area) => ({ id: area.workspaceTab, label: area.label })),
    ...NOMINA_WORKSPACE_TAIL_TABS,
  ];
}

export function buildNominaWorkspaceTabsVisible(): ReadonlyArray<{
  id: NominaWorkspaceTabVisible;
  label: string;
}> {
  return [
    { id: 'detalle_mensual', label: 'Detalle mensual' },
    { id: 'historial', label: 'Historial' },
  ];
}

export function valorFranjaMovimientos(resumen: NominaResumenSuperiorVm): string {
  if (resumen.movimientos.toLowerCase().includes('sin evaluar')) {
    return resumen.movimientos;
  }
  if (resumen.recurrentes.toLowerCase().includes('sin evaluar')) {
    return resumen.movimientos;
  }
  return `${resumen.movimientos} · ${resumen.recurrentes}`;
}

export function valorFranjaLiquidaciones(input: {
  liquidacionesGeneradas: number;
  nominaCerrada: boolean;
}): string {
  if (input.liquidacionesGeneradas > 0) {
    return `${input.liquidacionesGeneradas} generada${input.liquidacionesGeneradas === 1 ? '' : 's'}`;
  }
  if (input.nominaCerrada) {
    return 'Pendiente de generar';
  }
  return 'Confirmar nómina';
}

export function valorFranjaArea(
  area: NominaAreaOperativa,
  resumen: NominaResumenSuperiorVm,
  liquidaciones?: { liquidacionesGeneradas: number; nominaCerrada: boolean },
): string {
  switch (area) {
    case 'parametros':
      return resumen.parametros;
    case 'trabajadores':
      return resumen.trabajadores;
    case 'movimientos':
      return valorFranjaMovimientos(resumen);
    case 'liquidaciones':
      return liquidaciones
        ? valorFranjaLiquidaciones(liquidaciones)
        : 'Sin evaluar';
    default:
      return '';
  }
}
