import type { DetalleOperativoTab } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type {
  NominaDetalleMensualExpedienteRow,
  NominaDetalleMensualPendienteRow,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import type {
  IncidenciaPeriodo,
  IncidenciaPeriodoAccion,
} from './proceso-mensual-incidencias-periodo.rules';
import type { NominaMasivaEstado, NominaMasivaFila, NominaMasivaFiltro } from './proceso-mensual-masivo-layout.rules';
import {
  detalleTabUsaModal,
  resolveWorkspaceTargetFromDetalleTab,
  type NominaWorkspaceFlowTarget,
} from './proceso-mensual-flow-nav.rules';

export type AccionCorreccionKind =
  | 'panel_trabajador'
  | 'panel_filtro'
  | 'ruta'
  | 'overlay_parametros'
  | 'modal_tab';

export interface AccionCorreccionVm {
  label: string;
  kind: AccionCorreccionKind;
  idPersona?: number | string;
  filtroMasivo?: NominaMasivaFiltro;
  ruta?: string;
  tabModal?: DetalleOperativoTab;
}

const RUTA_NOVEDADES = '/remuneraciones/novedades-mensuales';
const RUTA_PARAMETROS = '/parametros';
const RUTA_HABERES = '/remuneraciones/haberes-descuentos';

const SEVERIDAD_RANK: Record<IncidenciaPeriodo['severidad'], number> = {
  bloqueo: 0,
  advertencia: 1,
  info: 2,
};

function clavePersona(idPersona: number | string | null | undefined): string {
  if (idPersona == null) return '';
  return String(idPersona).trim();
}

function accionDesdeWorkspaceTarget(
  destino: NominaWorkspaceFlowTarget,
  label: string,
  idPersona?: number | string,
): AccionCorreccionVm {
  if (destino.legacyTab === 'parametros') {
    return { label, kind: 'overlay_parametros' };
  }
  if (destino.filtroMasivo) {
    return {
      label,
      kind: 'panel_filtro',
      filtroMasivo: destino.filtroMasivo,
      idPersona,
    };
  }
  if (idPersona != null) {
    return { label, kind: 'panel_trabajador', idPersona, filtroMasivo: destino.filtroMasivo };
  }
  return { label, kind: 'panel_filtro', filtroMasivo: destino.filtroMasivo ?? 'todos' };
}

function accionDesdeDetalleTab(
  tab: DetalleOperativoTab,
  label: string,
  idPersona?: number | string,
): AccionCorreccionVm {
  const destino = resolveWorkspaceTargetFromDetalleTab(tab);
  if (destino) {
    return accionDesdeWorkspaceTarget(destino, label, idPersona);
  }
  if (detalleTabUsaModal(tab)) {
    return { label, kind: 'modal_tab', tabModal: tab };
  }
  return { label, kind: 'panel_trabajador', idPersona };
}

function accionDesdeIncidenciaAccion(
  accion: IncidenciaPeriodoAccion,
  idPersona?: number | string,
): AccionCorreccionVm {
  const label = accion.label.trim() || 'Revisar';
  if (accion.tipo === 'ruta' && accion.destino) {
    if (accion.destino.startsWith(RUTA_PARAMETROS)) {
      return { label, kind: 'overlay_parametros', ruta: accion.destino };
    }
    return { label, kind: 'ruta', ruta: accion.destino, idPersona };
  }
  if (accion.tipo === 'tab' && accion.destino) {
    return accionDesdeDetalleTab(accion.destino as DetalleOperativoTab, label, idPersona);
  }
  return { label, kind: 'panel_trabajador', idPersona };
}

export function resolveAccionCorreccionDesdeIncidencia(
  incidencia: IncidenciaPeriodo,
): AccionCorreccionVm | null {
  if (incidencia.accion) {
    return accionDesdeIncidenciaAccion(incidencia.accion, incidencia.idPersona);
  }
  switch (incidencia.ambito) {
    case 'parametros':
      return { label: 'Abrir parámetros', kind: 'overlay_parametros' };
    case 'movimientos':
    case 'recurrentes':
      return {
        label: 'Revisar movimientos',
        kind: 'ruta',
        ruta: RUTA_NOVEDADES,
        idPersona: incidencia.idPersona,
      };
    case 'trabajadores':
      if (incidencia.idPersona != null) {
        return { label: 'Revisar trabajador', kind: 'panel_trabajador', idPersona: incidencia.idPersona };
      }
      return { label: 'Revisar trabajadores', kind: 'panel_filtro', filtroMasivo: 'observaciones' };
    default:
      return null;
  }
}

function incidenciasOrdenadas(incidencias: readonly IncidenciaPeriodo[]): IncidenciaPeriodo[] {
  return [...incidencias].sort(
    (a, b) => SEVERIDAD_RANK[a.severidad] - SEVERIDAD_RANK[b.severidad] || a.prioridad - b.prioridad,
  );
}

export function resolveAccionCorreccionFilaMasiva(
  fila: NominaMasivaFila,
  incidenciasTrabajador: readonly IncidenciaPeriodo[],
): AccionCorreccionVm {
  const ordenadas = incidenciasOrdenadas(incidenciasTrabajador);
  for (const inc of ordenadas) {
    const accion = resolveAccionCorreccionDesdeIncidencia(inc);
    if (accion) return accion;
  }

  if (fila.estado === 'bloqueado') {
    return { label: 'Revisar bloqueo', kind: 'panel_trabajador', idPersona: fila.idPersona };
  }
  if (fila.estado === 'observacion') {
    return { label: 'Revisar trabajador', kind: 'panel_trabajador', idPersona: fila.idPersona };
  }
  if (!fila.tieneMovimientos && fila.estado !== 'listo') {
    return {
      label: 'Registrar movimiento',
      kind: 'ruta',
      ruta: RUTA_NOVEDADES,
      idPersona: fila.idPersona,
    };
  }
  if (fila.tieneMovimientos && fila.incidenciasCount > 0) {
    return {
      label: 'Revisar movimientos',
      kind: 'panel_trabajador',
      idPersona: fila.idPersona,
      filtroMasivo: 'con_movimientos',
    };
  }
  if (fila.tieneRecurrentes && fila.incidenciasCount > 0) {
    return {
      label: 'Revisar recurrentes',
      kind: 'ruta',
      ruta: RUTA_HABERES,
      idPersona: fila.idPersona,
    };
  }
  return { label: 'Ver detalle', kind: 'panel_trabajador', idPersona: fila.idPersona };
}

export function resolveAccionCorreccionDesdeExpedienteRow(
  row: NominaDetalleMensualExpedienteRow,
): AccionCorreccionVm {
  if (row.ambito === 'Parámetro') {
    return { label: row.accion, kind: 'overlay_parametros' };
  }
  if (row.ruta) {
    if (row.ruta.startsWith(RUTA_PARAMETROS)) {
      return { label: row.accion, kind: 'overlay_parametros', ruta: row.ruta };
    }
    return { label: row.accion, kind: 'ruta', ruta: row.ruta, idPersona: row.idPersona };
  }
  if (row.ambito === 'Trabajador' && row.idPersona != null) {
    return { label: row.accion, kind: 'panel_trabajador', idPersona: row.idPersona };
  }
  if (row.ambito === 'Movimiento') {
    const label = row.accion === 'Ver' ? 'Revisar movimientos' : row.accion;
    if (row.idPersona != null) {
      return {
        label,
        kind: 'panel_trabajador',
        idPersona: row.idPersona,
        filtroMasivo: 'con_movimientos',
      };
    }
    if (row.detalleTab) {
      return accionDesdeDetalleTab(row.detalleTab, label);
    }
    return { label, kind: 'ruta', ruta: RUTA_NOVEDADES };
  }
  if (row.detalleTab) {
    return accionDesdeDetalleTab(row.detalleTab, row.accion, row.idPersona);
  }
  return { label: row.accion, kind: 'panel_filtro', filtroMasivo: 'todos' };
}

export function resolveAccionCorreccionDesdePendienteRow(
  row: NominaDetalleMensualPendienteRow,
): AccionCorreccionVm {
  if (row.ruta) {
    if (row.ruta.startsWith(RUTA_PARAMETROS)) {
      return { label: row.accion, kind: 'overlay_parametros', ruta: row.ruta };
    }
    return { label: row.accion, kind: 'ruta', ruta: row.ruta };
  }
  if (row.detalleTab) {
    return accionDesdeDetalleTab(row.detalleTab, row.accion);
  }
  return accionDesdeDetalleTab(row.detalleTab ?? 'trabajadores', row.accion);
}

export function incidenciasPorPersonaMap(
  incidencias: readonly IncidenciaPeriodo[],
): Map<string, IncidenciaPeriodo[]> {
  const map = new Map<string, IncidenciaPeriodo[]>();
  for (const inc of incidencias) {
    const clave = inc.idPersona != null ? clavePersona(inc.idPersona) : '';
    if (!clave) continue;
    const lista = map.get(clave) ?? [];
    lista.push(inc);
    map.set(clave, lista);
  }
  return map;
}

export function filtroInicialRevisionTrabajadores(input: {
  bloqueosCount: number;
  advertenciasCount: number;
}): NominaMasivaFiltro {
  if (input.bloqueosCount > 0) return 'bloqueados';
  if (input.advertenciasCount > 0) return 'observaciones';
  return 'todos';
}
