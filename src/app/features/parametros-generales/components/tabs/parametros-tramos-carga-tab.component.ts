import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import { TramoCargaParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-tramos-carga-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="tramos-carga-title">
        <h2 id="tramos-carga-title">Tramos cargas familiares</h2>
        <div class="param-hint param-hint--consulta" role="note">
          <span class="param-hint__tag">Mensual</span>
          <span class="param-hint__tag">Período {{ periodo }}</span>
          <span class="param-hint__tag">Solo lectura</span>
          <span class="param-hint__text">Tramos cargados para el período activo.</span>
        </div>
        <app-data-grid
          title="Tramos de asignación familiar"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filters]="tramosCargaFilters"
          [filtersEnabled]="true"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="min(520px, 100%)"
          [persistenceKey]="gridPersistenceKey"
          emptyTitle="No hay tramos de asignación familiar para este período"
          emptyDescription="Prueba con otro período o revisa la sincronización/carga mensual."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosTramosCargaTabComponent {
  @Input({ required: true }) rows!: TramoCargaParametro[];
  @Input({ required: true }) columns!: DataGridColumn<TramoCargaParametro>[];
  @Input() periodo = '';
  @Input() loading = false;
  @Input() gridPersistenceKey = 'parametros.tramos-carga.dg';
  @Input() refresh: (() => void) | null = null;

  readonly tramosCargaFilters: DataGridFilter<TramoCargaParametro>[] = [
    {
      id: 'periodo',
      label: 'Período',
      field: 'periodo',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
  ];
}

