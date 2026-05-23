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
})
export class EmpleadoExpedienteRailComponent {
  @Input({ required: true }) items!: ItemNavegacionFichaEmpleado[];
  @Input({ required: true }) totalBloques!: number;
  readonly seleccionarTab = output<ClaveTabFichaEmpleado>();
}
