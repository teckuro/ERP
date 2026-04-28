import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
import { TramoCargaParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-tramos-carga-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="tramos-carga-title">
        <h2 id="tramos-carga-title">Tramos cargas familiares</h2>
        <app-data-grid
          title="Tramos de asignación familiar"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="28rem"
          persistenceKey="parametros.tramos-carga.dg"
          emptyTitle="No hay tramos cargados"
          emptyDescription="Sin carga externa de asignación familiar."
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
  @Input() refresh: (() => void) | null = null;
}

