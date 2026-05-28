import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { TablaImpuestoUnicoParametro, TramoImpuestoParametro } from '../../models/parametro-general.model';

/** @deprecated Solo se usa la vista tabla SII; se mantiene el tipo por compatibilidad interna. */
export type ImpuestoSubId = 'tabla';

@Component({
  selector: 'app-parametros-tramos-renta-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <section class="catalog-section parametros-grid-shell" aria-label="Tabla impuesto único SII">
        <app-data-grid
          title="Tabla impuesto único (SII)"
          [rows]="tablaRows"
          [columns]="tablaColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="12"
          gridHeight="min(520px, 100%)"
          [persistenceKey]="gridPersistenceKeyTabla"
          [emptyTitle]="'No hay tabla de impuesto único para ' + periodoLabel + '.'"
          emptyDescription="Ejecute la carga mensual v6.11 (fuente SII) para este período."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosTramosRentaTabComponent {
  @Input({ required: true }) activeSub!: ImpuestoSubId;
  @Output() activeSubChange = new EventEmitter<ImpuestoSubId>();

  @Input({ required: true }) tablaRows!: TablaImpuestoUnicoParametro[];
  @Input({ required: true }) tablaColumns!: DataGridColumn<TablaImpuestoUnicoParametro>[];
  /** @deprecated Ya no se muestra grilla separada; se conserva el input por contrato del contenedor. */
  @Input({ required: true }) tramosRows!: TramoImpuestoParametro[];
  @Input({ required: true }) tramosColumns!: DataGridColumn<TramoImpuestoParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyTabla = 'parametros.tabla-impuesto.dg';
  @Input() gridPersistenceKeyTramos = 'parametros.tramos-impuesto.dg';
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaTramosPeriodoLabel: string | null = null;
  @Input() referenciaTablaPeriodoLabel: string | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() refresh: (() => void) | null = null;
}
