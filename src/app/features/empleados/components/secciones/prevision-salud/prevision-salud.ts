import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import {
  EmpleadoCatalogOption,
  EmpleadoStringCatalogOption,
  RegimenExCajaCatalogOption,
} from '../../../models/empleado-catalogos.model';
import { PrevisionSaludFormGroup } from '../../../models/empleado-form.model';
import { TipoRegimenPrevisional } from '../../../models/empleado.model';
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
  @Input() tiposRegimenPrevisional: EmpleadoStringCatalogOption<TipoRegimenPrevisional>[] = [];
  @Input() regimenesPrevisionales: EmpleadoCatalogOption[] = [];
  @Input() entidadesPrevisionalesIps: EmpleadoCatalogOption[] = [];
  @Input() exCajasPrevisionales: EmpleadoCatalogOption[] = [];
  @Input() regimenesExCaja: RegimenExCajaCatalogOption[] = [];
  @Input() afps: EmpleadoCatalogOption[] = [];
  @Input() entidadesSalud: EmpleadoCatalogOption[] = [];
  @Input() monedas: EmpleadoCatalogOption[] = [];
  @Input() institucionesApv: EmpleadoCatalogOption[] = [];
  @Input() formasPagoApv: EmpleadoCatalogOption[] = [];
  @Input() visibleBlocks: string[] | null = null;

  controlClass(controlName: PrevisionSaludControlName): string {
    return ['employee-control', this.hasError(controlName) ? 'is-invalid' : '']
      .filter(Boolean)
      .join(' ');
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
    return this.tipoPrevision !== null;
  }

  get mostrarApvi(): boolean {
    return this.esAfp && this.formGroup.controls.tieneApv.value;
  }

  get regimenesExCajaFiltrados(): RegimenExCajaCatalogOption[] {
    const exCajaId = this.formGroup.controls.idExCajaPrevisional.value;
    return this.regimenesExCaja.filter((option) => option.idExCajaPrevisional === exCajaId);
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

  isBlockVisible(blockId: string): boolean {
    return this.visibleBlocks === null || this.visibleBlocks.includes(blockId);
  }
}
