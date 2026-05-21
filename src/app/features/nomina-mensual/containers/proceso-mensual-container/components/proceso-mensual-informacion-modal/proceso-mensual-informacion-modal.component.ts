import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import type { MessageBoxSection } from '../../../../../../shared/components/ui/message-box.types';
import type { InformacionPeriodoView } from '../../models/proceso-mensual-container.vm';
import { mapInformacionToneToMessageBoxVariant } from '../../../../rules/proceso-mensual-informacion-periodo.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-informacion-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MessageBoxComponent],
  templateUrl: './proceso-mensual-informacion-modal.component.html',
  styleUrl: '../../proceso-mensual-container.css',
})
export class ProcesoMensualInformacionModalComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);

  variant(info: InformacionPeriodoView): ReturnType<typeof mapInformacionToneToMessageBoxVariant> {
    return mapInformacionToneToMessageBoxVariant(info.tone);
  }

  sections(info: InformacionPeriodoView): MessageBoxSection[] {
    if (info.secciones?.length) {
      return info.secciones.map((seccion) => ({
        title: seccion.titulo,
        items: seccion.items,
        tone:
          seccion.titulo === 'Críticos' || info.tone === 'warning' || info.tone === 'danger'
            ? 'attention'
            : 'info',
      }));
    }
    if (info.puntos?.length) {
      return [{ title: 'Qué revisar', items: info.puntos, tone: 'info' as const }];
    }
    return [];
  }

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
}
