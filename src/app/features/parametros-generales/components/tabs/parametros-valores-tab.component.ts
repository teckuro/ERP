import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-parametros-valores-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="tab-panel parametros-tab-panel parametros-form" [formGroup]="form" (ngSubmit)="onSubmit?.()">
      @if (!hasPeriodoData) {
        <section class="param-pending-notice" aria-label="Estado de carga mensual">
          <div>
            <h2>
              @if (hasClienteConfig) {
                Configuracion cliente para {{ periodoLabel }}.
              } @else if (referenciaPeriodoLabel) {
                Valores de referencia disponibles.
              } @else {
                Sin base mensual para {{ periodoLabel }}.
              }
            </h2>
            <p>
              @if (hasClienteConfig) {
                La configuracion pertenece al periodo seleccionado; los oficiales siguen pendientes.
              } @else if (referenciaPeriodoLabel) {
                Estos valores son una referencia anterior. La carga oficial del periodo aun no esta disponible.
              } @else {
                Puedes crear una configuracion inicial desde Modificar.
              }
            </p>
          </div>
          @if (!hasClienteConfig && referenciaPeriodoLabel) {
            <button type="button" class="param-reference-callout__action" (click)="verReferenciaPeriodoAnterior?.()">
              Ver referencia {{ referenciaPeriodoLabel }}
            </button>
          }
        </section>
      }

      <section class="param-group parametros-section-card" aria-labelledby="indicadores-title">
        <h2 id="indicadores-title">Indicadores mensuales</h2>
        <p class="param-section-lead">UF, UTM y UTA del periodo.</p>
        <div class="field-grid parametros-form-grid field-grid--values">
          <label class="param-field">
            <span>UF (CLP)</span>
            <span class="unit-field unit-field--suffix" data-unit="CLP">
              <input class="param-input text-right" type="number" step="0.01" formControlName="uf" [readonly]="!officialEditable" />
            </span>
          </label>

          <label class="param-field">
            <span>UTM (CLP)</span>
            <span class="unit-field unit-field--suffix" data-unit="CLP">
              <input class="param-input text-right" type="number" step="1" formControlName="utm" [readonly]="!officialEditable" />
            </span>
          </label>

          <label class="param-field">
            <span>UTA (CLP)</span>
            <span class="unit-field unit-field--suffix" data-unit="CLP">
              <input class="param-input text-right" type="number" step="1" formControlName="uta" [readonly]="!officialEditable" />
            </span>
          </label>
        </div>
      </section>

      <footer class="tab-footnote tab-footnote--muted">Ultima actualizacion: {{ fechaActualizacionLabel }}</footer>
    </form>
  `,
})
export class ParametrosValoresTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() editable = false;
  @Input() officialEditable = false;
  @Input() configEditable = false;
  @Input() hasPeriodoData = true;
  @Input() hasClienteConfig = false;
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() onSubmit: (() => void) | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
}
