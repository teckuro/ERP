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
    return ['employee-control', hasError ? 'is-invalid' : ''].filter(Boolean).join(' ');
  }

  hasError(controlName: DatosPersonalesControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  hasIdentityError(): boolean {
    const rut = this.formGroup.controls.rut;
    const pasaporte = this.formGroup.controls.pasaporte;

    return this.formGroup.hasError('rutOrPassport') && (rut.touched || pasaporte.touched);
  }

  hasPassportWarning(): boolean {
    const rut = this.formGroup.controls.rut.value.trim();
    const pasaporte = this.formGroup.controls.pasaporte.value.trim();

    return !rut && Boolean(pasaporte) && !this.hasError('pasaporte');
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

  hasContactoWarning(controlName: 'email' | 'telefono'): boolean {
    const control = this.contactoFormGroup.controls[controlName];

    return control.touched && !String(control.value ?? '').trim();
  }
}
