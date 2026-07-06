import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { FieldHelpTipComponent } from '../../../../shared/components/ui/forms/field-help-tip.component';

/** Marcador compacto de campo obligatorio (icono + tooltip), mismo slot que el asterisco anterior. */
@Component({
  selector: 'app-empleado-field-required',
  standalone: true,
  imports: [FieldHelpTipComponent],
  template: `
    <app-field-help-tip
      mode="required"
      [text]="tooltip"
      [ariaLabel]="ariaLabel"
      [preferredPlacement]="preferredPlacement"
    />
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
export class EmpleadoFieldRequiredComponent {
  @Input() tooltip = 'Campo obligatorio';
  @Input() ariaLabel = 'Campo obligatorio';
  @Input() preferredPlacement: 'auto' | 'top' | 'bottom' = 'auto';
}
