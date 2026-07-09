import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import type { LiquidacionDocumentoSheetPresentacionVm } from './liquidacion-documento-sheet.model';

@Component({
  selector: 'app-liquidacion-documento-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liquidacion-documento-sheet.component.html',
  styleUrl: './liquidacion-documento-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LiquidacionDocumentoSheetComponent {
  readonly vista = input.required<LiquidacionDocumentoSheetPresentacionVm>();
  readonly logoRoto = input(false);
  readonly compact = input(false);

  readonly logoError = output<void>();
}
