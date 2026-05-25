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
import {
  CasaParticularModalidad,
  CasaParticularRegistroDtEstado,
  CausalExclusionJornada,
  RelacionLaboral,
  TipoContrato,
  TipoGratificacion,
} from '../../../models/empleado.model';
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
import { EmpleadoFieldRequiredComponent } from '../../empleado-field-required/empleado-field-required.component';
import { EmpleadoFieldTipComponent } from '../../empleado-field-tip/empleado-field-tip.component';
import { buildTodayValue } from '../../../utils/empleado-form-defaults';

type NombreControlContrato = keyof ContratoFormGroup['controls'];

interface OpcionSeleccion<T> {
  value: T;
  label: string;
}

interface OpcionDiaSemana {
  value: number;
  label: string;
}

@Component({
  selector: 'app-empleado-contrato',
  imports: [
    ReactiveFormsModule,
    CalendarInputComponent,
    CardComponent,
    SearchSelectComponent,
    EmpleadoFieldTipComponent,
    EmpleadoFieldRequiredComponent,
  ],
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
  @Input() bloquesVisibles: string[] | null = null;
  @Input() domicilioReferencia: string | null = null;
  /** Grilla 8 columnas y spans laborales (solo alta avanzada). */
  @Input() grillaAvanzada = false;
  /** Edicion inline desde ficha: la card exterior ya aporta el titulo del bloque. */
  @Input() disposicionInlineFicha = false;

  @HostBinding('class.labor-layout-advanced')
  protected get laborLayoutAdvanced(): boolean {
    return this.grillaAvanzada;
  }

  @HostBinding('class.labor-layout-inline-record')
  protected get laborLayoutInlineRecord(): boolean {
    return this.disposicionInlineFicha;
  }

  readonly hoy = buildTodayValue();

  get minFechaTermino(): string {
    const ingreso = this.formGroup.controls.fechaIngreso.value?.trim();
    return ingreso || '';
  }

  readonly estadosEmpleado: OpcionSeleccion<EmpleadoEstado>[] = [
    { value: 'en_proceso', label: 'En proceso' },
  ];

  readonly opcionesRelacionLaboral: OpcionSeleccion<RelacionLaboral>[] = [
    { value: 'CONTRATO', label: 'Contrato' },
    { value: 'HONORARIOS', label: 'Boleta de honorarios' },
  ];

  readonly opcionesModalidadCasaParticular: OpcionSeleccion<CasaParticularModalidad>[] = [
    { value: 'PUERTAS_AFUERA', label: 'Puertas afuera' },
    { value: 'PUERTAS_ADENTRO', label: 'Puertas adentro' },
  ];

  readonly opcionesRegistroDtCasaParticular: OpcionSeleccion<CasaParticularRegistroDtEstado>[] = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'REGISTRADO', label: 'Registrado' },
    { value: 'NO_APLICA', label: 'No aplica' },
  ];

  readonly opcionesCausalExclusionJornada: OpcionSeleccion<CausalExclusionJornada>[] = [
    { value: 'ALTA_RESPONSABILIDAD', label: 'Alta responsabilidad / confianza' },
    {
      value: 'SIN_FISCALIZACION_SUPERIOR_INMEDIATA',
      label: 'Sin fiscalizacion superior inmediata',
    },
  ];

  get esModoHonorarios(): boolean {
    return this.formGroup.controls.relacionLaboral.value === 'HONORARIOS';
  }

  get esCasaParticular(): boolean {
    return !this.esModoHonorarios && this.formGroup.controls.tipoContrato.value === 'CASA_PARTICULAR';
  }

  get esRegistroDtRegistrado(): boolean {
    return this.formGroup.controls.casaParticularRegistroDtEstado.value === 'REGISTRADO';
  }

  get estaExcluidoLimiteJornada(): boolean {
    return this.formGroup.controls.excluidoLimiteJornada.value === true;
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

  etiquetaServicioOCargo(): string {
    return this.esModoHonorarios ? 'Servicio o función' : 'Cargo';
  }

  placeholderServicioOCargo(): string {
    return this.esModoHonorarios ? 'Ej.: asesoría contable mensual' : '';
  }

  etiquetaMontoBase(): string {
    return this.esModoHonorarios ? 'Monto bruto de honorarios' : 'Sueldo base mensual';
  }

  ayudaMontoBase(): string {
    return this.esModoHonorarios
      ? 'Corresponde al valor bruto pactado por servicios a honorarios. No genera jornada laboral ni remuneración dependiente.'
      : 'El sueldo base debe ser mayor a cero.';
  }

  /** Ayuda operativa en tooltip (alta avanzada). */
  pistaCampoMontoBase(): string {
    return this.esModoHonorarios
      ? 'Corresponde al valor bruto pactado por servicios a honorarios. No genera jornada laboral ni remuneración dependiente.'
      : 'Monto base mensual pactado en la moneda del contrato.';
  }

  readonly opcionesDiasSemana: OpcionDiaSemana[] = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
  ];

  claseControl(controlName: NombreControlContrato): string {
    return ['employee-control', this.tieneError(controlName) ? 'is-invalid' : '']
      .filter(Boolean)
      .join(' ');
  }

  claseCheckboxDia(dayValue: number): string {
    return [
      'weekday-chip',
      this.tieneDiaSemana(dayValue) ? 'is-selected' : '',
      this.formGroup.controls.semanaCorridaActiva.value ? '' : 'is-disabled',
    ]
      .filter(Boolean)
      .join(' ');
  }

  tieneError(controlName: NombreControlContrato, errorCode?: string): boolean {
    const control = this.formGroup.controls[controlName];

    if (!control.touched) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : control.invalid;
  }

  esRequerido(controlName: NombreControlContrato): boolean {
    return this.formGroup.controls[controlName].hasValidator(Validators.required);
  }

  get departamentosFiltrados(): EmpleadoDepartamentoOption[] {
    const sucursalId = this.formGroup.controls.idSucursal.value;
    return this.departamentos.filter((option) => option.idSucursal === sucursalId);
  }

  get tiposContratoDisponibles(): OpcionSeleccion<TipoContrato>[] {
    return this.tiposContrato.length
      ? this.tiposContrato
      : [
          { value: 'INDEFINIDO', label: 'Indefinido' },
          { value: 'PLAZO_FIJO', label: 'Plazo fijo' },
          { value: 'OBRA_SERVICIO', label: 'Obra o servicio' },
          { value: 'CASA_PARTICULAR', label: 'Casa particular' },
        ];
  }

  get tiposGratificacionDisponibles(): OpcionSeleccion<TipoGratificacion>[] {
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
    return withEmptyStringCatalog(this.tiposContratoDisponibles, 'Seleccione tipo de contrato');
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
    return withEmptyStringCatalog(this.tiposGratificacionDisponibles, 'Seleccione tipo de gratificación');
  }

  get centrosCostoSelectOptions(): SearchSelectOption[] {
    return withEmptyNumberCatalog(this.centrosCosto, 'Seleccione centro de costo');
  }

  /** Etiquetas combinadas para app-search-select (misma info que los <option> nativos). */
  get tramosCargaSelectOptions(): SearchSelectOption[] {
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
    return this.tramoSeleccionado?.tramo ?? 'Sin tramo';
  }

  get valorPorCarga(): string {
    const tramo = this.tramoSeleccionado;

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
    return this.tramoSeleccionado?.periodo ?? this.tramosCarga[0]?.periodo ?? null;
  }

  get tramoSeleccionado(): TramoCargaCatalogOption | null {
    const tramoId = this.formGroup.controls.idTramoCarga.value;

    if (tramoId === null) {
      return null;
    }

    return this.tramosCarga.find((option) => option.value === tramoId) ?? null;
  }

  manejarToggleIndefinido(checked: boolean): void {
    if (checked) {
      this.formGroup.controls.tipoContrato.setValue('INDEFINIDO');
    } else if (this.formGroup.controls.tipoContrato.value === 'INDEFINIDO') {
      this.formGroup.controls.tipoContrato.setValue(null);
    }
    this.formGroup.controls.tipoContrato.markAsTouched();
  }

  alternarDiaSemana(dayValue: number): void {
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

  tieneDiaSemana(dayValue: number): boolean {
    return this.formGroup.controls.semanaCorridaDiasLaborables.value.includes(dayValue);
  }

  esBloqueVisible(blockId: string): boolean {
    if (this.bloquesVisibles === null) {
      return true;
    }

    const v = this.bloquesVisibles;

    if (blockId === 'contratoBase' && v.includes('contrato')) {
      return true;
    }

    return v.includes(blockId);
  }
}
