import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import { TablaImpuestoUnicoParametro, TramoImpuestoParametro } from '../../models/parametro-general.model';
import { ParametrosInnerTabBarComponent } from '../parametros-inner-tab-bar.component';

type ImpuestoSubId = 'tramos' | 'tabla';

@Component({
  selector: 'app-parametros-tramos-renta-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel">
      <div class="param-subhead">
        <div class="param-subhead__tabs">
          <app-parametros-inner-tab-bar
            ariaLabel="Secciones impuesto unico"
            mobileLabel="Vista"
            [tabs]="impuestoInnerTabs"
            [activeId]="activeSub()"
            (activeIdChange)="setSub($event)"
          />
        </div>
      </div>

      <div class="param-tab-subview">
        @if (activeSub() === 'tramos') {
          <section class="catalog-section" aria-label="Tramos impuesto">
            <app-data-grid
              title="Tramos impuesto por periodo"
              [rows]="tramosRows"
              [columns]="tramosColumns"
              [loading]="loading"
              [filters]="tramosImpuestoFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyTramos"
              emptyTitle="No hay tramos de impuesto único para este período"
              emptyDescription="Revisa la carga mensual o crea parámetros para el mes seleccionado."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'tabla') {
          <section class="catalog-section" aria-label="Tabla impuesto unico">
            <app-data-grid
              title="Tabla impuesto único"
              [rows]="tablaRows"
              [columns]="tablaColumns"
              [loading]="loading"
              [filters]="tablaImpuestoFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyTabla"
              emptyTitle="No hay tabla de impuesto único para este período"
              emptyDescription="Revisa la carga mensual o la normativa base."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }
      </div>
    </section>
  `,
})
export class ParametrosTramosRentaTabComponent {
  readonly impuestoInnerTabs = [
    { id: 'tramos' as const, label: 'Tramos' },
    { id: 'tabla' as const, label: 'Tabla' },
  ];

  readonly activeSub = signal<ImpuestoSubId>('tramos');

  @Input({ required: true }) tablaRows!: TablaImpuestoUnicoParametro[];
  @Input({ required: true }) tablaColumns!: DataGridColumn<TablaImpuestoUnicoParametro>[];
  @Input({ required: true }) tramosRows!: TramoImpuestoParametro[];
  @Input({ required: true }) tramosColumns!: DataGridColumn<TramoImpuestoParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyTabla = 'parametros.tabla-impuesto.dg';
  @Input() gridPersistenceKeyTramos = 'parametros.tramos-impuesto.dg';
  @Input() refresh: (() => void) | null = null;

  /**
   * Filtra por `periodo` YYYY-MM (columna generada en BD). Definido como filtro independiente del DataGrid
   * para que siga aplicando aunque la columna «Vigencia» esté oculta en el panel de columnas.
   */
  readonly tablaImpuestoFilters: DataGridFilter<TablaImpuestoUnicoParametro>[] = [
    {
      id: 'periodo',
      label: 'Período tabla',
      field: 'periodo',
      type: 'text',
      operator: 'startsWith',
      normalize: 'none',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
  ];

  readonly tramosImpuestoFilters: DataGridFilter<TramoImpuestoParametro>[] = [
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

  setSub(id: string): void {
    if (id === 'tramos' || id === 'tabla') {
      this.activeSub.set(id);
    }
  }
}
