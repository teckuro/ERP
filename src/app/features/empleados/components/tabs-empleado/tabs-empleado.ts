import { Component, EventEmitter, Input, Output } from '@angular/core';

import { StepperComponent, StepperItem } from '../../../../shared/components/ui/stepper.component';

@Component({
  selector: 'app-tabs-empleado',
  imports: [StepperComponent],
  templateUrl: './tabs-empleado.html',
  styleUrl: './tabs-empleado.css',
})
export class TabsEmpleadoComponent {
  @Input({ required: true }) steps: Array<StepperItem & { id: string }> = [];
  @Input({ required: true }) activeId!: string;
  @Input() caption = 'Progreso';
  @Output() readonly activeIdChange = new EventEmitter<string>();
}
