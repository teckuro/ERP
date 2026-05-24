import { Component, HostBinding, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import {
  CONDICIONES_TRABAJADOR_UI,
  CondicionTrabajadorControlName,
} from '../../../models/empleado-perfil-laboral.model';
import { PerfilLaboralFormGroup } from '../../../models/empleado-form.model';
import { RelacionLaboral } from '../../../models/empleado.model';
import { CalendarInputComponent } from '../../../../../shared/components/ui/calendar-input.component';
import { CardComponent } from '../../../../../shared/components/ui/card.component';
import { EmpleadoFieldRequiredComponent } from '../../empleado-field-required/empleado-field-required.component';
import { EmpleadoFieldTipComponent } from '../../empleado-field-tip/empleado-field-tip.component';
import { buildTodayValue } from '../../../utils/empleado-form-defaults';

interface EdadLaboralInfo {
  label: string;
  description: string;
  tone: 'neutral' | 'warning' | 'review';
  edad: number | null;
}

interface DeteccionAutomaticaPerfilLaboral {
  controlName: CondicionTrabajadorControlName;
  reason: string;
}

@Component({
  selector: 'app-empleado-perfil-laboral',
  imports: [
    ReactiveFormsModule,
    CalendarInputComponent,
    CardComponent,
    EmpleadoFieldTipComponent,
    EmpleadoFieldRequiredComponent,
  ],
  templateUrl: './perfil-laboral.html',
  styleUrl: './perfil-laboral.css',
})
export class PerfilLaboralComponent {
  @Input({ required: true }) formGroup!: PerfilLaboralFormGroup;
  @Input() fechaNacimiento = '';
  @Input() fechaIngreso = '';
  @Input() relacionLaboral: RelacionLaboral = 'CONTRATO';
  @Input() tipoTrabajadorLabel = 'Tipo trabajador pendiente';
  @Input() autoDetectedConditions: readonly DeteccionAutomaticaPerfilLaboral[] = [];
  /** Edicion inline desde ficha: sin cabeceras de card ni layout de wizard. */
  @Input() disposicionInlineFicha = false;
  /** Etiqueta de edad/tramo desde RPC (periodo activo) en ficha. */
  @Input() edadDetectadaLabel = '';
  @Input() edadDetectadaDescripcion = '';

  @HostBinding('class.perfil-layout-inline-record')
  protected get perfilLayoutInlineRecord(): boolean {
    return this.disposicionInlineFicha;
  }

  readonly condiciones = CONDICIONES_TRABAJADOR_UI;
  readonly todayIso = buildTodayValue();

  get minVigenciaFin(): string {
    return this.formGroup.controls.vigenciaInicio.value?.trim() || '';
  }

  get hasAutoDetectedConditions(): boolean {
    return this.autoDetectedConditions.length > 0;
  }

  get autoDetectedConditionsLabel(): string {
    if (this.autoDetectedConditions.length === 0) {
      return 'Sin condiciones detectadas';
    }

    if (this.autoDetectedConditions.length === 1) {
      return '1 condición pre-marcada';
    }

    return `${this.autoDetectedConditions.length} condiciones pre-marcadas`;
  }

  get autoDetectedSummary(): string {
    if (this.autoDetectedConditions.length === 0) {
      return 'No hay condiciones pre-marcadas desde los pasos anteriores.';
    }

    const labels = this.autoDetectedConditions
      .map((item) => this.condiciones.find((condition) => condition.controlName === item.controlName)?.label)
      .filter((label): label is string => Boolean(label));

    return `${labels.join(', ')}. RRHH puede revisar o corregir antes de finalizar.`;
  }

  get edadLaboralInfo(): EdadLaboralInfo {
    if (this.disposicionInlineFicha && this.edadDetectadaLabel.trim()) {
      return {
        label: this.edadDetectadaLabel.trim(),
        description:
          this.edadDetectadaDescripcion.trim() ||
          'Perfil detectado según el período activo del sistema.',
        tone: this.edadDetectadaTone(),
        edad: null,
      };
    }

    const edad = this.calcularEdad(this.fechaNacimiento, this.fechaIngreso || this.todayIso);

    if (edad === null) {
      return {
        label: 'Pendiente de fecha de nacimiento',
        description: 'Completa fecha de nacimiento y fecha de ingreso para mostrar la revisión administrativa.',
        tone: 'neutral',
        edad,
      };
    }

    if (edad < 18) {
      return {
        label: 'Menor de 18 años',
        description: 'Requiere revisión RRHH antes de continuar. Registra respaldo solo si corresponde contratar.',
        tone: 'warning',
        edad,
      };
    }

    if (edad > 65) {
      return {
        label: 'Mayor de 65 años',
        description: 'Revisa si existe condición previsional especial antes de usar en remuneraciones.',
        tone: 'review',
        edad,
      };
    }

    return {
      label: 'Adulto 18 a 65 años',
      description: 'Trabajador estándar para administración RRHH. Declara condiciones solo si existe respaldo.',
      tone: 'neutral',
      edad,
    };
  }

  get categoriaBaseLabel(): string {
    return this.relacionLaboral === 'HONORARIOS'
      ? 'Independiente / honorarios'
      : 'Dependiente / contrato';
  }

  get fechaReferenciaLabel(): string {
    return this.fechaIngreso || 'Fecha de ingreso pendiente';
  }

  get edadReferenciaLabel(): string {
    const edad = this.edadLaboralInfo.edad;
    return edad === null ? 'Pendiente' : `${edad} años al ingreso`;
  }

  get hasAnyConditionSelected(): boolean {
    return this.condiciones.some((condition) => this.formGroup.controls[condition.controlName].value);
  }

  get selectedConditionsCount(): number {
    return this.condiciones.filter((condition) => this.formGroup.controls[condition.controlName].value)
      .length;
  }

  get selectedConditionsBadgeLabel(): string {
    if (this.selectedConditionsCount === 0) {
      return 'Sin condiciones';
    }

    return `${this.selectedConditionsCount} ${this.selectedConditionsCount === 1 ? 'condición' : 'condiciones'}`;
  }

  get emptyStateTitle(): string {
    const edad = this.edadLaboralInfo.edad;

    if (edad === null) {
      return 'Revisión pendiente';
    }

    if (edad < 18) {
      return 'Edad especial detectada';
    }

    if (edad > 65) {
      return 'Revisión previsional sugerida';
    }

    return 'Trabajador estándar';
  }

  get emptyStateDescription(): string {
    const edad = this.edadLaboralInfo.edad;

    if (edad === null) {
      return 'Completa los datos base y vuelve a este paso. No declares condiciones si aún no existe respaldo.';
    }

    if (edad < 18) {
      return 'No hay condiciones declaradas. Revisa si corresponde trabajador adolescente protegido o autorización de menor.';
    }

    if (edad > 65) {
      return 'No hay condiciones declaradas. Continúa solo si RRHH confirma que no existe exención o respaldo previsional especial.';
    }

    return 'Sin condiciones especiales declaradas. Continúa al resumen si no hay pensionado, exención, menor protegido, técnico extranjero u otro respaldo.';
  }

  get emptyStateClass(): string {
    const edad = this.edadLaboralInfo.edad;
    const modifier = edad === null ? 'is-neutral' : edad < 18 || edad > 65 ? 'is-review' : 'is-standard';

    return ['perfil-empty-state', modifier].join(' ');
  }

  get requiereRespaldoPendiente(): boolean {
    return this.hasAnyConditionSelected && !this.formGroup.controls.respaldoRegistrado.value;
  }

  get requiereRevisionMenorEdad(): boolean {
    return (
      this.edadLaboralInfo.edad !== null &&
      this.edadLaboralInfo.edad < 18 &&
      !this.formGroup.controls.trabajadorAdolescenteProtegido.value &&
      !this.formGroup.controls.autorizacionMenorRegistrada.value
    );
  }

  statusClass(): string {
    return ['perfil-status', `is-${this.edadLaboralInfo.tone}`].join(' ');
  }

  conditionClass(controlName: CondicionTrabajadorControlName): string {
    return [
      'perfil-condition-card',
      this.formGroup.controls[controlName].value ? 'is-selected' : '',
      this.isAutoDetected(controlName) ? 'is-auto-detected' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  isAutoDetected(controlName: CondicionTrabajadorControlName): boolean {
    return this.autoDetectedConditions.some((item) => item.controlName === controlName);
  }

  autoDetectedReason(controlName: CondicionTrabajadorControlName): string {
    return this.autoDetectedConditions.find((item) => item.controlName === controlName)?.reason ?? '';
  }

  private calcularEdad(fechaNacimiento: string, fechaReferencia: string): number | null {
    const nacimiento = this.parseDate(fechaNacimiento);
    const referencia = this.parseDate(fechaReferencia);

    if (!nacimiento || !referencia || nacimiento > referencia) {
      return null;
    }

    let edad = referencia.getFullYear() - nacimiento.getFullYear();
    const monthDelta = referencia.getMonth() - nacimiento.getMonth();
    const dayDelta = referencia.getDate() - nacimiento.getDate();

    if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
      edad -= 1;
    }

    return edad;
  }

  private edadDetectadaTone(): EdadLaboralInfo['tone'] {
    const label = this.edadDetectadaLabel.toLowerCase();

    if (label.includes('menor')) {
      return 'warning';
    }

    if (label.includes('mayor')) {
      return 'review';
    }

    return 'neutral';
  }

  private parseDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
