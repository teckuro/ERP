/**
 * Paso Validación — F3 fusion (F3e-5).
 *
 * Muestra `ResumenValidacionNomina` ya calculado por el motor + lista de
 * incidencias críticas y advertencias filtrables. El botón "Aprobar para cierre"
 * sólo se habilita si no hay incidencias bloqueantes.
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

import type {
  IncidenciaNomina,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import { MENSAJE_CALCULO_NO_VIGENTE, esCalculoNoVigente } from '../../facade/nomina-mensual-v2-navegacion';

type FiltroSeveridad = 'todas' | 'critica' | 'advertencia';

const ETIQUETAS_TIPO_INCIDENCIA: Record<string, string> = {
  datos_incompletos: 'Datos incompletos',
  prevision: 'Previsión',
  bancario: 'Datos bancarios',
  movimiento: 'Movimiento',
  calculo: 'Cálculo',
  dotacion: 'Dotación',
};

function etiquetaTipoIncidencia(tipo: string): string {
  return ETIQUETAS_TIPO_INCIDENCIA[tipo] ?? 'Revisión requerida';
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-validacion',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkspaceLoadingComponent],
  templateUrl: './nomina-mensual-v2-paso-validacion.component.html',
  styleUrl: './nomina-mensual-v2-paso-validacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoValidacionComponent implements PasoNominaPort {
  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly verEnDotacionSolicitado = output<string>();

  readonly resumen = signal<ResumenValidacionNomina | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtroSeveridad = signal<FiltroSeveridad>('todas');
  readonly busqueda = signal('');
  readonly mensajeCalculoNoVigente = MENSAJE_CALCULO_NO_VIGENTE;
  readonly etiquetaTipoIncidencia = etiquetaTipoIncidencia;
  readonly aprobando = signal(false);

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

  readonly puedeAprobar = computed(() => {
    const r = this.resumen();
    return !!r && r.conIncidenciasCriticas === 0 && r.puedeValidar === true;
  });

  /**
   * `true` cuando el resumen indica explícitamente que el cálculo dejó de
   * ser vigente. Activa la misma banda warning que Cálculo y Cierre
   * (CAL-INV-05).
   */
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

  /**
   * Diagnóstico puro de "completitud" del paso. Lo consultan CTA y stepper
   * antes del click. Sin side-effects.
   */
  puedeContinuar(): ResultadoAvancePaso {
    if (this.cargando()) {
      return { ok: false, razon: 'Cargando la validación.' };
    }
    if (this.aprobando()) {
      return { ok: false, razon: 'Aprobación en curso.' };
    }
    if (this.calculoNoVigente()) {
      return {
        ok: false,
        razon: 'El cálculo no está vigente. Vuelve a procesarlo antes de aprobar.',
      };
    }
    if (!this.puedeAprobar()) {
      return {
        ok: false,
        razon: 'Aún hay incidencias críticas o la validación no está lista para aprobar.',
      };
    }
    if (!this.nominaPeriodoId()) {
      return { ok: false, razon: 'No hay una nómina activa.' };
    }
    return { ok: true };
  }

  /**
   * Comando único de avance (AG-NAV-03). Ejecuta la aprobación; el container
   * navega a cierre según el resultado de `ejecutarAvancePaso`.
   */
  async avanzar(): Promise<ResultadoAvancePaso> {
    const diagnostico = this.puedeContinuar();
    if (!diagnostico.ok) return diagnostico;
    const id = this.nominaPeriodoId();
    if (!id) {
      return { ok: false, razon: 'No hay una nómina activa.' };
    }
    this.aprobando.set(true);
    this.error.set(null);
    try {
      await this.servicio.validarYAprobarNomina(id);
      await this.cargar(id);
      return { ok: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible aprobar la validación: ${msg}`);
      return { ok: false, razon: `No fue posible aprobar la validación: ${msg}` };
    } finally {
      this.aprobando.set(false);
    }
  }
}
