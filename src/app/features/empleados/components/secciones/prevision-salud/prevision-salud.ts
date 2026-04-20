import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { PrevisionSaludFormGroup } from '../../../models/empleado-form.model';
import { TipoRegimenPrevisional } from '../../../models/empleado.model';
import { TIPO_REGIMEN_OPTIONS } from '../../../catalogs/prevision.options';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../../shared/components/ui/card.component';

type PrevisionSaludControlName = keyof PrevisionSaludFormGroup['controls'];
@Component({
  selector: 'app-empleado-prevision-salud',
  imports: [ReactiveFormsModule, CardComponent, CardContentComponent, CardHeaderComponent],
  templateUrl: './prevision-salud.html',
  styleUrl: './prevision-salud.css',
})
export class PrevisionSaludComponent {
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
