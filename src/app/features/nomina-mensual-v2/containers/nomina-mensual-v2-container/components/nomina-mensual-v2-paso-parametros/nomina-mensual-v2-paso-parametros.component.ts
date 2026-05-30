import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  ViewEncapsulation,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import type {
  NominaParametrosResumen,
  ParametroBloqueoSeveridad,
  ParametroResumenAreaId,
  ParametroResumenItem,
  ParametroResumenEstado,
  ParametroResumenItemEstado,
  ParametrosMantenedorDestino,
} from '../../../../models/nomina-parametros-resumen.models';
import { NominaParametrosResumenService } from '../../../../services/nomina-parametros-resumen.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { ORDEN_PASOS_NOMINA } from '../../facade/nomina-mensual-v2-navegacion';

type DonutTonoPresentacion = 'exito' | 'revision' | 'bloqueo' | 'neutral';

type ParametrosCargaOverlayPresentacion = {
  titulo: string;
  mensaje: string;
};

type ResultadoValidacionPaso = 'permitido' | 'advertencia' | 'bloqueado';

interface EstadoPendientesPasoParametros {
  tieneBloqueos: boolean;
  tieneRevisiones: boolean;
  puedeContinuar: boolean;
  resultado: ResultadoValidacionPaso;
}

const coloresDonutPorTono: Record<DonutTonoPresentacion, string> = {
  exito: '#3d6b4f',
  revision: '#d97706',
  bloqueo: '#9a5555',
  neutral: '#64748b',
};

@Component({
  selector: 'app-nomina-mensual-v2-paso-parametros',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MessageBoxComponent],
  templateUrl: './nomina-mensual-v2-paso-parametros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasoParametrosComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly parametrosResumenService = inject(NominaParametrosResumenService);

  @Output() avanceSolicitado = new EventEmitter<PayrollStepId>();
  @Output() resumenActualizado = new EventEmitter<void>();

  readonly parametrosResumen = signal<NominaParametrosResumen | null>(null);
  readonly parametrosLoading = signal(true);
  readonly parametrosValidando = signal(false);
  readonly parametrosError = signal<string | null>(null);
  readonly parametrosAreas = computed(() => this.parametrosResumen()?.areas ?? []);
  readonly parametrosBloqueosActuales = computed(() => this.parametrosResumen()?.bloqueosActuales ?? []);
  readonly parametrosAccesos = computed(() => this.parametrosResumen()?.accesos ?? []);

  readonly parametrosCargaOverlay = computed((): ParametrosCargaOverlayPresentacion | null => {
    if (this.parametrosLoading()) {
      return {
        titulo: 'Cargando parámetros',
        mensaje: 'Consultando la configuración normativa y operativa del período.',
      };
    }
    if (this.parametrosValidando()) {
      return {
        titulo: 'Validando parámetros',
        mensaje: 'Revisando bloqueos y consistencia antes de continuar.',
      };
    }
    return null;
  });

  readonly parametrosAlertaTipo = computed((): 'error' | 'bloqueo' | 'revision' | null => {
    if (this.parametrosLoading()) return null;
    if (this.parametrosError()) return 'error';
    const resumen = this.parametrosResumen();
    if (!resumen) return null;
    if (resumen.bloqueos > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0) return 'revision';
    return null;
  });

  readonly alertaRevisionTitulo = computed(() => {
    const cantidad = this.parametrosResumen()?.requiereRevision ?? 0;
    const etiquetaItem = cantidad === 1 ? 'ítem' : 'ítems';
    const etiquetaVerbo = cantidad === 1 ? 'requiere' : 'requieren';
    return `Hay ${cantidad} ${etiquetaItem} que ${etiquetaVerbo} revisión`;
  });

  readonly alertaRevisionDescripcion = computed(() => {
    const cantidad = this.parametrosResumen()?.requiereRevision ?? 0;
    const etiquetaAccion = cantidad === 1 ? 'Corrígelo' : 'Corrígelos';
    return `${etiquetaAccion} en Parámetros antes de validar.`;
  });

  readonly alertaBloqueoTitulo = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueos ?? 0;
    const etiquetaItem = cantidad === 1
      ? 'parámetro obligatorio pendiente'
      : 'parámetros obligatorios pendientes';
    return `Hay ${cantidad} ${etiquetaItem}`;
  });

  readonly alertaBloqueoDescripcion = computed(() => {
    const cantidad = this.parametrosResumen()?.bloqueos ?? 0;
    const etiquetaAccion = cantidad === 1 ? 'Corrígelo' : 'Corrígelos';
    return `${etiquetaAccion} antes de continuar.`;
  });

  readonly tituloEstadoParametros = computed(() => {
    const resumen = this.parametrosResumen();
    if ((resumen?.bloqueos ?? 0) > 0) {
      return 'Bloqueos actuales';
    }
    if ((resumen?.requiereRevision ?? 0) > 0) {
      return 'Revisiones pendientes';
    }
    return 'Estado actual';
  });

  readonly parametrosEstadoCompleto = computed(() => {
    if (this.parametrosLoading() || this.parametrosValidando()) return false;
    const resumen = this.parametrosResumen();
    if (!resumen) return false;
    return resumen.bloqueos === 0 && resumen.requiereRevision === 0;
  });

  readonly donutTono = computed((): DonutTonoPresentacion => {
    if (this.parametrosLoading()) return 'neutral';
    const resumen = this.parametrosResumen();
    if (!resumen) return 'neutral';
    if (resumen.bloqueos > 0) return 'bloqueo';
    if (resumen.requiereRevision > 0) return 'revision';
    return 'exito';
  });

  readonly completitudSeccionesPct = computed(() => {
    const resumen = this.parametrosResumen();
    if (!resumen) return 0;
    return resumen.completitudSecciones;
  });

  readonly completitudSeccionesCaption = computed(() => {
    const resumen = this.parametrosResumen();
    if (!resumen) return '0 de 0 secciones listas';
    return `${resumen.seccionesListas} de ${resumen.seccionesTotales} secciones listas`;
  });

  readonly estiloArcoDonut = computed(() => {
    const porcentaje = this.completitudSeccionesPct();
    const color = coloresDonutPorTono[this.donutTono()];
    return `conic-gradient(${color} 0 ${porcentaje}%, #e2e8f0 ${porcentaje}% 100%)`;
  });

  constructor() {
    effect(() => {
      if (this.parametrosLoading() || this.parametrosValidando()) {
        this.orquestador.establecerAyudaAvance(null);
        return;
      }
      const resumen = this.parametrosResumen();
      if (!resumen) {
        this.orquestador.establecerAyudaAvance(null);
        return;
      }
      if (resumen.bloqueos > 0) {
        this.orquestador.establecerAyudaAvance('Debes completar este paso antes de continuar al siguiente.', 'bloqueo');
        return;
      }
      if (resumen.requiereRevision > 0) {
        this.orquestador.establecerAyudaAvance('Hay observaciones pendientes. Revísalas antes de continuar.', 'revision');
        return;
      }
      this.orquestador.establecerAyudaAvance(null);
    });
  }

  ngOnInit(): void {
    this.orquestador.registrarAccionPrincipal(() => void this.validarParametros());
    this.destroyRef.onDestroy(() => {
      this.orquestador.limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
    void this.cargarParametrosResumen();
  }

  evaluarAvance(destinoPaso: PayrollStepId): void {
    const estado = this.obtenerEstadoPendientesPasoParametros();
    if (estado.resultado === 'bloqueado') {
      this.orquestador.modalAvanceParametros.set({ tipo: 'bloqueo' });
      return;
    }
    if (estado.resultado === 'advertencia') {
      this.orquestador.modalAvanceParametros.set({ tipo: 'revision', destinoPaso });
      return;
    }
    this.orquestador.modalAvanceParametros.set(null);
    this.avanceSolicitado.emit(destinoPaso);
  }

  confirmarAvanceConRevision(): void {
    const modal = this.orquestador.modalAvanceParametros();
    if (modal?.tipo !== 'revision') return;
    this.orquestador.modalAvanceParametros.set(null);
    this.avanceSolicitado.emit(modal.destinoPaso);
  }

  cerrarModalAvanceParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
  }

  irAPendientesParametros(): void {
    this.orquestador.modalAvanceParametros.set(null);
    queueMicrotask(() => {
      document.getElementById('parametros-pendientes-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  async cargarParametrosResumen(): Promise<void> {
    this.parametrosLoading.set(true);
    this.parametrosError.set(null);
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen();
      this.parametrosResumen.set(resumen);
      this.resumenActualizado.emit();
    } catch (error) {
      console.error('[Nómina V2] Error cargando parámetros', error);
      this.parametrosError.set('No fue posible cargar el resumen de parámetros.');
      this.resumenActualizado.emit();
    } finally {
      this.parametrosLoading.set(false);
    }
  }

  async validarParametros(): Promise<void> {
    this.parametrosValidando.set(true);
    this.parametrosError.set(null);
    this.resumenActualizado.emit();
    try {
      const resumen = await this.parametrosResumenService.obtenerResumen();
      this.parametrosResumen.set(resumen);
      this.resumenActualizado.emit();
      const indiceActual = ORDEN_PASOS_NOMINA.indexOf('parameters');
      const destino = indiceActual < ORDEN_PASOS_NOMINA.length - 1 ? ORDEN_PASOS_NOMINA[indiceActual + 1] : null;
      if (destino) {
        this.evaluarAvance(destino);
      }
    } catch (error) {
      console.error('[Nómina V2] Error validando parámetros', error);
      this.parametrosError.set('No fue posible validar los parámetros.');
      this.resumenActualizado.emit();
    } finally {
      this.parametrosValidando.set(false);
      this.resumenActualizado.emit();
    }
  }

  goToParametros(destino: ParametrosMantenedorDestino): void {
    void this.router.navigate(['/parametros'], {
      queryParams: {
        periodo: this.parametrosResumen()?.periodo,
        area: destino.area,
        tab: destino.tab,
      },
    });
  }

  parametroEstadoEtiqueta(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'Completo';
      case 'requiereRevision': return 'Requiere revisión';
      case 'bloqueo': return 'Bloqueo';
      case 'pendiente': return 'Pendiente';
    }
  }

  parametroEstadoIcono(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'check-circle-2';
      case 'requiereRevision': return 'triangle-alert';
      case 'bloqueo': return 'circle-alert';
      case 'pendiente': return 'clock-3';
    }
  }

  parametroEstadoClase(estado: ParametroResumenEstado): string {
    switch (estado) {
      case 'completo': return 'status-green';
      case 'requiereRevision': return 'status-amber';
      case 'bloqueo': return 'status-red';
      case 'pendiente': return 'status-gray';
    }
  }

  bloqueoSeveridadClase(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'status-red' : 'status-amber';
  }

  bloqueoSeveridadIcono(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'circle-alert' : 'triangle-alert';
  }

  bloqueoSeveridadEtiqueta(severidad: ParametroBloqueoSeveridad): string {
    return severidad === 'bloqueo' ? 'Bloqueo crítico' : 'Revisión requerida';
  }

  formatoHoraActualizacion(value: string | null | undefined): string {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `hoy, ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  parametroAreaTitulo(areaId: ParametroResumenAreaId): string {
    return this.parametrosAreas().find((area) => area.id === areaId)?.titulo ?? areaId;
  }

  chipsVisiblesParametro(items: ParametroResumenItem[]): ParametroResumenItem[] {
    return items.slice(0, 5);
  }

  cantidadChipsOcultosParametro(items: ParametroResumenItem[]): number {
    return Math.max(items.length - 5, 0);
  }

  private obtenerEstadoPendientesPasoParametros(): EstadoPendientesPasoParametros {
    const resumen = this.parametrosResumen();
    const tieneBloqueos = (resumen?.bloqueos ?? 0) > 0;
    const tieneRevisiones = (resumen?.requiereRevision ?? 0) > 0;
    const puedeContinuar = resumen?.puedeContinuar ?? false;
    let resultado: ResultadoValidacionPaso = 'permitido';
    if (tieneBloqueos) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones && !puedeContinuar) {
      resultado = 'bloqueado';
    } else if (tieneRevisiones) {
      resultado = 'advertencia';
    }
    return { tieneBloqueos, tieneRevisiones, puedeContinuar, resultado };
  }
}
