/**
 * Paso Validación — F13 núcleo.
 *
 * Sincroniza incidencias, muestra decisiones pendientes y valida la nómina
 * (calculada → validada) cuando no quedan bloqueos sin resolver.
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

import { MessageBoxComponent } from '../../../../../../shared/components/ui/message-box.component';
import type {
  IncidenciaNomina,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import {
  advertenciaPendiente,
  etiquetaEstadoDecisionIncidencia,
  incidenciaCriticaPendiente,
} from '../../../../../nomina-mensual/rules/nomina-validacion-incidencias.rules';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import { MENSAJE_CALCULO_NO_VIGENTE, RAZON_VALIDACION_MODAL_PENDIENTE, esCalculoNoVigente } from '../../facade/nomina-mensual-v2-navegacion';

type FiltroSeveridad = 'todas' | 'critica' | 'advertencia';

const ETIQUETAS_TIPO_INCIDENCIA: Record<string, string> = {
  datos_incompletos: 'Datos incompletos',
  prevision: 'Previsión',
  bancario: 'Datos bancarios',
  movimiento: 'Movimiento',
  calculo: 'Cálculo',
  dotacion: 'Dotación',
  'dotacion-vacia': 'Dotación',
  'trabajador-duplicado-en-segmentos': 'Dotación',
};

function etiquetaTipoIncidencia(tipo: string): string {
  return ETIQUETAS_TIPO_INCIDENCIA[tipo] ?? 'Revisión requerida';
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-validacion',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkspaceLoadingComponent, MessageBoxComponent],
  templateUrl: './nomina-mensual-v2-paso-validacion.component.html',
  styleUrl: './nomina-mensual-v2-paso-validacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoValidacionComponent implements PasoNominaPort {
  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly preparacionExterna = input(false);
  readonly verEnDotacionSolicitado = output<string>();
  readonly validacionCompletada = output<void>();

  readonly resumen = signal<ResumenValidacionNomina | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtroSeveridad = signal<FiltroSeveridad>('todas');
  readonly busqueda = signal('');
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;
  readonly etiquetaTipoIncidencia = etiquetaTipoIncidencia;
  readonly etiquetaEstadoDecision = etiquetaEstadoDecisionIncidencia;
  readonly validando = signal(false);
  readonly confirmarValidacionVisible = signal(false);
  readonly procesandoDecision = signal<string | null>(null);
  readonly justificaciones = signal<Record<string, string>>({});

  readonly incidenciasFiltradas = computed<IncidenciaNomina[]>(() => {
    const resumen = this.resumen();
    if (!resumen) return [];
    const filtro = this.filtroSeveridad();
    const busqueda = this.busqueda().trim().toLowerCase();
    const todas = [...resumen.incidenciasCriticas, ...resumen.advertencias];

    return todas.filter((inc) => {
      if (filtro !== 'todas' && inc.severidad !== filtro) return false;
      if (busqueda && !inc.mensaje.toLowerCase().includes(busqueda)) return false;
      return true;
    });
  });

  readonly puedeValidar = computed(() => {
    const r = this.resumen();
    return !!r && r.puedeValidar === true;
  });

  readonly calculoNoVigente = computed(() =>
    esCalculoNoVigente({ calculoVigente: this.resumen()?.calculoVigente }),
  );

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
      const resumen = await this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId);
      this.resumen.set(resumen);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar el resumen de validación: ${msg}`);
    } finally {
      this.cargando.set(false);
    }
  }

  recargar(): void {
    const id = this.nominaPeriodoId();
    if (id) void this.cargar(id);
  }

  cambiarFiltroSeveridad(value: FiltroSeveridad): void {
    this.filtroSeveridad.set(value);
  }

  emitirVerEnDotacion(trabajadorId: string | undefined): void {
    if (trabajadorId) this.verEnDotacionSolicitado.emit(trabajadorId);
  }

  setJustificacion(incidenciaId: string, value: string): void {
    this.justificaciones.update((actual) => ({ ...actual, [incidenciaId]: value }));
  }

  incidenciaCriticaPendiente(inc: IncidenciaNomina): boolean {
    return incidenciaCriticaPendiente(inc);
  }

  advertenciaPendiente(inc: IncidenciaNomina): boolean {
    return advertenciaPendiente(inc);
  }

  async marcarResuelta(inc: IncidenciaNomina): Promise<void> {
    this.procesandoDecision.set(inc.id);
    this.error.set(null);
    try {
      await this.servicio.registrarDecisionIncidencia(inc.id, 'resolver');
      this.recargar();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible registrar la resolución: ${msg}`);
    } finally {
      this.procesandoDecision.set(null);
    }
  }

  async aceptarAdvertencia(inc: IncidenciaNomina): Promise<void> {
    const justificacion = this.justificaciones()[inc.id]?.trim() ?? '';
    if (!justificacion) {
      this.error.set('Indica una justificación antes de aceptar la advertencia.');
      return;
    }
    this.procesandoDecision.set(inc.id);
    this.error.set(null);
    try {
      await this.servicio.registrarDecisionIncidencia(inc.id, 'aceptar', justificacion);
      this.recargar();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aceptar la advertencia: ${msg}`);
    } finally {
      this.procesandoDecision.set(null);
    }
  }

  puedeContinuar(): ResultadoAvancePaso {
    if (this.cargando()) {
      return { ok: false, razon: 'Cargando la validación.' };
    }
    if (this.validando()) {
      return { ok: false, razon: 'Validación en curso.' };
    }
    if (this.calculoNoVigente()) {
      return {
        ok: false,
        razon: 'El cálculo no está vigente. Vuelve a procesarlo antes de validar.',
      };
    }
    if (!this.puedeValidar()) {
      return {
        ok: false,
        razon: 'Resuelve incidencias críticas y acepta advertencias pendientes antes de validar.',
      };
    }
    if (!this.nominaPeriodoId()) {
      return { ok: false, razon: 'No hay una nómina activa.' };
    }
    return { ok: true };
  }

  async avanzar(): Promise<ResultadoAvancePaso> {
    const diagnostico = this.puedeContinuar();
    if (!diagnostico.ok) return diagnostico;
    this.confirmarValidacionVisible.set(true);
    return { ok: false, razon: RAZON_VALIDACION_MODAL_PENDIENTE };
  }

  async confirmarValidacion(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.validando.set(true);
    this.error.set(null);
    try {
      await this.servicio.validarNomina(id);
      this.confirmarValidacionVisible.set(false);
      await this.cargar(id);
      this.validacionCompletada.emit();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible validar la nómina: ${msg}`);
    } finally {
      this.validando.set(false);
    }
  }
}
