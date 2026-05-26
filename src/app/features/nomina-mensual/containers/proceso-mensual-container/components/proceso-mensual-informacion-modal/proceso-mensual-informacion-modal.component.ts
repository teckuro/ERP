import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { X as XIcon } from 'lucide-angular/src/icons';

import type {
  InformacionPeriodoSeccionDetalleView,
  InformacionPeriodoView,
} from '../../models/proceso-mensual-container.vm';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-informacion-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './proceso-mensual-informacion-modal.component.html',
  styleUrls: [
    '../proceso-mensual-detalle-modal/proceso-mensual-detalle-modal.component.css',
    './proceso-mensual-informacion-modal.component.css',
  ],
})
export class ProcesoMensualInformacionModalComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
  readonly closeIcon = XIcon;

  primaryLabel(info: InformacionPeriodoView): string {
    return info.accionPrincipal?.label ?? 'Entendido';
  }

  secondaryLabel(info: InformacionPeriodoView): string {
    const destino = info.accionSecundaria?.destino;
    if (!destino || destino === 'cerrar') {
      return '';
    }
    return info.accionSecundaria?.label ?? '';
  }

  modalExpandido(info: InformacionPeriodoView): boolean {
    return (info.trabajadoresPendientes?.length ?? 0) > 0;
  }

  irARevisionDesdeAdvertencia(detalle: InformacionPeriodoSeccionDetalleView): void {
    if (!detalle.ruta || !detalle.accionLabel) {
      return;
    }
    this.facade.ejecutarAccionCorreccionDesdeModal({
      ruta: detalle.ruta,
      label: detalle.accionLabel,
    });
  }
}
