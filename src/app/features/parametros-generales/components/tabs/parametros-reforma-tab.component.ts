import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid';
import {
  ParametroLegal,
  ReformaPrevisionalParametro,
} from '../../models/parametro-general.model';
import { ParametrosInnerTabBarComponent } from '../parametros-inner-tab-bar.component';

type ReformaSubId = 'legales' | 'aportes';

@Component({
  selector: 'app-parametros-reforma-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <p class="param-section-lead parametros-reforma-observacion">
        Observación normativa para anticipar la gradualidad de la reforma de pensiones en próximos períodos.
      </p>

      <div class="param-subhead">
        <div class="param-subhead__tabs">
          <app-parametros-inner-tab-bar
            ariaLabel="Secciones reforma de pensiones"
            mobileLabel="Vista"
            [tabs]="reformaInnerTabs"
            [activeId]="activeSub()"
            (activeIdChange)="setSub($event)"
          />
        </div>
      </div>

      <div class="param-tab-subview">
        @if (activeSub() === 'legales') {
          <section class="catalog-section parametros-grid-shell" aria-label="Reforma de pensiones">
            <app-data-grid
              title="Reforma de pensiones"
              [rows]="reformaPensiones"
              [columns]="parametrosLegalesColumns"
              [loading]="loading"
              [filters]="parametrosLegalesFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyLegal"
              emptyTitle="No hay registros de reforma para el período activo"
              emptyDescription="Prueba con otro período o revisa la carga normativa."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'aportes') {
          <section class="catalog-section parametros-grid-shell" aria-label="Gradualidad futura">
            <app-data-grid
              title="Gradualidad futura"
              [rows]="reformaPrevisional"
              [columns]="reformaPrevisionalColumns"
              [loading]="loading"
              [filters]="reformaPrevisionalFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyPrevisional"
              emptyTitle="No hay gradualidad vigente al período activo"
              emptyDescription="Revisa las vigencias de reforma previsional."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }
      </div>
    </section>
  `,
})
export class ParametrosReformaTabComponent {
  readonly reformaInnerTabs = [
    { id: 'legales' as const, label: 'Reforma' },
    { id: 'aportes' as const, label: 'Gradualidad' },
  ];

  readonly activeSub = signal<ReformaSubId>('legales');

  @Input({ required: true }) reformaPensiones!: ParametroLegal[];
  @Input({ required: true }) reformaPrevisional!: ReformaPrevisionalParametro[];

  @Input({ required: true }) parametrosLegalesColumns!: DataGridColumn<ParametroLegal>[];
  @Input({ required: true }) reformaPrevisionalColumns!: DataGridColumn<ReformaPrevisionalParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyLegal = 'parametros.reforma-legal.dg';
  @Input() gridPersistenceKeyPrevisional = 'parametros.reforma-previsional.dg';
  @Input() refresh: (() => void) | null = null;

  readonly parametrosLegalesFilters: DataGridFilter<ParametroLegal>[] = [
    {
      id: 'vigenciaInicio',
      label: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
  ];

  readonly reformaPrevisionalFilters: DataGridFilter<ReformaPrevisionalParametro>[] = [
    {
      id: 'vigenciaInicio',
      label: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-08',
      emptyLabel: 'Todos',
    },
  ];

  setSub(id: string): void {
    const allowed: ReformaSubId[] = ['legales', 'aportes'];
    if (allowed.includes(id as ReformaSubId)) {
      this.activeSub.set(id as ReformaSubId);
    }
  }
}
