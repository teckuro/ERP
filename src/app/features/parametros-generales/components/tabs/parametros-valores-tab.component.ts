import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-parametros-valores-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="tab-panel parametros-form" [formGroup]="form" (ngSubmit)="onSubmit?.()">
      @if (hasPeriodoData) {
        <div class="param-hint param-hint--editable" role="note">
          <span class="param-hint__tag">{{ editable ? 'Editando' : 'Cargado' }}</span>
          @if (editable) {
            <span class="param-hint__text">Los cambios se guardan con el botón Guardar de la barra superior.</span>
          } @else {
            <span class="param-hint__text">Estos datos se modifican desde el botón Modificar de la barra superior.</span>
          }
        </div>
      } @else {
        <div class="param-hint param-hint--consulta param-hint--inline" role="note">
          <span class="param-hint__tag">Sin datos del período</span>
          <span class="param-hint__text">Crea parámetros para habilitar edición en esta sección.</span>
        </div>
      }
      <section class="param-group" aria-labelledby="indicadores-title">
        <h2 id="indicadores-title">Indicadores mensuales</h2>
        <p class="param-section-lead">UF, UTM y UTA del periodo.</p>
        <div class="field-grid field-grid--values">
          <label class="param-field">
            <span>UF (CLP)</span>
            <span class="unit-field unit-field--suffix" data-unit="CLP">
              <input class="param-input text-right" type="number" step="0.01" formControlName="uf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>UTM (CLP)</span>
            <span class="unit-field unit-field--suffix" data-unit="CLP">
              <input class="param-input text-right" type="number" step="1" formControlName="utm" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>UTA (CLP)</span>
            <span class="unit-field unit-field--suffix" data-unit="CLP">
              <input class="param-input text-right" type="number" step="1" formControlName="uta" [readonly]="!editable" />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="gratificacion-title">
        <h2 id="gratificacion-title">Gratificación</h2>
        <div class="field-grid field-grid--gratificacion">
          <label class="param-field">
            <span>Porcentaje (legal)</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.01" [value]="25" readonly />
            </span>
          </label>

          <label class="param-field">
            <span>Factor I.M.M</span>
            <span class="unit-field unit-field--suffix" data-unit="IMM">
              <input
                class="param-input text-right"
                type="number"
                step="0.01"
                formControlName="immGratificacion"
                [readonly]="!editable"
              />
            </span>
          </label>

          <label class="param-checkbox-inline">
            <input type="checkbox" formControlName="gratificacion" (click)="onReadonlyToggle($event)" />
            <span>Con gratificación</span>
          </label>
          <label class="param-checkbox-inline">
            <input type="checkbox" checked disabled />
            <span>Tope legal</span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="ausencias-title">
        <h2 id="ausencias-title">Configuración general</h2>
        <p class="param-section-lead">Método de descuento por ausencias.</p>
        <div class="field-grid field-grid--values">
          <label class="erp-choice-radio">
            <span>En base 30 días</span>
            <input
              type="radio"
              name="descuentosBase"
              [checked]="!(form.get('descuentosBasePorDia')?.value ?? false)"
              [disabled]="!editable"
              (change)="setDescuentosBase(false)"
            />
          </label>
          <label class="erp-choice-radio">
            <span>En base días del mes</span>
            <input
              type="radio"
              name="descuentosBase"
              [checked]="(form.get('descuentosBasePorDia')?.value ?? false)"
              [disabled]="!editable"
              (change)="setDescuentosBase(true)"
            />
          </label>
        </div>
      </section>

      <footer class="tab-footnote tab-footnote--muted">Última actualización: {{ fechaActualizacionLabel }}</footer>
    </form>
  `,
})
export class ParametrosValoresTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() editable = false;
  @Input() hasPeriodoData = true;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() onSubmit: (() => void) | null = null;

  @Input() bloquearSiLectura: ((event: Event) => void) | null = null;
  @Input() setDescuentosBaseFn: ((value: boolean) => void) | null = null;

  onReadonlyToggle(event: Event): void {
    this.bloquearSiLectura?.(event);
  }

  setDescuentosBase(value: boolean): void {
    if (this.setDescuentosBaseFn) {
      this.setDescuentosBaseFn(value);
      return;
    }

    if (!this.editable) {
      return;
    }

    const control = (this.form as any)?.controls?.descuentosBasePorDia;
    control?.setValue?.(value);
  }
}

