/**
 * Modal "Historial administrativo" del Administrador de Nóminas (F17 piloto).
 *
 * Lectura-only: lista cronológica de movimientos de `evento_auditoria_nomina`
 * para una nómina específica, en lenguaje operativo. Reutiliza el patrón
 * visual del modal de trazabilidad del Generador V2 (`app-message-box` modo
 * modal con timeline compacta) para mantener identidad NOIA y evitar cards
 * decorativas.
 *
 * NOIA-ADM-NOM-HISTORIAL-01.
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

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  EventoAuditoriaNomina,
  NominaPeriodoResumen,
} from '../../../../models/nomina-periodo.models';
import {
  mapearHistorialAdministrativo,
  type FilaHistorialAdministrativo,
} from '../../utils/admin-nominas-auditoria.presenter';

@Component({
  selector: 'app-admin-nominas-modal-historial-nomina',
  standalone: true,
  imports: [MessageBoxComponent, LucideAngularModule],
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

  readonly tituloModal = computed(() => {
    const n = this.nomina();
    return `${n.empresaNombre} · ${n.periodo}`;
  });

  readonly filas = computed<FilaHistorialAdministrativo[]>(() => {
    const resolver = this.resolverUsuario();
    return mapearHistorialAdministrativo(
      this.eventos(),
      resolver ?? undefined,
    );
  });

  readonly contextoFranja = computed(() => {
    const filas = this.filas();
    const total = filas.length;
    const ultimo = filas[0]?.fechaCorta ?? null;
    let resumen = total === 0 ? 'Sin movimientos' : `${total} movimiento${total === 1 ? '' : 's'}`;
    if (ultimo) {
      resumen += ` · último ${ultimo}`;
    }
    return { resumen };
  });

  cerrarModal(): void {
    this.cerrar.emit();
  }

  trackFila(_index: number, fila: FilaHistorialAdministrativo): string {
    return fila.id;
  }
}
