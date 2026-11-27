import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ParametroCifraComponent } from '../parametro-cifra/parametro-cifra.component';

@Component({
  selector: 'app-parametros-remuneraciones-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ParametroCifraComponent],
  template: `
    <form class="tab-panel parametros-tab-panel parametros-form" [formGroup]="form" (ngSubmit)="enviarFormulario?.()">
      <section class="param-group parametros-section-card" aria-labelledby="rentas-title">
        <h2 id="rentas-title">Remuneraciones</h2>
        <p class="param-section-lead">Rentas mínimas imponibles y montos base.</p>
        <div class="field-grid parametros-form-grid field-grid--rentas">
          <label class="param-field">
            <span>Sueldo mínimo</span>
            <app-parametro-cifra [control]="form.get('sueldoMinimo')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Sueldo mínimo 18 a 65</span>
            <app-parametro-cifra [control]="form.get('sueldoMinimo18a65')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Menores de 18 y mayores de 65</span>
            <app-parametro-cifra [control]="form.get('sueldoMinimoMenor18Mayor65')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Casa particular</span>
            <app-parametro-cifra [control]="form.get('sueldoMinimoCasaParticular')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Ingreso mínimo no remuneracional</span>
            <app-parametro-cifra [control]="form.get('ingresoMinimoNoRemuneracional')" unidad="CLP" step="1" [editable]="editable" />
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="afc-title">
        <h2 id="afc-title">AFC (seguro de cesantía)</h2>
        <p class="param-section-lead">Porcentajes de cotización según tipo de contrato.</p>
        <div class="field-grid parametros-form-grid field-grid--afc">
          <label class="param-field">
            <span>Empleado</span>
            <app-parametro-cifra [control]="form.get('afcTrabajadorIndefinido')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Empleador</span>
            <app-parametro-cifra [control]="form.get('afcEmpleadorIndefinido')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Empleador plazo fijo / obra</span>
            <app-parametro-cifra [control]="form.get('afcEmpleadorPlazo')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Empleador indefinido 11 años o más</span>
            <app-parametro-cifra [control]="form.get('afcEmpleadorIndefinidoOnceAnosMas')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Empleador casa particular</span>
            <app-parametro-cifra [control]="form.get('afcEmpleadorCasaParticular')" unidad="%" step="0.001" [editable]="editable" />
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="sis-title">
        <h2 id="sis-title">SIS, SANNA y cotizaciones empleador</h2>
        <p class="param-section-lead">Porcentajes aplicados sobre la remuneración imponible.</p>
        <div class="field-grid parametros-form-grid field-grid--sis">
          <label class="param-field">
            <span>SIS</span>
            <app-parametro-cifra [control]="form.get('sis')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>SANNA</span>
            <app-parametro-cifra [control]="form.get('sanna')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Seguro social expectativa de vida</span>
            <app-parametro-cifra [control]="form.get('seguroSocialExpectativaVida')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Aporte empleador AFP</span>
            <app-parametro-cifra [control]="form.get('aporteEmpleadorAfp')" unidad="%" step="0.001" [editable]="editable" />
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="topes-title">
        <h2 id="topes-title">Topes imponibles</h2>
        <p class="param-section-lead">Límites en UF y en pesos por concepto.</p>
        <div class="field-grid parametros-form-grid field-grid--topes">
          <h3 class="param-subsection-title param-subsection-title--first">AFP</h3>
          <label class="param-field">
            <span>Tope en UF</span>
            <app-parametro-cifra [control]="form.get('topeAfpUf')" unidad="UF" step="0.01" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Equivalente en pesos</span>
            <app-parametro-cifra [control]="form.get('topeAfp')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <h3 class="param-subsection-title">IPS</h3>
          <label class="param-field">
            <span>Tope en UF</span>
            <app-parametro-cifra [control]="form.get('topeIpsUf')" unidad="UF" step="0.01" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Equivalente en pesos</span>
            <app-parametro-cifra [control]="form.get('topeIps')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <h3 class="param-subsection-title">Cesantía</h3>
          <label class="param-field">
            <span>Tope en UF</span>
            <app-parametro-cifra [control]="form.get('topeCesantiaUf')" unidad="UF" step="0.01" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Equivalente en pesos</span>
            <app-parametro-cifra [control]="form.get('topeCesantia')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <h3 class="param-subsection-title">APV voluntario</h3>
          <label class="param-field">
            <span>Mensual en UF</span>
            <app-parametro-cifra [control]="form.get('topeApvMensualUf')" unidad="UF" step="0.01" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Mensual en pesos</span>
            <app-parametro-cifra [control]="form.get('topeApvMensual')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Tope AFP voluntario</span>
            <app-parametro-cifra [control]="form.get('topeAfpVoluntario')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Anual en UF</span>
            <app-parametro-cifra [control]="form.get('topeApvAnualUf')" unidad="UF" step="0.01" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Anual en pesos</span>
            <app-parametro-cifra [control]="form.get('topeApvAnual')" unidad="CLP" step="1" [editable]="editable" />
          </label>

          <h3 class="param-subsection-title">Depósito convenido</h3>
          <label class="param-field">
            <span>Anual en UF</span>
            <app-parametro-cifra [control]="form.get('topeDepositoConvenidoAnualUf')" unidad="UF" step="0.01" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Anual en pesos</span>
            <app-parametro-cifra [control]="form.get('topeDepositoConvenidoAnual')" unidad="CLP" step="1" [editable]="editable" />
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="salud-title">
        <h2 id="salud-title">Salud</h2>
        <p class="param-section-lead">Cotizaciones de salud.</p>
        <div class="field-grid parametros-form-grid field-grid--rentas">
          <label class="param-field">
            <span>Salud obligatoria</span>
            <app-parametro-cifra [control]="form.get('saludObligatoria')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Salud CCAF</span>
            <app-parametro-cifra [control]="form.get('saludCcaf')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Salud Fonasa con CCAF</span>
            <app-parametro-cifra [control]="form.get('saludFonasaConCcaf')" unidad="%" step="0.001" [editable]="editable" />
          </label>
        </div>
      </section>

      <section class="param-group parametros-section-card" aria-labelledby="trabajo-pesado-title">
        <h2 id="trabajo-pesado-title">Trabajo pesado y menos pesado</h2>
        <p class="param-section-lead">Porcentajes adicionales por riesgo.</p>
        <div class="field-grid parametros-form-grid field-grid--rentas">
          <label class="param-field">
            <span>Trabajo pesado empleador</span>
            <app-parametro-cifra [control]="form.get('trabajoPesadoEmpleador')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Trabajo pesado trabajador</span>
            <app-parametro-cifra [control]="form.get('trabajoPesadoTrabajador')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Trabajo menos pesado empleador</span>
            <app-parametro-cifra [control]="form.get('trabajoMenosPesadoEmpleador')" unidad="%" step="0.001" [editable]="editable" />
          </label>

          <label class="param-field">
            <span>Trabajo menos pesado trabajador</span>
            <app-parametro-cifra [control]="form.get('trabajoMenosPesadoTrabajador')" unidad="%" step="0.001" [editable]="editable" />
          </label>
        </div>
      </section>

      <footer class="tab-footnote tab-footnote--muted">Última actualización: {{ fechaActualizacionLabel }}</footer>
    </form>
  `,
})
export class ParametrosRemuneracionesTabComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() editable = false;
  @Input() hasPeriodoData = true;
  @Input() hasClienteConfig = false;
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() fechaActualizacionLabel: string | null = null;
  @Input() enviarFormulario: (() => void) | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
}
