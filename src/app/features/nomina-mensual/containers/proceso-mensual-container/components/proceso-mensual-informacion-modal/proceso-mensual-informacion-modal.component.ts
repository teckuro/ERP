import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Check as CheckIcon, X as XIcon } from 'lucide-angular/src/icons';

import type {
  InformacionPeriodoSeccionDetalleView,
  InformacionPeriodoView,
} from '../../models/proceso-mensual-container.vm';
import { resolveDetalleMensualAccionUi } from '../../../../rules/proceso-mensual-detalle-mensual.rules';
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
  readonly checkIcon = CheckIcon;
  readonly revisionIcon = XIcon;

  primaryLabel(info: InformacionPeriodoView): string {
    if (info.consultando) {
      return 'Revisando…';
    }
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
    if (info.soloAlertasExpediente) {
      return true;
    }
    return (info.trabajadoresPendientes?.length ?? 0) > 0;
  }

  accionAlertaUi(label: string | undefined | null) {
    return resolveDetalleMensualAccionUi(label);
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
