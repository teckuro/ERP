import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  approvalMetrics,
  approvalTimeline,
  calculationMetrics,
  calculationRows,
  movementMetrics,
  movementRows,
  payslipMetrics,
  payslipRows,
  validationRows,
} from '../../../../data/nomina-mensual-v2.mock';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import {
  claseChecklist,
  claseTono,
  iconoChecklist,
  iconoEstado,
  iconoMetrica,
  inicialesNombre,
} from '../../utils/nomina-mensual-v2-presentacion.util';

@Component({
  selector: 'app-nomina-mensual-v2-pasos-demostracion',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './nomina-mensual-v2-pasos-demostracion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasosDemostracionComponent {
  @Input({ required: true }) paso!: PayrollStepId;

  readonly movementMetrics = movementMetrics;
  readonly movementRows = movementRows;
  readonly calculationMetrics = calculationMetrics;
  readonly calculationRows = calculationRows;
  readonly validationRows = validationRows;
  readonly approvalMetrics = approvalMetrics;
  readonly approvalTimeline = approvalTimeline;
  readonly payslipMetrics = payslipMetrics;
  readonly payslipRows = payslipRows;

  readonly toneClass = claseTono;
  readonly metricIcon = iconoMetrica;
  readonly statusIcon = iconoEstado;
  readonly initials = inicialesNombre;
  readonly checklistClass = claseChecklist;
  readonly checklistIcon = iconoChecklist;
}
