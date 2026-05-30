import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  approvalMetrics,
  calculationMetrics,
  calculationRows,
  movementMetrics,
  movementRows,
  payslipMetrics,
  payslipRows,
  validationMetrics,
  validationRows,
} from '../../../../data/nomina-mensual-v2.mock';
import type { PayrollStepId } from '../../../../models/nomina-mensual-v2.models';
import {
  etiquetaIntegridadVisible,
  formatoFechaTrazabilidad,
} from '../../../../utils/nomina-trazabilidad-presentacion.util';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import {
  claseChecklist,
  claseTono,
  iconoChecklist,
  iconoEstado,
  iconoMetrica,
  inicialesNombre,
} from '../../utils/nomina-mensual-v2-presentacion.util';
import { NominaMensualV2TrazabilidadPasoComponent } from '../nomina-mensual-v2-trazabilidad-paso/nomina-mensual-v2-trazabilidad-paso.component';

@Component({
  selector: 'app-nomina-mensual-v2-pasos-demostracion',
  standalone: true,
  imports: [LucideAngularModule, NominaMensualV2TrazabilidadPasoComponent],
  templateUrl: './nomina-mensual-v2-pasos-demostracion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasosDemostracionComponent {
  @Input({ required: true }) paso!: PayrollStepId;

  readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  readonly movementMetrics = movementMetrics;
  readonly movementRows = movementRows;
  readonly calculationMetrics = calculationMetrics;
  readonly calculationRows = calculationRows;
  readonly validationMetrics = validationMetrics;
  readonly validationRows = validationRows;
  readonly approvalMetrics = approvalMetrics;
  readonly payslipMetrics = payslipMetrics;
  readonly payslipRows = payslipRows;

  readonly approvalTimeline = computed(() =>
    this.orquestador
      .eventosTrazabilidad()
      .filter((e) => e.paso === 'approval' || e.paso === 'validation' || e.paso === 'calculation')
      .slice(0, 5)
      .map((e) => ({
        time: formatoFechaTrazabilidad(e.fechaEvento),
        title: e.descripcion,
        description: etiquetaIntegridadVisible(e.integridad.estadoIntegridad, e.origen),
        status: e.integridad.estadoIntegridad === 'invalidado' ? ('warning' as const) : ('success' as const),
      })),
  );

  readonly toneClass = claseTono;
  readonly metricIcon = iconoMetrica;
  readonly statusIcon = iconoEstado;
  readonly initials = inicialesNombre;
  readonly checklistClass = claseChecklist;
  readonly checklistIcon = iconoChecklist;
  readonly etiquetaIntegridad = etiquetaIntegridadVisible;
  readonly formatoFecha = formatoFechaTrazabilidad;
}
