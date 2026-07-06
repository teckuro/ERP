import { Directive, Input, TemplateRef } from '@angular/core';
import type { DataGridCellContext, DataGridRowDetailContext } from './data-grid.types';

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

/**
 * Template del detalle expandible. Solo se renderiza cuando el consumidor
 * habilita `expandableRows` en `<app-data-grid>` y una fila está expandida.
 *
 * Uso:
 * ```html
 * <app-data-grid [expandableRows]="true" ...>
 *   <ng-template appDataGridRowDetail let-row let-collapse="collapse">
 *     <p>Detalle de {{ row.nombre }}</p>
 *     <button (click)="collapse()">Cerrar</button>
 *   </ng-template>
 * </app-data-grid>
 * ```
 */
@Directive({
  selector: 'ng-template[appDataGridRowDetail]',
  standalone: true,
})
export class DataGridRowDetailDirective<T = unknown> {
  constructor(readonly template: TemplateRef<DataGridRowDetailContext<T>>) {}
}
