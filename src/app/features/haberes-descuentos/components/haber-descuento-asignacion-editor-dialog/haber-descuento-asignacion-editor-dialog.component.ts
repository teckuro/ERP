import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../../../../shared/components/ui/forms/search-select.component';
import type { HaberDescuentoTipoValor } from '../../models/haber-descuento-asignacion.model';
import type {
  TrabajadorResumenModal,
  VistaConceptoAsignacionModal,
} from '../../models/haber-descuento-asignacion-listado.vm';
import {
  etiquetaNaturalezaConcepto,
  etiquetaTipoConceptoHd,
} from '../../utils/haber-descuento-asignacion-listado.presenter';

@Component({
  selector: 'app-haber-descuento-asignacion-editor-dialog',
  standalone: true,
  imports: [FormsModule, SearchSelectComponent],
  templateUrl: './haber-descuento-asignacion-editor-dialog.component.html',
  styleUrl: './haber-descuento-asignacion-editor-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HaberDescuentoAsignacionEditorDialogComponent {
  readonly titulo = input.required<string>();
  readonly personaId = input<number | null>(null);
  readonly trabajador = input<TrabajadorResumenModal | null>(null);
  readonly conceptoVista = input.required<VistaConceptoAsignacionModal>();
  readonly conceptoOpciones = input.required<SearchSelectOption<number>[]>();
  readonly contratoOpciones = input<{ idContrato: number; etiqueta: string }[]>([]);
  readonly tieneMultiplesContratos = input(false);
  readonly periodicidades = input.required<readonly string[]>();
  readonly idAsignacionEdicion = input<number | null>(null);
  readonly idConcepto = input<number | null>(null);
  readonly idContrato = input<number | null>(null);
  readonly tipoValor = input<HaberDescuentoTipoValor>('FIJO');
  readonly monto = input(0);
  readonly porcentaje = input(0);
  readonly periodicidad = input('MENSUAL');
  readonly vigenciaInicio = input('');
  readonly vigenciaFin = input('');
  readonly observacion = input('');
  readonly estado = input(true);
  readonly mostrarCuotas = input(false);

  readonly cerrar = output<void>();
  readonly guardar = output<void>();
  readonly idConceptoChange = output<number | null>();
  readonly idContratoChange = output<number | null>();
  readonly tipoValorChange = output<string>();
  readonly montoChange = output<number>();
  readonly porcentajeChange = output<number>();
  readonly periodicidadChange = output<string>();
  readonly vigenciaInicioChange = output<string>();
  readonly vigenciaFinChange = output<string>();
  readonly observacionChange = output<string>();
  readonly estadoChange = output<boolean>();

  readonly etiquetaTipo = etiquetaTipoConceptoHd;
  readonly etiquetaNaturaleza = etiquetaNaturalezaConcepto;
}
