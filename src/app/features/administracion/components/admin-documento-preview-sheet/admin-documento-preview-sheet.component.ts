import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewEncapsulation,
} from '@angular/core';

import type { VistaPreviaDocumentoLiquidacion } from '../../rules/administracion.rules';

const BODY_CLASS_IMPRESION_DOCUMENTO = 'adm-doc-printing';

@Component({
  selector: 'app-admin-documento-preview-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-documento-preview-sheet.component.html',
  styleUrl: './admin-documento-preview-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminDocumentoPreviewSheetComponent implements OnDestroy {
  @Input({ required: true }) vista!: VistaPreviaDocumentoLiquidacion;
  @Input() logoRoto = false;

  @Output() logoError = new EventEmitter<void>();

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    document.body.classList.add(BODY_CLASS_IMPRESION_DOCUMENTO);
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    document.body.classList.remove(BODY_CLASS_IMPRESION_DOCUMENTO);
  }

  ngOnDestroy(): void {
    document.body.classList.remove(BODY_CLASS_IMPRESION_DOCUMENTO);
  }
}
