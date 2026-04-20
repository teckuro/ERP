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
    return ['employee-control', this.hasError(controlName) ? 'is-invalid' : '']
      .filter(Boolean)
      .join(' ');
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
