import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { DatosPersonalesFormGroup } from '../../../models/empleado-form.model';
import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { ESTADO_CIVIL_OPTIONS } from '../../../catalogs/estado-civil.options';
import { SEXO_OPTIONS } from '../../../catalogs/sexo.options';

type DatosPersonalesControlName = keyof DatosPersonalesFormGroup['controls'];

@Component({
  selector: 'app-empleado-datos-personales',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './datos-personales.html',
  styleUrl: './datos-personales.css',
})
export class DatosPersonalesComponent {
  @Input({ required: true }) formGroup!: DatosPersonalesFormGroup;
  @Input() paises: EmpleadoCatalogOption[] = [];

  readonly sexOptions = SEXO_OPTIONS;
  readonly estadoCivilOptions = ESTADO_CIVIL_OPTIONS;

  controlClass(controlName: DatosPersonalesControlName): string {
    return [
      'w-full rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4',
      this.hasError(controlName)
        ? 'border-red-300 focus:border-red-300 focus:ring-red-100'
        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
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
}
