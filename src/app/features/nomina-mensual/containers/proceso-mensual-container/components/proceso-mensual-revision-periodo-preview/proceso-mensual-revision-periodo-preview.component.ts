import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { RevisionPeriodoPreviewVm } from '../../../../rules/proceso-mensual-revision-periodo-preview.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-revision-periodo-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './proceso-mensual-revision-periodo-preview.component.html',
  styleUrls: ['./proceso-mensual-revision-periodo-preview.component.css'],
})
export class ProcesoMensualRevisionPeriodoPreviewComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
  readonly preview = input.required<RevisionPeriodoPreviewVm>();
  /** Sidebar: compacto; modal/panel: bloque ancho. */
  readonly variant = input<'sidebar' | 'panel'>('panel');

  claseEje(estado: string): string {
    switch (estado) {
      case 'listo':
        return 'payroll-revision-preview__eje payroll-revision-preview__eje--listo';
      case 'pendiente':
        return 'payroll-revision-preview__eje payroll-revision-preview__eje--pendiente';
      case 'sin_evaluar':
      default:
        return 'payroll-revision-preview__eje payroll-revision-preview__eje--neutral';
    }
  }
}
