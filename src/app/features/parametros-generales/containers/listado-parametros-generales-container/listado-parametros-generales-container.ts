import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/layout/record-breadcrumb.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { TablaParametrosGeneralesComponent } from '../../components/tabla-parametros-generales/tabla-parametros-generales';
import { ParametroGeneral } from '../../models/parametro-general.model';
import { ParametrosGeneralesService } from '../../services/parametros-generales.service';

@Component({
  selector: 'app-listado-parametros-generales-container',
  standalone: true,
  imports: [CommonModule, RecordBreadcrumbComponent, TablaParametrosGeneralesComponent, MessageBoxComponent],
  templateUrl: './listado-parametros-generales-container.html',
  styleUrl: './listado-parametros-generales-container.css',
})
export class ListadoParametrosGeneralesContainer implements OnInit {
  private readonly service = inject(ParametrosGeneralesService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [{ label: 'Parametros' }];
  readonly rows = signal<ParametroGeneral[]>([]);
  readonly isLoading = signal(true);
  readonly errorCargaDetalle = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadRows();
  }

  async loadRows(): Promise<void> {
    this.isLoading.set(true);
    this.errorCargaDetalle.set(null);

    try {
      this.rows.set(await this.service.listar());
    } catch (err) {
      const detalle =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '').trim()
          : '';
      this.errorCargaDetalle.set(detalle || 'Error desconocido.');
    } finally {
      this.isLoading.set(false);
    }
  }

  cerrarErrorCarga(): void {
    this.errorCargaDetalle.set(null);
  }
}
