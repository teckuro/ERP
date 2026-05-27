import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { IsapreParametro } from '../../models/parametro-general.model';
import { ParametrosInnerTabBarComponent } from '../parametros-inner-tab-bar.component';

export type SaludSubId = 'isapre' | 'instituciones';

@Component({
  selector: 'app-parametros-salud-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel parametros-tab-panel">
      <div class="param-subhead">
        <div class="param-subhead__tabs">
          <app-parametros-inner-tab-bar
            ariaLabel="Secciones de salud"
            mobileLabel="Vista"
            [tabs]="saludInnerTabs"
            [activeId]="activeSub"
            (activeIdChange)="emitSub($event)"
          />
        </div>
      </div>

      <div class="param-tab-subview">
        @if (activeSub === 'isapre') {
          <section class="catalog-section parametros-grid-shell" aria-label="ISAPRE">
            <app-data-grid
              title="ISAPRE"
              [rows]="isapreRows"
              [columns]="columns"
              [loading]="loading"
              [filtersEnabled]="false"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="100%"
              [persistenceKey]="gridPersistenceKeyIsapre"
              emptyTitle="No hay ISAPRE vigentes para el período activo"
              emptyDescription="Prueba con otro período o revisa el catálogo de salud."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub === 'instituciones') {
          <section class="catalog-section parametros-grid-shell" aria-label="Instituciones de salud">
            <app-data-grid
              title="Instituciones de salud"
              [rows]="institucionesRows"
              [columns]="columns"
              [loading]="loading"
              [filtersEnabled]="false"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="100%"
              [persistenceKey]="gridPersistenceKeyInstituciones"
              emptyTitle="No hay instituciones de salud vigentes para el período activo"
              emptyDescription="Prueba con otro período o revisa el catálogo de salud."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }
      </div>
    </section>
  `,
})
export class ParametrosSaludTabComponent {
  readonly saludInnerTabs = [
    { id: 'isapre' as const, label: 'ISAPRE' },
    { id: 'instituciones' as const, label: 'Instituciones' },
  ];

  @Input({ required: true }) activeSub!: SaludSubId;
  @Output() activeSubChange = new EventEmitter<SaludSubId>();

  @Input({ required: true }) isapreRows!: IsapreParametro[];
  @Input({ required: true }) institucionesRows!: IsapreParametro[];
  @Input({ required: true }) columns!: DataGridColumn<IsapreParametro>[];

  @Input() loading = false;
  @Input() gridPersistenceKeyIsapre = 'parametros.isapre.dg';
  @Input() gridPersistenceKeyInstituciones = 'parametros.salud-instituciones.dg';
  @Input() refresh: (() => void) | null = null;

  emitSub(id: string): void {
    if (id === 'isapre' || id === 'instituciones') {
      this.activeSubChange.emit(id);
    }
  }
}
