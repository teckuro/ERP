import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
import { TablaImpuestoUnicoParametro, TramoImpuestoParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-tramos-renta-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="tabla-impuesto-title">
        <h2 id="tabla-impuesto-title">Tramos Impuesto a la Renta</h2>
        <div class="catalog-grid">
          <app-data-grid
            title="Tabla impuesto unico"
            [rows]="tablaRows"
            [columns]="tablaColumns"
            [loading]="loading"
            [filtersEnabled]="false"
            [showExportAction]="true"
            [maxItems]="10"
            gridHeight="28rem"
            persistenceKey="parametros.tabla-impuesto.dg"
            emptyTitle="No hay tabla de impuesto cargada"
            emptyDescription="Sin carga externa del SII para impuesto unico."
            (refresh)="refresh?.()"
          ></app-data-grid>

          <app-data-grid
            title="Tramos impuesto periodo"
            [rows]="tramosRows"
            [columns]="tramosColumns"
            [loading]="loading"
            [filtersEnabled]="false"
            [showExportAction]="true"
            [maxItems]="10"
            gridHeight="28rem"
            persistenceKey="parametros.tramos-impuesto.dg"
            emptyTitle="No hay tramos por periodo"
            emptyDescription="Sin tramos mensuales heredados."
            (refresh)="refresh?.()"
          ></app-data-grid>
        </div>
      </section>
    </section>
  `,
})
export class ParametrosTramosRentaTabComponent {
  @Input({ required: true }) tablaRows!: TablaImpuestoUnicoParametro[];
  @Input({ required: true }) tablaColumns!: DataGridColumn<TablaImpuestoUnicoParametro>[];
  @Input({ required: true }) tramosRows!: TramoImpuestoParametro[];
  @Input({ required: true }) tramosColumns!: DataGridColumn<TramoImpuestoParametro>[];

  @Input() loading = false;
  @Input() refresh: (() => void) | null = null;
}

