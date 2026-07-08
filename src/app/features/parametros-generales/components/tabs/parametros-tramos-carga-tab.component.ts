import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { TramoCargaParametro } from '../../models/parametro-general.model';
import {
  PARAMETROS_DATA_GRID_SHELL,
  PARAMETROS_EMPTY_FILTERED,
  PARAMETROS_GRID_EMPTY,
} from '../../utils/parametros-workspace-grids.presenter';

@Component({
  selector: 'app-parametros-tramos-carga-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <section class="catalog-section parametros-grid-shell" aria-labelledby="tramos-carga-title">
        <h2 id="tramos-carga-title" class="sr-only">Tramos cargas familiares</h2>
        <app-data-grid
          [title]="gridCopy.title"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="10"
          [className]="gridShell.className"
          [cardClassName]="gridShell.cardClassName"
          [gridHeight]="gridShell.gridHeight"
          [persistenceKey]="gridPersistenceKey"
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
export class ParametrosTramosCargaTabComponent {
  readonly gridShell = PARAMETROS_DATA_GRID_SHELL;
  readonly emptyFiltered = PARAMETROS_EMPTY_FILTERED;
  readonly gridCopy = PARAMETROS_GRID_EMPTY.tramosCarga;
  @Input({ required: true }) rows!: TramoCargaParametro[];
  @Input({ required: true }) columns!: DataGridColumn<TramoCargaParametro>[];
  @Input() loading = false;
  @Input() gridPersistenceKey = 'parametros.tramos-carga.dg';
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() refresh: (() => void) | null = null;
}
