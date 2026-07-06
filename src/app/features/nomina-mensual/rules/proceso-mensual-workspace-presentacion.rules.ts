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
import type { NominaAreaOperativa } from '../containers/proceso-mensual-container/models/proceso-mensual-area-orden.config';

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

export type NominaConfiguracionPeriodoTono = 'neutral' | 'review' | 'danger' | 'ok';

export type NominaConfiguracionPeriodoAccion =
  | 'abrir_parametros'
  | 'verificar_periodo'
  | 'generar_nomina'
  | 'revisar_bloqueos_nomina'
  | 'revisar_trabajadores'
  | 'revisar_movimientos'
  | 'generar_liquidaciones'
  | 'ver_liquidaciones';

export type NominaConfiguracionPeriodoItemId = NominaAreaOperativa | 'nomina_revision';

export interface NominaConfiguracionPeriodoItemVm {
  id: NominaConfiguracionPeriodoItemId;
  label: string;
  icon: string;
  estado: string;
  valor: string;
  tono: NominaConfiguracionPeriodoTono;
  accionLabel: string;
  accion: NominaConfiguracionPeriodoAccion;
  disabled: boolean;
  disabledReason: string | null;
  prioridad: boolean;
}

export interface NominaConfiguracionPeriodoInput {
  parametrosListos: boolean | null;
  parametrosConsultando: boolean;
  trabajadoresAptos: number | null;
  trabajadoresPorRevisar: number;
  bloqueosTrabajadoresCount: number;
  bloqueosNominaCount: number;
  advertenciasCount: number;
  movimientosAprobados: number;
  movimientosPendientes: number;
  recurrentesAplicables: number | null;
  nominaFrame: NominaVisualFrame;
  nominaGenerada: boolean;
  tienePrevalidacion: boolean;
  nominaConfirmada: boolean;
  nominaAprobada: boolean;
  liquidacionesGeneradas: number;
}

function estadoParametros(input: NominaConfiguracionPeriodoInput): Pick<NominaConfiguracionPeriodoItemVm, 'estado' | 'valor' | 'tono' | 'accionLabel' | 'disabled' | 'disabledReason' | 'prioridad'> {
  if (input.parametrosConsultando) {
    return {
      estado: 'Consultando',
      valor: 'Lectura en curso',
      tono: 'neutral',
      accionLabel: 'Abrir parámetros',
      disabled: true,
      disabledReason: 'Consulta en curso',
      prioridad: false,
    };
  }
  if (input.parametrosListos === true) {
    return {
      estado: 'Listo',
      valor: 'Parámetros listos',
      tono: 'ok',
      accionLabel: 'Abrir parámetros',
      disabled: false,
      disabledReason: null,
      prioridad: false,
    };
  }
  if (input.parametrosListos === false) {
    return {
      estado: 'Bloqueado',
      valor: 'Faltan parámetros',
      tono: 'danger',
      accionLabel: 'Abrir parámetros',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  return {
    estado: 'Pendiente',
    valor: 'Sin evaluar',
    tono: 'neutral',
    accionLabel: 'Abrir parámetros',
    disabled: false,
    disabledReason: null,
    prioridad: false,
  };
}

function estadoNominaPeriodo(input: NominaConfiguracionPeriodoInput): Pick<NominaConfiguracionPeriodoItemVm, 'estado' | 'valor' | 'tono' | 'accionLabel' | 'disabled' | 'disabledReason' | 'prioridad' | 'accion'> {
  if (input.bloqueosNominaCount > 0) {
    const n = input.bloqueosNominaCount;
    return {
      estado: 'Cerrada',
      valor: `${n} bloqueo${n === 1 ? '' : 's'} en la nómina`,
      tono: 'danger',
      accion: 'revisar_bloqueos_nomina',
      accionLabel: 'Revisar nómina',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  if (!input.nominaGenerada) {
    const puedeGenerar = input.tienePrevalidacion && input.nominaFrame === 'sin_generar';
    return {
      estado: 'Sin generar',
      valor: 'Sin borrador del período',
      tono: 'neutral',
      accion: puedeGenerar ? 'generar_nomina' : 'verificar_periodo',
      accionLabel: puedeGenerar ? 'Generar nómina' : 'Verificar período',
      disabled: !puedeGenerar,
      disabledReason: puedeGenerar ? null : 'Primero verifica el período',
      prioridad: input.tienePrevalidacion,
    };
  }
  if (input.nominaConfirmada) {
    return {
      estado: 'Cerrada',
      valor: input.liquidacionesGeneradas > 0
        ? `${input.liquidacionesGeneradas} liquidación${input.liquidacionesGeneradas === 1 ? '' : 'es'} emitida${input.liquidacionesGeneradas === 1 ? '' : 's'}`
        : 'Proceso cerrado',
      tono: 'ok',
      accion: 'revisar_bloqueos_nomina',
      accionLabel: 'Revisar nómina',
      disabled: false,
      disabledReason: null,
      prioridad: false,
    };
  }
  if (input.nominaAprobada) {
    return {
      estado: 'Aprobada',
      valor: input.liquidacionesGeneradas > 0 ? 'Revisión registrada' : 'Pendiente de emitir',
      tono: 'ok',
      accion: 'revisar_bloqueos_nomina',
      accionLabel: 'Revisar nómina',
      disabled: false,
      disabledReason: null,
      prioridad: input.liquidacionesGeneradas === 0,
    };
  }
  if (input.nominaFrame === 'lista_para_confirmar') {
    return {
      estado: 'Por aprobar',
      valor: 'Revisión guardada',
      tono: 'review',
      accion: 'revisar_bloqueos_nomina',
      accionLabel: 'Revisar nómina',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  if (input.nominaFrame === 'liquidaciones_generadas') {
    return {
      estado: 'Cerrada',
      valor: `${input.liquidacionesGeneradas} liquidación${input.liquidacionesGeneradas === 1 ? '' : 'es'}`,
      tono: 'ok',
      accion: 'revisar_bloqueos_nomina',
      accionLabel: 'Revisar nómina',
      disabled: false,
      disabledReason: null,
      prioridad: false,
    };
  }
  if (input.nominaFrame === 'con_pendientes') {
    return {
      estado: 'En revisión',
      valor: 'Con pendientes del período',
      tono: 'review',
      accion: 'revisar_bloqueos_nomina',
      accionLabel: 'Revisar nómina',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  return {
    estado: 'En revisión',
    valor: 'Borrador en curso',
    tono: 'ok',
    accion: 'revisar_bloqueos_nomina',
    accionLabel: 'Revisar nómina',
    disabled: false,
    disabledReason: null,
    prioridad: false,
  };
}

function estadoTrabajadores(input: NominaConfiguracionPeriodoInput): Pick<NominaConfiguracionPeriodoItemVm, 'estado' | 'valor' | 'tono' | 'accionLabel' | 'disabled' | 'disabledReason' | 'prioridad'> {
  if (input.bloqueosTrabajadoresCount > 0) {
    const n = input.bloqueosTrabajadoresCount;
    return {
      estado: 'Bloqueado',
      valor: `${n} bloqueo${n === 1 ? '' : 's'} en trabajadores`,
      tono: 'danger',
      accionLabel: 'Revisar trabajadores',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  if (input.trabajadoresPorRevisar > 0 || input.advertenciasCount > 0) {
    const total = Math.max(input.trabajadoresPorRevisar, input.advertenciasCount);
    return {
      estado: 'Por revisar',
      valor: `${total} por revisar`,
      tono: 'review',
      accionLabel: 'Revisar trabajadores',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  if (!input.nominaGenerada && input.trabajadoresAptos != null && input.trabajadoresAptos > 0) {
    return {
      estado: 'Pendiente',
      valor: `${input.trabajadoresAptos} apto${input.trabajadoresAptos === 1 ? '' : 's'} · sin nómina generada`,
      tono: input.parametrosListos === false ? 'review' : 'neutral',
      accionLabel: 'Revisar trabajadores',
      disabled: false,
      disabledReason: null,
      prioridad: input.parametrosListos === false,
    };
  }
  if (input.trabajadoresAptos != null) {
    return {
      estado: 'Listo',
      valor: `${input.trabajadoresAptos} listo${input.trabajadoresAptos === 1 ? '' : 's'}`,
      tono: 'ok',
      accionLabel: 'Revisar trabajadores',
      disabled: false,
      disabledReason: null,
      prioridad: false,
    };
  }
  return {
    estado: 'Pendiente',
    valor: 'Sin evaluar',
    tono: 'neutral',
    accionLabel: 'Revisar trabajadores',
    disabled: input.nominaFrame === 'sin_generar',
    disabledReason: input.nominaFrame === 'sin_generar' ? 'Primero genera la nómina' : null,
    prioridad: false,
  };
}

function estadoLiquidaciones(input: NominaConfiguracionPeriodoInput): Pick<NominaConfiguracionPeriodoItemVm, 'estado' | 'valor' | 'tono' | 'accionLabel' | 'disabled' | 'disabledReason' | 'prioridad'> {
  if (input.liquidacionesGeneradas > 0) {
    return {
      estado: 'Listo',
      valor: `${input.liquidacionesGeneradas} generada${input.liquidacionesGeneradas === 1 ? '' : 's'}`,
      tono: 'ok',
      accionLabel: 'Ver liquidaciones',
      disabled: false,
      disabledReason: null,
      prioridad: input.nominaFrame === 'liquidaciones_generadas',
    };
  }
  if (input.nominaConfirmada) {
    return {
      estado: 'Pendiente',
      valor: 'Liquidaciones pendientes',
      tono: 'review',
      accionLabel: 'Generar liquidaciones',
      disabled: false,
      disabledReason: null,
      prioridad: true,
    };
  }
  return {
    estado: 'Pendiente',
    valor: 'Aprobar nómina',
    tono: 'neutral',
    accionLabel: 'Generar liquidaciones',
    disabled: true,
    disabledReason: 'Primero aprueba la nómina del período',
    prioridad: false,
  };
}

export function buildNominaConfiguracionPeriodoItems(
  input: NominaConfiguracionPeriodoInput,
): NominaConfiguracionPeriodoItemVm[] {
  const parametros = estadoParametros(input);
  const nominaPeriodo = estadoNominaPeriodo(input);
  const trabajadores = estadoTrabajadores(input);
  const liquidaciones = estadoLiquidaciones(input);
  return [
    {
      id: 'parametros',
      label: 'Parámetros',
      icon: 'sliders',
      accion: 'abrir_parametros',
      ...parametros,
    },
    {
      id: 'nomina_revision',
      label: 'Nómina del período',
      icon: 'calculator',
      ...nominaPeriodo,
    },
    {
      id: 'trabajadores',
      label: 'Trabajadores',
      icon: 'users',
      accion: 'revisar_trabajadores',
      ...trabajadores,
    },
    {
      id: 'liquidaciones',
      label: 'Liquidaciones',
      icon: input.liquidacionesGeneradas > 0 ? 'receipt' : input.nominaConfirmada ? 'lock' : 'receipt',
      accion: input.liquidacionesGeneradas > 0 ? 'ver_liquidaciones' : 'generar_liquidaciones',
      ...liquidaciones,
    },
  ];
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
  eventosHistorialCount: number;
}): NominaWorkspaceTabVisibleSummaryVm[] {
  const historialDescripcion = input.eventosHistorialCount > 0
    ? 'Registro de generación, revisión y confirmación.'
    : 'Aún no hay eventos registrados para este período.';

  return [
    {
      id: 'detalle_mensual',
      label: 'Detalle mensual',
      titulo: 'Expediente del período',
      descripcion: 'Revisión por trabajador del período.',
      severidad: input.bloqueosCount > 0 ? 'bloqueo' : input.pendientesCount > 0 ? 'atencion' : 'neutral',
      indicador: null,
      metricas: [],
    },
    {
      id: 'historial',
      label: 'Historial',
      titulo: 'Trazabilidad del período',
      descripcion: historialDescripcion,
      severidad: input.nominaCerrada ? 'listo' : 'neutral',
      indicador: input.eventosHistorialCount > 0 ? `${input.eventosHistorialCount} eventos` : null,
      metricas: [],
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
  if (v.includes('revisados') || v.includes('incluido') || v.includes('listo') || v.includes('vigente')) {
    return 'ok';
  }
  return 'neutral';
}
