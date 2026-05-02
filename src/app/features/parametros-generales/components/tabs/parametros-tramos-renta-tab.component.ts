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
    <section class="tab-panel parametros-tab-panel">
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
          <section class="catalog-section parametros-grid-shell" aria-label="Tramos impuesto">
            @if (tramosRows.length === 0 && referenciaPeriodoLabel) {
              <div class="param-reference-callout" role="note">
                <div>
                  <span class="param-reference-callout__label">Referencia disponible: {{ referenciaPeriodoLabel }}</span>
                  <p>No se usara para calculo de {{ periodoLabel }}.</p>
                </div>
                <button type="button" class="param-reference-callout__action" (click)="verReferenciaPeriodoAnterior?.()">
                  Ver referencia {{ referenciaPeriodoLabel }}
                </button>
              </div>
            }
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
              [emptyTitle]="'No hay tramos de impuesto unico para ' + periodoLabel + '.'"
              emptyDescription="La tabla oficial del periodo aun no esta integrada."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'tabla') {
          <section class="catalog-section parametros-grid-shell" aria-label="Tabla impuesto unico">
            @if (tablaRows.length === 0 && referenciaPeriodoLabel) {
              <div class="param-reference-callout" role="note">
                <div>
                  <span class="param-reference-callout__label">Referencia disponible: {{ referenciaPeriodoLabel }}</span>
                  <p>No se usara para calculo de {{ periodoLabel }}.</p>
                </div>
                <button type="button" class="param-reference-callout__action" (click)="verReferenciaPeriodoAnterior?.()">
                  Ver referencia {{ referenciaPeriodoLabel }}
                </button>
              </div>
            }
            <app-data-grid
              title="Tabla impuesto unico"
              [rows]="tablaRows"
              [columns]="tablaColumns"
              [loading]="loading"
              [filters]="tablaImpuestoFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyTabla"
              [emptyTitle]="'No hay tabla de impuesto unico para ' + periodoLabel + '.'"
              emptyDescription="La tabla oficial del periodo aun no esta integrada."
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
  @Input() periodoLabel = 'este periodo';
  @Input() referenciaPeriodoLabel: string | null = null;
  @Input() verReferenciaPeriodoAnterior: (() => void) | null = null;
  @Input() refresh: (() => void) | null = null;

  readonly tablaImpuestoFilters: DataGridFilter<TablaImpuestoUnicoParametro>[] = [
    {
      id: 'periodo',
      label: 'Periodo tabla',
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
      label: 'Periodo',
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
