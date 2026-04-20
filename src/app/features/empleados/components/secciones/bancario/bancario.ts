import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { BancarioFormGroup } from '../../../models/empleado-form.model';

type BancarioControlName = keyof BancarioFormGroup['controls'];

@Component({
  selector: 'app-empleado-bancario',
  imports: [ReactiveFormsModule],
  templateUrl: './bancario.html',
  styleUrl: './bancario.css',
})
export class BancarioComponent {
  @Input({ required: true }) formGroup!: BancarioFormGroup;
  @Input() bancos: EmpleadoCatalogOption[] = [];
  @Input() tiposCuentaBancaria: EmpleadoCatalogOption[] = [];

  controlClass(controlName: BancarioControlName): string {
    return [
      'w-full rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4',
      this.hasError(controlName)
        ? 'border-red-300 focus:border-red-300 focus:ring-red-100'
        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
    ].join(' ');
  }

  hasError(controlName: BancarioControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isRequired(controlName: BancarioControlName): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }
}
