import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  DecimalesCifra,
  UnidadParametro,
  formatearCifraParametro,
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
        <input class="param-input text-right" type="number" [step]="step" [formControl]="formControl" />
      </span>
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

  get formControl(): FormControl | null {
    return this.control instanceof FormControl ? this.control : null;
  }

  get texto(): string | null {
    const valor = this.control ? this.control.value : this.valor;
    return formatearCifraParametro(valor, this.unidad, this.decimales);
  }
}
