import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
import { AfpParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-afp-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="afp-title">
        <h2 id="afp-title">Información AFP</h2>
        <app-data-grid
          title="AFP"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="28rem"
          persistenceKey="parametros.afp.dg"
          emptyTitle="No hay AFP cargadas"
          emptyDescription="Sin tasas externas por administradora."
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
  @Input() refresh: (() => void) | null = null;
}

