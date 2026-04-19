import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import {
  EmpleadoCatalogOption,
  PrevisionSaludFormGroup,
  TipoRegimenPrevisional,
} from '../../models/empleado-form.model';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../shared/components/ui/card.component';

type PrevisionSaludControlName = keyof PrevisionSaludFormGroup['controls'];
type TipoRegimenOption = {
  value: TipoRegimenPrevisional;
  label: string;
  description: string;
};

const TIPO_REGIMEN_OPTIONS: readonly TipoRegimenOption[] = [
  {
    value: 'AFP',
    label: 'AFP',
    description: 'Muestra AFP, salud, Cuenta 2 y APVI.',
  },
  {
    value: 'IPS',
    label: 'IPS (Ex INP)',
    description: 'Muestra los datos de Ex-Caja y salud.',
  },
  {
    value: 'NINGUNA',
    label: 'Sin Prevision',
    description: 'Oculta salud y no registra previsiones asociadas.',
  },
] as const;

@Component({
  selector: 'app-form-empleado-prevision-salud',
  imports: [ReactiveFormsModule, CardComponent, CardContentComponent, CardHeaderComponent],
  templateUrl: './form-empleado-prevision-salud.html',
  styleUrl: './form-empleado-prevision-salud.css',
})
export class FormEmpleadoPrevisionSaludComponent {
  @Input({ required: true }) formGroup!: PrevisionSaludFormGroup;
  @Input() regimenesPrevisionales: EmpleadoCatalogOption[] = [];
  @Input() afps: EmpleadoCatalogOption[] = [];
  @Input() entidadesSalud: EmpleadoCatalogOption[] = [];
  @Input() monedas: EmpleadoCatalogOption[] = [];
  @Input() institucionesApv: EmpleadoCatalogOption[] = [];
  @Input() formasPagoApv: EmpleadoCatalogOption[] = [];
  readonly tipoRegimenOptions = TIPO_REGIMEN_OPTIONS;

  controlClass(controlName: PrevisionSaludControlName): string {
    return [
      'w-full rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4',
      this.hasError(controlName)
        ? 'border-red-300 focus:border-red-300 focus:ring-red-100'
        : 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
    ].join(' ');
  }

  get esAfp(): boolean {
    return this.tipoPrevision === 'AFP';
  }

  get esIps(): boolean {
    return this.tipoPrevision === 'IPS';
  }

  get sinPrevision(): boolean {
    return this.tipoPrevision === 'NINGUNA';
  }

  get mostrarSalud(): boolean {
    return this.tipoPrevision !== null && !this.sinPrevision;
  }

  get mostrarApvi(): boolean {
    return this.esAfp && this.formGroup.controls.tieneApv.value;
  }

  get tipoPrevision(): TipoRegimenPrevisional | null {
    return this.formGroup.controls.tipoRegimenPrevisional.value;
  }

  hasError(controlName: PrevisionSaludControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isRequired(controlName: PrevisionSaludControlName): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }
}
