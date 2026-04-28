import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import { IsapreParametro } from '../../models/parametro-general.model';

@Component({
  selector: 'app-parametros-isapre-tab',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <section class="tab-panel">
      <section class="catalog-section" aria-labelledby="isapre-title">
        <h2 id="isapre-title">ISAPRE</h2>
        <app-data-grid
          title="Instituciones de salud"
          [rows]="rows"
          [columns]="columns"
          [loading]="loading"
          [filters]="isapreFilters"
          [filtersEnabled]="true"
          [showExportAction]="true"
          [maxItems]="10"
          gridHeight="28rem"
          persistenceKey="parametros.isapre.dg"
          emptyTitle="No hay ISAPRE cargadas"
          emptyDescription="Sin registros externos de salud privada."
          (refresh)="refresh?.()"
        ></app-data-grid>
      </section>
    </section>
  `,
})
export class ParametrosIsapreTabComponent {
  @Input({ required: true }) rows!: IsapreParametro[];
  @Input({ required: true }) columns!: DataGridColumn<IsapreParametro>[];
  @Input() loading = false;
  @Input() refresh: (() => void) | null = null;

  readonly isapreFilters: DataGridFilter<IsapreParametro>[] = [
    {
      id: 'periodo',
      label: 'Periodo',
      field: 'vigenciaInicio',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-04',
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
}

