import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProcesoMensualOverlaysComponent } from './components/proceso-mensual-overlays/proceso-mensual-overlays.component';
import { ProcesoMensualWorkspaceComponent } from './components/proceso-mensual-workspace/proceso-mensual-workspace.component';
import { ProcesoMensualPresentacionFacade } from './facade/proceso-mensual-presentacion.facade';
import { ProcesoMensualOverlaysPort } from './facade/proceso-mensual-overlays.port';
import { ProcesoMensualRevisionTrabajadoresPort } from './facade/proceso-mensual-revision-trabajadores.port';
import { ProcesoMensualWorkspacePort } from './facade/proceso-mensual-workspace.port';
import { ProcesoMensualPeriodoStore } from './store/proceso-mensual-periodo.store';

@Component({
  selector: 'app-proceso-mensual-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ProcesoMensualPeriodoStore,
    ProcesoMensualOverlaysPort,
    ProcesoMensualWorkspacePort,
    ProcesoMensualRevisionTrabajadoresPort,
    { provide: ProcesoMensualPresentacionFacade, useExisting: ProcesoMensualContainer },
  ],
  imports: [
    CommonModule,
    ProcesoMensualWorkspaceComponent,
    ProcesoMensualOverlaysComponent,
  ],
  templateUrl: './proceso-mensual-container.html',
  styleUrl: './proceso-mensual-container.css',
})
export class ProcesoMensualContainer extends ProcesoMensualPresentacionFacade {}
