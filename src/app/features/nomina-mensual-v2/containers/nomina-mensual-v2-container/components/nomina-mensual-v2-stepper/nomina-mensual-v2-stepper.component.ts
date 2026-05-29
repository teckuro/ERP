import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { PayrollStep, PayrollStepId, PayrollStepStatus } from '../../../../models/nomina-mensual-v2.models';
import { obtenerEstadoPaso, obtenerIconoPaso } from '../../facade/nomina-mensual-v2-navegacion';

@Component({
  selector: 'app-nomina-mensual-v2-stepper',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2StepperComponent {
  @Input({ required: true }) pasoActual!: PayrollStepId;
  @Input({ required: true }) steps!: PayrollStep[];

  @Output() pasoSeleccionado = new EventEmitter<PayrollStepId>();

  estadoPaso(stepId: PayrollStepId): PayrollStepStatus {
    return obtenerEstadoPaso(stepId, this.pasoActual);
  }

  iconoPaso(stepId: PayrollStepId): string {
    return obtenerIconoPaso(stepId);
  }

  seleccionarPaso(stepId: PayrollStepId): void {
    this.pasoSeleccionado.emit(stepId);
  }
}
