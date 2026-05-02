import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import {
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  ParametroLegal,
  ReformaPrevisionalParametro,
  TrabajoPesadoParametro,
} from '../../models/parametro-general.model';
import { ParametrosInnerTabBarComponent } from '../parametros-inner-tab-bar.component';

type ReformaSubId = 'legales' | 'aportes' | 'trabPesados' | 'apvInst' | 'apvPago';

@Component({
  selector: 'app-parametros-reforma-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel">
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
          <section class="catalog-section" aria-label="Parametros legales">
            <app-data-grid
              title="Parámetros legales"
              [rows]="reformaPensiones"
              [columns]="parametrosLegalesColumns"
              [loading]="loading"
              [filters]="parametrosLegalesFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="10"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyLegal"
              emptyTitle="No hay parámetros legales vigentes al período activo"
              emptyDescription="Prueba con otro período o revisa la carga normativa."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'aportes') {
          <section class="catalog-section" aria-label="Aportes previsionales">
            <app-data-grid
              title="Aportes previsionales"
              [rows]="reformaPrevisional"
              [columns]="reformaPrevisionalColumns"
              [loading]="loading"
              [filters]="reformaPrevisionalFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyPrevisional"
              emptyTitle="No hay gradualidad cargada"
              emptyDescription="Revisa la normativa base de Reforma de Pensiones."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'trabPesados') {
          <section class="catalog-section" aria-label="Trabajos pesados">
            <app-data-grid
              title="Trabajos pesados"
              [rows]="trabajosPesados"
              [columns]="trabajosPesadosColumns"
              [loading]="loading"
              [filters]="trabajosPesadosFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyTrabPesados"
              emptyTitle="No hay trabajos pesados para el período activo"
              emptyDescription="Revisa la carga mensual o el catálogo normativo."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'apvInst') {
          <section class="catalog-section" aria-label="Instituciones APV">
            <app-data-grid
              title="Instituciones APV"
              [rows]="apvInstituciones"
              [columns]="apvInstitucionesColumns"
              [loading]="loading"
              [filters]="apvInstitucionesFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyApvInst"
              emptyTitle="Sin instituciones APV en catálogo"
              emptyDescription="Revisa la normativa base o maestros."
              (refresh)="refresh?.()"
            ></app-data-grid>
          </section>
        }

        @if (activeSub() === 'apvPago') {
          <section class="catalog-section" aria-label="Formas de pago APV">
            <app-data-grid
              title="Formas de pago APV"
              [rows]="apvFormasPago"
              [columns]="apvFormasPagoColumns"
              [loading]="loading"
              [filters]="apvFormasPagoFilters"
              [filtersEnabled]="true"
              [showExportAction]="true"
              [maxItems]="8"
              gridHeight="min(520px, 100%)"
              [persistenceKey]="gridPersistenceKeyApvPago"
              emptyTitle="Sin formas de pago APV en catálogo"
              emptyDescription="Revisa la normativa base o maestros."
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
    { id: 'legales' as const, label: 'Legales' },
    { id: 'aportes' as const, label: 'Aportes' },
    { id: 'trabPesados' as const, label: 'Trab. pesados' },
    { id: 'apvInst' as const, label: 'APV inst.' },
    { id: 'apvPago' as const, label: 'APV pago' },
  ];

  readonly activeSub = signal<ReformaSubId>('legales');

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
  @Input() gridPersistenceKeyLegal = 'parametros.reforma-legal.dg';
  @Input() gridPersistenceKeyPrevisional = 'parametros.reforma-previsional.dg';
  @Input() gridPersistenceKeyTrabPesados = 'parametros.trabajos-pesados.dg';
  @Input() gridPersistenceKeyApvInst = 'parametros.apv-instituciones.dg';
  @Input() gridPersistenceKeyApvPago = 'parametros.apv-formas-pago.dg';
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

  readonly trabajosPesadosFilters: DataGridFilter<TrabajoPesadoParametro>[] = [
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

  readonly apvInstitucionesFilters: DataGridFilter<ApvApvcInstitucion>[] = [
    {
      id: 'codigo',
      label: 'Codigo',
      field: 'codigo',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'nombre',
      label: 'Institucion',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'vigente',
      label: 'Estado',
      field: 'vigente',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Vigente', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
  ];

  readonly apvFormasPagoFilters: DataGridFilter<ApvApvcFormaPago>[] = [
    {
      id: 'codigo',
      label: 'Codigo',
      field: 'codigo',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'nombre',
      label: 'Forma',
      field: 'nombre',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
    {
      id: 'vigente',
      label: 'Estado',
      field: 'vigente',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Vigente', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
  ];

  setSub(id: string): void {
    const allowed: ReformaSubId[] = ['legales', 'aportes', 'trabPesados', 'apvInst', 'apvPago'];
    if (allowed.includes(id as ReformaSubId)) {
      this.activeSub.set(id as ReformaSubId);
    }
  }
}
