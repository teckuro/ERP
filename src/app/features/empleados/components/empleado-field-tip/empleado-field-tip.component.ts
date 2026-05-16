import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { FieldHelpTipComponent } from '../../../../shared/components/ui/field-help-tip.component';

/** Alias de compatibilidad: usa el tooltip compartido con posicionamiento dinámico. */
@Component({
  selector: 'app-empleado-field-tip',
  standalone: true,
  imports: [FieldHelpTipComponent],
  template: `
    <app-field-help-tip [text]="text" [ariaLabel]="ariaLabel" [preferredPlacement]="preferredPlacement" />
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoFieldTipComponent {
  @Input({ required: true }) text!: string;
  @Input() ariaLabel = 'Ayuda del campo';
  @Input() preferredPlacement: 'auto' | 'top' | 'bottom' = 'auto';
}
