import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  LiquidacionEmision,
  LiquidacionRevisionEvento,
  LiquidacionTrabajador,
} from '../../models/liquidacion-oficial.model';
import {
  COLUMNAS_HISTORIAL_REVISION_TRABAJADOR,
  mapearHistorialRevisionTrabajador,
  type FilaHistorialRevisionTrabajador,
} from '../../presenters/liquidaciones-revision-historial.presenter';

@Component({
  selector: 'app-liquidaciones-modal-historial-trabajador',
  standalone: true,
  imports: [
    MessageBoxComponent,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
  ],
  templateUrl: './liquidaciones-modal-historial-trabajador.component.html',
  styleUrl: './liquidaciones-modal-historial-trabajador.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LiquidacionesModalHistorialTrabajadorComponent {
  readonly abierto = input(false);
  readonly trabajador = input<LiquidacionTrabajador | null>(null);
  readonly eventos = input<readonly LiquidacionRevisionEvento[]>([]);
  readonly emisiones = input<readonly LiquidacionEmision[]>([]);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly cerrar = output<void>();

  readonly columnas = COLUMNAS_HISTORIAL_REVISION_TRABAJADOR;

  readonly tituloModal = computed(() => {
    const trabajador = this.trabajador();
    if (!trabajador) return 'Historial de liquidación';
    const rut = trabajador.rut?.trim();
    return rut
      ? `${trabajador.nombreTrabajador} · ${rut}`
      : trabajador.nombreTrabajador;
  });

  readonly subtituloModal = computed(() => {
    const trabajador = this.trabajador();
    if (!trabajador) {
      return 'Autorización, pago, entrega de documento y emisiones del comprobante.';
    }
    const cargo = trabajador.cargo?.trim();
    return cargo
      ? `Movimientos RRHH · ${cargo}`
      : 'Movimientos RRHH del trabajador';
  });

  readonly filas = computed<FilaHistorialRevisionTrabajador[]>(() =>
    mapearHistorialRevisionTrabajador({
      eventos: this.eventos(),
      emisiones: this.emisiones(),
      trabajador: this.trabajador(),
    }),
  );

  cerrarModal(): void {
    this.cerrar.emit();
  }

  trackFila(_index: number, fila: FilaHistorialRevisionTrabajador): string {
    return fila.id;
  }
}
