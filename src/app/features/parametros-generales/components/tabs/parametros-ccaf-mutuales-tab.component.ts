import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import {
  CcafEntidad,
  Ley16744Parametro,
  OrganismoLey16744,
  ParametrosGeneralesCatalogos,
} from '../../models/parametro-general.model';
import {
  ParametrosInnerTabBarComponent,
  ParametrosInnerTabItem,
} from '../parametros-inner-tab-bar.component';

export type CcafMutualSubId = 'listaCcaf' | 'mutuales' | 'ley16744';

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
              title="Organismos administradores Ley 16.744"
              [rows]="catalogos.organismosLey16744"
              [columns]="organismosLeyColumns"
              [loading]="loading"
              [filters]="organismosLeyFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyMutuales"
              emptyTitle="Sin organismos administradores en catalogo"
              emptyDescription="No hay mutualidades u organismos cargados. Revisa la normativa base o maestros."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub === 'ley16744') {
          <section class="catalog-section parametros-grid-shell" aria-labelledby="ley-title">
            <h2 class="sr-only" id="ley-title">Ley 16.744</h2>
            @if (referenciaPeriodoLabel) {
              <div class="param-reference-callout" role="note">
                <div>
                  <span class="param-reference-callout__label">Referencia {{ referenciaPeriodoLabel }}</span>
                  <p>No se usara para calculo de {{ periodoLabel }}.</p>
                </div>
                <button type="button" class="param-reference-callout__action" (click)="verReferenciaPeriodoAnterior?.()">
                  Ver referencia {{ referenciaPeriodoLabel }}
                </button>
              </div>
            }
            <app-data-grid
              title="Parametros Ley 16.744"
              [rows]="catalogos.ley16744Parametros"
              [columns]="ley16744Columns"
              [loading]="loading"
              [filters]="ley16744Filters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyLey16744"
              [emptyTitle]="'No hay parametros Ley 16.744 cargados para ' + periodoLabel + '.'"
              emptyDescription="Pendiente de fuente o criterio oficial para el snapshot mensual."
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
    { id: 'ley16744', label: 'Ley 16.744' },
  ];

  @Input({ required: true }) activeSub!: CcafMutualSubId;
  @Output() activeSubChange = new EventEmitter<CcafMutualSubId>();

  @Input({ required: true }) catalogos!: ParametrosGeneralesCatalogos;
  @Input({ required: true }) ccafColumns!: DataGridColumn<CcafEntidad>[];
  @Input({ required: true }) organismosLeyColumns!: DataGridColumn<OrganismoLey16744>[];
  @Input({ required: true }) ley16744Columns!: DataGridColumn<Ley16744Parametro>[];

  @Input() loading = false;
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() gridPersistenceKeyCcaf = 'parametros.ccaf.dg';
  @Input() gridPersistenceKeyMutuales = 'parametros.mutuales.dg';
  @Input() gridPersistenceKeyLey16744 = 'parametros.ley16744.dg';

  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
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

  readonly ley16744Filters: DataGridFilter<Ley16744Parametro>[] = [
    {
      id: 'periodo',
      label: 'Periodo',
      field: 'periodo',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
  ];
}
