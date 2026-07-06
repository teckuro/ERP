import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-parametros-valores-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <form
      class="tab-panel parametros-tab-panel parametros-form"
      [formGroup]="form"
      (ngSubmit)="enviarFormulario?.()"
    >
      <section class="param-group parametros-section-card" aria-labelledby="indicadores-title">
        <h2 id="indicadores-title">Indicadores mensuales</h2>
        <p class="param-section-lead">UF, UTM y UTA del período.</p>
        <div class="field-grid parametros-form-grid field-grid--values">
          <label class="param-field">
            <span>UF (CLP)</span>
            @if (officialEditable) {
              <span class="unit-field unit-field--suffix" data-unit="CLP">
                <input
                  class="param-input text-right"
                  type="number"
                  step="0.01"
                  formControlName="uf"
                />
              </span>
            } @else {
              <span class="param-input-readonly text-right">
                {{ form.get('uf')?.value | number: '1.2-2' : 'es-CL' }}
              </span>
            }
          </label>

          <label class="param-field">
            <span>UTM (CLP)</span>
            @if (officialEditable) {
              <span class="unit-field unit-field--suffix" data-unit="CLP">
                <input
                  class="param-input text-right"
                  type="number"
                  step="1"
                  formControlName="utm"
                />
              </span>
            } @else {
              <span class="param-input-readonly text-right">
                {{ form.get('utm')?.value | number: '1.0-0' : 'es-CL' }}
              </span>
            }
          </label>

          <label class="param-field">
            <span>UTA (CLP)</span>
            @if (officialEditable) {
              <span class="unit-field unit-field--suffix" data-unit="CLP">
                <input
                  class="param-input text-right"
                  type="number"
                  step="1"
                  formControlName="uta"
                />
              </span>
            } @else {
              <span class="param-input-readonly text-right">
                {{ form.get('uta')?.value | number: '1.0-0' : 'es-CL' }}
              </span>
            }
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
  styles: [
    `
      .param-input-readonly {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        height: var(--erp-control-height, 22px);
        min-height: var(--erp-control-height, 22px);
        width: 100%;
        box-sizing: border-box;
        padding: 0 6px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #f8fafc;
        font-size: 0.78rem;
        font-variant-numeric: tabular-nums;
        color: #111827;
      }
    `,
  ],
})
export class ParametrosValoresTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() editable = false;
  @Input() officialEditable = false;
  @Input() configEditable = false;
  @Input() hasPeriodoData = true;
  @Input() hasClienteConfig = false;
  @Input() periodoLabel = 'este período';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() enviarFormulario: (() => void) | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() capturarValores: (() => void) | null = null;
}
