import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { ContactoFormGroup, EmpleadoCatalogOption } from '../../models/empleado-form.model';

type ContactoControlName = keyof ContactoFormGroup['controls'];

@Component({
  selector: 'app-form-empleado-contacto',
  imports: [ReactiveFormsModule],
  templateUrl: './form-empleado-contacto.html',
  styleUrl: './form-empleado-contacto.css',
})
export class FormEmpleadoContactoComponent {
  @Input({ required: true }) formGroup!: ContactoFormGroup;
  @Input() comunas: EmpleadoCatalogOption[] = [];

  controlClass(controlName: ContactoControlName): string {
    return [
      'w-full rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4',
      this.hasError(controlName)
        ? 'border-red-300 focus:border-red-300 focus:ring-red-100'
        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
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
