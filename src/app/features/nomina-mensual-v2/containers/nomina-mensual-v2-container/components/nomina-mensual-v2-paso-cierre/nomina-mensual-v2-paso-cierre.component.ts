/**
 * Paso Cierre — F3 fusion (F3e-6).
 *
 * Muestra una checklist de cierre operativo (parámetros, dotación, movimientos,
 * cálculo, validación) y, cuando todo está OK, habilita el cierre.
 *
 * Cerrar cambia `nomina_periodo.estado` a `'cerrada'` y registra un evento de
 * auditoría con el motivo opcional. Reabrir es una acción secundaria que pide
 * motivo obligatorio.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';

import type {
  NominaPeriodo,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { estadoNominaToLabel } from '../../../../../nomina-mensual/presenters/admin-nominas.presenter';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import {
  MENSAJE_CALCULO_NO_VIGENTE,
  RAZON_CIERRE_MODAL_PENDIENTE,
} from '../../facade/nomina-mensual-v2-navegacion';
import type { NominaCabeceraCambiadaEvent } from '../../../../models/nomina-cabecera-cambiada.models';

interface ChecklistItem {
  id: string;
  label: string;
  cumplido: boolean;
  detalle: string;
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-cierre',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageBoxComponent, WorkspaceLoadingComponent],
  templateUrl: './nomina-mensual-v2-paso-cierre.component.html',
  styleUrl: './nomina-mensual-v2-paso-cierre.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoCierreComponent implements PasoNominaPort {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly router = inject(Router);

  readonly estadoLabel = estadoNominaToLabel;

  readonly nominaPeriodoId = input<string | null>(null);
  /** Notifica al container que debe refrescar cabecera (y opcionalmente persistir paso). */
  readonly nominaCabeceraCambiada = output<NominaCabeceraCambiadaEvent>();

  readonly nomina = signal<NominaPeriodo | null>(null);
  readonly resumen = signal<ResumenValidacionNomina | null>(null);
  readonly cargando = signal(false);
  readonly ejecutando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly motivoCierre = signal('');
  readonly motivoReapertura = signal('');
  readonly mostrarReabrir = signal(false);
  readonly confirmarCierreVisible = signal(false);

  readonly checklist = computed<ChecklistItem[]>(() => {
    const n = this.nomina();
    const r = this.resumen();
    if (!n || !r) return [];
    return [
      {
        id: 'parametros',
        label: 'Parámetros guardados',
        cumplido: n.estado !== 'borrador',
        detalle: 'Los parámetros base del período están confirmados.',
      },
      {
        id: 'dotacion',
        label: 'Dotación lista',
        cumplido: n.trabajadorIds.length > 0,
        detalle: `${n.trabajadorIds.length} trabajadores en la nómina.`,
      },
      {
        id: 'movimientos',
        label: 'Movimientos aplicados',
        cumplido: n.estado !== 'dotacion_generada',
        detalle: 'Recurrentes y manuales registrados.',
      },
      {
        id: 'calculo',
        label: 'Cálculo realizado',
        cumplido: (n.evidenciaCalculo?.calculoVigente ?? false) && !!n.evidenciaCalculo?.idCalculoPeriodo,
        detalle: 'El cálculo del período está guardado y vigente.',
      },
      {
        id: 'validacion',
        label: 'Validación aprobada',
        cumplido:
          (n.estado === 'aprobada' || n.estado === 'liquidada')
          && r.puedeCerrar
          && r.conIncidenciasCriticas === 0,
        detalle: `${r.conIncidenciasCriticas} críticas · ${r.conAdvertencias} advertencias.`,
      },
    ];
  });

  readonly todoCumplido = computed(() => this.checklist().every((c) => c.cumplido));
  readonly cerrada = computed(() => this.nomina()?.estado === 'cerrada');

  /**
   * `true` cuando el snapshot persistido dejó de ser vigente por cambios
   * posteriores. Replica el banner CAL-INV-05 introducido en el paso Cálculo
   * para que la advertencia persista hasta que se recalcule.
   */
  readonly calculoNoVigente = computed(() => {
    const ev = this.nomina()?.evidenciaCalculo;
    return ev != null && ev.versionCalculo > 0 && ev.calculoVigente === false;
  });

  readonly versionCalculo = computed(() => this.nomina()?.evidenciaCalculo?.versionCalculo ?? 0);
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar(id);
    });
  }

  private async cargar(nominaPeriodoId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [nomina, resumen] = await Promise.all([
        this.servicio.obtenerNomina(nominaPeriodoId),
        this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId),
      ]);
      this.nomina.set(nomina);
      this.resumen.set(resumen);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar el resumen de cierre: ${msg}`);
    } finally {
      this.cargando.set(false);
    }
  }

  async cerrarNomina(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || !this.todoCumplido()) return;
    this.confirmarCierreVisible.set(false);
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.cerrarNomina(id, { motivo: this.motivoCierre().trim() || undefined });
      this.mensaje.set('Nómina cerrada correctamente.');
      const refrescada = await this.servicio.obtenerNomina(id);
      this.nomina.set(refrescada);
      this.nominaCabeceraCambiada.emit({
        registrarPasoCompletado: 'closure',
        trazabilidad: {
          tipo: 'cierre',
          motivo: this.motivoCierre().trim() || 'Nómina cerrada operativamente.',
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cerrar la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  solicitarCierre(): void {
    if (this.todoCumplido()) this.confirmarCierreVisible.set(true);
  }

  /**
   * Diagnóstico puro de "completitud" del paso. Sin side-effects. Lo
   * consultan CTA y stepper.
   */
  puedeContinuar(): ResultadoAvancePaso {
    if (this.cerrada()) {
      return { ok: false, razon: 'La nómina ya está cerrada.' };
    }
    if (this.ejecutando()) {
      return { ok: false, razon: 'Cierre en curso.' };
    }
    if (this.cargando()) {
      return { ok: false, razon: 'Cargando el resumen de cierre.' };
    }
    if (!this.todoCumplido()) {
      return { ok: false, razon: 'Aún hay ítems pendientes en la checklist de cierre.' };
    }
    return { ok: true };
  }

  /**
   * Comando único de avance (AG-NAV-03). Paso terminal: abre el modal de
   * confirmación del cierre. El cierre real ocurre cuando el usuario confirma
   * dentro del modal (`cerrarNomina()`). El container NO navega tras
   * `ok: true` porque cierre es el paso final del flujo.
   */
  async avanzar(): Promise<ResultadoAvancePaso> {
    const diagnostico = this.puedeContinuar();
    if (!diagnostico.ok) return diagnostico;
    this.solicitarCierre();
    return { ok: false, razon: RAZON_CIERRE_MODAL_PENDIENTE };
  }

  abrirReaperturaModal(): void {
    this.motivoReapertura.set('');
    this.error.set(null);
    this.mostrarReabrir.set(true);
  }

  cancelarReapertura(): void {
    if (this.ejecutando()) return;
    this.mostrarReabrir.set(false);
    this.motivoReapertura.set('');
    this.error.set(null);
  }

  async reabrirNomina(): Promise<void> {
    if (this.ejecutando()) return;
    const id = this.nominaPeriodoId();
    const motivo = this.motivoReapertura().trim();
    if (!id || !motivo) {
      this.error.set('Debes ingresar un motivo para reabrir la nómina.');
      return;
    }
    this.ejecutando.set(true);
    this.error.set(null);
    try {
      await this.servicio.reabrirNomina(id, { motivo });
      this.mensaje.set('Nómina reabierta para edición.');
      const refrescada = await this.servicio.obtenerNomina(id);
      this.nomina.set(refrescada);
      this.nominaCabeceraCambiada.emit({
        trazabilidad: { tipo: 'reapertura', motivo },
      });
      this.mostrarReabrir.set(false);
      this.motivoReapertura.set('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible reabrir la nómina: ${msg}`);
    } finally {
      this.ejecutando.set(false);
    }
  }

  volverAdministrador(): void {
    void this.router.navigate(['/remuneraciones/nominas']);
  }
}
