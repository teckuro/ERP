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

@Component({
  selector: 'app-parametros-config-cliente-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SearchSelectComponent],
  template: `
    <form class="tab-panel parametros-tab-panel parametros-form" [formGroup]="form" (ngSubmit)="enviarFormulario?.()">
      <section class="param-group parametros-section-card" aria-labelledby="gratificacion-title">
        <h2 id="gratificacion-title">Gratificacion</h2>
        <div class="field-grid parametros-form-grid field-grid--gratificacion">
          <label class="param-field">
            <span>Porcentaje legal</span>
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

          <label
            class="param-checkbox-inline"
            [class.param-checkbox-inline--locked]="!editable"
          >
            <input type="checkbox" formControlName="gratificacion" (click)="onReadonlyToggle($event)" />
            <span>Con gratificacion</span>
          </label>
          <label class="param-checkbox-inline param-checkbox-inline--locked">
            <input type="checkbox" checked disabled aria-disabled="true" title="Valor normativo fijo" />
            <span>Tope legal</span>
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="ausencias-title">
        <h2 id="ausencias-title">Ausencias</h2>
        <p class="param-section-lead">Metodo de descuento por ausencias.</p>
        <div class="field-grid parametros-form-grid field-grid--values">
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
            <span>En base dias del mes</span>
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
          Caja de compensacion, organismo mutual y tasa base usados como referencia para el periodo activo.
        </p>
        <div
          class="field-grid parametros-form-grid parametros-form-grid-compact field-grid--ccaf field-grid--ccaf-compact"
          aria-label="Configuracion CCAF y mutual"
        >
          <label class="param-field">
            <span>Caja de compensacion</span>
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
            <span>Porcentaje</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input
                class="param-input text-right"
                type="number"
                step="0.01"
                [value]="selectedLey16744CotizacionBasica"
                readonly
              />
            </span>
          </label>
        </div>
      </section>

      <footer class="tab-footnote tab-footnote--muted">Ultima actualizacion: {{ fechaActualizacionLabel }}</footer>
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
  @Input() periodoLabel = 'este periodo';
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
