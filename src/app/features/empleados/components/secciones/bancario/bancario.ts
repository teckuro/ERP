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
      'h-9 w-full rounded-md border bg-white px-3 text-sm font-medium text-neutral-900 transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-2',
      this.hasError(controlName)
        ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100'
        : 'border-neutral-200 hover:border-neutral-300 focus:border-blue-500 focus:ring-blue-100',
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
