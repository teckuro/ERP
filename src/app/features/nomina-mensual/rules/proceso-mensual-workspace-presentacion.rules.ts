import type {
  BitacoraRailEtapaVm,
  DetalleOperativoTab,
  NominaWorkspaceDetailItemVm,
  NominaWorkspaceDetailSeverity,
  NominaResumenSuperiorVm,
  NominaWorkspaceTabSummaryVm,
  NominaVisualFrame,
  NominaWorkspaceTab,
  ValidacionAccionLocal,
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

function detalleTabDesdeWorkspace(tab: NominaWorkspaceTab): DetalleOperativoTab | null {
  switch (tab) {
    case 'trabajadores':
      return 'trabajadores';
    case 'parametros':
      return 'parametros';
    case 'movimientos':
    case 'recurrentes':
      return 'movimientos_recurrentes';
    case 'historial':
      return 'resultado';
    default:
      return null;
  }
}

export function buildNominaWorkspaceTabSummaries(input: {
  tabsMeta: NominaWorkspaceTabMeta[];
  resumenSuperior: NominaResumenSuperiorVm;
  trabajadoresAptos: number | null;
  trabajadoresPorRevisar: number | null;
  movimientosAprobados: number;
  movimientosPendientes: number;
  asignacionesAplicables: number | null;
  asignacionesPorRevisar: number | null;
  liquidacionesGeneradas: number;
  nominaCerrada: boolean;
  resultadoPreliminar: string;
  totalLiquidoLabel: string;
}): NominaWorkspaceTabSummaryVm[] {
  return input.tabsMeta.map((tab) => {
    const base = {
      id: tab.id,
      label: tab.label,
      severidad: tab.severidad,
      indicador: tab.indicador,
      detalleTab: detalleTabDesdeWorkspace(tab.id),
    };

    switch (tab.id) {
      case 'trabajadores':
        return {
          ...base,
          titulo: 'Trabajadores del periodo',
          descripcion: 'Estado de las personas consideradas para la nomina mensual.',
          metricas: [
            { label: 'Incluidos', value: input.trabajadoresAptos ?? 'Sin evaluar' },
            { label: 'Por revisar', value: input.trabajadoresPorRevisar ?? 0 },
            { label: 'Resumen', value: input.resumenSuperior.trabajadores },
          ],
          ctaLabel: null,
        };
      case 'parametros':
        return {
          ...base,
          titulo: 'Parametros del periodo',
          descripcion: 'Parametros legales y operativos requeridos antes de calcular.',
          metricas: [
            { label: 'Estado', value: input.resumenSuperior.parametros },
            { label: 'Bloqueos', value: input.resumenSuperior.bloqueos },
            { label: 'Cambios', value: input.resumenSuperior.cambios },
          ],
          ctaLabel: null,
        };
      case 'movimientos':
        return {
          ...base,
          titulo: 'Movimientos del mes',
          descripcion: 'Bonos, descuentos y hechos puntuales que entran al calculo.',
          metricas: [
            { label: 'Aprobados', value: input.movimientosAprobados },
            { label: 'Pendientes', value: input.movimientosPendientes },
            { label: 'Resumen', value: input.resumenSuperior.movimientos },
          ],
          ctaLabel: null,
        };
      case 'recurrentes':
        return {
          ...base,
          titulo: 'Recurrentes vigentes',
          descripcion: 'Asignaciones permanentes aplicables al periodo activo.',
          metricas: [
            { label: 'Vigentes', value: input.asignacionesAplicables ?? 'Sin evaluar' },
            { label: 'Por revisar', value: input.asignacionesPorRevisar ?? 0 },
            { label: 'Resumen', value: input.resumenSuperior.recurrentes },
          ],
          ctaLabel: null,
        };
      case 'liquidaciones':
        return {
          ...base,
          titulo: 'Liquidaciones',
          descripcion: input.liquidacionesGeneradas > 0
            ? 'Liquidaciones emitidas desde la version oficial del periodo.'
            : input.nominaCerrada
              ? 'Nomina confirmada; queda pendiente generar liquidaciones.'
              : 'Disponible despues de confirmar la nomina mensual.',
          metricas: [
            { label: 'Estado', value: input.liquidacionesGeneradas > 0 ? 'Generadas' : 'Pendiente' },
            { label: 'Generadas', value: input.liquidacionesGeneradas },
          ],
          ctaLabel: null,
        };
      case 'historial':
        return {
          ...base,
          titulo: 'Historial y version',
          descripcion: 'Trazabilidad de la version generada, revisada y confirmada.',
          metricas: [
            { label: 'Resultado', value: input.resultadoPreliminar },
            { label: 'Liquido', value: input.totalLiquidoLabel },
          ],
          ctaLabel: null,
        };
      case 'resumen':
      default:
        return {
          ...base,
          titulo: 'Resumen operativo',
          descripcion: 'Estado general del periodo.',
          metricas: [
            { label: 'Bloqueos', value: input.resumenSuperior.bloqueos },
            { label: 'Cambios', value: input.resumenSuperior.cambios },
          ],
          ctaLabel: null,
        };
    }
  });
}

export interface NominaWorkspaceDetailSourceItem {
  id?: string;
  titulo: string;
  descripcion: string;
  estado?: string;
  estadoClase?: string;
  contexto?: string;
  accion?: string;
  ruta?: string;
  detalleTab?: DetalleOperativoTab;
  accionLocal?: ValidacionAccionLocal;
}

function severityDesdeEstado(estado: string, estadoClase: string): NominaWorkspaceDetailSeverity {
  const text = `${estado} ${estadoClase}`.toLowerCase();
  if (text.includes('danger') || text.includes('bloque') || text.includes('omitido')) return 'bloqueo';
  if (text.includes('warning') || text.includes('revis') || text.includes('pendiente') || text.includes('observ')) {
    return 'atencion';
  }
  if (text.includes('success') || text.includes('listo') || text.includes('calculado') || text.includes('generada')) {
    return 'listo';
  }
  return 'neutral';
}

function iconoDetallePorTab(tab: NominaWorkspaceTab, severity: NominaWorkspaceDetailSeverity, item: NominaWorkspaceDetailSourceItem): string {
  if (severity === 'bloqueo') return tab === 'trabajadores' ? 'user-x' : 'circle-alert';
  if (severity === 'atencion') return 'circle-alert';
  switch (tab) {
    case 'trabajadores':
      return 'user-check';
    case 'parametros':
      return item.contexto?.toLowerCase().includes('periodo') ? 'calendar' : 'shield-check';
    case 'movimientos':
      return item.descripcion.toLowerCase().includes('descuento') ? 'arrow-down-up' : 'badge-dollar-sign';
    case 'recurrentes':
      return item.descripcion.toLowerCase().includes('vigente') ? 'calendar-check' : 'repeat';
    case 'liquidaciones':
      return severity === 'listo' ? 'file-check' : 'receipt';
    case 'historial':
      return item.estado?.toLowerCase().includes('confirm') || item.titulo.toLowerCase().includes('oficial')
        ? 'lock'
        : item.titulo.toLowerCase().includes('version')
          ? 'file-clock'
          : 'history';
    default:
      return 'list-checks';
  }
}

function claseEstadoDetalle(severity: NominaWorkspaceDetailSeverity, estadoClase?: string): string {
  if (estadoClase) return estadoClase;
  switch (severity) {
    case 'bloqueo':
      return 'payroll-state-chip payroll-state-chip--danger';
    case 'atencion':
      return 'payroll-state-chip payroll-state-chip--warning';
    case 'listo':
      return 'payroll-state-chip payroll-state-chip--success';
    case 'neutral':
    default:
      return 'payroll-state-chip payroll-state-chip--info';
  }
}

function ordenSeverity(severity: NominaWorkspaceDetailSeverity): number {
  switch (severity) {
    case 'bloqueo':
      return 0;
    case 'atencion':
      return 1;
    case 'neutral':
      return 2;
    case 'listo':
    default:
      return 3;
  }
}

export function buildNominaWorkspaceDetailItems(input: {
  tab: NominaWorkspaceTab;
  items: NominaWorkspaceDetailSourceItem[];
}): NominaWorkspaceDetailItemVm[] {
  return input.items
    .map((item, index) => {
      const estado = item.estado || 'Informacion';
      const severity = severityDesdeEstado(estado, item.estadoClase ?? '');
      return {
        id: item.id ?? `${input.tab}-${index}-${item.titulo}`,
        icon: iconoDetallePorTab(input.tab, severity, item),
        titulo: item.titulo,
        descripcion: item.descripcion,
        estado,
        estadoClase: claseEstadoDetalle(severity, item.estadoClase),
        contexto: item.contexto,
        accion: item.accion,
        ruta: item.ruta,
        detalleTab: item.detalleTab,
        accionLocal: item.accionLocal,
        severity,
      };
    })
    .sort((a, b) => ordenSeverity(a.severity) - ordenSeverity(b.severity) || a.titulo.localeCompare(b.titulo));
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
