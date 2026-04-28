import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
import {
  CcafEntidad,
  Ley16744Parametro,
  OrganismoLey16744,
  ParametrosGeneralesCatalogos,
} from '../../models/parametro-general.model';

export type CcafMutualesTabMode = 'config' | 'ccafLista' | 'mutualesLey';

@Component({
  selector: 'app-parametros-ccaf-mutuales-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      @if (mode === 'config') {
        <section class="param-group" aria-labelledby="ccaf-title">
          <h2 id="ccaf-title">Configuracion CCAF y Mutual</h2>
          <div class="field-grid field-grid--ccaf" aria-label="Configuracion CCAF y Mutual">
            <label class="param-field">
              <span>Caja de Compensacion</span>
              <select class="param-input" [value]="selectedCcafId ?? ''" (change)="seleccionarCcaf?.($event)">
                <option value="">Sin CCAF cargada</option>
                @for (ccaf of catalogos.ccafEntidades; track ccaf.idCcafEntidad) {
                  <option [value]="ccaf.idCcafEntidad">{{ ccaf.nombre }}</option>
                }
              </select>
            </label>

            <div class="erp-grid-filler" aria-hidden="true"></div>

            <label class="param-field">
              <span>Mutual de Seguridad</span>
              <select class="param-input" [value]="selectedMutualId ?? ''" (change)="seleccionarMutual?.($event)">
                <option value="">Sin mutual cargada</option>
                @for (mutual of catalogos.organismosLey16744; track mutual.idOrganismoAdministradorLey16744) {
                  <option [value]="mutual.idOrganismoAdministradorLey16744">{{ mutual.nombre }}</option>
                }
              </select>
            </label>

            <label class="param-field">
              <span>Porcentaje</span>
              <span class="unit-field unit-field--suffix" data-unit="%" style="width: 100%;">
                <input class="param-input text-right" type="text" [value]="percentLabel" readonly />
              </span>
            </label>
          </div>
        </section>
      }

      @if (mode === 'ccafLista') {
        <section class="catalog-section" aria-labelledby="lista-ccaf-title">
          <h2 id="lista-ccaf-title">Lista CCAF</h2>
          <app-data-grid
            title="CCAF"
            [rows]="catalogos.ccafEntidades"
            [columns]="ccafColumns"
            [loading]="loading"
            [filtersEnabled]="false"
            [showExportAction]="true"
            [maxItems]="8"
            gridHeight="22rem"
            persistenceKey="parametros.ccaf.dg"
            emptyTitle="No hay CCAF cargadas"
            emptyDescription="Sin registros externos de cajas de compensacion."
            (refresh)="refresh?.()"
          ></app-data-grid>
        </section>
      }

      @if (mode === 'mutualesLey') {
        <section class="catalog-section" aria-labelledby="lista-mutuales-title">
          <h2 id="lista-mutuales-title">Mutuales y Ley 16.744</h2>
          <div class="catalog-grid">
            <app-data-grid
              title="Organismos administradores"
              [rows]="catalogos.organismosLey16744"
              [columns]="organismosLeyColumns"
              [loading]="loading"
              [filtersEnabled]="false"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="22rem"
              persistenceKey="parametros.mutuales.dg"
              emptyTitle="No hay mutuales cargadas"
              emptyDescription="Sin organismos administradores Ley 16.744."
              (refresh)="refresh?.()"
            ></app-data-grid>

            <app-data-grid
              title="Parametros Ley 16.744"
              [rows]="catalogos.ley16744Parametros"
              [columns]="ley16744Columns"
              [loading]="loading"
              [filtersEnabled]="false"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="22rem"
              persistenceKey="parametros.ley16744.dg"
              emptyTitle="No hay parametros Ley 16.744"
              emptyDescription="Sin tasas base externas para mutuales."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </div>
        </section>
      }
    </section>
  `,
})
export class ParametrosCcafMutualesTabComponent {
  @Input() mode: CcafMutualesTabMode = 'config';
  @Input({ required: true }) catalogos!: ParametrosGeneralesCatalogos;
  @Input({ required: true }) ccafColumns!: DataGridColumn<CcafEntidad>[];
  @Input({ required: true }) organismosLeyColumns!: DataGridColumn<OrganismoLey16744>[];
  @Input({ required: true }) ley16744Columns!: DataGridColumn<Ley16744Parametro>[];

  @Input() loading = false;
  @Input() selectedCcafId: number | null = null;
  @Input() selectedMutualId: number | null = null;
  @Input() percentLabel = '-';

  @Input() seleccionarCcaf: ((event: Event) => void) | null = null;
  @Input() seleccionarMutual: ((event: Event) => void) | null = null;
  @Input() refresh: (() => void) | null = null;
}

