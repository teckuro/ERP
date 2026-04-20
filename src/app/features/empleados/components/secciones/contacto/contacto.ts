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
    return [
      'h-9 w-full rounded-md border bg-white px-3 text-sm font-medium text-neutral-900 transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-2',
      this.hasError(controlName)
        ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100'
        : 'border-neutral-200 hover:border-neutral-300 focus:border-blue-500 focus:ring-blue-100',
    ].join(' ');
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
