import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStep, PayrollStepId, PayrollStepStatus } from '../../../../models/nomina-mensual-v2.models';
import type { NominaPeriodo } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { construirVistasStepper } from '../../../../presenters/nomina-stepper-trazabilidad.presenter';
import {
  esAvanceHaciaAdelante,
  esPasoCongelado,
  obtenerEstadoPaso,
  tooltipPasoCongelado,
} from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';

@Component({
  selector: 'app-nomina-mensual-v2-stepper',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-stepper.component.html',
  styleUrl: './nomina-mensual-v2-stepper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2StepperComponent {
  readonly pasoActual = input.required<PayrollStepId>();
  readonly steps = input.required<PayrollStep[]>();
  readonly avanceDesdePasoActualBloqueado = input(false);
  /**
   * Nómina persistida del período activo. Cuando está disponible, el stepper
   * deriva el estado de cada paso (`completed` / `active` / `pending`) desde
   * `nomina.estado` y `evidenciaCalculo` (AG-NAV-02). Si es `null` (carga
   * inicial o estado degradado) los pasos no-activos quedan `pending`.
   */
  readonly nomina = input<NominaPeriodo | null>(null);

  @Output() pasoSeleccionado = new EventEmitter<PayrollStepId>();

  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  readonly vistasStepper = computed(() =>
    construirVistasStepper(
      this.steps(),
      this.pasoActual(),
      (id) => this.estadoPaso(id),
      this.orquestador.auditoriaPorPaso(),
      this.orquestador.eventosTrazabilidad(),
    ),
  );

  estadoPaso(stepId: PayrollStepId): PayrollStepStatus {
    return obtenerEstadoPaso(stepId, this.pasoActual(), this.nomina());
  }

  claseEstadoPaso(estado: PayrollStepStatus): string {
    switch (estado) {
      case 'active':
        return 'nomina-step--active';
      case 'completed':
        return 'nomina-step--complete';
      case 'blocked':
        return 'nomina-step--blocked';
      case 'warning':
        return 'nomina-step--warning';
      case 'pending':
      default:
        return 'nomina-step--pending';
    }
  }

  seleccionarPaso(stepId: PayrollStepId): void {
    if (this.pasoCongelado(stepId)) return;
    if (this.avanceDesdePasoActualBloqueado() && esAvanceHaciaAdelante(this.pasoActual(), stepId)) {
      return;
    }
    this.pasoSeleccionado.emit(stepId);
  }

  pasoAvanceBloqueado(stepId: PayrollStepId): boolean {
    return this.avanceDesdePasoActualBloqueado() && esAvanceHaciaAdelante(this.pasoActual(), stepId);
  }

  pasoCongelado(stepId: PayrollStepId): boolean {
    return esPasoCongelado(stepId);
  }

  tooltipPaso(stepId: PayrollStepId): string | null {
    if (this.pasoCongelado(stepId)) return tooltipPasoCongelado();
    return null;
  }
}
