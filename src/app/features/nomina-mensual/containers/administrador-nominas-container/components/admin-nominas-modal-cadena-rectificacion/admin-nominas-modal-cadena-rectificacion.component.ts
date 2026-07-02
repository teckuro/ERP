import { CommonModule } from '@angular/common';
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
import type { NominaPeriodoResumen } from '../../../../models/nomina-periodo.models';
import { estadoNominaToBadge } from '../../utils/admin-nominas-presentacion.util';
import { prepararFilasCadenaRectificacion } from '../../../../presenters/nomina-rectificacion-ui.presenter';
import { formatearActualizada } from '../../utils/admin-nominas-presentacion.util';

@Component({
  selector: 'app-admin-nominas-modal-cadena-rectificacion',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MessageBoxComponent],
  templateUrl: './admin-nominas-modal-cadena-rectificacion.component.html',
  styleUrl: './admin-nominas-modal-cadena-rectificacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalCadenaRectificacionComponent {
  readonly origen = input.required<NominaPeriodoResumen>();
  readonly resumenes = input.required<readonly NominaPeriodoResumen[]>();

  readonly cerrar = output<void>();
  readonly abrirRectificacion = output<NominaPeriodoResumen>();
  readonly consultarOriginal = output<void>();

  readonly estadoNominaToBadge = estadoNominaToBadge;

  readonly filas = computed(() =>
    prepararFilasCadenaRectificacion(
      this.resumenes(),
      this.origen().id,
      (iso) => formatearActualizada(iso),
    ),
  );

  readonly contexto = computed(
    () => `${this.origen().empresaNombre} · ${this.origen().periodo} · Cierre original`,
  );

  cerrarModal(): void {
    this.cerrar.emit();
  }

  abrirFila(id: string): void {
    const fila = this.resumenes().find((r) => r.id === id);
    if (fila) this.abrirRectificacion.emit(fila);
  }
}
