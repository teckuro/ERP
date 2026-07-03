/**
 * Modal de búsqueda de nómina origen para Liquidaciones (F18c).
 */

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
  PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ,
  crearFiltrosSeleccionNominaLiquidacion,
} from '../../presenters/liquidaciones-oficiales.presenter';

@Component({
  selector: 'app-liquidaciones-modal-seleccion-nomina',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MessageBoxComponent,
    DataGridComponent,
    DataGridCellDirective,
  ],
  templateUrl: './liquidaciones-modal-seleccion-nomina.component.html',
  styleUrl: './liquidaciones-modal-seleccion-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LiquidacionesModalSeleccionNominaComponent {
  readonly abierto = input(false);
  readonly nominas = input<NominaPeriodoResumen[]>([]);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly nominaSeleccionadaId = input<string | null>(null);

  readonly cerrar = output<void>();
  readonly seleccionar = output<NominaPeriodoResumen>();

  readonly columnas = COLUMNAS_SELECCION_NOMINA_LIQUIDACION;
  readonly persistenciaKey = PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ;
  readonly estadoNominaToBadge = estadoNominaToBadge;

  readonly filtros = computed(() => crearFiltrosSeleccionNominaLiquidacion(this.nominas()));

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
