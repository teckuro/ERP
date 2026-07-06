import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ItemNavegacionFichaEmpleado } from '../../../models/ficha-empleado.vm';
import type { ClaveTabFichaEmpleado } from '../../../models/ficha-empleado-tabs.config';

@Component({
  selector: 'app-empleado-expediente-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './empleado-expediente-rail.component.html',
  styleUrls: [
    '../../../styles/empleado-expediente-tokens.css',
    '../../../containers/ficha-empleado-container/ficha-empleado-expediente.css',
    '../../../containers/ficha-empleado-container/ficha-empleado-responsive.css',
    './empleado-expediente-rail.component.css',
  ],
})
export class EmpleadoExpedienteRailComponent {
  @Input({ required: true }) items!: ItemNavegacionFichaEmpleado[];
  @Input({ required: true }) totalBloques!: number;
  readonly seleccionarTab = output<ClaveTabFichaEmpleado>();
}
