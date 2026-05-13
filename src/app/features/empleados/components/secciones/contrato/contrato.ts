import { Component, HostBinding, Input } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';

import {
  EmpleadoCatalogOption,
  EmpleadoDepartamentoOption,
  EmpleadoStringCatalogOption,
  EmpleadoSucursalOption,
  TramoCargaCatalogOption,
} from '../../../models/empleado-catalogos.model';
import { ContratoFormGroup } from '../../../models/empleado-form.model';
import { RelacionLaboral, TipoContrato, TipoGratificacion } from '../../../models/empleado.model';
import { EmpleadoEstado } from '../../../models/empleado-listado.model';
import { CalendarInputComponent } from '../../../../../shared/components/ui/calendar-input.component';
import { CardComponent } from '../../../../../shared/components/ui/card.component';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/search-select.component';
import { withEmptyNumberCatalog, withEmptyStringCatalog } from '../../../utils/empleado-select-options';
import {
  buscarTipoTrabajadorBase,
  descripcionTipoTrabajadorBase,
  tipoTrabajadorBaseParaRelacion,
} from '../../../rules/empleado-tipo-trabajador-flow.rules';

type ContratoControlName = keyof ContratoFormGroup['controls'];

interface SelectOption<T> {
  value: T;
  label: string;
}

interface WeekdayOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-empleado-contrato',
  imports: [ReactiveFormsModule, CalendarInputComponent, CardComponent, SearchSelectComponent],
  templateUrl: './contrato.html',
  styleUrl: './contrato.css',
})
export class ContratoComponent {
  @Input({ required: true }) formGroup!: ContratoFormGroup;
  @Input() centrosCosto: EmpleadoCatalogOption[] = [];
  @Input() sucursales: EmpleadoSucursalOption[] = [];
  @Input() departamentos: EmpleadoDepartamentoOption[] = [];
  @Input() tiposTrabajador: EmpleadoCatalogOption[] = [];
  @Input() tiposJornada: EmpleadoCatalogOption[] = [];
  @Input() tiposContrato: EmpleadoStringCatalogOption<TipoContrato>[] = [];
  @Input() tiposGratificacion: EmpleadoStringCatalogOption<TipoGratificacion>[] = [];
  @Input() monedas: EmpleadoCatalogOption[] = [];
  @Input() tramosCarga: TramoCargaCatalogOption[] = [];
  @Input() visibleBlocks: string[] | null = null;
  /** Grilla 8 columnas y spans laborales (solo alta avanzada). */
  @Input() advancedGridLayout = false;

  @HostBinding('class.labor-layout-advanced')
  protected get laborLayoutAdvanced(): boolean {
    return this.advancedGridLayout;
  }

  readonly employeeStates: SelectOption<EmpleadoEstado>[] = [
    { value: 'en_proceso', label: 'En proceso' },
  ];

  readonly relationOptions: SelectOption<RelacionLaboral>[] = [
    { value: 'CONTRATO', label: 'Contrato' },
    { value: 'HONORARIOS', label: 'Boleta de honorarios' },
  ];


  get isHonorariosMode(): boolean {
    return this.formGroup.controls.relacionLaboral.value === 'HONORARIOS';
  }

  get tipoTrabajadorBaseEsperado(): 'DEPENDIENTE' | 'INDEPENDIENTE' {
    return tipoTrabajadorBaseParaRelacion(this.formGroup.controls.relacionLaboral.value);
  }

  get tipoTrabajadorBaseLabel(): string {
    const selectedId = this.formGroup.controls.idTipoTrabajador.value;
    const selected = this.tiposTrabajador.find((option) => option.value === selectedId);

    return selected?.label ?? this.tipoTrabajadorBaseEsperado;
  }

  get tipoTrabajadorBaseDescription(): string {
    return descripcionTipoTrabajadorBase(this.tipoTrabajadorBaseEsperado);
  }

  get tipoTrabajadorBaseWarning(): string | null {
    const selectedId = this.formGroup.controls.idTipoTrabajador.value;
    if (selectedId !== null) {
      return null;
    }

    const expected = buscarTipoTrabajadorBase(this.tiposTrabajador, this.tipoTrabajadorBaseEsperado);
    if (expected) {
      return null;
    }

    return `No se encontró ${this.tipoTrabajadorBaseEsperado} en el catálogo tipo_trabajador.`;
  }

  serviceOrPositionLabel(): string {
    return this.isHonorariosMode ? 'Servicio o función' : 'Cargo';
  }

  serviceOrPositionPlaceholder(): string {
    return this.isHonorariosMode ? 'Ej.: asesoría contable mensual' : '';
  }

  baseAmountLabel(): string {
    return this.isHonorariosMode ? 'Monto bruto de honorarios' : 'Sueldo base mensual';
  }

  baseAmountHelpText(): string {
    return this.isHonorariosMode
      ? 'Corresponde al valor bruto pactado por servicios a honorarios. No genera jornada laboral ni remuneración dependiente.'
      : 'El sueldo base debe ser mayor a cero.';
  }

  readonly weekdayOptions: WeekdayOption[] = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
  ];

  controlClass(controlName: ContratoControlName): string {
    return ['employee-control', this.hasError(controlName) ? 'is-invalid' : '']
      .filter(Boolean)
      .join(' ');
  }

  checkboxClass(dayValue: number): string {
    return [
      'weekday-chip',
      this.hasWeekday(dayValue) ? 'is-selected' : '',
      this.formGroup.controls.semanaCorridaActiva.value ? '' : 'is-disabled',
    ]
      .filter(Boolean)
      .join(' ');
  }

  hasError(controlName: ContratoControlName, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  isRequired(controlName: ContratoControlName): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }

  get departamentosFiltrados(): EmpleadoDepartamentoOption[] {
    const sucursalId = this.formGroup.controls.idSucursal.value;
    return this.departamentos.filter((option) => option.idSucursal === sucursalId);
  }

  get contractTypes(): SelectOption<TipoContrato>[] {
    return this.tiposContrato.length
      ? this.tiposContrato
      : [
          { value: 'INDEFINIDO', label: 'Indefinido' },
          { value: 'PLAZO_FIJO', label: 'Plazo fijo' },
          { value: 'OBRA_SERVICIO', label: 'Obra o servicio' },
          { value: 'CASA_PARTICULAR', label: 'Casa particular' },
        ];
  }

  get gratificationTypes(): SelectOption<TipoGratificacion>[] {
    return this.tiposGratificacion.length
      ? this.tiposGratificacion
      : [
          { value: 'LEGAL_ART_50', label: 'Legal art. 50' },
          { value: 'LEGAL_ART_47', label: 'Legal art. 47' },
          { value: 'VOLUNTARIA', label: 'Voluntaria' },
        ];
  }

  get tiposTrabajadorSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.tiposTrabajador, 'Seleccione tipo de trabajador');
  }

  get tipoContratoSelectOptions(): SearchSelectOption[] {
    return withEmptyStringCatalog(this.contractTypes, 'Seleccione tipo de contrato');
  }

  get sucursalesSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.sucursales, 'Seleccione sucursal');
  }

  get departamentosSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.departamentosFiltrados, 'Seleccione área / departamento');
  }

  get tiposJornadaSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.tiposJornada, 'Seleccione jornada');
  }

  get monedasSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.monedas, 'Seleccione moneda');
  }

  get gratificacionSelectOptions(): SearchSelectOption[] {
    return withEmptyStringCatalog(this.gratificationTypes, 'Seleccione tipo de gratificación');
  }

  get centrosCostoSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.centrosCosto, 'Seleccione centro de costo');
  }

  /** Etiquetas combinadas para app-search-select (misma info que los <option> nativos). */
  get tramosCargaOptions(): SearchSelectOption[] {
    const rows = this.tramosCarga.map((tramo) => {
      const range =
        tramo.desde !== null || tramo.hasta !== null
          ? ` (${tramo.desde ?? 0} – ${tramo.hasta ?? 'Sin tope'})`
          : '';

      return {
        value: tramo.value,
        label: `${tramo.tramo || 'Nuevo Colaborador'}${range}`,
      };
    });
    return withEmptyNumberCatalog(rows, 'Sin seleccionar');
  }

  get isIndefinido(): boolean {
    return this.formGroup.controls.tipoContrato.value === 'INDEFINIDO';
  }

  get tramoAsignado(): string {
    return this.selectedTramo?.tramo ?? 'Sin tramo';
  }

  get valorPorCarga(): string {
    const tramo = this.selectedTramo;

    if (!tramo?.valor) {
      return '$0';
    }

    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(tramo.valor);
  }

  get periodoTramoVigente(): string | null {
    return this.selectedTramo?.periodo ?? this.tramosCarga[0]?.periodo ?? null;
  }

  get selectedTramo(): TramoCargaCatalogOption | null {
    const tramoId = this.formGroup.controls.idTramoCarga.value;

    if (tramoId === null) {
      return null;
    }

    return this.tramosCarga.find((option) => option.value === tramoId) ?? null;
  }

  onRelacionLaboralChange(value: RelacionLaboral): void {
    this.formGroup.controls.relacionLaboral.setValue(value);
    this.formGroup.controls.relacionLaboral.markAsTouched();
  }

  onIndefinidoToggle(checked: boolean): void {
    if (checked) {
      this.formGroup.controls.tipoContrato.setValue('INDEFINIDO');
    } else if (this.formGroup.controls.tipoContrato.value === 'INDEFINIDO') {
      this.formGroup.controls.tipoContrato.setValue(null);
    }
    this.formGroup.controls.tipoContrato.markAsTouched();
  }

  toggleWeekday(dayValue: number): void {
    if (!this.formGroup.controls.semanaCorridaActiva.value) {
      return;
    }

    const currentDays = this.formGroup.controls.semanaCorridaDiasLaborables.value;
    const nextDays = currentDays.includes(dayValue)
      ? currentDays.filter((value) => value !== dayValue)
      : [...currentDays, dayValue].sort((left, right) => left - right);

    this.formGroup.controls.semanaCorridaDiasLaborables.setValue(nextDays);
    this.formGroup.controls.semanaCorridaDiasLaborables.markAsTouched();
  }

  hasWeekday(dayValue: number): boolean {
    return this.formGroup.controls.semanaCorridaDiasLaborables.value.includes(dayValue);
  }

  isBlockVisible(blockId: string): boolean {
    if (this.visibleBlocks === null) {
      return true;
    }

    const v = this.visibleBlocks;

    if (blockId === 'contratoBase' && v.includes('contrato')) {
      return true;
    }

    return v.includes(blockId);
  }
}
