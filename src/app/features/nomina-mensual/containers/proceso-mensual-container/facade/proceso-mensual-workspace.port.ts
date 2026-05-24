import { Injectable, signal } from '@angular/core';

import type {
  NominaDetalleMensualVista,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
} from '../models/proceso-mensual-container.vm';
import type { NominaWorkspaceFlowTarget } from '../../../rules/proceso-mensual-flow-nav.rules';
import type { NominaMasivaFiltro } from '../../../rules/proceso-mensual-masivo-layout.rules';
import { mapDetalleVistaALegacyTab } from './proceso-mensual-navegacion';

@Injectable()
export class ProcesoMensualWorkspacePort {
  readonly nominaWorkspaceTab = signal<NominaWorkspaceTab>('parametros');
  readonly nominaWorkspaceTabVisible = signal<NominaWorkspaceTabVisible>('detalle_mensual');
  readonly nominaDetalleMensualVista = signal<NominaDetalleMensualVista>('trabajadores');
  readonly actaOperativaPreparada = signal(false);

  seleccionarLegacyTab(tab: NominaWorkspaceTab): NominaMasivaFiltro | null {
    const mapped = mapLegacyWorkspaceTabANavegacion(tab);
    this.aplicarDestino(mapped);
    if (tab === 'movimientos') {
      return 'con_movimientos';
    }
    if (tab === 'recurrentes') {
      return 'con_recurrentes';
    }
    return null;
  }

  seleccionarTabVisible(tab: NominaWorkspaceTabVisible): void {
    this.nominaWorkspaceTabVisible.set(tab);
    if (tab === 'historial') {
      this.nominaWorkspaceTab.set('historial');
    }
  }

  seleccionarDetalleMensualVista(vista: NominaDetalleMensualVista): NominaMasivaFiltro | null {
    this.nominaWorkspaceTabVisible.set('detalle_mensual');
    if (vista === 'movimientos') {
      this.nominaDetalleMensualVista.set('trabajadores');
      this.nominaWorkspaceTab.set('movimientos');
      return 'con_movimientos';
    }
    this.nominaDetalleMensualVista.set(vista);
    const legacy = mapDetalleVistaALegacyTab(vista);
    if (legacy) {
      this.nominaWorkspaceTab.set(legacy);
    }
    return null;
  }

  aplicarDestino(destino: NominaWorkspaceFlowTarget): void {
    this.nominaWorkspaceTabVisible.set(destino.tabVisible);
    this.nominaDetalleMensualVista.set(destino.detalleVista);
    this.nominaWorkspaceTab.set(destino.legacyTab);
  }
}

function mapLegacyWorkspaceTabANavegacion(tab: NominaWorkspaceTab): NominaWorkspaceFlowTarget {
  switch (tab) {
    case 'historial':
      return { tabVisible: 'historial', detalleVista: 'todos', legacyTab: 'historial' };
    case 'liquidaciones':
      return { tabVisible: 'detalle_mensual', detalleVista: 'liquidaciones', legacyTab: 'liquidaciones' };
    case 'movimientos':
    case 'recurrentes':
      return { tabVisible: 'detalle_mensual', detalleVista: 'trabajadores', legacyTab: tab };
    case 'trabajadores':
      return { tabVisible: 'detalle_mensual', detalleVista: 'trabajadores', legacyTab: 'trabajadores' };
    case 'parametros':
      return { tabVisible: 'detalle_mensual', detalleVista: 'pendientes', legacyTab: 'parametros' };
    default:
      return { tabVisible: 'detalle_mensual', detalleVista: 'todos', legacyTab: tab };
  }
}
