import { Component, HostBinding, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import { ContactoFormGroup, DatosPersonalesFormGroup } from '../../../models/empleado-form.model';
import {
  EmpleadoCatalogOption,
  EmpleadoStringCatalogOption,
} from '../../../models/empleado-catalogos.model';
import { EmpleadoSexo, TipoEstadoCivil } from '../../../models/empleado.model';
import { CalendarInputComponent } from '../../../../../shared/components/ui/calendar-input.component';
import { CardComponent } from '../../../../../shared/components/ui/card.component';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/search-select.component';
import { withEmptyNumberCatalog, withEmptyStringCatalog } from '../../../utils/empleado-select-options';
import { EmpleadoFieldRequiredComponent } from '../../empleado-field-required/empleado-field-required.component';

type DatosPersonalesControlName = keyof DatosPersonalesFormGroup['controls'];
type ContactoControlName = keyof ContactoFormGroup['controls'];

@Component({
  selector: 'app-empleado-datos-personales',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CalendarInputComponent,
    CardComponent,
    SearchSelectComponent,
    EmpleadoFieldRequiredComponent,
  ],
  templateUrl: './datos-personales.html',
  styleUrl: './datos-personales.css',
})
export class DatosPersonalesComponent {
  @Input({ required: true }) formGroup!: DatosPersonalesFormGroup;
  @Input({ required: true }) contactoFormGroup!: ContactoFormGroup;
  @Input() sexos: EmpleadoStringCatalogOption<EmpleadoSexo>[] = [];
  @Input() estadosCivil: EmpleadoStringCatalogOption<TipoEstadoCivil>[] = [];
  @Input() paises: EmpleadoCatalogOption[] = [];
  @Input() visibleBlocks: string[] | null = null;
  /** Textos de ayuda bajo cada titulo de bloque (solo creacion basica). */
  @Input() basicSectionLeads = false;
  /** Grilla 8 columnas y spans proporcionales (solo alta avanzada). */
  @Input() advancedGridLayout = false;
  /** Edicion inline desde ficha: la card exterior ya aporta el titulo del bloque. */
  @Input() inlineRecordLayout = false;

  @HostBinding('class.employee-layout-advanced')
  protected get employeeLayoutAdvanced(): boolean {
    return this.advancedGridLayout;
  }

  @HostBinding('class.employee-layout-inline-record')
  protected get employeeLayoutInlineRecord(): boolean {
    return this.inlineRecordLayout;
  }

  readonly today = this.toIsoDate(new Date());

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

  isBlockVisible(blockId: string): boolean {
    return this.visibleBlocks === null || this.visibleBlocks.includes(blockId);
  }

  get sexoSelectOptions(): SearchSelectOption[] {
    return withEmptyStringCatalog(this.sexos, 'Seleccione sexo');
  }

  get paisSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.paises, 'Seleccione país');
  }

  get estadoCivilSelectOptions(): SearchSelectOption[] {
    return withEmptyStringCatalog(this.estadosCivil, 'Seleccione estado civil');
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
