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
      @if (editable) {
        <p class="parametros-valores-aviso" role="note">
          Al guardar se persisten también los cambios de Remuneraciones y Cliente para este período.
        </p>
      }

      @if (!hasPeriodoData && !editable) {
        @if (referenciaPeriodoLabel) {
          <section
            class="param-group parametros-section-card parametros-empty"
            aria-labelledby="empty-title"
          >
            <h2 id="empty-title">Sin datos oficiales para {{ periodoLabel }}</h2>
            <p class="param-section-lead">
              Aún no se cargó el período. Puedes revisar la referencia disponible o esperar la carga oficial.
            </p>
            <p class="parametros-valores-referencia">
              Referencia disponible: <strong>{{ referenciaPeriodoLabel }}</strong>
            </p>
          </section>
        } @else {
          <section
            class="param-group parametros-section-card parametros-empty"
            aria-labelledby="empty-title"
          >
            <h2 id="empty-title">Sin datos oficiales para {{ periodoLabel }}</h2>
            <p class="param-section-lead">
              El proceso normativo del mes aún no se ha ejecutado para este período.
            </p>
          </section>
        }
      } @else {
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
      }

      @if (fechaActualizacionLabel) {
        <footer class="tab-footnote tab-footnote--muted">
          Última actualización: {{ fechaActualizacionLabel }}
        </footer>
      }
    </form>
  `,
  styles: [
    `
      .parametros-valores-aviso {
        margin: 0 0 0.75rem 0;
        padding: 0.5rem 0.75rem;
        background: var(--noia-tone-info-bg, #f1f5f9);
        border: 1px solid var(--noia-tone-info-border, #cbd5e1);
        border-radius: 6px;
        font-size: 0.85rem;
        color: var(--noia-tone-info-text, #1e293b);
      }

      .parametros-empty {
        text-align: left;
      }

      .parametros-valores-referencia {
        margin: 0.5rem 0 0 0;
        font-size: 0.9rem;
        color: var(--noia-text-secondary, #475569);
      }

      .param-input-readonly {
        display: inline-block;
        padding: 0.35rem 0.55rem;
        background: transparent;
        font-variant-numeric: tabular-nums;
        color: var(--noia-text-primary, #1e293b);
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
}
