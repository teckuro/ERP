/**
 * Modal "Nueva nómina" del Administrador (F2).
 *
 * Form simple (período + empresa + tipo) que emite `(creada)` con una
 * `NominaPeriodo` recién instanciada vía `crearNomina()`.
 *
 * IMPORTANTE: en F2 NO persiste. El adapter mock no expone aún
 * `crearNominaPeriodo`. El container la inyecta en memoria local. F3 conectará
 * persistencia real.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { NominaPeriodoMockAdapterService } from '../../../../services/nomina-periodo-mock-adapter.service';
import { crearNomina, type NominaPeriodo, type NominaPeriodoResumen, type TipoNomina } from '../../../../models/nomina-periodo.models';

interface OpcionEmpresa {
  id: string;
  nombre: string;
}

const TIPOS_NOMINA: { id: TipoNomina; label: string; descripcion: string }[] = [
  { id: 'mensual', label: 'Mensual', descripcion: 'Período mensual estándar.' },
  { id: 'quincenal', label: 'Quincenal', descripcion: 'Dos liquidaciones por mes.' },
  { id: 'semanal', label: 'Semanal', descripcion: 'Una liquidación por semana.' },
  { id: 'extraordinaria', label: 'Extraordinaria', descripcion: 'Bonificación, finiquito masivo o ajuste fuera de calendario.' },
];

function periodoActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  return `${anio}-${mes}`;
}

function generarIdLocal(): string {
  return `nom-borrador-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

@Component({
  selector: 'app-admin-nominas-modal-nueva-nomina',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-nominas-modal-nueva-nomina.component.html',
  styleUrl: './admin-nominas-modal-nueva-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalNuevaNominaComponent {
  private readonly adapter = inject(NominaPeriodoMockAdapterService);

  readonly empresasDisponibles = input<readonly NominaPeriodoResumen[]>([]);
  readonly creada = output<NominaPeriodo>();
  readonly cerrar = output<void>();

  readonly tiposNomina = TIPOS_NOMINA;

  readonly periodo = signal(periodoActual());
  readonly empresaId = signal('');
  readonly tipo = signal<TipoNomina>('mensual');

  readonly empresas = computed<OpcionEmpresa[]>(() => {
    const fuente = this.empresasDisponibles().length > 0
      ? this.empresasDisponibles()
      : this.adapter.listarResumenes();
    const mapa = new Map<string, string>();
    for (const r of fuente) {
      if (!mapa.has(r.empresaId)) {
        mapa.set(r.empresaId, r.empresaNombre);
      }
    }
    return [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly periodoEsValido = computed(() => /^\d{4}-(0[1-9]|1[0-2])$/.test(this.periodo()));

  readonly empresaSeleccionadaNombre = computed(() => {
    const id = this.empresaId();
    return this.empresas().find((e) => e.id === id)?.nombre ?? '';
  });

  readonly puedeCrear = computed(() => this.periodoEsValido() && this.empresaId().length > 0);

  constructor() {
    const primera = this.empresas()[0];
    if (primera) {
      this.empresaId.set(primera.id);
    }
  }

  setPeriodo(valor: string): void {
    this.periodo.set(valor);
  }

  setEmpresa(valor: string): void {
    this.empresaId.set(valor);
  }

  setTipo(valor: TipoNomina): void {
    this.tipo.set(valor);
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrar.emit();
    }
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrar.emit();
    }
  }

  confirmar(): void {
    if (!this.puedeCrear()) return;

    const nombre = this.empresaSeleccionadaNombre();
    const nomina = crearNomina({
      id: generarIdLocal(),
      periodo: this.periodo(),
      empresaId: this.empresaId(),
      empresaNombre: nombre,
      tipo: this.tipo(),
      estado: 'borrador',
    });

    this.creada.emit(nomina);
  }
}
