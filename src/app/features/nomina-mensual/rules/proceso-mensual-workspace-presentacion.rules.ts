import type {
  NominaVisualFrame,
  NominaWorkspaceTab,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { AlertasPeriodoResumenVm } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type {
  DetalleRevisionTabMeta,
  DetalleRevisionTabSeveridad,
} from './proceso-mensual-detalle-modal.rules';
import {
  buildTabMetaFromIncidenciaList,
  claseDetalleRevisionTab,
} from './proceso-mensual-detalle-modal.rules';
import type {
  IncidenciaPeriodoAmbito,
  IncidenciasPeriodoView,
} from './proceso-mensual-incidencias-periodo.rules';

export type FocusPresentacionVariant = 'neutral' | 'active' | 'info' | 'review' | 'success';

export type FocusPresentacionLayout = 'hero' | 'compact' | 'banner';

export interface FocusPresentacionVm {
  variant: FocusPresentacionVariant;
  icon: string;
  layout: FocusPresentacionLayout;
  showAreas: boolean;
  hintInline: boolean;
}

export function resolveFocusPresentacion(frame: NominaVisualFrame): FocusPresentacionVm {
  switch (frame) {
    case 'sin_generar':
      return {
        variant: 'neutral',
        icon: 'file-spreadsheet',
        layout: 'hero',
        showAreas: true,
        hintInline: false,
      };
    case 'generando':
      return {
        variant: 'active',
        icon: 'refresh-cw',
        layout: 'banner',
        showAreas: false,
        hintInline: true,
      };
    case 'en_revision':
      return {
        variant: 'info',
        icon: 'file-check-2',
        layout: 'compact',
        showAreas: false,
        hintInline: true,
      };
    case 'con_pendientes':
      return {
        variant: 'review',
        icon: 'circle-alert',
        layout: 'compact',
        showAreas: false,
        hintInline: true,
      };
    case 'lista_para_confirmar':
      return {
        variant: 'success',
        icon: 'check-circle',
        layout: 'compact',
        showAreas: false,
        hintInline: true,
      };
    case 'confirmada':
      return {
        variant: 'success',
        icon: 'lock',
        layout: 'compact',
        showAreas: false,
        hintInline: true,
      };
    case 'liquidaciones_generadas':
      return {
        variant: 'success',
        icon: 'receipt',
        layout: 'compact',
        showAreas: false,
        hintInline: true,
      };
    default:
      return {
        variant: 'neutral',
        icon: 'file-spreadsheet',
        layout: 'hero',
        showAreas: true,
        hintInline: false,
      };
  }
}

export interface NominaWorkspaceTabMeta {
  id: NominaWorkspaceTab;
  label: string;
  severidad: DetalleRevisionTabSeveridad;
  indicador: string | null;
}

export interface NominaExceptionStripVm {
  visible: boolean;
  criticas: number;
  advertencias: number;
}

export function buildNominaExceptionStrip(alertas: AlertasPeriodoResumenVm): NominaExceptionStripVm {
  return {
    visible: alertas.modo === 'alertas' && alertas.mostrarDetalle,
    criticas: alertas.criticas,
    advertencias: alertas.advertencias,
  };
}

/** Alias del patrón operativo compartido con el modal de revisión. */
export function claseNominaWorkspaceTab(severidad: DetalleRevisionTabSeveridad, activo: boolean): string {
  return claseDetalleRevisionTab(severidad, activo);
}

function metaDesdeDetalleTab(
  detalleTabs: DetalleRevisionTabMeta[],
  detalleId: DetalleRevisionTabMeta['id'],
): Pick<NominaWorkspaceTabMeta, 'severidad' | 'indicador'> {
  const found = detalleTabs.find((tab) => tab.id === detalleId);
  return {
    severidad: found?.severidad ?? 'neutral',
    indicador: found?.indicador ?? null,
  };
}

function metaDesdeAmbito(
  incidencias: IncidenciasPeriodoView,
  ambito: IncidenciaPeriodoAmbito,
  tieneActividadPeriodo: boolean,
): Pick<NominaWorkspaceTabMeta, 'severidad' | 'indicador'> {
  const items = incidencias.porAmbito[ambito] ?? [];
  return buildTabMetaFromIncidenciaList(items, {
    tieneDatos: items.length > 0,
    tieneActividadPeriodo,
  });
}

export function buildNominaWorkspaceTabsMeta(input: {
  tabs: ReadonlyArray<{ id: NominaWorkspaceTab; label: string }>;
  detalleTabs: DetalleRevisionTabMeta[];
  incidencias: IncidenciasPeriodoView;
  tieneActividadPeriodo: boolean;
  liquidacionesGeneradas: boolean;
  nominaCerrada: boolean;
}): NominaWorkspaceTabMeta[] {
  return input.tabs.map((tab) => {
    const base = { id: tab.id, label: tab.label };

    switch (tab.id) {
      case 'resumen':
        return { ...base, ...metaDesdeDetalleTab(input.detalleTabs, 'resumen') };
      case 'trabajadores':
        return { ...base, ...metaDesdeDetalleTab(input.detalleTabs, 'trabajadores') };
      case 'parametros':
        return { ...base, ...metaDesdeDetalleTab(input.detalleTabs, 'parametros') };
      case 'movimientos':
        return {
          ...base,
          ...metaDesdeAmbito(input.incidencias, 'movimientos', input.tieneActividadPeriodo),
        };
      case 'recurrentes':
        return {
          ...base,
          ...metaDesdeAmbito(input.incidencias, 'recurrentes', input.tieneActividadPeriodo),
        };
      case 'liquidaciones':
        if (input.liquidacionesGeneradas) {
          return { ...base, severidad: 'listo', indicador: 'Generadas' };
        }
        if (input.nominaCerrada) {
          return { ...base, severidad: 'atencion', indicador: 'Pendiente' };
        }
        return { ...base, severidad: 'neutral', indicador: null };
      case 'historial':
        return { ...base, ...metaDesdeDetalleTab(input.detalleTabs, 'resultado') };
      default:
        return { ...base, severidad: 'neutral', indicador: null };
    }
  });
}

export function resolveFranjaItemTono(valor: string): 'neutral' | 'review' | 'ok' {
  const v = valor.trim().toLowerCase();
  if (v === 'sin evaluar') {
    return 'neutral';
  }
  if (v.includes('por revisar')) {
    return 'review';
  }
  if (v.includes('pendiente') && !v.startsWith('0 aprobados')) {
    return 'review';
  }
  if (v.includes('revisados') || v.includes('incluido') || v.includes('vigente')) {
    return 'ok';
  }
  return 'neutral';
}
