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
import { construirVistasStepper } from '../../../../presenters/nomina-stepper-trazabilidad.presenter';
import { obtenerEstadoPaso } from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2StepperTraceabilityComponent } from '../nomina-mensual-v2-stepper-traceability/nomina-mensual-v2-stepper-traceability.component';

@Component({
  selector: 'app-nomina-mensual-v2-stepper',
  standalone: true,
  imports: [LucideAngularModule, NominaMensualV2StepperTraceabilityComponent],
  templateUrl: './nomina-mensual-v2-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2StepperComponent {
  readonly pasoActual = input.required<PayrollStepId>();
  readonly steps = input.required<PayrollStep[]>();

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
    return obtenerEstadoPaso(stepId, this.pasoActual());
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
    this.pasoSeleccionado.emit(stepId);
  }
}
