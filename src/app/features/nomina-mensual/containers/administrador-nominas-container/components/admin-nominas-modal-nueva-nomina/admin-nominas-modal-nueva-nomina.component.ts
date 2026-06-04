/**
 * Modal "Nueva nómina" del Administrador.
 *
 * Form simple (período + empresa + tipo) que emite `(creada)` con el
 * `NominaPeriodoResumen` recién persistido en BD vía `NominaPeriodoService`.
 *
 * F3 (fusion): persiste contra Supabase. La empresa se resuelve desde
 * `EmpresaActivaService`. Si el usuario solo ve 1 empresa, el selector queda
 * deshabilitado y prellenado.
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

import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen, TipoNomina } from '../../../../models/nomina-periodo.models';

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
  private readonly servicio = inject(NominaPeriodoService);
  private readonly empresaActiva = inject(EmpresaActivaService);

  readonly empresasDisponibles = input<readonly NominaPeriodoResumen[]>([]);
  readonly creada = output<NominaPeriodoResumen>();
  readonly cerrar = output<void>();

  readonly tiposNomina = TIPOS_NOMINA;

  readonly periodo = signal(periodoActual());
  readonly empresaId = signal('');
  readonly tipo = signal<TipoNomina>('mensual');
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly empresas = computed<OpcionEmpresa[]>(() => {
    const fuente = this.empresasDisponibles();
    const mapa = new Map<string, string>();
    for (const r of fuente) {
      if (!mapa.has(r.empresaId)) {
        mapa.set(r.empresaId, r.empresaNombre);
      }
    }
    const empresaActivaSnap = this.empresaActiva.empresa();
    if (empresaActivaSnap) {
      const id = String(empresaActivaSnap.idEmpresa);
      if (!mapa.has(id)) {
        mapa.set(id, empresaActivaSnap.nombre || empresaActivaSnap.razonSocial);
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

  readonly puedeCrear = computed(
    () => !this.guardando() && this.periodoEsValido() && this.empresaId().length > 0,
  );

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
    if (this.guardando()) return;
    this.cerrar.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrarModal();
    }
  }

  async confirmar(): Promise<void> {
    if (!this.puedeCrear()) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      const resumen = await this.servicio.crearNominaPeriodo({
        periodo: this.periodo(),
        tipo: this.tipo(),
        empresaId: this.empresaId(),
        empresaNombre: this.empresaSeleccionadaNombre(),
      });
      this.creada.emit(resumen);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible crear la nómina.';
      this.error.set(mensaje);
    } finally {
      this.guardando.set(false);
    }
  }
}
