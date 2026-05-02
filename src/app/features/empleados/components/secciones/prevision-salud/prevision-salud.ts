import { Component, HostBinding, Input } from '@angular/core';
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
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/search-select.component';
import { withEmptyNumberCatalog, withEmptyStringCatalog } from '../../../utils/empleado-select-options';
import { LucideAngularModule } from 'lucide-angular';

type PrevisionSaludControlName = keyof PrevisionSaludFormGroup['controls'];
@Component({
  selector: 'app-empleado-prevision-salud',
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    SearchSelectComponent,
  ],
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
  /** Grilla 8 columnas y spans (solo alta avanzada). */
  @Input() advancedGridLayout = false;

  @HostBinding('class.employee-layout-advanced')
  protected get employeeLayoutAdvanced(): boolean {
    return this.advancedGridLayout;
  }

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

  get regimenStatusLabel(): string {
    if (this.esAfp) {
      return 'Cotiza en AFP';
    }
    if (this.esIps) {
      return 'Régimen IPS';
    }
    if (this.sinPrevision) {
      return 'Sin régimen previsional';
    }
    return 'Pendiente';
  }

  get apviImpactLabel(): string {
    if (this.esAfp && this.formGroup.controls.tieneApv.value) {
      return 'APVI habilitado';
    }
    if (this.esAfp) {
      return 'APVI opcional';
    }
    return 'APVI no aplica';
  }

  get apviDestinationLabel(): string {
    if (this.esAfp && this.formGroup.controls.tieneApv.value) {
      return 'APVI';
    }
    return 'Bancario';
  }

  get regimenesExCajaFiltrados(): RegimenExCajaCatalogOption[] {
    const exCajaId = this.formGroup.controls.idExCajaPrevisional.value;
    return this.regimenesExCaja.filter((option) => option.idExCajaPrevisional === exCajaId);
  }

  get tipoPrevision(): TipoRegimenPrevisional | null {
    return this.formGroup.controls.tipoRegimenPrevisional.value;
  }

  get tiposRegimenSelectOptions(): SearchSelectOption[] {
    return withEmptyStringCatalog(this.tiposRegimenPrevisional, 'Seleccione régimen previsional');
  }

  get afpSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.afps, 'Seleccione AFP');
  }

  get monedaCuenta2SelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.monedas, 'Seleccione moneda');
  }

  get entidadIpsSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.entidadesPrevisionalesIps, 'Seleccione IPS');
  }

  get exCajaSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.exCajasPrevisionales, 'Seleccione ex caja');
  }

  get regimenExCajaSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.regimenesExCajaFiltrados, 'Seleccione régimen ex caja');
  }

  get saludSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.entidadesSalud, 'Seleccione institución de salud');
  }

  get monedaPlanSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.monedas, 'Seleccione moneda plan salud');
  }

  get institucionApvSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.institucionesApv, 'Seleccione institución APV');
  }

  get monedaApvSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.monedas, 'Seleccione moneda APV');
  }

  get formaPagoApvSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.formasPagoApv, 'Seleccione forma de pago APV');
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
