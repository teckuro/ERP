import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { TablaImpuestoUnicoParametro, TramoImpuestoParametro } from '../../models/parametro-general.model';
import {
  PARAMETROS_DATA_GRID_SHELL,
  PARAMETROS_EMPTY_FILTERED,
  PARAMETROS_GRID_EMPTY,
} from '../../utils/parametros-workspace-grids.presenter';

/** @deprecated Solo se usa la vista tabla SII; se mantiene el tipo por compatibilidad interna. */
export type ImpuestoSubId = 'tabla';

@Component({
  selector: 'app-parametros-tramos-renta-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <section class="catalog-section parametros-grid-shell" aria-label="Tabla impuesto único SII">
        <app-data-grid
          [title]="gridCopy.title"
          [rows]="tablaRows"
          [columns]="tablaColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="12"
          [className]="gridShell.className"
          [cardClassName]="gridShell.cardClassName"
          [gridHeight]="gridShell.gridHeight"
          [persistenceKey]="gridPersistenceKeyTabla"
          [emptyTitle]="gridCopy.emptyTitle"
          [emptyDescription]="gridCopy.emptyDescription"
          [emptyTitleWhenFiltered]="emptyFiltered.emptyTitleWhenFiltered"
          [emptyDescriptionWhenFiltered]="emptyFiltered.emptyDescriptionWhenFiltered"
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosTramosRentaTabComponent {
  readonly gridShell = PARAMETROS_DATA_GRID_SHELL;
  readonly emptyFiltered = PARAMETROS_EMPTY_FILTERED;
  readonly gridCopy = PARAMETROS_GRID_EMPTY.tablaImpuesto;
  @Input({ required: true }) activeSub!: ImpuestoSubId;
  @Output() activeSubChange = new EventEmitter<ImpuestoSubId>();

  @Input({ required: true }) tablaRows!: TablaImpuestoUnicoParametro[];
  @Input({ required: true }) tablaColumns!: DataGridColumn<TablaImpuestoUnicoParametro>[];
  /** @deprecated Ya no se muestra grilla separada; se conserva el input por contrato del contenedor. */
  @Input({ required: true }) tramosRows!: TramoImpuestoParametro[];
  @Input({ required: true }) tramosColumns!: DataGridColumn<TramoImpuestoParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyTabla = 'parametros.tabla-impuesto.dg';
  @Input() gridPersistenceKeyTramos = 'parametros.tramos-impuesto.dg';
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaTramosPeriodoLabel: string | null = null;
  @Input() referenciaTablaPeriodoLabel: string | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() refresh: (() => void) | null = null;
}
