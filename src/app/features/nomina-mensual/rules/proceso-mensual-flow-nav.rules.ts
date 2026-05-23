import type {
  DetalleOperativoTab,
  NominaDetalleMensualVista,
  NominaVisualFrame,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type { NominaMasivaFiltro } from './proceso-mensual-masivo-layout.rules';
import type {
  ProcesoMensualAccionLocal,
  ProcesoMensualPendienteVm,
} from './proceso-mensual-estado-operativo.rules';
import { suggestNominaWorkspaceNavigation } from './proceso-mensual-workspace.rules';

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
        legacyTab: 'trabajadores',
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

export function resolveFlowDestinoPorFrame(frame: NominaVisualFrame): NominaWorkspaceFlowTarget {
  return suggestNominaWorkspaceNavigation(frame);
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

/** Alias de matriz única frame/acción → destino workspace (NOM-MENSUAL-FLOW-NAV-02). */
export const resolveFlowDestinoPorAccion = resolveWorkspaceTargetFromAccionLocal;

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

export const NOMINA_FLOW_QUERY_ID_PERSONA = 'idPersona';

export function buildNominaFlowQueryParams(
  periodoYm: string,
  idPersona?: number | string | null,
): Record<string, string> {
  const query: Record<string, string> = {
    returnTo: NOMINA_FLOW_RETURN_PATH,
    periodo: periodoYm,
  };
  if (idPersona != null && String(idPersona).trim() !== '') {
    query[NOMINA_FLOW_QUERY_ID_PERSONA] = String(idPersona).trim();
  }
  return query;
}

/** @deprecated Preferir `buildNominaFlowQueryParams`. */
export function buildNominaFlowReturnQuery(
  periodoYm: string,
  idPersona?: number | string | null,
): Record<string, string> {
  return buildNominaFlowQueryParams(periodoYm, idPersona);
}

export function buildNominaFlowReturnUrl(
  periodoYm: string,
  idPersona?: number | string | null,
): string {
  const params = new URLSearchParams(buildNominaFlowQueryParams(periodoYm, idPersona));
  return `${NOMINA_FLOW_RETURN_PATH}?${params.toString()}`;
}

export function appendNominaFlowQuery(
  ruta: string,
  periodoYm: string,
  idPersona?: number | string | null,
): string {
  const base = ruta.split('?')[0] ?? ruta;
  const params = new URLSearchParams(buildNominaFlowQueryParams(periodoYm, idPersona));
  return `${base}?${params.toString()}`;
}

export function idPersonaDesdeFlowQuery(
  params: Record<string, string | undefined> | null | undefined,
): number | null {
  const raw = params?.[NOMINA_FLOW_QUERY_ID_PERSONA]?.trim();
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function nominaFlowQueryParamsALimpiar(): Record<string, null> {
  return {
    periodo: null,
    returnTo: null,
    [NOMINA_FLOW_QUERY_ID_PERSONA]: null,
  };
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

export function debeRehidratarDesdeFlowQuery(
  params: Record<string, string | undefined> | null | undefined,
): boolean {
  const returnTo = params?.['returnTo']?.trim();
  if (!returnTo) {
    return false;
  }
  return returnTo === NOMINA_FLOW_RETURN_PATH || returnTo.endsWith(NOMINA_FLOW_RETURN_PATH);
}

/** CTA único del bloque Revisión en sidebar (evita enlaces duplicados). */
export interface RevisionRailCtaVm {
  label: string;
  usarPanel: boolean;
  tabModal?: DetalleOperativoTab;
  accionLocal?: ProcesoMensualAccionLocal;
  /** Abre revisión masiva de fichas pendientes (prevalidación). */
  revisarFichasGuiada?: boolean;
}

export interface RevisionRailContext {
  baseGenerada: boolean;
  puedeGenerarNomina: boolean;
  puedeCalcular: boolean;
  hayPendientesRevisionTrabajadores: boolean;
  hayFichasPendientesPrevalidacion?: boolean;
  revisionTrabajadoresCompleta?: boolean;
}

const ETIQUETAS_REVISION_RAIL_DUPLICADAS = new Set([
  'generar nómina',
  'preparar confirmación',
  'confirmar revisión',
  'confirmar nómina',
  'revisar fichas',
  'revisar movimientos',
  'revisar trabajadores',
  'revisar en detalle',
  'ver revisión ampliada',
  'ver resumen del período',
  'ver resultado del período',
  'revisar parámetros',
  'abrir parámetros',
]);

export function labelRevisionRailDesdeDestino(destino: NominaWorkspaceFlowTarget): string {
  if (destino.detalleVista === 'pendientes') {
    return destino.legacyTab === 'parametros' ? 'Revisar parámetros' : 'Revisar pendientes';
  }
  if (destino.detalleVista === 'trabajadores') {
    if (destino.filtroMasivo === 'con_recurrentes') return 'Revisar recurrentes';
    return 'Revisar trabajadores';
  }
  return 'Revisar en detalle';
}

export function buildRevisionRailCta(
  tab: DetalleOperativoTab,
  destino: NominaWorkspaceFlowTarget | null,
  ctx?: RevisionRailContext,
): RevisionRailCtaVm {
  if (ctx) {
    const revisionAlDia =
      !ctx.hayPendientesRevisionTrabajadores
      && (ctx.revisionTrabajadoresCompleta ?? !ctx.hayPendientesRevisionTrabajadores);
    if (revisionAlDia) {
      if (!ctx.baseGenerada && ctx.puedeGenerarNomina) {
        return { label: 'Generar nómina', usarPanel: false, accionLocal: 'generarBase' };
      }
      if (ctx.baseGenerada && ctx.puedeCalcular) {
        return { label: 'Confirmar nómina', usarPanel: false, accionLocal: 'confirmarNomina' };
      }
    }
  }
  if (destino) {
    return { label: labelRevisionRailDesdeDestino(destino), usarPanel: true };
  }
  if (!ctx?.baseGenerada) {
    if (ctx?.hayFichasPendientesPrevalidacion) {
      return { label: 'Revisar trabajadores', usarPanel: false, revisarFichasGuiada: true };
    }
    if (ctx?.puedeGenerarNomina) {
      return { label: 'Generar nómina', usarPanel: false, accionLocal: 'generarBase' };
    }
    return { label: 'Revisar trabajadores', usarPanel: true };
  }
  return {
    label: tab === 'resultado' ? 'Ver resultado del período' : 'Resumen ampliado',
    usarPanel: false,
    tabModal: tab,
  };
}

export interface FiltrarPendientesRailOpciones {
  /** No listar enlaces a parámetros cuando el período ya está listo para revisar. */
  omitirParametrosSiListos?: boolean;
}

function esPendienteRailParametros(p: ProcesoMensualPendienteVm): boolean {
  const label = (p.accionLabel ?? p.titulo).trim().toLowerCase();
  if (label.includes('parámetro') || label.includes('parametro')) {
    return true;
  }
  const codigo = p.codigo.toUpperCase();
  return codigo.includes('PARAM') && !codigo.startsWith('PARAM_MIN_');
}

/** Solo pendientes con acción distinta al CTA principal (máx. 2). */
export function filtrarPendientesRailSecundarios(
  pendientes: readonly ProcesoMensualPendienteVm[],
  labelPrincipal: string,
  maxItems = 2,
  opciones?: FiltrarPendientesRailOpciones,
): ProcesoMensualPendienteVm[] {
  const principalNorm = labelPrincipal.trim().toLowerCase();
  const seen = new Set<string>();
  const out: ProcesoMensualPendienteVm[] = [];
  for (const p of pendientes) {
    const label = (p.accionLabel ?? p.titulo).trim();
    const norm = label.toLowerCase();
    if (!label || ETIQUETAS_REVISION_RAIL_DUPLICADAS.has(norm)) continue;
    if (opciones?.omitirParametrosSiListos && esPendienteRailParametros(p)) continue;
    if (norm === principalNorm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(p);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function mostrarResumenAmpliadoEnRail(input: {
  nominaGenerada: boolean;
  vistaTrabajadores: boolean;
}): boolean {
  return input.nominaGenerada && input.vistaTrabajadores;
}
