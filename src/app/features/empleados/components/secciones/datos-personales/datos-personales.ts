import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { ContactoFormGroup, DatosPersonalesFormGroup } from '../../../models/empleado-form.model';
import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { ESTADO_CIVIL_OPTIONS } from '../../../catalogs/estado-civil.options';
import { SEXO_OPTIONS } from '../../../catalogs/sexo.options';

type DatosPersonalesControlName = keyof DatosPersonalesFormGroup['controls'];
type ContactoControlName = keyof ContactoFormGroup['controls'];

@Component({
  selector: 'app-empleado-datos-personales',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './datos-personales.html',
  styleUrl: './datos-personales.css',
})
export class DatosPersonalesComponent {
  @Input({ required: true }) formGroup!: DatosPersonalesFormGroup;
  @Input({ required: true }) contactoFormGroup!: ContactoFormGroup;
  @Input() paises: EmpleadoCatalogOption[] = [];

  readonly sexOptions = SEXO_OPTIONS;
  readonly estadoCivilOptions = ESTADO_CIVIL_OPTIONS;

  controlClass(controlName: DatosPersonalesControlName): string {
    return this.resolveControlClass(this.hasError(controlName));
  }

  contactoControlClass(controlName: ContactoControlName): string {
    return this.resolveControlClass(this.hasContactoError(controlName));
  }

  private resolveControlClass(hasError: boolean): string {
    return [
      'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2',
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
    ].join(' ');
  }

  hasError(controlName: DatosPersonalesControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isRequired(controlName: DatosPersonalesControlName): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }

  hasContactoError(controlName: ContactoControlName, errorCode?: string): boolean {
    const control = this.contactoFormGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isContactoRequired(controlName: ContactoControlName): boolean {
    return this.contactoFormGroup.controls[controlName].hasValidator(Validators.required);
  }
}
