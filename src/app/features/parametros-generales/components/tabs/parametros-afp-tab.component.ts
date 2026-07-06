import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { AfpParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-afp-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <section class="catalog-section parametros-grid-shell" aria-label="AFP">
        <app-data-grid
          title="AFP"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filtersEnabled]="false"
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
}

