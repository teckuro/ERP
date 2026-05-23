import { Component } from '@angular/core';
import { FichaEmpleadoPresentacionFacade } from './facade/ficha-empleado-presentacion.facade';
import { FichaEmpleadoOverlaysComponent } from './components/ficha-empleado-overlays/ficha-empleado-overlays.component';
import { FichaEmpleadoWorkspaceComponent } from './components/ficha-empleado-workspace/ficha-empleado-workspace.component';

@Component({
  selector: 'app-ficha-empleado-container',
  standalone: true,
  providers: [
    { provide: FichaEmpleadoPresentacionFacade, useExisting: FichaEmpleadoContainer },
  ],
  imports: [FichaEmpleadoWorkspaceComponent, FichaEmpleadoOverlaysComponent],
  templateUrl: './ficha-empleado-container.html',
  styleUrls: [
    './ficha-empleado-container.css',
    './ficha-empleado-expediente.css',
    './ficha-empleado-detalle.css',
    './ficha-empleado-responsive.css',
  ],
})
export class FichaEmpleadoContainer extends FichaEmpleadoPresentacionFacade {}
