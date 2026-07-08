import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import {
  CcafEntidad,
  OrganismoLey16744,
  ParametrosGeneralesCatalogos,
} from '../../models/parametro-general.model';
import {
  ParametrosInnerTabBarComponent,
  ParametrosInnerTabItem,
} from '../parametros-inner-tab-bar.component';
import {
  PARAMETROS_DATA_GRID_SHELL,
  PARAMETROS_EMPTY_FILTERED,
  PARAMETROS_GRID_EMPTY,
} from '../../utils/parametros-workspace-grids.presenter';

export type CcafMutualSubId = 'listaCcaf' | 'mutuales';

@Component({
  selector: 'app-parametros-ccaf-mutuales-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <div class="param-subhead">
        <div class="param-subhead__tabs">
          <app-parametros-inner-tab-bar
            ariaLabel="Secciones CCAF y mutual"
            mobileLabel="Seccion"
            [tabs]="ccafInnerTabs"
            [activeId]="activeSub"
            (activeIdChange)="emitSub($event)"
          />
        </div>
      </div>

      <div class="param-tab-subview">
        @if (activeSub === 'listaCcaf') {
          <section class="catalog-section parametros-grid-shell" aria-labelledby="lista-ccaf-title">
            <h2 class="sr-only" id="lista-ccaf-title">Lista CCAF</h2>
            <app-data-grid
              [title]="gridCopyCcaf.title"
              [rows]="catalogos.ccafEntidades"
              [columns]="ccafColumns"
              [loading]="loading"
              [filtersEnabled]="false"
              [showExportAction]="true"
              [maxItems]="8"
              [className]="gridShell.className"
              [cardClassName]="gridShell.cardClassName"
              [gridHeight]="gridShell.gridHeight"
              [persistenceKey]="gridPersistenceKeyCcaf"
              [emptyTitle]="gridCopyCcaf.emptyTitle"
              [emptyDescription]="gridCopyCcaf.emptyDescription"
              [emptyTitleWhenFiltered]="emptyFiltered.emptyTitleWhenFiltered"
              [emptyDescriptionWhenFiltered]="emptyFiltered.emptyDescriptionWhenFiltered"
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub === 'mutuales') {
          <section class="catalog-section parametros-grid-shell" aria-labelledby="lista-mutuales-title">
            <h2 class="sr-only" id="lista-mutuales-title">Mutuales</h2>
            <app-data-grid
              [title]="gridCopyMutuales.title"
              [rows]="catalogos.organismosLey16744"
              [columns]="organismosLeyColumns"
              [loading]="loading"
              [filtersEnabled]="false"
              [showExportAction]="true"
              [maxItems]="8"
              [className]="gridShell.className"
              [cardClassName]="gridShell.cardClassName"
              [gridHeight]="gridShell.gridHeight"
              [persistenceKey]="gridPersistenceKeyMutuales"
              [emptyTitle]="gridCopyMutuales.emptyTitle"
              [emptyDescription]="gridCopyMutuales.emptyDescription"
              [emptyTitleWhenFiltered]="emptyFiltered.emptyTitleWhenFiltered"
              [emptyDescriptionWhenFiltered]="emptyFiltered.emptyDescriptionWhenFiltered"
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }
      </div>
    </section>
  `,
})
export class ParametrosCcafMutualesTabComponent {
  readonly gridShell = PARAMETROS_DATA_GRID_SHELL;
  readonly emptyFiltered = PARAMETROS_EMPTY_FILTERED;
  readonly gridCopyCcaf = PARAMETROS_GRID_EMPTY.ccaf;
  readonly gridCopyMutuales = PARAMETROS_GRID_EMPTY.mutuales;
  readonly ccafInnerTabs: readonly ParametrosInnerTabItem[] = [
    { id: 'listaCcaf', label: 'Lista CCAF' },
    { id: 'mutuales', label: 'Mutuales' },
  ];

  @Input({ required: true }) activeSub!: CcafMutualSubId;
  @Output() activeSubChange = new EventEmitter<CcafMutualSubId>();

  @Input({ required: true }) catalogos!: ParametrosGeneralesCatalogos;
  @Input({ required: true }) ccafColumns!: DataGridColumn<CcafEntidad>[];
  @Input({ required: true }) organismosLeyColumns!: DataGridColumn<OrganismoLey16744>[];

  @Input() loading = false;
  @Input() periodoLabel = 'este periodo';
  @Input() gridPersistenceKeyCcaf = 'parametros.ccaf.dg';
  @Input() gridPersistenceKeyMutuales = 'parametros.mutuales.dg';

  @Input() refresh: (() => void) | null = null;

  emitSub(id: string): void {
    this.activeSubChange.emit(id as CcafMutualSubId);
  }
}
