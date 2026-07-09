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
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import {
  COLUMNAS_HISTORIAL_REVISION_PERIODO,
  mapearHistorialRevisionPeriodo,
  type FilaHistorialRevisionPeriodo,
} from '../../presenters/liquidaciones-revision-historial.presenter';

@Component({
  selector: 'app-liquidaciones-modal-historial-nomina',
  standalone: true,
  imports: [
    MessageBoxComponent,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
  ],
  templateUrl: './liquidaciones-modal-historial-nomina.component.html',
  styleUrl: '../liquidaciones-modal-historial-trabajador/liquidaciones-modal-historial-trabajador.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LiquidacionesModalHistorialNominaComponent {
  readonly abierto = input(false);
  readonly nomina = input<NominaPeriodoResumen | null>(null);
  readonly versionLiquidacion = input<number | null>(null);
  readonly eventos = input<readonly LiquidacionRevisionEvento[]>([]);
  readonly emisiones = input<readonly LiquidacionEmision[]>([]);
  readonly trabajadores = input<readonly LiquidacionTrabajador[]>([]);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly cerrar = output<void>();

  readonly columnas = COLUMNAS_HISTORIAL_REVISION_PERIODO;

  readonly tituloModal = computed(() => {
    const nomina = this.nomina();
    if (!nomina) return 'Historial de liquidaciones';
    return `${nomina.empresaNombre} · ${nomina.periodo}`;
  });

  readonly subtituloModal = computed(() => {
    const version = this.versionLiquidacion();
    if (version == null) {
      return 'Movimientos RRHH por trabajador: autorización, pago, entrega y emisiones.';
    }
    return `Versión vigente v${version} · movimientos consolidados por trabajador.`;
  });

  readonly filas = computed<FilaHistorialRevisionPeriodo[]>(() =>
    mapearHistorialRevisionPeriodo({
      eventos: this.eventos(),
      emisiones: this.emisiones(),
      trabajadores: this.trabajadores(),
    }),
  );

  cerrarModal(): void {
    this.cerrar.emit();
  }

  trackFila(_index: number, fila: FilaHistorialRevisionPeriodo): string {
    return fila.id;
  }
}
