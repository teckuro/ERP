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
import type { ContratoResumenPersona } from '../../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { MOTIVOS_AUSENCIA_OPCIONES, requiereFolioLicencia } from '../../models/motivo-ausencia.model';
import type { FormularioAusenciaLicenciaValores } from '../../presenters/novedades-formulario-ausencia-licencia.presenter';

export type FormularioAusenciaLicenciaCambio = {
  campo: keyof FormularioAusenciaLicenciaValores;
  valor: FormularioAusenciaLicenciaValores[keyof FormularioAusenciaLicenciaValores];
};

@Component({
  selector: 'app-novedades-formulario-ausencia-licencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchSelectComponent,
    CalendarInputComponent,
    FieldHelpTipComponent,
  ],
  templateUrl: './novedades-formulario-ausencia-licencia.component.html',
  styleUrl: './novedades-formulario-ausencia-licencia.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormularioAusenciaLicenciaComponent {
  readonly motivos = MOTIVOS_AUSENCIA_OPCIONES;
  readonly requiereFolioLicencia = requiereFolioLicencia;

  @Input({ required: true }) formulario!: FormularioAusenciaLicenciaValores;
  @Input() fieldIdPrefix = 'nm-aus';
  @Input() mostrarTrabajador = false;
  @Input() errores: Partial<Record<string, string>> = {};
  @Input() validacionActiva = false;
  @Input() camposTocados: Partial<Record<string, boolean>> = {};
  @Input() disabled = false;
  @Input() soporteLoading = false;
  @Input() periodoMin = '';
  @Input() periodoMax = '';
  @Input() periodoEtiqueta = '';
  @Input() empleadoOptions: SearchSelectOption<number>[] = [];

  @Output() readonly cambioCampo = new EventEmitter<FormularioAusenciaLicenciaCambio>();
  @Output() readonly cambioTrabajador = new EventEmitter<number | null>();
  @Output() readonly cambioMotivo = new EventEmitter<string>();

  get minFechaHasta(): string {
    return this.formulario.fechaEvento?.trim() || this.periodoMin;
  }

  get etiquetaDiasCalculados(): string {
    if (this.formulario.cantidad == null) {
      return '—';
    }
    if (this.formulario.cantidad <= 0) {
      return 'Sin días en el período';
    }
    const n = this.formulario.cantidad;
    return `${n} día${n === 1 ? '' : 's'}`;
  }

  idCampo(suffix: string): string {
    return `${this.fieldIdPrefix}-${suffix}`;
  }

  errorCampo(campo: string): string {
    return this.validacionActiva ? (this.errores[campo] ?? '') : '';
  }

  emitirCampo<K extends keyof FormularioAusenciaLicenciaValores>(
    campo: K,
    valor: FormularioAusenciaLicenciaValores[K],
  ): void {
    this.cambioCampo.emit({ campo, valor });
  }

  onMotivoChange(value: string): void {
    this.cambioMotivo.emit(value);
  }
}
