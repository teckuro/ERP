import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageBoxComponent } from '../../../../shared/components/ui/message-box.component';
import {
  RecordBreadcrumbComponent,
} from '../../../../shared/components/ui/record-breadcrumb.component';
import { ProcesoMensualDetalleModalComponent } from './components/proceso-mensual-detalle-modal/proceso-mensual-detalle-modal.component';
import { ProcesoMensualWorkspaceComponent } from './components/proceso-mensual-workspace/proceso-mensual-workspace.component';
import { ProcesoMensualPresentacionFacade } from './facade/proceso-mensual-presentacion.facade';
import { ProcesoMensualPeriodoStore } from './store/proceso-mensual-periodo.store';

@Component({
  selector: 'app-proceso-mensual-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ProcesoMensualPeriodoStore,
    { provide: ProcesoMensualPresentacionFacade, useExisting: ProcesoMensualContainer },
  ],
  imports: [
    CommonModule,
    RecordBreadcrumbComponent,
    MessageBoxComponent,
    ProcesoMensualWorkspaceComponent,
    ProcesoMensualDetalleModalComponent,
  ],
  templateUrl: './proceso-mensual-container.html',
  styleUrl: './proceso-mensual-container.css',
})
export class ProcesoMensualContainer extends ProcesoMensualPresentacionFacade {}
