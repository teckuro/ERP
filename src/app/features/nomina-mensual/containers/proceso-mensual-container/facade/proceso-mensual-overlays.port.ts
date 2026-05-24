import { Injectable, signal } from '@angular/core';

import type {
  ConfirmacionProcesoMensualView,
  InformacionPeriodoView,
  ProcesoMensualOverlay,
} from '../models/proceso-mensual-container.vm';
import type { DetalleOperativoTab } from '../models/proceso-mensual-container.vm';
import { normalizeDetalleOperativoTab } from '../../../rules/proceso-mensual-detalle-modal.rules';

@Injectable()
export class ProcesoMensualOverlaysPort {
  readonly overlay = signal<ProcesoMensualOverlay>({ kind: 'cerrado' });
  private informacionPeriodoSuprimidaValue = false;

  informacionPeriodoSuprimida(): boolean {
    return this.informacionPeriodoSuprimidaValue;
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
    this.overlay.set({ kind: 'cerrado' });
  }

  cerrarInformacionSuprimida(): void {
    this.suprimirInformacionPeriodo();
    this.cerrar();
  }
}
