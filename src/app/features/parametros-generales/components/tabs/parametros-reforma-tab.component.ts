import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
import {
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  ParametroLegal,
  ReformaPrevisionalParametro,
  TrabajoPesadoParametro,
} from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-reforma-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="reforma-title">
        <h2 id="reforma-title">Reforma de Pensiones</h2>
        <app-data-grid
          title="Parametros legales"
          [rows]="reformaPensiones"
          [columns]="parametrosLegalesColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="24rem"
          persistenceKey="parametros.reforma-legal.dg"
          emptyTitle="No hay parametros legales"
          emptyDescription="Sin registros externos de reforma o APV."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>

      <section class="catalog-section" aria-labelledby="reforma-previsional-title">
        <h2 id="reforma-previsional-title">Aportes reforma previsional</h2>
        <app-data-grid
          title="Aportes previsionales"
          [rows]="reformaPrevisional"
          [columns]="reformaPrevisionalColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="8"
          gridHeight="20rem"
          persistenceKey="parametros.reforma-previsional.dg"
          emptyTitle="No hay aportes de reforma"
          emptyDescription="Sin parametros externos de aporte empleador."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>

      <section class="catalog-section" aria-labelledby="trabajos-pesados-title">
        <h2 id="trabajos-pesados-title">Trabajos pesados</h2>
        <app-data-grid
          title="Trabajos pesados"
          [rows]="trabajosPesados"
          [columns]="trabajosPesadosColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="8"
          gridHeight="20rem"
          persistenceKey="parametros.trabajos-pesados.dg"
          emptyTitle="No hay parametros de trabajos pesados"
          emptyDescription="Sin tasas externas por trabajo pesado."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>

      <section class="catalog-section catalog-section--split" aria-labelledby="apv-title">
        <h2 id="apv-title">APV / APVC</h2>
        <app-data-grid
          title="Instituciones APV"
          [rows]="apvInstituciones"
          [columns]="apvInstitucionesColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="8"
          gridHeight="18rem"
          persistenceKey="parametros.apv-instituciones.dg"
          emptyTitle="No hay instituciones APV"
          emptyDescription="Sin instituciones APV/APVC externas."
          (refresh)="refresh?.()"
        ></app-data-grid>

        <app-data-grid
          title="Formas de pago APV"
          [rows]="apvFormasPago"
          [columns]="apvFormasPagoColumns"
          [loading]="loading"
          [filtersEnabled]="false"
          [showExportAction]="true"
          [maxItems]="8"
          gridHeight="18rem"
          persistenceKey="parametros.apv-formas-pago.dg"
          emptyTitle="No hay formas de pago APV"
          emptyDescription="Sin formas de pago APV/APVC externas."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosReformaTabComponent {
  @Input({ required: true }) reformaPensiones!: ParametroLegal[];
  @Input({ required: true }) reformaPrevisional!: ReformaPrevisionalParametro[];
  @Input({ required: true }) trabajosPesados!: TrabajoPesadoParametro[];
  @Input({ required: true }) apvInstituciones!: ApvApvcInstitucion[];
  @Input({ required: true }) apvFormasPago!: ApvApvcFormaPago[];

  @Input({ required: true }) parametrosLegalesColumns!: DataGridColumn<ParametroLegal>[];
  @Input({ required: true }) reformaPrevisionalColumns!: DataGridColumn<ReformaPrevisionalParametro>[];
  @Input({ required: true }) trabajosPesadosColumns!: DataGridColumn<TrabajoPesadoParametro>[];
  @Input({ required: true }) apvInstitucionesColumns!: DataGridColumn<ApvApvcInstitucion>[];
  @Input({ required: true }) apvFormasPagoColumns!: DataGridColumn<ApvApvcFormaPago>[];

  @Input() loading = false;
  @Input() refresh: (() => void) | null = null;
}

