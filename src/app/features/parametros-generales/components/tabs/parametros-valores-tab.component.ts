import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-parametros-valores-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <form class="tab-panel parametros-form" [formGroup]="form" (ngSubmit)="onSubmit?.()">
      <section class="param-group" aria-labelledby="indicadores-title">
        <h2 id="indicadores-title">Indicadores</h2>
        <div class="field-grid field-grid--values">
          <label class="param-field">
            <span>Valor U.F.</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="0.01" formControlName="uf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Valor U.T.M.</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="utm" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Valor U.T.A.</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="uta" [readonly]="!editable" />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="gratificacion-title">
        <h2 id="gratificacion-title">Gratificacion</h2>
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

          <label class="param-check erp-flag-check">
            <span>Con Gratificacion</span>
            <input type="checkbox" formControlName="gratificacion" (click)="onReadonlyToggle($event)" />
          </label>

          <label class="param-check erp-flag-check">
            <span>Tope Legal</span>
            <input type="checkbox" checked disabled />
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="ausencias-title">
        <h2 id="ausencias-title">Metodo de Descuento Ausencias</h2>
        <div class="radio-row">
          <label class="erp-choice-radio">
            <span>En base 30 dias</span>
            <input
              type="radio"
              name="descuentosBase"
              [checked]="!(form.get('descuentosBasePorDia')?.value ?? false)"
              [disabled]="!editable"
              (change)="setDescuentosBase(false)"
            />
          </label>
          <label class="erp-choice-radio">
            <span>En base dias del Mes</span>
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

      <footer class="tab-footnote">Ultima actualizacion: {{ fechaActualizacionLabel || 'Sin registro' }}</footer>
    </form>
  `,
})
export class ParametrosValoresTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() editable = false;
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

