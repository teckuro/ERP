import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import { estadoNominaToBadge } from '../../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';
import {
  COLUMNAS_SELECCION_NOMINA_LIQUIDACION,
  crearFiltrosSeleccionNominaLiquidacion,
} from '../../../liquidaciones-oficiales/presenters/liquidaciones-oficiales.presenter';

@Component({
  selector: 'app-seleccion-nomina-exportable-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MessageBoxComponent,
    DataGridComponent,
    DataGridCellDirective,
  ],
  templateUrl: './seleccion-nomina-exportable-modal.component.html',
  styleUrl: './seleccion-nomina-exportable-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SeleccionNominaExportableModalComponent {
  readonly abierto = input(false);
  readonly nominas = input<NominaPeriodoResumen[]>([]);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly nominaSeleccionadaId = input<string | null>(null);
  readonly eyebrow = input('Remuneraciones');
  readonly titulo = input('Buscar nómina');
  readonly mensaje = input('Solo nóminas liquidadas o cerradas con liquidación oficial.');
  readonly persistenceKey = input.required<string>();

  readonly cerrar = output<void>();
  readonly seleccionar = output<NominaPeriodoResumen>();

  readonly columnas = COLUMNAS_SELECCION_NOMINA_LIQUIDACION;
  readonly estadoNominaToBadge = estadoNominaToBadge;

  readonly filtros = computed(() => crearFiltrosSeleccionNominaLiquidacion([...this.nominas()]));
  readonly filasNomina = computed(() => [...this.nominas()]);

  cerrarModal(): void {
    this.cerrar.emit();
  }

  seleccionarNomina(fila: NominaPeriodoResumen): void {
    this.seleccionar.emit(fila);
  }

  esNominaActiva(fila: NominaPeriodoResumen): boolean {
    const activa = this.nominaSeleccionadaId();
    return !!activa && fila.id === activa;
  }

  trackNomina = (_index: number, fila: NominaPeriodoResumen): string => fila.id;
}
