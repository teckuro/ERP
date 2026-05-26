import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { EmpleadoDiagnosticoPanelComponent } from '../../../../components/expediente/empleado-diagnostico-panel/empleado-diagnostico-panel.component';
import { EmpleadoExpedienteRailComponent } from '../../../../components/expediente/empleado-expediente-rail/empleado-expediente-rail.component';
import { EmpleadoRecordHeaderComponent } from '../../../../components/expediente/empleado-record-header/empleado-record-header.component';
import { DataGridComponent } from '../../../../../../shared/components/ui/data-grid';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { FichaEmpleadoPresentacionFacade } from '../../facade/ficha-empleado-presentacion.facade';

@Component({
  selector: 'app-ficha-empleado-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    DataGridComponent,
    WorkspaceLoadingComponent,
    EmpleadoRecordHeaderComponent,
    EmpleadoExpedienteRailComponent,
    EmpleadoDiagnosticoPanelComponent,
  ],
  templateUrl: './ficha-empleado-workspace.component.html',
  styleUrls: [
    '../../../../styles/empleado-expediente-tokens.css',
    '../../../../styles/ficha-expediente.layout.css',
    '../../ficha-empleado-container.css',
    '../../ficha-empleado-expediente.css',
    '../../ficha-empleado-detalle.css',
    '../../ficha-empleado-responsive.css',
  ],
})
export class FichaEmpleadoWorkspaceComponent {
  readonly facade = inject(FichaEmpleadoPresentacionFacade);
}
