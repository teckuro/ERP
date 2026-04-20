import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { ContactoFormGroup } from '../../../models/empleado-form.model';

type ContactoControlName = keyof ContactoFormGroup['controls'];

@Component({
  selector: 'app-empleado-contacto',
  imports: [ReactiveFormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class ContactoComponent {
  @Input({ required: true }) formGroup!: ContactoFormGroup;
  @Input() comunas: EmpleadoCatalogOption[] = [];

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
}
