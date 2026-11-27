import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import {
  SearchSelectComponent,
  SearchSelectOption,
  SearchSelectValue,
} from '../../../../shared/components/ui/forms/search-select.component';
import { ParametrosGeneralesCatalogos } from '../../models/parametro-general.model';
import { ParametroCifraComponent } from '../parametro-cifra/parametro-cifra.component';

@Component({
  selector: 'app-parametros-config-cliente-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SearchSelectComponent, ParametroCifraComponent],
  template: `
    <form class="tab-panel parametros-tab-panel parametros-form" [formGroup]="form" (ngSubmit)="enviarFormulario?.()">
      <section class="param-group parametros-section-card" aria-labelledby="gratificacion-title">
        <h2 id="gratificacion-title">Gratificación</h2>
        <div class="field-grid parametros-form-grid field-grid--gratificacion">
          <label class="param-field">
            <span>Porcentaje legal</span>
            <app-parametro-cifra [valor]="25" unidad="%" />
          </label>

          <label class="param-field">
            <span>Factor IMM</span>
            <app-parametro-cifra [control]="form.get('immGratificacion')" unidad="IMM" step="0.01" [editable]="editable" />
          </label>

          <label
            class="param-checkbox-inline"
            [class.param-checkbox-inline--locked]="!editable"
          >
            <input type="checkbox" formControlName="gratificacion" (click)="onReadonlyToggle($event)" />
            <span>Con gratificación</span>
          </label>
          <label class="param-checkbox-inline param-checkbox-inline--locked">
            <input type="checkbox" checked disabled aria-disabled="true" title="Valor normativo fijo" />
            <span>Tope legal</span>
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="ausencias-title">
        <h2 id="ausencias-title">Ausencias</h2>
        <p class="param-section-lead">Método de descuento por ausencias.</p>
        <div class="field-grid parametros-form-grid field-grid--values">
          <label class="erp-choice-radio">
            <span>En base a 30 días</span>
            <input
              type="radio"
              name="descuentosBase"
              [checked]="!(form.get('descuentosBasePorDia')?.value ?? false)"
              [disabled]="!editable"
              (change)="setDescuentosBase(false)"
            />
          </label>
          <label class="erp-choice-radio">
            <span>En base a los días del mes</span>
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

      <section
        class="param-group parametros-section-card parametros-config-card param-group--ccaf-current"
        aria-labelledby="ccaf-title"
      >
        <h2 id="ccaf-title">CCAF y mutual</h2>
        <p class="param-section-lead">
          Caja de compensación, mutual y tasa base usadas como referencia en el período activo.
        </p>
        <div
          class="field-grid parametros-form-grid parametros-form-grid-compact field-grid--ccaf field-grid--ccaf-compact"
          aria-label="Configuración CCAF y mutual"
        >
          <label class="param-field">
            <span>Caja de compensación</span>
            <app-search-select
              class="param-field-search-select"
              [ngModel]="selectedCcafId"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="seleccionarCcaf?.($event)"
              [options]="ccafSelectOptions"
              [disabled]="!editable"
              placeholder="Sin CCAF seleccionada"
              searchPlaceholder="Buscar CCAF"
            ></app-search-select>
          </label>

          <label class="param-field">
            <span>Mutual de Seguridad</span>
            <app-search-select
              class="param-field-search-select"
              [ngModel]="selectedOrganismoLey16744Id"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="seleccionarOrganismoLey16744?.($event)"
              [options]="organismosLeySelectOptions"
              [disabled]="!editable"
              placeholder="Sin mutual seleccionada"
              searchPlaceholder="Buscar mutual"
            ></app-search-select>
          </label>

          <label class="param-field">
            <span>Cotización básica</span>
            <app-parametro-cifra [valor]="selectedLey16744CotizacionBasica" unidad="%" />
          </label>
        </div>
      </section>

      <footer class="tab-footnote tab-footnote--muted">Última actualización: {{ fechaActualizacionLabel }}</footer>
    </form>
  `,
  styles: [
    `
      .param-field-search-select ::ng-deep .select-field {
        border-radius: 6px;
        height: var(--erp-control-height, 21px);
        min-height: var(--erp-control-height, 21px);
      }

      .param-group--ccaf-current {
        width: min(56rem, 100%);
        max-width: 100%;
        align-self: flex-start;
      }

      .field-grid--ccaf-compact {
        max-width: min(56rem, 100%);
      }
    `,
  ],
})
export class ParametrosConfigClienteTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) catalogos!: ParametrosGeneralesCatalogos;
  @Input() editable = false;
  @Input() hasClienteConfig = false;
  @Input() periodoLabel = 'este período';
  @Input() selectedCcafId: number | null = null;
  @Input() selectedOrganismoLey16744Id: number | null = null;
  @Input() selectedLey16744CotizacionBasica: number | null = null;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() enviarFormulario: (() => void) | null = null;
  @Input() bloquearSiLectura: ((event: Event) => void) | null = null;
  @Input() setDescuentosBaseFn: ((value: boolean) => void) | null = null;
  @Input() seleccionarCcaf: ((value: SearchSelectValue) => void) | null = null;
  @Input() seleccionarOrganismoLey16744: ((value: SearchSelectValue) => void) | null = null;

  get ccafSelectOptions(): SearchSelectOption<number | null>[] {
    return [
      { value: null, label: 'Sin CCAF seleccionada' },
      ...this.catalogos.ccafEntidades.map((ccaf) => ({
        value: ccaf.idCcafEntidad,
        label: ccaf.nombre,
      })),
    ];
  }

  get organismosLeySelectOptions(): SearchSelectOption<number | null>[] {
    return [
      { value: null, label: 'Sin mutual seleccionada' },
      ...this.catalogos.organismosLey16744.map((organismo) => ({
        value: organismo.idOrganismoAdministradorLey16744,
        label: organismo.nombre,
      })),
    ];
  }

  onReadonlyToggle(event: Event): void {
    this.bloquearSiLectura?.(event);
  }

  setDescuentosBase(value: boolean): void {
    if (!this.editable) {
      return;
    }
    this.setDescuentosBaseFn?.(value);
  }
}
