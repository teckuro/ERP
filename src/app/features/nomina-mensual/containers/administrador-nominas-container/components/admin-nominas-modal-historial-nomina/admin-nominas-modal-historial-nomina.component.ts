/**
 * Modal "Historial administrativo" del Administrador de Nóminas (F17 piloto).
 *
 * Lectura-only: bitácora en `app-data-grid` a altura completa dentro de MessageBox modal.
 */

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
} from '../../../../../../shared/components/ui/data-grid';
import {
  MessageBoxComponent,
} from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  EventoAuditoriaNomina,
  NominaPeriodoResumen,
} from '../../../../models/nomina-periodo.models';
import { COLUMNAS_HISTORIAL_ADMIN } from '../../presenters/admin-nominas-historial.presenter';
import {
  mapearHistorialAdministrativo,
  type FilaHistorialAdministrativo,
} from '../../utils/admin-nominas-auditoria.presenter';

@Component({
  selector: 'app-admin-nominas-modal-historial-nomina',
  standalone: true,
  imports: [
    MessageBoxComponent,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
  ],
  templateUrl: './admin-nominas-modal-historial-nomina.component.html',
  styleUrl: './admin-nominas-modal-historial-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalHistorialNominaComponent {
  readonly nomina = input.required<NominaPeriodoResumen>();
  readonly eventos = input<readonly EventoAuditoriaNomina[]>([]);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);
  readonly resolverUsuario = input<((usuarioId: string | undefined) => string | null) | null>(null);
  readonly cerrar = output<void>();

  readonly columnas = COLUMNAS_HISTORIAL_ADMIN;

  readonly tituloModal = computed(() => {
    const n = this.nomina();
    return `${n.empresaNombre} · ${n.periodo}`;
  });

  readonly subtituloModal = computed(() => {
    if (this.error()) {
      return this.error()!;
    }
    return 'Movimientos de estado y acciones administrativas del período.';
  });

  readonly filas = computed<FilaHistorialAdministrativo[]>(() => {
    const resolver = this.resolverUsuario();
    return mapearHistorialAdministrativo(
      this.eventos(),
      resolver ?? undefined,
    );
  });

  cerrarModal(): void {
    this.cerrar.emit();
  }

  trackFila(_index: number, fila: FilaHistorialAdministrativo): string {
    return fila.id;
  }
}
