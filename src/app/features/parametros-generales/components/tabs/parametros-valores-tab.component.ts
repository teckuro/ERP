import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import type { ParametroGeneral } from '../../models/parametro-general.model';

import { fechaUfDelPeriodo } from '../../utils/parametros-formato';
import { ParametroCifraComponent } from '../parametro-cifra/parametro-cifra.component';

@Component({
  selector: 'app-parametros-valores-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ParametroCifraComponent],
  template: `
    <form
      class="tab-panel parametros-tab-panel parametros-form"
      [formGroup]="form"
      (ngSubmit)="enviarFormulario?.()"
    >
      <section class="param-group parametros-section-card" aria-labelledby="indicadores-title">
        <h2 id="indicadores-title">Indicadores mensuales</h2>
        <div class="field-grid parametros-form-grid field-grid--values">
          <label class="param-field">
            <span>UF</span>
            <app-parametro-cifra
              [control]="form.get('uf')" [oficial]="oficial?.uf"
              unidad="CLP"
              [decimales]="{ min: 2, max: 2 }"
              step="0.01"
              [editable]="officialEditable"
              [destacada]="true"
              [nota]="notaUf"
            />
          </label>

          <label class="param-field">
            <span>UTM</span>
            <app-parametro-cifra
              [control]="form.get('utm')" [oficial]="oficial?.utm"
              unidad="CLP"
              step="1"
              [editable]="officialEditable"
              [destacada]="true"
            />
          </label>

          <label class="param-field">
            <span>UTA</span>
            <app-parametro-cifra
              [control]="form.get('uta')" [oficial]="oficial?.uta"
              unidad="CLP"
              step="1"
              [editable]="officialEditable"
              [destacada]="true"
            />
          </label>
        </div>
      </section>

      @if (fechaActualizacionLabel) {
        <footer class="tab-footnote tab-footnote--muted">
          Última actualización: {{ fechaActualizacionLabel }}
        </footer>
      }
    </form>
  `,
})
export class ParametrosValoresTabComponent {
  @Input({ required: true }) form!: FormGroup;
  /** Fila oficial del mes; si la configuración del cliente difiere, cada cifra lo indica. */
  @Input() oficial: ParametroGeneral | null = null;
  @Input() editable = false;
  @Input() officialEditable = false;
  @Input() configEditable = false;
  @Input() hasPeriodoData = true;
  @Input() hasClienteConfig = false;
  @Input() periodoLabel = 'este período';
  /** Período `AAAA-MM`: fija la fecha a la que corresponde la UF. */
  @Input() periodoYm: string | null = null;
  /** Período del que vienen los valores mostrados; difiere de `periodoYm` si se muestra una referencia. */
  @Input() periodoIndicadoresYm: string | null = null;
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() enviarFormulario: (() => void) | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() capturarValores: (() => void) | null = null;

  get notaUf(): string | null {
    const origen = this.periodoIndicadoresYm ?? this.periodoYm;
    // En edición se captura la UF del período seleccionado; en lectura puede mostrarse la de referencia.
    if (this.officialEditable || !origen || origen === this.periodoYm) {
      const fecha = fechaUfDelPeriodo(this.periodoYm);
      return fecha ? `Valor al último día del período (${fecha})` : null;
    }
    const fechaReferencia = fechaUfDelPeriodo(origen);
    return fechaReferencia
      ? `Referencia: valor al ${fechaReferencia}. Falta la carga oficial del período.`
      : null;
  }
}
