import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { DataGridColumn, DataGridComponent } from '../../../../shared/components/ui/data-grid.component';
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
  @Input() errorMessage = '';

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

  readonly columns: DataGridColumn<ParametroGeneral>[] = [
    { id: 'periodo', header: 'Periodo', field: 'periodo', sortable: true },
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
      id: 'topeCesantia',
      header: 'Tope cesantía',
      field: 'topeCesantia',
      sortable: true,
      align: 'right',
      format: this.formatDecimal,
    },
    { id: 'sis', header: 'SIS', field: 'sis', sortable: true, align: 'right', format: this.formatPercent },
  ];
}
