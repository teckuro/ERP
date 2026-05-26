import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRight } from 'lucide-angular/src/icons';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../../../shared/components/ui/data-grid';
import type {
  NominaDetalleMensualExpedienteRow,
  NominaDetalleMensualPendienteRow,
} from '../../models/proceso-mensual-container.vm';
import { ProcesoMensualRevisionTrabajadoresComponent } from '../proceso-mensual-revision-trabajadores/proceso-mensual-revision-trabajadores.component';
import { claseDetalleRevisionTab } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import type { DetalleRevisionTabSeveridad } from '../../../../rules/proceso-mensual-detalle-modal.rules';
import {
  resolveBitacoraRailIcon,
  resolveFocusPresentacion,
} from '../../../../rules/proceso-mensual-workspace-presentacion.rules';
import type { NominaDetalleMensualVista } from '../../models/proceso-mensual-container.vm';
import { claseSegmentNavActivo } from '../../../../rules/proceso-mensual-segment-nav.rules';
import { resolveDetalleMensualAccionUi } from '../../../../rules/proceso-mensual-detalle-mensual.rules';
import { ProcesoMensualPresentacionFacade } from '../../facade/proceso-mensual-presentacion.facade';

@Component({
  selector: 'app-proceso-mensual-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
    ProcesoMensualRevisionTrabajadoresComponent,
  ],
  templateUrl: './proceso-mensual-workspace.component.html',
  styleUrls: ['../../proceso-mensual-container.css', './proceso-mensual-workspace.component.css'],
})
export class ProcesoMensualWorkspaceComponent {
  readonly facade = inject(ProcesoMensualPresentacionFacade);
  readonly chevronRightIcon = ChevronRight;

  readonly focusPresentacion = computed(() => resolveFocusPresentacion(this.facade.nominaFrame().frame));
  readonly resolveBitacoraRailIcon = resolveBitacoraRailIcon;

  claseWorkspaceTab(severidad: DetalleRevisionTabSeveridad, activo: boolean): string {
    return claseDetalleRevisionTab(severidad, activo);
  }

  claseDetalleFiltro(vista: NominaDetalleMensualVista): string {
    return claseSegmentNavActivo(this.facade.nominaDetalleMensualVista() === vista);
  }

  accionPendienteUi(label: string | undefined | null) {
    return resolveDetalleMensualAccionUi(label);
  }
}
