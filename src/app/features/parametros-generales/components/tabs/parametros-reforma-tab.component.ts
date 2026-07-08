import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import {
  ReformaPrevisionalParametro,
} from '../../models/parametro-general.model';
import {
  PARAMETROS_DATA_GRID_SHELL,
  PARAMETROS_EMPTY_FILTERED,
  PARAMETROS_GRID_EMPTY,
} from '../../utils/parametros-workspace-grids.presenter';

@Component({
  selector: 'app-parametros-reforma-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <div class="param-tab-subview">
        <section class="catalog-section parametros-grid-shell" aria-label="Gradualidad futura">
          <app-data-grid
            [title]="gridCopy.title"
            [rows]="reformaPrevisional"
            [columns]="reformaPrevisionalColumns"
            [loading]="loading"
            [filtersEnabled]="false"
            [showExportAction]="true"
            [maxItems]="8"
            [className]="gridShell.className"
            [cardClassName]="gridShell.cardClassName"
            [gridHeight]="gridShell.gridHeight"
            [persistenceKey]="gridPersistenceKeyPrevisional"
            [emptyTitle]="gridCopy.emptyTitle"
            [emptyDescription]="gridCopy.emptyDescription"
            [emptyTitleWhenFiltered]="emptyFiltered.emptyTitleWhenFiltered"
            [emptyDescriptionWhenFiltered]="emptyFiltered.emptyDescriptionWhenFiltered"
            (refresh)="refresh?.()"
          ></app-data-grid>
        </section>
      </div>
    </section>
  `,
})
export class ParametrosReformaTabComponent {
  readonly gridShell = PARAMETROS_DATA_GRID_SHELL;
  readonly emptyFiltered = PARAMETROS_EMPTY_FILTERED;
  readonly gridCopy = PARAMETROS_GRID_EMPTY.reforma;
  @Input({ required: true }) reformaPrevisional!: ReformaPrevisionalParametro[];

  @Input({ required: true }) reformaPrevisionalColumns!: DataGridColumn<ReformaPrevisionalParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyPrevisional = 'parametros.reforma-previsional.dg';
  @Input() refresh: (() => void) | null = null;
}
