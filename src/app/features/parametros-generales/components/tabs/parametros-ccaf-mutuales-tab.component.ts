import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  SearchSelectComponent,
  SearchSelectOption,
  SearchSelectValue,
} from '../../../../shared/components/ui/search-select.component';
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

export type CcafMutualSubId = 'config' | 'listaCcaf' | 'mutuales' | 'ley16744';

@Component({
  selector: 'app-parametros-ccaf-mutuales-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent, ParametrosInnerTabBarComponent, SearchSelectComponent],
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
        @if (activeSub === 'config') {
          <section class="param-group parametros-section-card parametros-config-card param-group--ccaf-current" aria-labelledby="ccaf-title">
            <h2 id="ccaf-title">Configuracion vigente del periodo</h2>
            <p class="param-section-lead">Seleccion usada como referencia para el periodo activo.</p>
            <div class="field-grid parametros-form-grid parametros-form-grid-compact field-grid--ccaf field-grid--ccaf-compact" aria-label="Configuracion CCAF y mutual">
              <label class="param-field">
                <span>Caja de compensacion</span>
                <app-search-select
                  class="param-field-search-select"
                  [ngModel]="selectedCcafId"
                  (ngModelChange)="seleccionarCcaf?.($event)"
                  [options]="ccafSelectOptions"
                  placeholder="Sin CCAF cargada"
                  searchPlaceholder="Buscar CCAF"
                ></app-search-select>
              </label>

              <label class="param-field">
                <span>Mutual de Seguridad</span>
                <app-search-select
                  class="param-field-search-select"
                  [ngModel]="selectedMutualId"
                  (ngModelChange)="seleccionarMutual?.($event)"
                  [options]="mutualSelectOptions"
                  placeholder="Sin mutual cargada"
                  searchPlaceholder="Buscar mutual"
                ></app-search-select>
              </label>

              <label class="param-field">
                <span>Porcentaje</span>
                <span class="unit-field unit-field--suffix" data-unit="%">
                  <input class="param-input text-right" type="text" [value]="percentLabel === '-' ? '-' : percentLabel" readonly />
                </span>
              </label>
            </div>
          </section>
        }

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
            @if (catalogos.ley16744Parametros.length === 0 && referenciaPeriodoLabel) {
              <div class="param-reference-callout" role="note">
                <div>
                  <span class="param-reference-callout__label">Referencia disponible: {{ referenciaPeriodoLabel }}</span>
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
  styles: [
    `
      .param-field-search-select ::ng-deep .select-field {
        border-radius: 6px;
        height: var(--erp-control-height, 22px);
        min-height: var(--erp-control-height, 22px);
      }

      .param-group--ccaf-current {
        width: min(56rem, 100%);
        max-width: 100%;
        align-self: flex-start;
      }

      .field-grid--ccaf-compact {
        max-width: min(56rem, 100%);
      }
    `,
  ],
})
export class ParametrosCcafMutualesTabComponent {
  get ccafSelectOptions(): SearchSelectOption<number | null>[] {
    return [
      { value: null, label: 'Sin CCAF cargada' },
      ...this.catalogos.ccafEntidades.map((ccaf) => ({
        value: ccaf.idCcafEntidad,
        label: ccaf.nombre,
      })),
    ];
  }

  get mutualSelectOptions(): SearchSelectOption<number | null>[] {
    return [
      { value: null, label: 'Sin mutual cargada' },
      ...this.catalogos.organismosLey16744.map((mutual) => ({
        value: mutual.idOrganismoAdministradorLey16744,
        label: mutual.nombre,
      })),
    ];
  }

  emitSub(id: string): void {
    this.activeSubChange.emit(id as CcafMutualSubId);
  }

  readonly ccafInnerTabs: readonly ParametrosInnerTabItem[] = [
    { id: 'config', label: 'Configuracion' },
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
  @Input() selectedCcafId: number | null = null;
  @Input() selectedMutualId: number | null = null;
  @Input() percentLabel = '-';
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() gridPersistenceKeyCcaf = 'parametros.ccaf.dg';
  @Input() gridPersistenceKeyMutuales = 'parametros.mutuales.dg';
  @Input() gridPersistenceKeyLey16744 = 'parametros.ley16744.dg';

  @Input() seleccionarCcaf: ((value: SearchSelectValue) => void) | null = null;
  @Input() seleccionarMutual: ((value: SearchSelectValue) => void) | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() refresh: (() => void) | null = null;

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
