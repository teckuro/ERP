import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-parametros-remuneraciones-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="tab-panel parametros-form" [formGroup]="form" (ngSubmit)="onSubmit?.()">
      <section class="param-group" aria-labelledby="rentas-title">
        <h2 id="rentas-title">Rentas Minimas Imponibles</h2>
        <div class="field-grid field-grid--rentas">
          <label class="param-field">
            <span>Sueldo minimo 18 a 65</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="sueldoMinimo18a65" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Menores de 18 y Mayores de 65</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input
                class="param-input text-right"
                type="number"
                step="1"
                formControlName="sueldoMinimoMenor18Mayor65"
                [readonly]="!editable"
              />
            </span>
          </label>

          <label class="param-field">
            <span>Casa particular</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="sueldoMinimoCasaParticular" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Ingreso minimo no remuneracional</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input
                class="param-input text-right"
                type="number"
                step="1"
                formControlName="ingresoMinimoNoRemuneracional"
                [readonly]="!editable"
              />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="afc-title">
        <h2 id="afc-title">Seguro de Cesantia (AFC)</h2>
        <div class="field-grid field-grid--afc">
          <label class="param-field">
            <span>Empleado</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="afcTrabajadorIndefinido" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Empleador</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="afcEmpleadorIndefinido" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Empleador plazo fijo / obra</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="afcEmpleadorPlazo" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Empleador indefinido 11 anos o mas</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input
                class="param-input text-right"
                type="number"
                step="0.001"
                formControlName="afcEmpleadorIndefinidoOnceAnosMas"
                [readonly]="!editable"
              />
            </span>
          </label>

          <label class="param-field">
            <span>Empleador casa particular</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input
                class="param-input text-right"
                type="number"
                step="0.001"
                formControlName="afcEmpleadorCasaParticular"
                [readonly]="!editable"
              />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="sis-title">
        <h2 id="sis-title">Cotizaciones Empleador</h2>
        <div class="field-grid field-grid--sis">
          <label class="param-field">
            <span>SIS</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="sis" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>SANNA</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="sanna" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Seguro social expectativa de vida</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input
                class="param-input text-right"
                type="number"
                step="0.001"
                formControlName="seguroSocialExpectativaVida"
                [readonly]="!editable"
              />
            </span>
          </label>

          <label class="param-field">
            <span>Aporte empleador AFP</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="aporteEmpleadorAfp" [readonly]="!editable" />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="topes-title">
        <h2 id="topes-title">Topes</h2>
        <div class="field-grid field-grid--topes">
          <label class="param-field">
            <span>AFP UF</span>
            <span class="unit-field unit-field--suffix" data-unit="UF">
              <input class="param-input text-right" type="number" step="0.01" formControlName="topeAfpUf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>AFP pesos</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="topeAfp" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>IPS UF</span>
            <span class="unit-field unit-field--suffix" data-unit="UF">
              <input class="param-input text-right" type="number" step="0.01" formControlName="topeIpsUf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>IPS pesos</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="topeIps" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Cesantia UF</span>
            <span class="unit-field unit-field--suffix" data-unit="UF">
              <input class="param-input text-right" type="number" step="0.01" formControlName="topeCesantiaUf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Cesantia pesos</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="topeCesantia" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>APV mensual UF</span>
            <span class="unit-field unit-field--suffix" data-unit="UF">
              <input class="param-input text-right" type="number" step="0.01" formControlName="topeApvMensualUf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>APV mensual pesos</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="topeApvMensual" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>APV anual UF</span>
            <span class="unit-field unit-field--suffix" data-unit="UF">
              <input class="param-input text-right" type="number" step="0.01" formControlName="topeApvAnualUf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>APV anual pesos</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input class="param-input text-right" type="number" step="1" formControlName="topeApvAnual" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Deposito convenido anual UF</span>
            <span class="unit-field unit-field--suffix" data-unit="UF">
              <input
                class="param-input text-right"
                type="number"
                step="0.01"
                formControlName="topeDepositoConvenidoAnualUf"
                [readonly]="!editable"
              />
            </span>
          </label>

          <label class="param-field">
            <span>Deposito convenido anual pesos</span>
            <span class="unit-field unit-field--suffix" data-unit="$">
              <input
                class="param-input text-right"
                type="number"
                step="1"
                formControlName="topeDepositoConvenidoAnual"
                [readonly]="!editable"
              />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="salud-title">
        <h2 id="salud-title">Salud</h2>
        <div class="field-grid field-grid--rentas">
          <label class="param-field">
            <span>Salud obligatoria</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="saludObligatoria" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Salud CCAF</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="saludCcaf" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Salud Fonasa con CCAF</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="saludFonasaConCcaf" [readonly]="!editable" />
            </span>
          </label>
        </div>
      </section>

      <section class="param-group" aria-labelledby="trabajo-pesado-title">
        <h2 id="trabajo-pesado-title">Trabajo Pesado</h2>
        <div class="field-grid field-grid--rentas">
          <label class="param-field">
            <span>Trabajo pesado empleador</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="trabajoPesadoEmpleador" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Trabajo pesado trabajador</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="trabajoPesadoTrabajador" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Trabajo menos pesado empleador</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="trabajoMenosPesadoEmpleador" [readonly]="!editable" />
            </span>
          </label>

          <label class="param-field">
            <span>Trabajo menos pesado trabajador</span>
            <span class="unit-field unit-field--suffix" data-unit="%">
              <input class="param-input text-right" type="number" step="0.001" formControlName="trabajoMenosPesadoTrabajador" [readonly]="!editable" />
            </span>
          </label>
        </div>
      </section>

      <footer class="tab-footnote">Ultima actualizacion: {{ fechaActualizacionLabel || 'Sin registro' }}</footer>
    </form>
  `,
})
export class ParametrosRemuneracionesTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() editable = false;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() onSubmit: (() => void) | null = null;
}

