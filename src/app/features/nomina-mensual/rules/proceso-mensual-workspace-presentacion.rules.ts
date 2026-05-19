import type {
  BitacoraRailEtapaVm,
  NominaResumenSuperiorVm,
  NominaVisualFrame,
  NominaWorkspaceTabVisible,
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

type WorkspaceTabMetaSeveridad = Pick<NominaWorkspaceTabVisibleMeta, 'severidad' | 'indicador'>;

export interface NominaWorkspaceTabVisibleMeta {
  id: NominaWorkspaceTabVisible;
  label: string;
  severidad: DetalleRevisionTabSeveridad;
  indicador: string | null;
}

export interface NominaWorkspaceTabVisibleSummaryVm {
  id: NominaWorkspaceTabVisible;
  label: string;
  titulo: string;
  descripcion: string;
  severidad: 'neutral' | 'atencion' | 'bloqueo' | 'listo';
  indicador: string | null;
  metricas: Array<{ label: string; value: string | number }>;
}

function peorSeveridad(
  severidades: DetalleRevisionTabSeveridad[],
): DetalleRevisionTabSeveridad {
  if (severidades.includes('bloqueo')) return 'bloqueo';
  if (severidades.includes('atencion')) return 'atencion';
  if (severidades.every((s) => s === 'listo')) return 'listo';
  return 'neutral';
}

/** Alias del patrón operativo compartido con el modal de revisión. */
export function claseNominaWorkspaceTab(severidad: DetalleRevisionTabSeveridad, activo: boolean): string {
  return claseDetalleRevisionTab(severidad, activo);
}

function metaDesdeDetalleTab(
  detalleTabs: DetalleRevisionTabMeta[],
  detalleId: DetalleRevisionTabMeta['id'],
): WorkspaceTabMetaSeveridad {
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
): WorkspaceTabMetaSeveridad {
  const items = incidencias.porAmbito[ambito] ?? [];
  return buildTabMetaFromIncidenciaList(items, {
    tieneDatos: items.length > 0,
    tieneActividadPeriodo,
  });
}

export function buildNominaWorkspaceTabsVisibleMeta(input: {
  tabs: ReadonlyArray<{ id: NominaWorkspaceTabVisible; label: string }>;
  detalleTabs: DetalleRevisionTabMeta[];
  incidencias: IncidenciasPeriodoView;
  tieneActividadPeriodo: boolean;
  liquidacionesGeneradas: boolean;
  nominaCerrada: boolean;
  bloqueosCount: number;
}): NominaWorkspaceTabVisibleMeta[] {
  const metaParam = metaDesdeDetalleTab(input.detalleTabs, 'parametros');
  const metaTrab = metaDesdeDetalleTab(input.detalleTabs, 'trabajadores');
  const metaMov = metaDesdeAmbito(input.incidencias, 'movimientos', input.tieneActividadPeriodo);
  const metaRec = metaDesdeAmbito(input.incidencias, 'recurrentes', input.tieneActividadPeriodo);
  const metaDetalle = peorSeveridad([
    metaParam.severidad,
    metaTrab.severidad,
    metaMov.severidad,
    metaRec.severidad,
  ]);
  const indicadorDetalle =
    input.bloqueosCount > 0
      ? `${input.bloqueosCount} bloqueo${input.bloqueosCount === 1 ? '' : 's'}`
      : input.incidencias.resumen.advertencias > 0
        ? `${input.incidencias.resumen.advertencias} por revisar`
        : null;

  return input.tabs.map((tab) => {
    if (tab.id === 'detalle_mensual') {
      return {
        id: tab.id,
        label: tab.label,
        severidad: metaDetalle,
        indicador: indicadorDetalle,
      };
    }
    if (input.liquidacionesGeneradas) {
      return { id: tab.id, label: tab.label, severidad: 'listo', indicador: 'Trazabilidad' };
    }
    return {
      id: tab.id,
      label: tab.label,
      ...metaDesdeDetalleTab(input.detalleTabs, 'resultado'),
    };
  });
}

export function buildNominaWorkspaceTabVisibleSummaries(input: {
  resumenSuperior: NominaResumenSuperiorVm;
  bloqueosCount: number;
  pendientesCount: number;
  liquidacionesGeneradas: number;
  nominaCerrada: boolean;
}): NominaWorkspaceTabVisibleSummaryVm[] {
  return [
    {
      id: 'detalle_mensual',
      label: 'Detalle mensual',
      titulo: 'Expediente del período',
      descripcion: 'Trabajadores, movimientos, liquidaciones y pendientes en una sola vista.',
      severidad: input.bloqueosCount > 0 ? 'bloqueo' : input.pendientesCount > 0 ? 'atencion' : 'neutral',
      indicador: null,
      metricas: [
        { label: 'Trabajadores', value: input.resumenSuperior.trabajadores },
        { label: 'Movimientos', value: input.resumenSuperior.movimientos },
        { label: 'Bloqueos', value: input.bloqueosCount },
      ],
    },
    {
      id: 'historial',
      label: 'Historial',
      titulo: 'Trazabilidad del período',
      descripcion: 'Registro de generación, revisión y confirmación.',
      severidad: input.nominaCerrada ? 'listo' : 'neutral',
      indicador: null,
      metricas: [
        { label: 'Liquidaciones', value: input.liquidacionesGeneradas > 0 ? 'Generadas' : 'Pendiente' },
      ],
    },
  ];
}

export function resolveBitacoraRailIcon(marca: BitacoraRailEtapaVm['marca']): string {
  switch (marca) {
    case 'hecho':
      return 'check';
    case 'actual':
      return 'circle-dot';
    case 'bloqueado':
      return 'minus';
    case 'pendiente':
    default:
      return 'circle';
  }
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
