import { Injectable, signal } from '@angular/core';

import type { ProcesoMensualPrevalidacion } from '../../../models/proceso-mensual.model';
import type {
  ConfirmacionProcesoMensualView,
  InformacionPeriodoView,
  NominaDetalleMensualVista,
  NominaVisualFrameView,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
  ProcesoMensualOverlay,
} from '../models/proceso-mensual-container.vm';
import type { DetalleOperativoTab } from '../models/proceso-mensual-container.vm';
import { normalizeDetalleOperativoTab } from '../../../rules/proceso-mensual-detalle-modal.rules';

export interface VerificacionParametrosSnapshot {
  frame: NominaVisualFrameView;
  resultado: ProcesoMensualPrevalidacion | null;
  workspace: {
    tabVisible: NominaWorkspaceTabVisible;
    detalleVista: NominaDetalleMensualVista;
    legacyTab: NominaWorkspaceTab;
  };
}

@Injectable()
export class ProcesoMensualOverlaysPort {
  readonly overlay = signal<ProcesoMensualOverlay>({ kind: 'cerrado' });
  private informacionPeriodoSuprimidaValue = false;
  private verificacionParametrosActivaValue = false;
  private verificacionSnapshot: VerificacionParametrosSnapshot | null = null;
  private omitirProximaSyncNavValue = false;

  informacionPeriodoSuprimida(): boolean {
    return this.informacionPeriodoSuprimidaValue;
  }

  /** Modal tile Parámetros abierto: no reemplazar por sincronización de verificación del período. */
  verificacionParametrosActiva(): boolean {
    return this.verificacionParametrosActivaValue;
  }

  snapshotVerificacionParametros(): VerificacionParametrosSnapshot | null {
    return this.verificacionSnapshot;
  }

  /** CTA del shell congelado mientras el modal de parámetros está abierto. */
  nominaFrameCongelado(): NominaVisualFrameView | null {
    return this.verificacionSnapshot?.frame ?? null;
  }

  resultadoCongelado(): ProcesoMensualPrevalidacion | null {
    return this.verificacionSnapshot?.resultado ?? null;
  }

  iniciarVerificacionParametros(snapshot: VerificacionParametrosSnapshot): void {
    this.verificacionSnapshot = snapshot;
    this.verificacionParametrosActivaValue = true;
  }

  marcarOmitirProximaSyncNav(): void {
    this.omitirProximaSyncNavValue = true;
  }

  consumirOmitirProximaSyncNav(): boolean {
    if (!this.omitirProximaSyncNavValue) {
      return false;
    }
    this.omitirProximaSyncNavValue = false;
    return true;
  }

  setVerificacionParametrosActiva(activa: boolean): void {
    this.verificacionParametrosActivaValue = activa;
    if (!activa) {
      this.verificacionSnapshot = null;
    }
  }

  suprimirInformacionPeriodo(): void {
    this.informacionPeriodoSuprimidaValue = true;
  }

  habilitarInformacionPeriodo(): void {
    this.informacionPeriodoSuprimidaValue = false;
  }

  abrirRevision(tab: DetalleOperativoTab): void {
    this.overlay.set({ kind: 'revision', tab: normalizeDetalleOperativoTab(tab) });
  }

  abrirDecision(view: ConfirmacionProcesoMensualView): void {
    this.overlay.set({ kind: 'decision', view });
  }

  abrirInformacion(view: InformacionPeriodoView): void {
    this.overlay.set({ kind: 'informacion', view });
  }

  cerrar(): void {
    if (this.overlay().kind === 'informacion') {
      this.setVerificacionParametrosActiva(false);
    }
    this.overlay.set({ kind: 'cerrado' });
  }

  cerrarInformacionSuprimida(): void {
    this.setVerificacionParametrosActiva(false);
    this.suprimirInformacionPeriodo();
    this.cerrar();
  }
}
