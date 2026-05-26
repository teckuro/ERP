import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
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
              title="CCAF"
              [rows]="catalogos.ccafEntidades"
              [columns]="ccafColumns"
              [loading]="loading"
              [filters]="ccafEntidadFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyCcaf"
              emptyTitle="Sin cajas de compensacion en catalogo"
              emptyDescription="No hay CCAF cargadas. Revisa la normativa base o maestros."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub === 'mutuales') {
          <section class="catalog-section parametros-grid-shell" aria-labelledby="lista-mutuales-title">
            <h2 class="sr-only" id="lista-mutuales-title">Mutuales</h2>
            <app-data-grid
              title="Organismos mutual"
              [rows]="catalogos.organismosLey16744"
              [columns]="organismosLeyColumns"
              [loading]="loading"
              [filters]="organismosLeyFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyMutuales"
              emptyTitle="Sin organismos mutual en catalogo"
              emptyDescription="No hay mutualidades u organismos cargados. Revisa la normativa base o maestros."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }
      </div>
    </section>
  `,
})
export class ParametrosCcafMutualesTabComponent {
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

  readonly ccafEntidadFilters: DataGridFilter<CcafEntidad>[] = [
    { id: 'codigo', label: 'Codigo', field: 'codigo', type: 'text', operator: 'contains', emptyLabel: 'Todos' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', type: 'text', operator: 'contains', emptyLabel: 'Todos' },
    {
      id: 'vigente',
      label: 'Estado',
      field: 'vigente',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Vigente', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
  ];

  readonly organismosLeyFilters: DataGridFilter<OrganismoLey16744>[] = [
    { id: 'codigo', label: 'Codigo', field: 'codigo', type: 'text', operator: 'contains', emptyLabel: 'Todos' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', type: 'text', operator: 'contains', emptyLabel: 'Todos' },
    { id: 'tipo', label: 'Tipo', field: 'tipo', type: 'text', operator: 'contains', emptyLabel: 'Todos' },
    {
      id: 'vigente',
      label: 'Estado',
      field: 'vigente',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Vigente', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
  ];
}
