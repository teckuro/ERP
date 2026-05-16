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
    <section class="tab-panel parametros-tab-panel">
      <section class="catalog-section parametros-grid-shell" aria-labelledby="tramos-carga-title">
        <h2 id="tramos-carga-title">Tramos cargas familiares</h2>
        <app-data-grid
          title="Tramos de asignacion familiar"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filters]="tramosCargaFilters"
          [filtersEnabled]="true"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="min(520px, 100%)"
          [persistenceKey]="gridPersistenceKey"
          [emptyTitle]="'No hay tramos de asignacion familiar para ' + periodoLabel + '.'"
          emptyDescription="La carga oficial del periodo esta pendiente."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosTramosCargaTabComponent {
  @Input({ required: true }) rows!: TramoCargaParametro[];
  @Input({ required: true }) columns!: DataGridColumn<TramoCargaParametro>[];
  @Input() loading = false;
  @Input() gridPersistenceKey = 'parametros.tramos-carga.dg';
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() refresh: (() => void) | null = null;

  readonly tramosCargaFilters: DataGridFilter<TramoCargaParametro>[] = [
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
