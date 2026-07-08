import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CalendarInputComponent } from '../../../../shared/components/ui/forms/calendar-input/calendar-input.component';
import { SearchSelectComponent, SearchSelectOption, SearchSelectValue } from '../../../../shared/components/ui/forms/search-select.component';
import type { EmpleadoListado } from '../../../empleados/models/empleado-listado.model';
import type { LicenciaMedica, LicenciaMedicaIngresoCorreo, LicenciaMedicaTipo } from '../../models/licencia-medica.model';
import { calcularDiasLicenciaInclusive, etiquetaEstadoLicenciaMedica, licenciaMedicaEstadoEsFinal, licenciaMedicaListaParaVincular } from '../../rules/licencia-medica-novedades.rules';

@Component({
  selector: 'app-licencia-medica-revision-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchSelectComponent, CalendarInputComponent],
  templateUrl: './licencia-medica-revision-drawer.component.html',
  styleUrl: './licencia-medica-revision-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicenciaMedicaRevisionDrawerComponent implements OnChanges {
  @Input({ required: true }) licencia!: LicenciaMedica;
  @Input() ingreso: LicenciaMedicaIngresoCorreo | null = null;
  @Input() empleados: readonly EmpleadoListado[] = [];
  @Input() guardando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardarBorrador = new EventEmitter<void>();
  @Output() confirmarVincular = new EventEmitter<void>();
  @Output() rechazar = new EventEmitter<void>();

  readonly idPersona = signal<number | null>(null);
  readonly idContrato = signal<number | null>(null);
  readonly folio = signal('');
  readonly tipo = signal<LicenciaMedicaTipo>('comun');
  readonly fechaInicio = signal('');
  readonly fechaTermino = signal('');
  readonly dias = signal<number | null>(null);
  readonly montoSubsidio = signal<number | null>(null);
  readonly observacion = signal('');

  readonly empleadoOptions = computed<SearchSelectOption<number>[]>(() =>
    this.empleados.map((e) => ({
      value: e.id,
      label: `${e.nombre} · ${e.rut}`,
      searchText: `${e.nombre} ${e.rut}`,
    })),
  );

  readonly diasCalculados = computed(() =>
    calcularDiasLicenciaInclusive(this.fechaInicio(), this.fechaTermino()),
  );

  esSoloLectura(): boolean {
    return licenciaMedicaEstadoEsFinal(this.licencia?.estado);
  }

  etiquetaEstado(): string {
    return etiquetaEstadoLicenciaMedica(this.licencia?.estado);
  }

  puedeConfirmarVincular(): boolean {
    if (this.esSoloLectura()) {
      return false;
    }
    return licenciaMedicaListaParaVincular({
      idPersona: this.idPersona(),
      folio: this.folio(),
      fechaInicio: this.fechaInicio(),
      fechaTermino: this.fechaTermino(),
      dias: this.dias(),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['licencia']?.currentValue) {
      return;
    }
    this.idPersona.set(this.licencia.idPersona);
    this.idContrato.set(this.licencia.idContrato);
    this.folio.set(this.licencia.folio ?? '');
    this.tipo.set((this.licencia.tipo as LicenciaMedicaTipo) ?? 'comun');
    this.fechaInicio.set(this.licencia.fechaInicio ?? '');
    this.fechaTermino.set(this.licencia.fechaTermino ?? '');
    this.dias.set(this.licencia.dias);
    this.montoSubsidio.set(this.licencia.montoSubsidio);
    this.observacion.set(this.licencia.observacion ?? '');
  }

  onEmpleadoChange(value: SearchSelectValue): void {
    const id = typeof value === 'number' ? value : null;
    this.idPersona.set(id);
    const empleado = id == null ? undefined : this.empleados.find((e) => e.id === id);
    this.idContrato.set(empleado?.idContrato ?? null);
  }

  onFechasChange(): void {
    const calculado = this.diasCalculados();
    if (calculado != null) {
      this.dias.set(calculado);
    }
  }

  payload(): {
    idLicencia: number;
    idPersona: number | null;
    idContrato: number | null;
    folio: string;
    tipo: LicenciaMedicaTipo;
    fechaInicio: string;
    fechaTermino: string;
    dias: number | null;
    montoSubsidio: number | null;
    observacion: string;
    origen: LicenciaMedica['origen'];
    idIngreso: number | null;
  } {
    return {
      idLicencia: this.licencia.idLicencia,
      idPersona: this.idPersona(),
      idContrato: this.idContrato(),
      folio: this.folio().trim(),
      tipo: this.tipo(),
      fechaInicio: this.fechaInicio().trim(),
      fechaTermino: this.fechaTermino().trim(),
      dias: this.dias(),
      montoSubsidio: this.montoSubsidio(),
      observacion: this.observacion().trim(),
      origen: this.licencia.origen,
      idIngreso: this.licencia.idIngreso,
    };
  }
}
