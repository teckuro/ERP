/**
 * Modal "Editor de plantilla" del Administrador de plantillas (F03).
 *
 * Crea una plantilla nueva (modo `crear`) o registra una nueva versión de una
 * plantilla existente (modo `editar`, vía RPC `crear_version_plantilla`).
 *
 * Documento rector:
 *   `docs/codex/modulos/nomina-mensual/roadmap-admin-generador-operativo-100.md` §F03.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { NominaPlantillaCicloService } from '../../../../services/nomina-plantilla-ciclo.service';
import type {
  NaturalezaNomina,
  TipoNomina,
} from '../../../../models/nomina-periodo.models';
import type {
  ModoReglaAnticipo,
  NominaPlantillaCiclo,
  PoliticaFinSemana,
  ReglaAnticipo,
  ReglaFechaPago,
  TipoReglaFechaPago,
} from '../../../../models/nomina-plantilla-ciclo.models';

type ModoEditor = 'crear' | 'editar';

interface OpcionTipo {
  readonly id: TipoNomina;
  readonly label: string;
}

interface OpcionNaturaleza {
  readonly id: NaturalezaNomina;
  readonly label: string;
}

interface OpcionRegla {
  readonly id: TipoReglaFechaPago;
  readonly label: string;
  readonly descripcion: string;
}

const TIPOS_DISPONIBLES: OpcionTipo[] = [
  { id: 'mensual', label: 'Mensual' },
  { id: 'quincenal', label: 'Quincenal' },
  { id: 'semanal', label: 'Semanal' },
];

const NATURALEZAS_DISPONIBLES: OpcionNaturaleza[] = [
  { id: 'liquidacion_legal', label: 'Liquidación legal' },
  { id: 'anticipo', label: 'Anticipo' },
];

const REGLAS_FECHA_PAGO: OpcionRegla[] = [
  {
    id: 'ultimo_dia_habil',
    label: 'Último día hábil del mes',
    descripcion: 'El último lunes a viernes del mes.',
  },
  {
    id: 'ultimo_dia_corrido',
    label: 'Último día calendario del mes',
    descripcion: 'Día 28-31 según mes, aunque caiga en fin de semana.',
  },
  {
    id: 'dia_fijo',
    label: 'Día fijo del mes',
    descripcion: 'Pago siempre el mismo día (ej. día 5).',
  },
  {
    id: 'dia_habil_n',
    label: 'Día hábil número N',
    descripcion: 'Quinto día hábil del mes, por ejemplo.',
  },
  {
    id: 'siguiente_mes_dia_fijo',
    label: 'Día fijo del mes siguiente',
    descripcion: 'Pago el día N del mes que sigue al corte.',
  },
];

const POLITICAS_FDS: { id: PoliticaFinSemana; label: string; descripcion: string }[] = [
  {
    id: 'adelantar',
    label: 'Adelantar al viernes anterior',
    descripcion: 'Si la fecha de pago cae sábado o domingo, paga el viernes previo.',
  },
  {
    id: 'atrasar',
    label: 'Atrasar al lunes siguiente',
    descripcion: 'Si cae en fin de semana, paga el lunes siguiente.',
  },
  {
    id: 'mantener',
    label: 'Mantener fecha calendario',
    descripcion: 'Pago en la fecha calendario, aunque sea sábado o domingo.',
  },
];

@Component({
  selector: 'app-admin-plantillas-modal-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-plantillas-modal-editor.component.html',
  styleUrl: './admin-plantillas-modal-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminPlantillasModalEditorComponent {
  private readonly servicio = inject(NominaPlantillaCicloService);
  private readonly empresaActiva = inject(EmpresaActivaService);

  readonly modo = input.required<ModoEditor>();
  readonly plantillaBase = input<NominaPlantillaCiclo | null>(null);

  readonly guardada = output<NominaPlantillaCiclo>();
  readonly cerrar = output<void>();

  readonly codigo = signal('');
  readonly nombre = signal('');
  readonly tipo = signal<TipoNomina>('mensual');
  readonly naturaleza = signal<NaturalezaNomina>('liquidacion_legal');
  readonly descripcion = signal('');

  readonly reglaTipo = signal<TipoReglaFechaPago>('ultimo_dia_habil');
  readonly reglaDia = signal<number>(15);
  readonly reglaNHabil = signal<number>(5);

  readonly politicaFds = signal<PoliticaFinSemana>('adelantar');

  readonly anticipoModo = signal<ModoReglaAnticipo>('porcentaje');
  readonly anticipoValor = signal<number>(50);

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly tipos = TIPOS_DISPONIBLES;
  readonly naturalezas = NATURALEZAS_DISPONIBLES;
  readonly reglas = REGLAS_FECHA_PAGO;
  readonly politicas = POLITICAS_FDS;

  readonly esEditar = computed(() => this.modo() === 'editar');

  readonly mostrarCampoDia = computed(
    () => this.reglaTipo() === 'dia_fijo' || this.reglaTipo() === 'siguiente_mes_dia_fijo',
  );
  readonly mostrarCampoNHabil = computed(() => this.reglaTipo() === 'dia_habil_n');
  readonly mostrarSeccionAnticipo = computed(() => this.naturaleza() === 'anticipo');

  readonly puedeGuardar = computed(() => {
    if (this.guardando()) return false;
    if (this.codigo().trim() === '') return false;
    if (this.nombre().trim() === '') return false;
    if (this.mostrarCampoDia()) {
      const d = this.reglaDia();
      if (!Number.isInteger(d) || d < 1 || d > 31) return false;
    }
    if (this.mostrarCampoNHabil()) {
      const n = this.reglaNHabil();
      if (!Number.isInteger(n) || n < 1 || n > 23) return false;
    }
    if (this.mostrarSeccionAnticipo()) {
      const v = this.anticipoValor();
      if (!Number.isFinite(v) || v <= 0) return false;
      if (this.anticipoModo() === 'porcentaje' && v > 100) return false;
    }
    return true;
  });

  constructor() {
    effect(() => {
      const base = this.plantillaBase();
      if (!base) {
        this.resetForm();
        return;
      }
      this.codigo.set(base.codigo);
      this.nombre.set(base.nombre);
      this.tipo.set(base.tipo);
      this.naturaleza.set(base.naturaleza);
      this.descripcion.set(base.descripcion ?? '');
      this.reglaTipo.set(base.reglaFechaPago.tipo);
      if (
        base.reglaFechaPago.tipo === 'dia_fijo' ||
        base.reglaFechaPago.tipo === 'siguiente_mes_dia_fijo'
      ) {
        this.reglaDia.set(base.reglaFechaPago.dia);
      }
      if (base.reglaFechaPago.tipo === 'dia_habil_n') {
        this.reglaNHabil.set(base.reglaFechaPago.n_habil);
      }
      this.politicaFds.set(base.politicaFinSemana);
      if (base.reglaAnticipo) {
        this.anticipoModo.set(base.reglaAnticipo.modo);
        this.anticipoValor.set(base.reglaAnticipo.valor);
      }
    });
  }

  private resetForm(): void {
    this.codigo.set('');
    this.nombre.set('');
    this.tipo.set('mensual');
    this.naturaleza.set('liquidacion_legal');
    this.descripcion.set('');
    this.reglaTipo.set('ultimo_dia_habil');
    this.reglaDia.set(15);
    this.reglaNHabil.set(5);
    this.politicaFds.set('adelantar');
    this.anticipoModo.set('porcentaje');
    this.anticipoValor.set(50);
    this.error.set(null);
  }

  private construirReglaFechaPago(): ReglaFechaPago {
    const tipo = this.reglaTipo();
    if (tipo === 'dia_fijo' || tipo === 'siguiente_mes_dia_fijo') {
      return { tipo, dia: this.reglaDia() };
    }
    if (tipo === 'dia_habil_n') {
      return { tipo, n_habil: this.reglaNHabil() };
    }
    return { tipo };
  }

  private construirReglaAnticipo(): ReglaAnticipo | null {
    if (!this.mostrarSeccionAnticipo()) return null;
    return {
      modo: this.anticipoModo(),
      valor: this.anticipoValor(),
    };
  }

  setCodigo(valor: string): void {
    this.codigo.set(valor.toUpperCase());
  }

  setNombre(valor: string): void {
    this.nombre.set(valor);
  }

  setTipo(valor: TipoNomina): void {
    this.tipo.set(valor);
  }

  setNaturaleza(valor: NaturalezaNomina): void {
    this.naturaleza.set(valor);
  }

  setReglaTipo(valor: TipoReglaFechaPago): void {
    this.reglaTipo.set(valor);
  }

  setReglaDia(valor: string | number): void {
    const v = Number(valor);
    if (!Number.isNaN(v)) this.reglaDia.set(Math.trunc(v));
  }

  setReglaNHabil(valor: string | number): void {
    const v = Number(valor);
    if (!Number.isNaN(v)) this.reglaNHabil.set(Math.trunc(v));
  }

  setPoliticaFds(valor: PoliticaFinSemana): void {
    this.politicaFds.set(valor);
  }

  setAnticipoModo(valor: ModoReglaAnticipo): void {
    this.anticipoModo.set(valor);
  }

  setAnticipoValor(valor: string | number): void {
    const v = Number(valor);
    if (!Number.isNaN(v)) this.anticipoValor.set(v);
  }

  setDescripcion(valor: string): void {
    this.descripcion.set(valor);
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
      event.preventDefault();
      this.cerrarModal();
    }
  }

  async confirmar(): Promise<void> {
    if (!this.puedeGuardar()) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      if (this.modo() === 'crear') {
        const empresaId = this.empresaActiva.empresaActivaId();
        if (empresaId === null || empresaId === undefined) {
          throw new Error('No hay una empresa activa seleccionada.');
        }
        const creada = await this.servicio.crearPlantilla({
          empresaId: String(empresaId),
          codigo: this.codigo().trim(),
          nombre: this.nombre().trim(),
          tipo: this.tipo(),
          naturaleza: this.naturaleza(),
          reglaFechaPago: this.construirReglaFechaPago(),
          politicaFinSemana: this.politicaFds(),
          reglaAnticipo: this.construirReglaAnticipo(),
          descripcion: this.descripcion().trim() || null,
        });
        this.guardada.emit(creada);
      } else {
        const base = this.plantillaBase();
        if (!base) {
          throw new Error('No se encontró la plantilla a editar.');
        }
        await this.servicio.crearNuevaVersion({
          plantillaId: base.id,
          nombre: this.nombre().trim(),
          reglaFechaPago: this.construirReglaFechaPago(),
          politicaFinSemana: this.politicaFds(),
          reglaAnticipo: this.construirReglaAnticipo() ?? undefined,
          descripcion: this.descripcion().trim() || undefined,
          activar: true,
        });
        const refrescada = (await this.servicio.refrescar()).find(
          (p) => p.codigo === base.codigo && p.activo,
        );
        if (refrescada) this.guardada.emit(refrescada);
      }
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'No fue posible guardar la plantilla.';
      this.error.set(mensaje);
    } finally {
      this.guardando.set(false);
    }
  }
}
