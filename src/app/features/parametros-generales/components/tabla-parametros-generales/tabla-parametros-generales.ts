import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { DataGridColumn, DataGridComponent, DataGridFilter } from '../../../../shared/components/ui/data-grid';
import { ParametroGeneral } from '../../models/parametro-general.model';

@Component({
  selector: 'app-tabla-parametros-generales',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './tabla-parametros-generales.html',
})
export class TablaParametrosGeneralesComponent {
  @Input() rows: ParametroGeneral[] = [];
  @Input() loading = false;
  @Input() mensajeError = '';

  readonly filters: DataGridFilter<ParametroGeneral>[] = [
    {
      id: 'periodo',
      label: 'Periodo',
      field: 'periodo',
      type: 'text',
      operator: 'startsWith',
      placeholder: 'Ej: 2026-04',
      emptyLabel: 'Todos',
    },
    {
      id: 'gratificacion',
      label: 'Gratificacion',
      field: 'gratificacion',
      type: 'select',
      emptyLabel: 'Todas',
      options: [
        { label: 'Si', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      id: 'descuentosBasePorDia',
      label: 'Desc. por dia',
      field: 'descuentosBasePorDia',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Si', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      id: 'fechaActualizacion',
      label: 'Actualizacion',
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
    return Number.isFinite(numberValue) ? `$${this.clpFormatter.format(numberValue)}` : '-';
  };

  private formatDecimal = (value: unknown): string => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? this.decimalFormatter.format(numberValue) : '-';
  };

  private formatPercent = (value: unknown): string => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? `${this.percentFormatter.format(numberValue)}%` : '-';
  };

  private formatBoolean = (value: unknown): string => (value ? 'Si' : 'No');

  private formatDateTime = (value: unknown): string => {
    if (!value) {
      return '-';
    }

    const date = new Date(String(value));
    return Number.isFinite(date.getTime()) ? this.dateFormatter.format(date) : String(value);
  };

  readonly columns: DataGridColumn<ParametroGeneral>[] = [
    { id: 'periodo', header: 'Periodo', field: 'periodo', sortable: true },
    { id: 'uf', header: 'UF', field: 'uf', sortable: true, align: 'right', format: this.formatDecimal },
    { id: 'utm', header: 'UTM', field: 'utm', sortable: true, align: 'right', format: this.formatMoney },
    {
      id: 'sueldoMinimo',
      header: 'Sueldo minimo',
      field: 'sueldoMinimo',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'sueldoMinimo18a65',
      header: 'Sueldo min. 18 a 65',
      field: 'sueldoMinimo18a65',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'immGratificacion',
      header: 'IMM gratificacion',
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
      header: 'Tope cesantia',
      field: 'topeCesantia',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    {
      id: 'topeAfpVoluntario',
      header: 'Tope AFP volunt.',
      field: 'topeAfpVoluntario',
      sortable: true,
      align: 'right',
      format: this.formatMoney,
    },
    { id: 'sis', header: 'SIS', field: 'sis', sortable: true, align: 'right', format: this.formatPercent },
    {
      id: 'afcTrabajadorIndefinido',
      header: 'AFC trab. indef.',
      field: 'afcTrabajadorIndefinido',
      sortable: true,
      align: 'right',
      format: this.formatPercent,
    },
    {
      id: 'afcEmpleadorIndefinido',
      header: 'AFC emp. indef.',
      field: 'afcEmpleadorIndefinido',
      sortable: true,
      align: 'right',
      format: this.formatPercent,
    },
    {
      id: 'afcEmpleadorPlazo',
      header: 'AFC emp. plazo',
      field: 'afcEmpleadorPlazo',
      sortable: true,
      align: 'right',
      format: this.formatPercent,
    },
    {
      id: 'gratificacion',
      header: 'Gratificacion',
      field: 'gratificacion',
      sortable: true,
      format: this.formatBoolean,
    },
    {
      id: 'descuentosBasePorDia',
      header: 'Desc. por dia',
      field: 'descuentosBasePorDia',
      sortable: true,
      format: this.formatBoolean,
    },
    {
      id: 'fechaActualizacion',
      header: 'Actualizacion',
      field: 'fechaActualizacion',
      sortable: true,
      format: this.formatDateTime,
    },
  ];
}
