import type {
  DetalleOperativoTab,
  NominaDetalleMensualVista,
  NominaVisualFrame,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { NominaMasivaFiltro } from './proceso-mensual-masivo-layout.rules';
import type { ProcesoMensualAccionLocal } from './proceso-mensual-estado-operativo.rules';

export interface NominaWorkspaceFlowTarget {
  tabVisible: NominaWorkspaceTabVisible;
  detalleVista: NominaDetalleMensualVista;
  legacyTab: NominaWorkspaceTab;
  filtroMasivo?: NominaMasivaFiltro;
}

export interface NominaEstadoRrhhVm {
  etiqueta: string;
  descripcion: string;
}

const DETALLE_TABS_EN_MODAL: ReadonlySet<DetalleOperativoTab> = new Set([
  'resumen',
  'resultado',
]);

export function detalleTabUsaModal(tab: DetalleOperativoTab): boolean {
  return DETALLE_TABS_EN_MODAL.has(tab);
}

export function resolveWorkspaceTargetFromDetalleTab(
  tab: DetalleOperativoTab,
): NominaWorkspaceFlowTarget | null {
  if (detalleTabUsaModal(tab)) {
    return null;
  }

  switch (tab) {
    case 'trabajadores':
      return {
        tabVisible: 'detalle_mensual',
        detalleVista: 'trabajadores',
        legacyTab: 'trabajadores',
      };
    case 'movimientos_recurrentes':
      return {
        tabVisible: 'detalle_mensual',
        detalleVista: 'trabajadores',
        legacyTab: 'movimientos',
        filtroMasivo: 'con_movimientos',
      };
    case 'parametros':
      return {
        tabVisible: 'detalle_mensual',
        detalleVista: 'pendientes',
        legacyTab: 'parametros',
      };
    default:
      return null;
  }
}

export function resolveWorkspaceTargetFromAccionLocal(
  accion: ProcesoMensualAccionLocal,
): NominaWorkspaceFlowTarget | null {
  if (accion === 'revisarBloqueos') {
    return {
      tabVisible: 'detalle_mensual',
      detalleVista: 'trabajadores',
      legacyTab: 'trabajadores',
    };
  }
  return null;
}

export function resolveNominaEstadoRrhh(frame: NominaVisualFrame): NominaEstadoRrhhVm {
  switch (frame) {
    case 'generando':
      return {
        etiqueta: 'Generando',
        descripcion: 'Se está armando el borrador del período.',
      };
    case 'en_revision':
      return {
        etiqueta: 'Borrador generado',
        descripcion: 'Revise trabajadores, movimientos y recurrentes antes de confirmar.',
      };
    case 'con_pendientes':
      return {
        etiqueta: 'En revisión',
        descripcion: 'Hay bloqueos o datos obligatorios por resolver.',
      };
    case 'lista_para_confirmar':
      return {
        etiqueta: 'Lista para confirmar',
        descripcion: 'Puede confirmar esta versión como base oficial del período.',
      };
    case 'confirmada':
      return {
        etiqueta: 'Confirmada',
        descripcion: 'Versión oficial bloqueada para liquidaciones.',
      };
    case 'liquidaciones_generadas':
      return {
        etiqueta: 'Liquidaciones generadas',
        descripcion: 'Liquidaciones emitidas desde la nómina confirmada.',
      };
    case 'sin_generar':
    default:
      return {
        etiqueta: 'Sin generar',
        descripcion: 'Verifique el período y genere la nómina mensual.',
      };
  }
}

export const NOMINA_FLOW_RETURN_PATH = '/remuneraciones/proceso-mensual';

export function buildNominaFlowReturnQuery(periodoYm: string): Record<string, string> {
  return {
    returnTo: NOMINA_FLOW_RETURN_PATH,
    periodo: periodoYm,
  };
}

export function appendNominaFlowQuery(ruta: string, periodoYm: string): string {
  const base = ruta.split('?')[0] ?? ruta;
  const params = new URLSearchParams(buildNominaFlowQueryParams(periodoYm));
  return `${base}?${params.toString()}`;
}

export function buildNominaFlowQueryParams(periodoYm: string): Record<string, string> {
  return buildNominaFlowReturnQuery(periodoYm);
}

export function periodoYmDesdeFlowQuery(
  params: Record<string, string | undefined> | null | undefined,
): string | null {
  const raw = params?.['periodo']?.trim();
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
    return null;
  }
  return raw;
}
