import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../../../../shared/components/ui/forms/search-select.component';
import type { EstadoAltaMovimientoVariable } from '../../models/movimiento-variable-listado.vm';

@Component({
  selector: 'app-movimiento-variable-alta-dialog',
  standalone: true,
  imports: [FormsModule, SearchSelectComponent],
  templateUrl: './movimiento-variable-alta-dialog.component.html',
  styleUrl: '../movimiento-variable-dialog/movimiento-variable-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientoVariableAltaDialogComponent {
  readonly periodoEtiqueta = input.required<string>();
  readonly empleadoOpciones = input.required<SearchSelectOption<number>[]>();
  readonly conceptoOpciones = input.required<SearchSelectOption<number>[]>();
  readonly idPersona = input<number | null>(null);
  readonly idConcepto = input<number | null>(null);
  readonly monto = input<number | null>(null);
  readonly estadoAlta = input<EstadoAltaMovimientoVariable>('BORRADOR');
  readonly observacion = input('');
  readonly guardando = input(false);

  readonly cerrar = output<void>();
  readonly guardar = output<void>();
  readonly idPersonaChange = output<number | null>();
  readonly idConceptoChange = output<number | null>();
  readonly montoChange = output<number | null>();
  readonly estadoAltaChange = output<EstadoAltaMovimientoVariable>();
  readonly observacionChange = output<string>();
}
