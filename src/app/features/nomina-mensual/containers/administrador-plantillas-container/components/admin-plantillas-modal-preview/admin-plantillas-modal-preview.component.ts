/**
 * Modal "Vista previa de cortes" del Administrador de plantillas (F03).
 *
 * Llama al RPC `previsualizar_cortes_plantilla` para una plantilla y año
 * dados; muestra la tabla resultante con ajustes de fin de semana visibles.
 * No persiste nada.
 */

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

import { mensajeErrorSupabaseParaUsuario } from '../../../../../../core/errors/erp-supabase-user-message';
import { NominaPlantillaCicloService } from '../../../../services/nomina-plantilla-ciclo.service';
import {
  describirPoliticaFinSemana,
  describirReglaAnticipo,
  describirReglaFechaPago,
  type NominaPlantillaCiclo,
  type PreviewCorte,
} from '../../../../models/nomina-plantilla-ciclo.models';

@Component({
  selector: 'app-admin-plantillas-modal-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-plantillas-modal-preview.component.html',
  styleUrl: './admin-plantillas-modal-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminPlantillasModalPreviewComponent {
  private readonly servicio = inject(NominaPlantillaCicloService);

  readonly plantilla = input.required<NominaPlantillaCiclo>();
  readonly cerrar = output<void>();

  readonly anio = signal<number>(new Date().getFullYear());
  readonly cortes = signal<readonly PreviewCorte[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly reglaTexto = computed(() => describirReglaFechaPago(this.plantilla().reglaFechaPago));
  readonly politicaTexto = computed(() => describirPoliticaFinSemana(this.plantilla().politicaFinSemana));
  readonly anticipoTexto = computed(() => describirReglaAnticipo(this.plantilla().reglaAnticipo));

  readonly hayCortes = computed(() => this.cortes().length > 0);
  readonly cortesAjustados = computed(() => this.cortes().filter((c) => c.ajusteFds !== null).length);

  constructor() {
    effect(() => {
      const p = this.plantilla();
      if (p) {
        void this.refrescar();
      }
    });
  }

  setAnio(valor: string | number): void {
    const v = Number(valor);
    if (Number.isInteger(v) && v >= 2000 && v <= 2100) {
      this.anio.set(v);
      void this.refrescar();
    }
  }

  async refrescar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const data = await this.servicio.previsualizarCortes(this.plantilla().id, this.anio());
      this.cortes.set(data);
    } catch (err) {
      const mensaje =
        mensajeErrorSupabaseParaUsuario(err, 'calcular la vista previa de cortes'),
      this.error.set(mensaje);
      this.cortes.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cerrarModal();
    }
  }

  formatearFecha(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  }
}
