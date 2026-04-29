import { Component, HostBinding, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { ContactoFormGroup } from '../../../models/empleado-form.model';
import { CardComponent } from '../../../../../shared/components/ui/card.component';

type ContactoControlName = keyof ContactoFormGroup['controls'];

@Component({
  selector: 'app-empleado-contacto',
  imports: [ReactiveFormsModule, CardComponent],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class ContactoComponent {
  @Input({ required: true }) formGroup!: ContactoFormGroup;
  @Input() comunas: EmpleadoCatalogOption[] = [];
  @Input() visibleBlocks: string[] | null = null;
  /** Resalta comuna obligatoria (creacion avanzada). */
  @Input() domicilioAvanzado = false;
  /** Grilla 8 columnas y spans del domicilio (solo alta avanzada). */
  @Input() advancedGridLayout = false;

  @HostBinding('class.employee-layout-advanced')
  protected get employeeLayoutAdvanced(): boolean {
    return this.advancedGridLayout;
  }

  controlClass(controlName: ContactoControlName): string {
    return ['employee-control', this.hasError(controlName) ? 'is-invalid' : '']
      .filter(Boolean)
      .join(' ');
  }

  hasError(controlName: ContactoControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isRequired(controlName: ContactoControlName): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }

  isBlockVisible(blockId: string): boolean {
    return this.visibleBlocks === null || this.visibleBlocks.includes(blockId);
  }
}
