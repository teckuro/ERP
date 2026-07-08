import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { DataGridColumn, DataGridComponent, DataGridFilter } from '../../../../shared/components/ui/data-grid';
import { ParametroGeneral } from '../../models/parametro-general.model';
import {
  PARAMETROS_DATA_GRID_SHELL,
  PARAMETROS_EMPTY_FILTERED,
  PARAMETROS_GRID_EMPTY,
} from '../../utils/parametros-workspace-grids.presenter';

@Component({
  selector: 'app-tabla-parametros-generales',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './tabla-parametros-generales.html',
  styleUrl: './tabla-parametros-generales.css',
})
export class TablaParametrosGeneralesComponent {
  readonly gridShell = PARAMETROS_DATA_GRID_SHELL;
  readonly emptyFiltered = PARAMETROS_EMPTY_FILTERED;
  readonly gridCopy = PARAMETROS_GRID_EMPTY.listado;

  @Input() rows: ParametroGeneral[] = [];
  @Input() loading = false;
  @Input() mensajeError = '';
  @Output() refresh = new EventEmitter<void>();

  readonly filters: DataGridFilter<ParametroGeneral>[] = [
    {
      id: 'periodo',
      label: 'Período',
      field: 'periodo',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej.: 2026-04',
      emptyLabel: 'Todos',
    },
    {
      id: 'gratificacion',
      label: 'Gratificación legal',
      field: 'gratificacion',
      type: 'select',
      emptyLabel: 'Todas',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      id: 'descuentosBasePorDia',
      label: 'Descuentos base por día',
      field: 'descuentosBasePorDia',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      id: 'fechaActualizacion',
      label: 'Última actualización',
      field: 'fechaActualizacion',
      type: 'date-range',
      emptyLabel: 'Cualquier fecha',
    },
  ];

  private readonly clpFormatter = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  });

  private readonly decimalFormatter = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly percentFormatter = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  private formatMoney = (value: unknown): string => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? `$ ${this.clpFormatter.format(numberValue)}` : '—';
  };

  private formatDecimal = (value: unknown): string => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? this.decimalFormatter.format(numberValue) : '—';
  };

  private formatPercent = (value: unknown): string => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? `${this.percentFormatter.format(numberValue)} %` : '—';
  };

  private formatBoolean = (value: unknown): string => (value ? 'Sí' : 'No');

  private formatDateTime = (value: unknown): string => {
    if (!value) {
      return '—';
    }

    const date = new Date(String(value));
    return Number.isFinite(date.getTime()) ? this.dateFormatter.format(date) : String(value || '—');
  };

  readonly columns: DataGridColumn<ParametroGeneral>[] = [
    { id: 'periodo', header: 'Período', field: 'periodo', sortable: true },
    { id: 'uf', header: 'UF', field: 'uf', sortable: true, align: 'right', format: this.formatDecimal },
    { id: 'utm', header: 'UTM', field: 'utm', sortable: true, align: 'right', format: this.formatMoney },
    {
      id: 'sueldoMinimo',
      header: 'Sueldo mínimo',
      field: 'sueldoMinimo',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'sueldoMinimo18a65',
      header: 'Sueldo mínimo 18 a 65',
      field: 'sueldoMinimo18a65',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'immGratificacion',
      header: 'IMM gratificación',
      field: 'immGratificacion',
      sortable: true,
      align: 'right',
      format: this.formatDecimal,
    },
    {
      id: 'topeAfp',
      header: 'Tope AFP',
      field: 'topeAfp',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'topeIps',
      header: 'Tope IPS',
      field: 'topeIps',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'topeCesantia',
      header: 'Tope cesantía',
      field: 'topeCesantia',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'topeAfpVoluntario',
      header: 'Tope AFP voluntario',
      field: 'topeAfpVoluntario',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    { id: 'sis', header: 'SIS', field: 'sis', sortable: true, align: 'right', format: this.formatPercent },
    {
      id: 'afcTrabajadorIndefinido',
      header: 'AFC trabajador indefinido',
      field: 'afcTrabajadorIndefinido',
      sortable: true,
      align: 'right',
      format: this.formatPercent,
    },
    {
      id: 'afcEmpleadorIndefinido',
      header: 'AFC empleador indefinido',
      field: 'afcEmpleadorIndefinido',
      sortable: true,
      align: 'right',
      format: this.formatPercent,
    },
    {
      id: 'afcEmpleadorPlazo',
      header: 'AFC empleador plazo fijo',
      field: 'afcEmpleadorPlazo',
      sortable: true,
      align: 'right',
      format: this.formatPercent,
    },
    {
      id: 'gratificacion',
      header: 'Gratificación legal',
      field: 'gratificacion',
      sortable: true,
      format: this.formatBoolean,
    },
    {
      id: 'descuentosBasePorDia',
      header: 'Descuentos base por día',
      field: 'descuentosBasePorDia',
      sortable: true,
      format: this.formatBoolean,
    },
    {
      id: 'fechaActualizacion',
      header: 'Última actualización',
      field: 'fechaActualizacion',
      sortable: true,
      format: this.formatDateTime,
    },
  ];
}
