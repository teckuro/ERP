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
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRight } from 'lucide-angular/src/icons';

import { CalendarInputComponent } from '../../../../../shared/components/ui/forms/calendar-input/calendar-input.component';
import { FieldHelpTipComponent } from '../../../../../shared/components/ui/forms/field-help-tip.component';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/forms/search-select.component';
import type { ContratoResumenPersona } from '../../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type { FormularioMovimientoMesValores } from '../../models/novedades-formulario-movimiento-mes.model';
import {
  CATEGORIAS_MOVIMIENTO_MES,
  ORIGENES_MOVIMIENTO_MES,
  TIPOS_MOVIMIENTO_MES,
  etiquetaCategoriaMovimientoMes,
  etiquetaOrigenMovimientoMes,
  etiquetaTipoMovimientoMes,
} from '../../utils/novedades-formulario-movimiento-mes.labels';

export type FormularioMovimientoMesCambio = {
  campo: keyof FormularioMovimientoMesValores;
  valor: FormularioMovimientoMesValores[keyof FormularioMovimientoMesValores];
};

@Component({
  selector: 'app-novedades-formulario-movimiento-mes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    SearchSelectComponent,
    CalendarInputComponent,
    FieldHelpTipComponent,
  ],
  templateUrl: './novedades-formulario-movimiento-mes.component.html',
  styleUrl: './novedades-formulario-movimiento-mes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NovedadesFormularioMovimientoMesComponent {
  readonly chevronRightIcon = ChevronRight;
  readonly tiposMovimiento = TIPOS_MOVIMIENTO_MES;
  readonly categorias = CATEGORIAS_MOVIMIENTO_MES;
  readonly origenes = ORIGENES_MOVIMIENTO_MES;
  readonly etiquetaTipoMovimiento = etiquetaTipoMovimientoMes;
  readonly etiquetaCategoria = etiquetaCategoriaMovimientoMes;
  readonly etiquetaOrigen = etiquetaOrigenMovimientoMes;

  @Input({ required: true }) formulario!: FormularioMovimientoMesValores;
  @Input() fieldIdPrefix = 'nm';
  @Input() mostrarTrabajador = false;
  @Input() detalleAdminCompleto = true;
  @Input() mostrarDetalleAdmin = true;
  @Input() errores: Partial<Record<string, string>> = {};
  @Input() validacionActiva = false;
  @Input() camposTocados: Partial<Record<string, boolean>> = {};
  @Input() disabled = false;
  @Input() soporteLoading = false;
  @Input() contratosLoading = false;
  @Input() periodoMin = '';
  @Input() periodoMax = '';
  @Input() periodoEtiqueta = '';
  @Input() conceptoOptions: SearchSelectOption<number>[] = [];
  @Input() empleadoOptions: SearchSelectOption<number>[] = [];
  @Input() contratosPersona: ContratoResumenPersona[] = [];

  @Output() readonly cambioCampo = new EventEmitter<FormularioMovimientoMesCambio>();
  @Output() readonly cambioConcepto = new EventEmitter<number | null>();
  @Output() readonly cambioTrabajador = new EventEmitter<number | null>();
  @Output() readonly campoTocado = new EventEmitter<keyof FormularioMovimientoMesValores>();

  idCampo(suffix: string): string {
    return `${this.fieldIdPrefix}-${suffix}`;
  }

  errorCampo(campo: keyof FormularioMovimientoMesValores): string {
    const mensaje = this.errores[campo];
    if (!mensaje) {
      return '';
    }
    if (!this.validacionActiva && !this.camposTocados[campo]) {
      return '';
    }
    return mensaje;
  }

  emitCampo<K extends keyof FormularioMovimientoMesValores>(
    campo: K,
    valor: FormularioMovimientoMesValores[K],
  ): void {
    this.cambioCampo.emit({ campo, valor });
  }

  onConceptoChange(valor: number | string | null): void {
    const idConcepto = valor == null ? null : +valor;
    this.cambioConcepto.emit(idConcepto);
  }

  onTrabajadorChange(valor: number | string | null): void {
    const idPersona = valor == null ? null : +valor;
    this.cambioTrabajador.emit(idPersona);
  }

  onMontoChange(valor: number | string | null): void {
    this.emitCampo('monto', valor == null || valor === '' ? null : +valor);
  }

  onContratoChange(valor: number | string | null): void {
    this.emitCampo('idContrato', valor == null || valor === '' ? null : +valor);
  }

  onCantidadChange(valor: number | string | null): void {
    this.emitCampo('cantidad', valor == null || valor === '' ? null : +valor);
  }

  marcarTocado(campo: keyof FormularioMovimientoMesValores): void {
    this.campoTocado.emit(campo);
  }
}
