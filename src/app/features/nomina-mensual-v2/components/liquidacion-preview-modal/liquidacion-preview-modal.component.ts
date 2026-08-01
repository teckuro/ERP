/**
 * Modal de previsualización tipo liquidación de sueldo.
 *
 * Usa la hoja compartida del editor de Administración para que el PDF
 * se vea igual en nómina, liquidaciones oficiales y configuración.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  OnDestroy,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Printer as PrinterIcon, X as XIcon } from 'lucide-angular/src/icons';

import type { LiquidacionCalculada } from '../../../nomina-mensual/models/proceso-mensual.model';
import {
  buildLiquidacionDocumentoSheetFromCalculada,
  ERP_DOC_SHEET_PRINTING_CLASS,
  LiquidacionDocumentoSheetComponent,
  type LiquidacionDocumentoCierreInput,
  type LiquidacionDocumentoDetalleInput,
  type LiquidacionDocumentoEmpresaVm,
  type LiquidacionDocumentoNominaInput,
  type LiquidacionDocumentoTrabajadorMetaInput,
} from '../../../../shared/components/documento-liquidacion-sheet';

export type LiquidacionPreviewEmpresa = LiquidacionDocumentoEmpresaVm;
export type LiquidacionPreviewNomina = LiquidacionDocumentoNominaInput;
export type LiquidacionPreviewTrabajadorMeta = LiquidacionDocumentoTrabajadorMetaInput;
export type LiquidacionPreviewDetalle = LiquidacionDocumentoDetalleInput;
export type LiquidacionPreviewCierre = LiquidacionDocumentoCierreInput;

@Component({
  selector: 'app-liquidacion-preview-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, LiquidacionDocumentoSheetComponent],
  templateUrl: './liquidacion-preview-modal.component.html',
  styleUrl: './liquidacion-preview-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LiquidacionPreviewModalComponent implements OnDestroy {
  readonly closeIcon = XIcon;
  readonly printIcon = PrinterIcon;

  readonly liquidacion = input.required<LiquidacionCalculada>();
  readonly empresa = input.required<LiquidacionPreviewEmpresa>();
  readonly nomina = input.required<LiquidacionPreviewNomina>();
  readonly trabajadorMeta = input<LiquidacionPreviewTrabajadorMeta | null>(null);
  readonly detalle = input<LiquidacionPreviewDetalle | null>(null);
  readonly cierre = input<LiquidacionPreviewCierre | null>(null);
  readonly numeroDocumento = input<string | null>(null);
  readonly fechaEmision = input<string | null>(null);
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

  readonly vistaSheet = computed(() =>
    buildLiquidacionDocumentoSheetFromCalculada({
      liquidacion: this.liquidacion(),
      empresa: this.empresa(),
      nomina: this.nomina(),
      trabajadorMeta: this.trabajadorMeta(),
      detalle: this.detalle(),
      cierre: this.cierre(),
      numeroDocumento: this.numeroDocumento(),
      fechaEmision: this.fechaEmision(),
    }),
  );

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    event.preventDefault();
    this.cerrar.emit();
  }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    document.body.classList.add(ERP_DOC_SHEET_PRINTING_CLASS);
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    document.body.classList.remove(ERP_DOC_SHEET_PRINTING_CLASS);
  }

  emitirCerrar(): void {
    this.cerrar.emit();
  }

  emitirImprimir(): void {
    this.imprimirSolicitado.emit();
  }

  ngOnDestroy(): void {
    document.body.classList.remove(ERP_DOC_SHEET_PRINTING_CLASS);
  }
}
