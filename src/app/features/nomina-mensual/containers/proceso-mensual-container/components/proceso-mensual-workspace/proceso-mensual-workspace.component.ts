import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import type { NominaWorkspaceTab } from '../../models/proceso-mensual-container.vm';
import { claseDetalleRevisionTab } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import type { DetalleRevisionTabSeveridad } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import {
  resolveFocusPresentacion,
  resolveFranjaItemTono,
} from '../../../../rules/proceso-mensual-workspace-presentacion.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './proceso-mensual-workspace.component.html',
  styleUrl: '../../proceso-mensual-container.css',
})
export class ProcesoMensualWorkspaceComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);

  readonly franjaIcono = {
    trabajadores: 'users',
    parametros: 'sliders',
    movimientos: 'list-checks',
    recurrentes: 'repeat',
  } as const;

  readonly focusPresentacion = computed(() => resolveFocusPresentacion(this.facade.nominaFrame().frame));

  claseWorkspaceTab(severidad: DetalleRevisionTabSeveridad, activo: boolean): string {
    return claseDetalleRevisionTab(severidad, activo);
  }

  franjaItemClase(valor: string, tab: NominaWorkspaceTab): string {
    const tono = resolveFranjaItemTono(valor);
    const activo = this.facade.nominaWorkspaceTab() === tab;
    return [
      'payroll-franja-operativa__item',
      `payroll-franja-operativa__item--${tono}`,
      activo ? 'payroll-franja-operativa__item--active' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
