import { Component, HostBinding, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { EmpleadoCatalogOption } from '../../../models/empleado-catalogos.model';
import { ContactoFormGroup } from '../../../models/empleado-form.model';
import { CardComponent } from '../../../../../shared/components/ui/card.component';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/search-select.component';
import { withEmptyNumberCatalog } from '../../../utils/empleado-select-options';
import { EmpleadoFieldRequiredComponent } from '../../empleado-field-required/empleado-field-required.component';

type ContactoControlName = keyof ContactoFormGroup['controls'];

@Component({
  selector: 'app-empleado-contacto',
  imports: [ReactiveFormsModule, CardComponent, SearchSelectComponent, EmpleadoFieldRequiredComponent],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class ContactoComponent {
  @Input({ required: true }) formGroup!: ContactoFormGroup;
  @Input() comunas: EmpleadoCatalogOption[] = [];
  @Input() bloquesVisibles: string[] | null = null;
  /** Resalta comuna obligatoria (creacion avanzada). */
  @Input() domicilioAvanzado = false;
  /** Grilla 8 columnas y spans del domicilio (solo alta avanzada). */
  @Input() grillaAvanzada = false;
  /** Edicion inline desde ficha: la card exterior ya aporta el titulo del bloque. */
  @Input() disposicionInlineFicha = false;

  @HostBinding('class.employee-layout-advanced')
  protected get employeeLayoutAdvanced(): boolean {
    return this.grillaAvanzada;
  }

  @HostBinding('class.employee-layout-inline-record')
  protected get employeeLayoutInlineRecord(): boolean {
    return this.disposicionInlineFicha;
  }

  controlClass(controlName: ContactoControlName): string {
    return ['employee-control', this.hasError(controlName) ? 'is-invalid' : '']
      .filter(Boolean)
      .join(' ');
  }

  hasError(controlName: ContactoControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isRequired(controlName: ContactoControlName): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }

  esBloqueVisible(blockId: string): boolean {
    return this.bloquesVisibles === null || this.bloquesVisibles.includes(blockId);
  }

  get comunaSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.comunas, 'Seleccione comuna');
  }
}
