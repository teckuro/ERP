import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
import { IsapreParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-isapre-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="isapre-title">
        <h2 id="isapre-title">ISAPRE</h2>
        <app-data-grid
          title="Instituciones de salud"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="28rem"
          persistenceKey="parametros.isapre.dg"
          emptyTitle="No hay ISAPRE cargadas"
          emptyDescription="Sin registros externos de salud privada."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosIsapreTabComponent {
  @Input({ required: true }) rows!: IsapreParametro[];
  @Input({ required: true }) columns!: DataGridColumn<IsapreParametro>[];
  @Input() loading = false;
  @Input() refresh: (() => void) | null = null;
}

