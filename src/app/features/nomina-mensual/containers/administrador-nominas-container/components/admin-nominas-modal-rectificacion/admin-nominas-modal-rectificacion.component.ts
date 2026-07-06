import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen } from '../../../../models/nomina-periodo.models';
import type {
  ConfirmarRectificacionResultado,
  RectificacionPreview,
} from '../../../../models/nomina-rectificacion-preview.models';
import { prepararContextoRectificacionModal } from '../../../../presenters/nomina-rectificacion-ui.presenter';

export interface RectificacionCreadaEvento {
  resumen: NominaPeriodoResumen;
  resultado: ConfirmarRectificacionResultado;
}

@Component({
  selector: 'app-admin-nominas-modal-rectificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MessageBoxComponent],
  templateUrl: './admin-nominas-modal-rectificacion.component.html',
  styleUrl: './admin-nominas-modal-rectificacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalRectificacionComponent {
  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaOrigen = input.required<NominaPeriodoResumen>();

  readonly cerrar = output<void>();
  readonly creada = output<RectificacionCreadaEvento>();

  readonly motivo = signal('');
  readonly seleccionados = signal<Set<number>>(new Set());
  readonly preview = signal<RectificacionPreview | null>(null);
  readonly cargandoPreview = signal(false);
  readonly confirmando = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmacionAbierta = signal(false);

  readonly puedeConfirmar = computed(() => {
    const p = this.preview();
    return !!p?.puedeCrear && !this.cargandoPreview() && !this.confirmando();
  });

  readonly contextoModal = computed(() =>
    prepararContextoRectificacionModal(this.nominaOrigen(), this.preview()),
  );

  readonly detalleConfirmacion = computed(() => {
    const ctx = this.contextoModal();
    const seleccionados = ctx.seleccionados;
    const trabajadores = seleccionados === 1 ? '1 trabajador' : `${seleccionados} trabajadores`;
    return `Se abrirá un nuevo ciclo con ${trabajadores}. ${ctx.notaReferencia}`;
  });

  constructor() {
    effect(() => {
      const origen = this.nominaOrigen();
      void this.recargarPreview(origen.id, []);
    });
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.confirmando()) {
      this.cerrarModal();
    }
  }

  cerrarModal(): void {
    if (this.confirmando()) return;
    this.cerrar.emit();
  }

  toggleTrabajador(idPersona: number, checked: boolean): void {
    this.seleccionados.update((set) => {
      const next = new Set(set);
      if (checked) next.add(idPersona);
      else next.delete(idPersona);
      return next;
    });
    void this.recargarPreview(this.nominaOrigen().id, [...this.seleccionados()]);
  }

  onMotivoInput(value: string): void {
    this.motivo.set(value);
    void this.recargarPreview(this.nominaOrigen().id, [...this.seleccionados()]);
  }

  private async recargarPreview(nominaOrigenId: string, trabajadorIds: number[]): Promise<void> {
    this.cargandoPreview.set(true);
    this.error.set(null);
    try {
      const preview = await this.servicio.previsualizarRectificacion({
        nominaOrigenId,
        trabajadorIds: trabajadorIds.length ? trabajadorIds : undefined,
        motivo: this.motivo().trim() || undefined,
      });
      this.preview.set(preview);
      if (trabajadorIds.length === 0 && preview.trabajadorIdsSeleccionados.length) {
        this.seleccionados.set(new Set(preview.trabajadorIdsSeleccionados));
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No fue posible preparar la rectificación.');
      this.preview.set(null);
    } finally {
      this.cargandoPreview.set(false);
    }
  }

  solicitarConfirmacion(): void {
    if (!this.puedeConfirmar()) return;
    this.confirmacionAbierta.set(true);
  }

  cancelarConfirmacion(): void {
    if (this.confirmando()) return;
    this.confirmacionAbierta.set(false);
  }

  async confirmar(): Promise<void> {
    const preview = this.preview();
    if (!preview || !preview.puedeCrear) return;
    this.confirmando.set(true);
    this.error.set(null);
    try {
      const resultado = await this.servicio.confirmarRectificacion({
        nominaOrigenId: this.nominaOrigen().id,
        fingerprint: preview.fingerprint,
        motivo: this.motivo().trim(),
        trabajadorIds: [...this.seleccionados()],
      });
      const cabecera = await this.servicio.obtenerCabeceraNomina(resultado.idNominaPeriodo);
      if (!cabecera) {
        throw new Error('La rectificación se creó pero no fue posible cargar su resumen.');
      }
      this.confirmacionAbierta.set(false);
      this.creada.emit({ resumen: cabecera, resultado });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No fue posible crear la rectificación.');
    } finally {
      this.confirmando.set(false);
    }
  }
}
