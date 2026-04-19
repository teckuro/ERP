import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { DatosPersonalesFormGroup, EmpleadoSexo,EmpleadoCatalogOption,TipoEstadoCivil } from '../../models/empleado-form.model';

type DatosPersonalesControlName = keyof DatosPersonalesFormGroup['controls'];

interface SelectOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-form-empleado-datos-personales',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './form-empleado-datos-personales.html',
  styleUrl: './form-empleado-datos-personales.css',
})
export class FormEmpleadoDatosPersonalesComponent {
  @Input({ required: true }) formGroup!: DatosPersonalesFormGroup;
  @Input() paises: EmpleadoCatalogOption[] = [];

  readonly sexOptions: SelectOption<EmpleadoSexo>[] = [
    { value: 'F', label: 'Femenino' },
    { value: 'M', label: 'Masculino' },
    { value: 'O', label: 'Otro' },
  ];

  readonly estadoCivilOptions: SelectOption<TipoEstadoCivil>[] = [
    { value: 'SOLTERO', label: 'Soltero/a' },
    { value: 'CASADO', label: 'Casado/a' },
    { value: 'CONVIVIENTE CIVIL', label: 'Conviviente civil' },
    { value: 'SEPARADO', label: 'Separado/a' },
    { value: 'DIVORCIADO', label: 'Divorciado/a' },
    { value: 'VIUDO', label: 'Viudo/a' },
  ];

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
