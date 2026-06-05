/**
 * Paso Cálculo — F3 fusion (F3e-4).
 *
 * Invoca al motor V1 (`ProcesoMensualService.generarCalculoPeriodo`) sobre el
 * período de la nómina activa, y muestra un resumen sintético del resultado
 * (totales, bloqueados, advertencias, top trabajadores por líquido).
 *
 * No reescribe motor: solo orquesta y persiste el evento de auditoría en
 * `evento_auditoria_nomina` vía `NominaPeriodoService`.
 *
 * Antes de calcular, evalúa `obtenerResumenValidacionNomina` y bloquea
 * la ejecución si hay incidencias bloqueantes.
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

import type {
  MotorCalculoPeriodoResultado,
  LiquidacionCalculada,
} from '../../../../../nomina-mensual/models/proceso-mensual.model';
import type {
  NominaPeriodo,
  ResumenValidacionNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import { NominaPeriodoCalculoAdapterService } from '../../../../../nomina-mensual/services/nomina-periodo-calculo-adapter.service';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';

@Component({
  selector: 'app-nomina-mensual-v2-paso-calculo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nomina-mensual-v2-paso-calculo.component.html',
  styleUrl: './nomina-mensual-v2-paso-calculo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoCalculoComponent implements PasoNominaPort {
  private readonly calculoAdapter = inject(NominaPeriodoCalculoAdapterService);
  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly avanceSolicitado = output<void>();
  readonly volverMovimientos = output<void>();

  readonly nomina = signal<NominaPeriodo | null>(null);
  readonly preValidacion = signal<ResumenValidacionNomina | null>(null);
  readonly resultado = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly calculando = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly puedeCalcular = computed(() => {
    if (this.calculando()) return false;
    const valid = this.preValidacion();
    return !!valid && valid.puedeCalcular;
  });

  readonly topLiquidaciones = computed<LiquidacionCalculada[]>(() => {
    const liqs = this.resultado()?.liquidaciones ?? [];
    return [...liqs]
      .sort((a, b) => (b.liquidoAPago ?? 0) - (a.liquidoAPago ?? 0))
      .slice(0, 5);
  });

  readonly puedeAvanzar = computed(() => this.resultado() != null);

  /**
   * `true` cuando el snapshot persistido en `evidenciaCalculo` dejó de ser
   * vigente por cambios posteriores (dotación/movimientos). Activa el banner
   * de advertencia replicado en Validación y Cierre (CAL-INV-05).
   */
  readonly calculoNoVigente = computed(() => {
    const ev = this.nomina()?.evidenciaCalculo;
    return ev != null && ev.versionCalculo > 0 && ev.calculoVigente === false;
  });

  readonly versionCalculo = computed(() => this.nomina()?.evidenciaCalculo?.versionCalculo ?? 0);

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
      const [nomina, validacion] = await Promise.all([
        this.servicio.obtenerNomina(nominaPeriodoId),
        this.servicio.obtenerResumenValidacionNomina(nominaPeriodoId),
      ]);
      this.nomina.set(nomina);
      this.preValidacion.set(validacion);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible preparar el cálculo: ${mensaje}`);
    } finally {
      this.cargando.set(false);
    }
  }

  async calcular(): Promise<void> {
    const nomina = this.nomina();
    if (!nomina) return;
    this.calculando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    try {
      const { resultado } = await this.calculoAdapter.calcular(nomina.id);
      this.resultado.set(resultado);
      this.mensaje.set(
        `Cálculo generado: ${resultado.resumen.totalTrabajadoresCalculados} trabajadores procesados.`,
      );
      this.nomina.set(await this.servicio.obtenerNomina(nomina.id));
      this.preValidacion.set(await this.servicio.obtenerResumenValidacionNomina(nomina.id));
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible ejecutar el cálculo: ${mensaje}`);
    } finally {
      this.calculando.set(false);
    }
  }

  private async registrarEventoCalculo(
    nomina: NominaPeriodo,
    resultado: MotorCalculoPeriodoResultado,
  ): Promise<void> {
    try {
      await this.servicio.registrarEventoAuditoria({
        nominaPeriodoId: nomina.id,
        accion: 'calculada',
        motivo: `Motor V1: ${resultado.resumen.totalTrabajadoresCalculados} trabajadores · líquido $${resultado.resumen.totalLiquidoPreliminar.toLocaleString('es-CL')}`,
      });
    } catch (error) {
      console.error('[Cálculo] No fue posible registrar evento de auditoría', error);
    }
  }

  emitirAvance(): void {
    if (this.puedeAvanzar()) this.avanceSolicitado.emit();
  }

  /**
   * Comando único de avance (AG-NAV-03). Paso navegacional con guard: requiere
   * un resultado de cálculo vigente. La acción operativa real (`Calcular
   * nómina`) sigue siendo un botón inline en el cuerpo del paso.
   */
  async avanzar(): Promise<ResultadoAvancePaso> {
    if (this.calculando()) {
      return { ok: false, razon: 'Cálculo en curso.' };
    }
    if (this.calculoNoVigente()) {
      return {
        ok: false,
        razon: 'El cálculo no está vigente. Vuelve a procesarlo antes de continuar.',
      };
    }
    if (!this.puedeAvanzar()) {
      return { ok: false, razon: 'Procesa el cálculo antes de continuar.' };
    }
    return { ok: true };
  }

  emitirVolver(): void {
    this.volverMovimientos.emit();
  }
}
