import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRight } from 'lucide-angular/src/icons';
import type { FaltanteFichaEmpleado, FichaEstadoPanelVm } from '../../../models/ficha-empleado.vm';

@Component({
  selector: 'app-empleado-diagnostico-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './empleado-diagnostico-panel.component.html',
})
export class EmpleadoDiagnosticoPanelComponent {
  @Input({ required: true }) estado!: FichaEstadoPanelVm;
  @Input({ required: true }) progressStyle!: Record<string, string>;
  @Input() validando = false;
  readonly navegarFaltante = output<FaltanteFichaEmpleado>();
  readonly accionPrincipal = output<void>();
  readonly chevronRightIcon = ChevronRight;
}
