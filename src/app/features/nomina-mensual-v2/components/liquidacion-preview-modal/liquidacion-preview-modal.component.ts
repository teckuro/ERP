/**
 * Modal de previsualización tipo liquidación de sueldo.
 *
 * Toma una `LiquidacionCalculada` del motor V1 y la presenta con la
 * maqueta visual de un documento imprimible (cabecera empresa,
 * identificación trabajador, tabla de haberes, descuentos, bases legales,
 * cargos informativos del empleador y líquido a pago en pesos y palabras).
 *
 * No genera PDF real (eso se hará en el paso 9 Liquidaciones). Aquí es solo
 * un preview operativo para que RRHH valide visualmente el desglose antes
 * de aprobar la nómina.
 *
 * Reglas NOIA:
 * - Sin gradientes, sin sombras fuertes, sin paletas nuevas.
 * - Density compacta; tipografía existente.
 * - Lenguaje RRHH (sin códigos del motor visibles).
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { X as XIcon } from 'lucide-angular/src/icons';

import type { LiquidacionCalculada } from '../../../nomina-mensual/models/proceso-mensual.model';
import { liquidoEnPalabras } from './liquidacion-en-palabras';

export interface LiquidacionPreviewEmpresa {
  razonSocial: string;
  rut?: string | null;
  direccion?: string | null;
}

export interface LiquidacionPreviewNomina {
  periodo: string;
  fechaPago?: string | null;
}

export interface LiquidacionPreviewTrabajadorMeta {
  afp?: string | null;
  salud?: string | null;
  tipoContrato?: string | null;
  cargo?: string | null;
  sueldoBase?: number | null;
  diasTrabajados?: number | null;
}

@Component({
  selector: 'app-liquidacion-preview-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './liquidacion-preview-modal.component.html',
  styleUrl: './liquidacion-preview-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidacionPreviewModalComponent {
  readonly closeIcon = XIcon;

  readonly liquidacion = input.required<LiquidacionCalculada>();
  readonly empresa = input.required<LiquidacionPreviewEmpresa>();
  readonly nomina = input.required<LiquidacionPreviewNomina>();
  readonly trabajadorMeta = input<LiquidacionPreviewTrabajadorMeta | null>(null);
  /** `oficial` = liquidación materializada; `preliminar` = preview del generador. */
  readonly modoEmision = input<'preliminar' | 'oficial'>('preliminar');

  readonly cerrar = output<void>();
  readonly imprimirSolicitado = output<void>();

  readonly chromeEyebrow = computed(() =>
    this.modoEmision() === 'oficial' ? 'Liquidación oficial' : 'Previsualización',
  );
  readonly chromeSubtitle = computed(() =>
    this.modoEmision() === 'oficial'
      ? 'Documento materializado desde la liquidación oficial. Imprima o guarde como PDF desde el navegador.'
      : 'Vista previa del documento que se entregará al trabajador. Aún no es oficial; el PDF final se genera al cerrar la nómina.',
  );

  readonly subtotalHaberesImponibles = computed(() =>
    sumar(this.liquidacion().haberesImponibles.map((h) => h.monto)),
  );
  readonly subtotalHaberesNoImponibles = computed(() =>
    sumar(this.liquidacion().haberesNoImponibles.map((h) => h.monto)),
  );
  readonly subtotalDescuentosLegales = computed(() =>
    sumar(this.liquidacion().descuentosLegales.map((d) => d.monto)),
  );
  readonly subtotalDescuentosVoluntarios = computed(() =>
    sumar(this.liquidacion().descuentosVoluntarios.map((d) => d.monto)),
  );

  readonly liquidoEnPalabras = computed(() => liquidoEnPalabras(this.liquidacion().liquidoAPago));

  readonly periodoHumano = computed(() => periodoHumano(this.nomina().periodo));

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    event.preventDefault();
    this.cerrar.emit();
  }

  emitirCerrar(): void {
    this.cerrar.emit();
  }

  emitirImprimir(): void {
    this.imprimirSolicitado.emit();
  }
}

function sumar(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v ?? 0;
  return total;
}

function periodoHumano(periodo: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return periodo;
  const [, anio, mes] = match;
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${meses[Number(mes) - 1]} ${anio}`;
}
