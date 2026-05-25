import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { FilaGridMovimientoVariable } from '../../models/movimiento-variable-listado.vm';
import { formatMontoMovimientoVariable } from '../../utils/movimiento-variable-listado.presenter';

@Component({
  selector: 'app-movimiento-variable-anular-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './movimiento-variable-anular-dialog.component.html',
  styleUrl: '../movimiento-variable-dialog/movimiento-variable-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientoVariableAnularDialogComponent {
  readonly fila = input.required<FilaGridMovimientoVariable>();
  readonly motivoAnulacion = input('');

  readonly cerrar = output<void>();
  readonly confirmar = output<void>();
  readonly motivoAnulacionChange = output<string>();

  readonly formatMonto = formatMontoMovimientoVariable;
}
