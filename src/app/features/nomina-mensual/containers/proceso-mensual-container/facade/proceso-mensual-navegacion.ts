import type { Router } from '@angular/router';

import type {
  DetalleOperativoTab,
  NominaDetalleMensualVista,
  NominaWorkspaceTab,
} from '../models/proceso-mensual-container.vm';
import type { AccionCorreccionVm } from '../../../rules/proceso-mensual-correccion.rules';
import { resolveAccionCorreccionDesdeModalItem } from '../../../rules/proceso-mensual-correccion.rules';
import {
  appendNominaFlowQuery,
  debeRehidratarDesdeFlowQuery,
  detalleTabUsaModal,
  idPersonaDesdeFlowQuery,
  nominaFlowQueryParamsALimpiar,
  periodoYmDesdeFlowQuery,
  type NominaWorkspaceFlowTarget,
} from '../../../rules/proceso-mensual-flow-nav.rules';
import type { NominaMasivaFiltro } from '../../../rules/proceso-mensual-masivo-layout.rules';

/** Puerto de navegación/corrección inyectado desde la facade de presentación (NOM-MENSUAL-TS-AUDIT-00). */
export interface ProcesoMensualCorreccionNavegacionPort {
  periodoYmActivo(): string;
  periodoSeleccionadoYm(): string;
  setPeriodoYm(periodo: string): void;
  rehidratarPeriodoActivo(periodo: string): void;
  limpiarFlowQueryEnRuta(): void;
  cerrarDetalleOperativo(): void;
  abrirTrabajadorEnDetalle(idPersona: number | string, filtroMasivo?: NominaMasivaFiltro): void;
  aplicarDestinoWorkspace(destino: NominaWorkspaceFlowTarget): void;
  seleccionarTrabajadorNominaMasiva(idPersona: number | string): void;
  abrirInformacionParametrosPeriodo(): void;
  abrirDetalleOperativo(tab: DetalleOperativoTab): void;
  navegarExterna(url: string): void;
}

export function mapDetalleVistaALegacyTab(vista: NominaDetalleMensualVista): NominaWorkspaceTab | null {
  switch (vista) {
    case 'trabajadores':
      return 'trabajadores';
    case 'movimientos':
      return 'movimientos';
    case 'liquidaciones':
      return 'liquidaciones';
    case 'pendientes':
      return 'parametros';
    default:
      return null;
  }
}

export function ejecutarAccionCorreccionEnPort(
  port: ProcesoMensualCorreccionNavegacionPort,
  accion: AccionCorreccionVm,
): void {
  switch (accion.kind) {
    case 'panel_trabajador':
      if (accion.idPersona != null) {
        port.abrirTrabajadorEnDetalle(accion.idPersona, accion.filtroMasivo);
      }
      return;
    case 'panel_filtro': {
      const filtro = accion.filtroMasivo ?? 'todos';
      const detalleVista = accion.detalleVista ?? 'trabajadores';
      const legacy =
        mapDetalleVistaALegacyTab(detalleVista)
        ?? (filtro === 'con_movimientos' ? 'movimientos' : 'trabajadores');
      port.aplicarDestinoWorkspace({
        tabVisible: 'detalle_mensual',
        detalleVista,
        legacyTab: legacy,
        filtroMasivo: detalleVista === 'trabajadores' ? filtro : undefined,
      });
      if (accion.idPersona != null) {
        port.seleccionarTrabajadorNominaMasiva(accion.idPersona);
      }
      return;
    }
    case 'ruta':
      port.cerrarDetalleOperativo();
      if (accion.ruta) {
        port.navegarExterna(appendNominaFlowQuery(accion.ruta, port.periodoSeleccionadoYm(), accion.idPersona));
      }
      return;
    case 'overlay_parametros':
      port.abrirInformacionParametrosPeriodo();
      return;
    case 'modal_tab':
      if (accion.tabModal) {
        port.abrirDetalleOperativo(accion.tabModal);
      }
      return;
    default:
      return;
  }
}

export function ejecutarAccionCorreccionDesdeModalEnPort(
  port: ProcesoMensualCorreccionNavegacionPort,
  input: {
    ruta?: string;
    accionTab?: DetalleOperativoTab;
    label?: string;
  },
): void {
  const accion = resolveAccionCorreccionDesdeModalItem(input);
  if (!accion) {
    return;
  }
  const quedaEnModal =
    accion.kind === 'modal_tab'
    && accion.tabModal != null
    && detalleTabUsaModal(accion.tabModal);
  if (!quedaEnModal) {
    port.cerrarDetalleOperativo();
  }
  ejecutarAccionCorreccionEnPort(port, accion);
}

export function aplicarFlowQueryNominaMensual(
  params: Record<string, string | undefined> | null | undefined,
  port: ProcesoMensualCorreccionNavegacionPort,
): void {
  const periodo = periodoYmDesdeFlowQuery(params);
  if (!periodo) {
    return;
  }
  if (port.periodoYmActivo() !== periodo) {
    port.setPeriodoYm(periodo);
  }
  if (!debeRehidratarDesdeFlowQuery(params)) {
    return;
  }
  port.rehidratarPeriodoActivo(periodo);
  const idPersona = idPersonaDesdeFlowQuery(params);
  if (idPersona != null) {
    port.abrirTrabajadorEnDetalle(idPersona);
  }
  port.limpiarFlowQueryEnRuta();
}

export function crearCorreccionNavegacionPort(input: {
  periodoActivoYm: () => string;
  periodoSeleccionadoYm: () => string;
  setPeriodoYm: (periodo: string) => void;
  rehidratarPeriodoActivo: (periodo: string) => void;
  router: Router;
  cerrarDetalleOperativo: () => void;
  abrirTrabajadorEnDetalle: (idPersona: number | string, filtroMasivo?: NominaMasivaFiltro) => void;
  aplicarDestinoWorkspace: (destino: NominaWorkspaceFlowTarget) => void;
  seleccionarTrabajadorNominaMasiva: (idPersona: number | string) => void;
  abrirInformacionParametrosPeriodo: () => void;
  abrirDetalleOperativo: (tab: DetalleOperativoTab) => void;
}): ProcesoMensualCorreccionNavegacionPort {
  return {
    periodoYmActivo: input.periodoActivoYm,
    periodoSeleccionadoYm: input.periodoSeleccionadoYm,
    setPeriodoYm: input.setPeriodoYm,
    rehidratarPeriodoActivo: input.rehidratarPeriodoActivo,
    limpiarFlowQueryEnRuta: () => {
      void input.router.navigate([], {
        queryParams: nominaFlowQueryParamsALimpiar(),
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    },
    navegarExterna: (url: string) => {
      void input.router.navigateByUrl(url);
    },
    cerrarDetalleOperativo: input.cerrarDetalleOperativo,
    abrirTrabajadorEnDetalle: input.abrirTrabajadorEnDetalle,
    aplicarDestinoWorkspace: input.aplicarDestinoWorkspace,
    seleccionarTrabajadorNominaMasiva: input.seleccionarTrabajadorNominaMasiva,
    abrirInformacionParametrosPeriodo: input.abrirInformacionParametrosPeriodo,
    abrirDetalleOperativo: input.abrirDetalleOperativo,
  };
}
