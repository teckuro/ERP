import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import {
  ReformaPrevisionalParametro,
} from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-reforma-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <div class="param-tab-subview">
        <section class="catalog-section parametros-grid-shell" aria-label="Gradualidad futura">
          <app-data-grid
            title="Gradualidad futura"
            [rows]="reformaPrevisional"
            [columns]="reformaPrevisionalColumns"
            [loading]="loading"
            [filtersEnabled]="false"
            [showExportAction]="true"
            [maxItems]="8"
            gridHeight="min(520px, 100%)"
            [persistenceKey]="gridPersistenceKeyPrevisional"
            emptyTitle="No hay gradualidad vigente al período activo"
            emptyDescription="Revisa las vigencias de reforma previsional."
            (refresh)="refresh?.()"
          ></app-data-grid>
        </section>
      </div>
    </section>
  `,
})
export class ParametrosReformaTabComponent {
  @Input({ required: true }) reformaPrevisional!: ReformaPrevisionalParametro[];

  @Input({ required: true }) reformaPrevisionalColumns!: DataGridColumn<ReformaPrevisionalParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyPrevisional = 'parametros.reforma-previsional.dg';
  @Input() refresh: (() => void) | null = null;
}
