import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import { IsapreParametro } from '../../models/parametro-general.model';
import { ParametrosInnerTabBarComponent } from '../parametros-inner-tab-bar.component';

type SaludSubId = 'isapre' | 'instituciones';

@Component({
  selector: 'app-parametros-salud-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent, ParametrosInnerTabBarComponent],
  template: `
    <section class="tab-panel">
      <div class="param-subhead">
        <div class="param-subhead__tabs">
          <app-parametros-inner-tab-bar
            ariaLabel="Secciones de salud"
            mobileLabel="Vista"
            [tabs]="saludInnerTabs"
            [activeId]="activeSub()"
            (activeIdChange)="setSub($event)"
          />
        </div>
        <div class="param-hint param-hint--consulta param-hint--inline" role="note">
          <span class="param-hint__tag">Vigencia</span>
          <span class="param-hint__tag">Vigente al período activo</span>
          <span class="param-hint__tag">Solo lectura</span>
          <span class="param-hint__text">Instituciones vigentes para el período {{ periodo }}.</span>
        </div>
      </div>

      <div class="param-tab-subview">
        @if (activeSub() === 'isapre') {
          <section class="catalog-section" aria-label="ISAPRE">
            <app-data-grid
              title="ISAPRE"
              [rows]="isapreRows"
              [columns]="columns"
              [loading]="loading"
              [filters]="isapreFilters"
              [filtersEnabled]="true"
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

        @if (activeSub() === 'instituciones') {
          <section class="catalog-section" aria-label="Instituciones de salud">
            <app-data-grid
              title="Instituciones de salud"
              [rows]="institucionesRows"
              [columns]="columns"
              [loading]="loading"
              [filters]="institucionesFilters"
              [filtersEnabled]="true"
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

  readonly activeSub = signal<SaludSubId>('isapre');

  @Input({ required: true }) isapreRows!: IsapreParametro[];
  @Input({ required: true }) institucionesRows!: IsapreParametro[];
  @Input({ required: true }) columns!: DataGridColumn<IsapreParametro>[];

  @Input() periodo = '';
  @Input() loading = false;
  @Input() gridPersistenceKeyIsapre = 'parametros.isapre.dg';
  @Input() gridPersistenceKeyInstituciones = 'parametros.salud-instituciones.dg';
  @Input() refresh: (() => void) | null = null;

  readonly isapreFilters: DataGridFilter<IsapreParametro>[] = [
    {
      id: 'vigenciaInicio',
      label: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
    {
      id: 'codigo',
      label: 'Codigo',
      field: 'codigo',
      type: 'text',
      operator: 'contains',
      placeholder: 'Filtrar por codigo',
      emptyLabel: 'Todos',
    },
    {
      id: 'nombre',
      label: 'Nombre',
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

  readonly institucionesFilters: DataGridFilter<IsapreParametro>[] = [
    {
      id: 'vigenciaInicio',
      label: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-05',
      emptyLabel: 'Todos',
    },
    {
      id: 'tipo',
      label: 'Tipo',
      field: 'tipo',
      type: 'text',
      operator: 'contains',
      emptyLabel: 'Todos',
    },
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
      label: 'Nombre',
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
    if (id === 'isapre' || id === 'instituciones') {
      this.activeSub.set(id);
    }
  }
}
