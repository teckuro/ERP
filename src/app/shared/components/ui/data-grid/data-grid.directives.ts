import { Directive, Input, TemplateRef } from '@angular/core';
import type { DataGridCellContext } from './data-grid.types';

@Directive({
  selector: 'ng-template[appDataGridCell]',
  standalone: true,
})
export class DataGridCellDirective<T = unknown> {
  @Input('appDataGridCell') columnId = '';

  constructor(readonly template: TemplateRef<DataGridCellContext<T>>) {}
}

@Directive({
  selector: 'ng-template[appDataGridPrimaryActionMenu]',
  standalone: true,
})
export class DataGridPrimaryActionMenuDirective {
  constructor(readonly template: TemplateRef<unknown>) {}
}
