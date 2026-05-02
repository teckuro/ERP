import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import { AfpParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-afp-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-label="AFP">
        <app-data-grid
          title="AFP"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filters]="afpFilters"
          [filtersEnabled]="true"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="100%"
          [persistenceKey]="gridPersistenceKey"
          emptyTitle="No hay AFP vigentes para el período activo"
          emptyDescription="Prueba con otro período o revisa el catálogo previsional."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosAfpTabComponent {
  @Input({ required: true }) rows!: AfpParametro[];
  @Input({ required: true }) columns!: DataGridColumn<AfpParametro>[];
  @Input() loading = false;
  @Input() gridPersistenceKey = 'parametros.afp.dg';
  @Input() refresh: (() => void) | null = null;

  readonly afpFilters: DataGridFilter<AfpParametro>[] = [
    {
      id: 'vigenciaInicio',
      label: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
    {
      id: 'codigo',
      label: 'Codigo',
      field: 'codigo',
      type: 'text',
      operator: 'contains',
      placeholder: 'Filtrar por codigo',
      emptyLabel: 'Todos',
    },
    {
      id: 'nombre',
      label: 'Nombre',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      placeholder: 'Filtrar por nombre',
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
}

