import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CalendarInputComponent } from '../../../../../shared/components/ui/forms/calendar-input/calendar-input.component';
import { FieldHelpTipComponent } from '../../../../../shared/components/ui/forms/field-help-tip.component';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/forms/search-select.component';
import {
  PERIODICIDADES_HD,
  type ContratoResumenPersona,
  type PeriodicidadHd,
} from '../../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import {
  etiquetaPeriodicidadHd,
  type FormularioRecurrenteValores,
} from '../../presenters/novedades-formulario-recurrente.presenter';

export type FormularioRecurrenteCambio = {
  campo: keyof FormularioRecurrenteValores;
  valor: FormularioRecurrenteValores[keyof FormularioRecurrenteValores];
};

@Component({
  selector: 'app-novedades-formulario-recurrente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchSelectComponent,
    CalendarInputComponent,
    FieldHelpTipComponent,
  ],
  templateUrl: './novedades-formulario-recurrente.component.html',
  styleUrl: './novedades-formulario-recurrente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormularioRecurrenteComponent {
  readonly periodicidades = PERIODICIDADES_HD;
  readonly etiquetaPeriodicidad = etiquetaPeriodicidadHd;

  @Input({ required: true }) formulario!: FormularioRecurrenteValores;
  @Input() fieldIdPrefix = 'nm-rec';
  @Input() errores: Partial<Record<string, string>> = {};
  @Input() validacionActiva = false;
  @Input() disabled = false;
  @Input() soporteLoading = false;
  @Input() contratosLoading = false;
  @Input() vigenciaFinMin = '';
  @Input() mostrarCuotas = false;
  @Input() conceptoOptions: SearchSelectOption<number>[] = [];
  @Input() contratosPersona: ContratoResumenPersona[] = [];

  @Output() readonly cambioCampo = new EventEmitter<FormularioRecurrenteCambio>();
  @Output() readonly cambioConcepto = new EventEmitter<number | null>();

  get minFechaHasta(): string {
    return this.formulario.vigenciaInicio?.trim() || this.vigenciaFinMin;
  }

  idCampo(suffix: string): string {
    return `${this.fieldIdPrefix}-${suffix}`;
  }

  errorCampo(campo: string): string {
    return this.validacionActiva ? (this.errores[campo] ?? '') : '';
  }

  emitirCampo<K extends keyof FormularioRecurrenteValores>(
    campo: K,
    valor: FormularioRecurrenteValores[K],
  ): void {
    this.cambioCampo.emit({ campo, valor });
  }

  onConceptoChange(value: number | null): void {
    this.cambioConcepto.emit(value);
  }

  onPeriodicidadChange(value: PeriodicidadHd): void {
    this.emitirCampo('periodicidad', value);
  }

  onMontoChange(raw: string | number | null): void {
    this.emitirCampo('monto', raw == null || raw === '' ? 0 : +raw);
  }

  onPorcentajeChange(raw: string | number | null): void {
    this.emitirCampo('porcentaje', raw == null || raw === '' ? 0 : +raw);
  }
}
