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

export type CcafMutualSubId = 'config' | 'listaCcaf' | 'mutuales' | 'ley16744';

@Component({
  selector: 'app-parametros-ccaf-mutuales-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel">
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
        @if (activeSub !== 'config') {
          <div class="param-hint param-hint--consulta param-hint--inline" role="note">
            <span class="param-hint__tag">Solo lectura</span>
          </div>
        }
      </div>

      <div class="param-tab-subview">
        @if (activeSub === 'config') {
          <div class="param-hint param-hint--editable" role="note">
            <span class="param-hint__tag">Editable</span>
            <span class="param-hint__text">La selección se guarda con Guardar en la barra superior.</span>
          </div>
          <section class="param-group" aria-labelledby="ccaf-title">
            <h2 id="ccaf-title">Configuración CCAF y mutual</h2>
            <p class="param-section-lead">Selección usada como referencia en el periodo actual.</p>
            <div class="field-grid field-grid--ccaf" aria-label="Configuración CCAF y mutual">
              <label class="param-field">
                <span>Caja de compensación</span>
                <select class="param-input" [value]="selectedCcafId ?? ''" (change)="seleccionarCcaf?.($event)">
                  <option value="" [selected]="selectedCcafId === null">Sin CCAF cargada</option>
                  @for (ccaf of catalogos.ccafEntidades; track ccaf.idCcafEntidad) {
                    <option [value]="ccaf.idCcafEntidad" [selected]="ccaf.idCcafEntidad === selectedCcafId">{{ ccaf.nombre }}</option>
                  }
                </select>
              </label>

              <label class="param-field">
                <span>Mutual de Seguridad</span>
                <select class="param-input" [value]="selectedMutualId ?? ''" (change)="seleccionarMutual?.($event)">
                  <option value="" [selected]="selectedMutualId === null">Sin mutual cargada</option>
                  @for (mutual of catalogos.organismosLey16744; track mutual.idOrganismoAdministradorLey16744) {
                    <option
                      [value]="mutual.idOrganismoAdministradorLey16744"
                      [selected]="mutual.idOrganismoAdministradorLey16744 === selectedMutualId"
                    >
                      {{ mutual.nombre }}
                    </option>
                  }
                </select>
              </label>

              <label class="param-field">
                <span>Porcentaje</span>
                <span class="unit-field unit-field--suffix" data-unit="%">
                  <input class="param-input text-right" type="text" [value]="percentLabel" readonly />
                </span>
              </label>
            </div>
          </section>
        }

        @if (activeSub === 'listaCcaf') {
          <section class="catalog-section" aria-labelledby="lista-ccaf-title">
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
              gridHeight="100%"
              [persistenceKey]="gridPersistenceKeyCcaf"
              emptyTitle="No hay registros para el periodo seleccionado"
              emptyDescription="Sin cajas de compensación disponibles en catálogo."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub === 'mutuales') {
          <section class="catalog-section" aria-labelledby="lista-mutuales-title">
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
              gridHeight="100%"
              [persistenceKey]="gridPersistenceKeyMutuales"
              emptyTitle="No hay registros para el periodo seleccionado"
              emptyDescription="Sin organismos administradores en catálogo."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub === 'ley16744') {
          <section class="catalog-section" aria-labelledby="ley-title">
            <h2 class="sr-only" id="ley-title">Ley 16.744</h2>
            <app-data-grid
              title="Parámetros Ley 16.744"
              [rows]="catalogos.ley16744Parametros"
              [columns]="ley16744Columns"
              [loading]="loading"
              [filters]="ley16744Filters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="100%"
              [persistenceKey]="gridPersistenceKeyLey16744"
              emptyTitle="No hay registros para el periodo seleccionado"
              emptyDescription="Sin parámetros Ley 16.744 vigentes para este periodo."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }
      </div>
    </section>
  `,
})
export class ParametrosCcafMutualesTabComponent {
  emitSub(id: string): void {
    this.activeSubChange.emit(id as CcafMutualSubId);
  }

  readonly ccafInnerTabs: readonly ParametrosInnerTabItem[] = [
    { id: 'config', label: 'Configuración' },
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
  @Input() gridPersistenceKeyCcaf = 'parametros.ccaf.dg';
  @Input() gridPersistenceKeyMutuales = 'parametros.mutuales.dg';
  @Input() gridPersistenceKeyLey16744 = 'parametros.ley16744.dg';

  @Input() seleccionarCcaf: ((event: Event) => void) | null = null;
  @Input() seleccionarMutual: ((event: Event) => void) | null = null;
  @Input() refresh: (() => void) | null = null;

  readonly ccafEntidadFilters: DataGridFilter<CcafEntidad>[] = [
    {
      id: 'codigo',
      label: 'Codigo',
      field: 'codigo',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'nombre',
      label: 'Nombre',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
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
    {
      id: 'codigo',
      label: 'Codigo',
      field: 'codigo',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'nombre',
      label: 'Nombre',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'tipo',
      label: 'Tipo',
      field: 'tipo',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
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
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-04',
      emptyLabel: 'Todos',
    },
  ];
}
