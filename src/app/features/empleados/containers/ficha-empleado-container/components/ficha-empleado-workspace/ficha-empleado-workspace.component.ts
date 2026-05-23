import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { BancarioComponent } from '../../../../components/secciones/bancario/bancario';
import { ContratoComponent } from '../../../../components/secciones/contrato/contrato';
import { ContactoComponent } from '../../../../components/secciones/contacto/contacto';
import { DatosPersonalesComponent } from '../../../../components/secciones/datos-personales/datos-personales';
import { PrevisionSaludComponent } from '../../../../components/secciones/prevision-salud/prevision-salud';
import { EmpleadoDiagnosticoPanelComponent } from '../../../../components/expediente/empleado-diagnostico-panel/empleado-diagnostico-panel.component';
import { EmpleadoExpedienteRailComponent } from '../../../../components/expediente/empleado-expediente-rail/empleado-expediente-rail.component';
import { EmpleadoRecordHeaderComponent } from '../../../../components/expediente/empleado-record-header/empleado-record-header.component';
import { DataGridComponent } from '../../../../../../shared/components/ui/data-grid.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/workspace-loading.component';
import { FichaEmpleadoPresentacionFacade } from '../../facade/ficha-empleado-presentacion.facade';

@Component({
  selector: 'app-ficha-empleado-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    DatosPersonalesComponent,
    ContactoComponent,
    ContratoComponent,
    PrevisionSaludComponent,
    BancarioComponent,
    DataGridComponent,
    WorkspaceLoadingComponent,
    EmpleadoRecordHeaderComponent,
    EmpleadoExpedienteRailComponent,
    EmpleadoDiagnosticoPanelComponent,
  ],
  templateUrl: './ficha-empleado-workspace.component.html',
  styleUrls: [
    '../../ficha-empleado-container.css',
    '../../ficha-empleado-expediente.css',
    '../../ficha-empleado-detalle.css',
    '../../ficha-empleado-responsive.css',
  ],
})
export class FichaEmpleadoWorkspaceComponent {
  readonly facade = inject(FichaEmpleadoPresentacionFacade);
}
