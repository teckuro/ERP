import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  DecimalesCifra,
  UnidadParametro,
  formatearCifraParametro,
  numeroParametro,
} from '../../utils/parametros-formato';

/**
 * Cifra de un parámetro mensual. En edición muestra el input numérico con su unidad;
 * en lectura, la cifra formateada en es-CL (`$529.000`, `87,8 UF`, `0,6 %`).
 */
@Component({
  selector: 'app-parametro-cifra',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (editable && formControl) {
      <span class="unit-field unit-field--suffix" [attr.data-unit]="unidad === 'CLP' ? '$' : unidad">
        <input
          class="param-input text-right"
          type="number"
          [step]="step"
          [formControl]="formControl"
          [attr.aria-invalid]="error ? 'true' : null"
        />
      </span>
      @if (error) {
        <small class="param-cifra__error" role="alert">{{ error }}</small>
      }
    } @else {
      <span
        class="param-cifra"
        [class.param-cifra--destacada]="destacada"
        [class.param-cifra--vacia]="texto === null"
      >
        @if (texto === null) {
          <span class="param-cifra__vacio">Sin valor</span>
        } @else {
          <span class="param-cifra__numero">{{ texto }}</span>
          @if (unidad !== 'CLP') {
            <span class="param-cifra__unidad">{{ unidad }}</span>
          }
        }
      </span>
    }
    @if (textoOficialDistinto; as oficialTexto) {
      <small class="param-cifra__nota param-cifra__nota--oficial">Oficial del mes: {{ oficialTexto }}</small>
    }
    @if (nota) {
      <small class="param-cifra__nota">{{ nota }}</small>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }

      .param-cifra {
        display: flex;
        align-items: baseline;
        justify-content: flex-end;
        gap: 0.3em;
        box-sizing: border-box;
        height: var(--erp-control-height, 21px);
        padding: 0 8px;
        border-radius: 6px 6px 0 0;
        background: var(--prm-soft, #f8fafc);
        box-shadow: inset 0 -1px 0 var(--prm-line, #d7dde5);
        color: var(--prm-ink, #111827);
        font-size: 0.8rem;
        font-weight: 600;
        line-height: var(--erp-control-height, 21px);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
      }

      .param-cifra__unidad {
        color: var(--prm-muted, #6b7280);
        font-size: 0.68rem;
        font-weight: 600;
      }

      .param-cifra__vacio {
        color: var(--prm-muted, #6b7280);
        font-size: 0.72rem;
        font-weight: 500;
      }

      .param-cifra--destacada {
        height: auto;
        padding: 6px 10px 5px;
        font-size: 1.2rem;
        font-weight: 650;
        line-height: 1.2;
        letter-spacing: -0.01em;
      }

      .param-cifra--destacada .param-cifra__unidad {
        font-size: 0.75rem;
      }

      .param-cifra__nota {
        display: block;
        margin-top: 4px;
        color: var(--prm-muted, #6b7280);
        font-size: 0.68rem;
        font-weight: 500;
        line-height: 1.35;
        text-align: right;
      }

      /* Difiere del oficial: tono ámbar, el mismo de los pendientes del cierre. */
      .param-cifra__nota--oficial {
        color: #92400e;
      }

      .unit-field:has(.param-input.ng-invalid.ng-touched) {
        border-color: #dc2626;
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.12);
      }

      .param-cifra__error {
        display: block;
        margin-top: 4px;
        color: #b91c1c;
        font-size: 0.68rem;
        font-weight: 600;
        line-height: 1.3;
        text-align: right;
      }
    `,
  ],
})
export class ParametroCifraComponent {
  /** Control del formulario. Sin control, la cifra se muestra siempre en lectura con `valor`. */
  @Input() control: AbstractControl | null = null;
  @Input() valor: number | null = null;
  @Input({ required: true }) unidad!: UnidadParametro;
  @Input() decimales: DecimalesCifra | undefined;
  @Input() step = 'any';
  @Input() editable = false;
  @Input() destacada = false;
  @Input() nota: string | null = null;
  /** Valor oficial del mes. Si la cifra mostrada (configuración del cliente) difiere, se indica debajo. */
  @Input() oficial: number | null | undefined = undefined;

  get formControl(): FormControl | null {
    return this.control instanceof FormControl ? this.control : null;
  }

  private get valorActual(): unknown {
    return this.control ? this.control.value : this.valor;
  }

  get texto(): string | null {
    return formatearCifraParametro(this.valorActual, this.unidad, this.decimales);
  }

  get textoOficialDistinto(): string | null {
    const oficial = numeroParametro(this.oficial);
    const actual = numeroParametro(this.valorActual);
    if (oficial === null || actual === null || Math.abs(oficial - actual) < 1e-9) {
      return null;
    }
    const cifra = formatearCifraParametro(oficial, this.unidad, this.decimales);
    return this.unidad === 'CLP' ? cifra : `${cifra} ${this.unidad}`;
  }

  get error(): string | null {
    const control = this.formControl;
    if (!control || !control.invalid || !control.touched) {
      return null;
    }
    const errores = control.errors ?? {};
    if (errores['required']) {
      return 'Ingresa un valor.';
    }
    if (errores['min']) {
      return 'No puede ser negativo.';
    }
    if (errores['max']) {
      const maximo = errores['max'].max;
      return this.unidad === '%' ? `No puede superar ${maximo} %.` : `No puede superar ${maximo}.`;
    }
    return 'Valor no válido.';
  }
}
