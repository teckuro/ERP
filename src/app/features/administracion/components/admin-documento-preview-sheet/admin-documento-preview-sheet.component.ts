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

import type { VistaPreviaDocumentoLiquidacion } from '../../rules/administracion.rules';
import {
  buildLiquidacionDocumentoSheetEjemplo,
  ERP_DOC_SHEET_PRINTING_CLASS,
  LiquidacionDocumentoSheetComponent,
} from '../../../../shared/components/documento-liquidacion-sheet';

@Component({
  selector: 'app-admin-documento-preview-sheet',
  standalone: true,
  imports: [CommonModule, LiquidacionDocumentoSheetComponent],
  template: `
    <app-liquidacion-documento-sheet
      [vista]="vistaSheet()"
      [logoRoto]="logoRoto()"
      (logoError)="logoError.emit()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminDocumentoPreviewSheetComponent implements OnDestroy {
  readonly vista = input.required<VistaPreviaDocumentoLiquidacion>();
  readonly logoRoto = input(false);

  readonly logoError = output<void>();

  readonly vistaSheet = computed(() => buildLiquidacionDocumentoSheetEjemplo(this.vista()));

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    document.body.classList.add(ERP_DOC_SHEET_PRINTING_CLASS);
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    document.body.classList.remove(ERP_DOC_SHEET_PRINTING_CLASS);
  }

  ngOnDestroy(): void {
    document.body.classList.remove(ERP_DOC_SHEET_PRINTING_CLASS);
  }
}
