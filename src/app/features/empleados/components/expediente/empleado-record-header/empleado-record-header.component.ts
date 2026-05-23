import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { EmpleadoFichaDetalle } from '../../../models/empleado-listado.model';

@Component({
  selector: 'app-empleado-record-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './empleado-record-header.component.html',
  styleUrls: [
    '../../../styles/empleado-expediente-tokens.css',
    '../../../containers/ficha-empleado-container/ficha-empleado-expediente.css',
    '../../../containers/ficha-empleado-container/ficha-empleado-responsive.css',
    './empleado-record-header.component.css',
  ],
})
export class EmpleadoRecordHeaderComponent {
  @Input({ required: true }) employee!: EmpleadoFichaDetalle;
  @Input({ required: true }) initials!: string;
}
