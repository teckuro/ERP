/**
 * Modal "Nueva nómina" del Administrador (wizard 2 pasos, F04 + F05).
 *
 * Paso 1 — Configuración: período + empresa contextual + tipo fijo.
 * Paso 2 — Vista previa: tabs incluidos/excluidos/conflictos + totales.
 *          La RPC `previsualizar_creacion_nomina` clasifica el universo y
 *          emite un `fingerprint` que `crearNominaPeriodo` (F05) validará
 *          al confirmar.
 *
 * Cuando F05 cierre, `confirmar()` invocará `confirmarCreacion(fingerprint)`
 * en el servicio. En el piloto actual mantenemos `crearNominaPeriodo()`
 * como wrapper hasta migrar la dotación al servidor.
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
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { NominaPeriodoResumen, TipoNomina } from '../../../../models/nomina-periodo.models';
import type {
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  SiguientePasoCreacion,
} from '../../../../models/nomina-creacion-preview.models';

interface OpcionEmpresa {
  id: string;
  nombre: string;
}

/**
 * Evento que enriquece al `NominaPeriodoResumen` con el contexto del RPC F05
 * para que el contenedor pueda llevar al Generador al paso recomendado y
 * mostrar el banner contextual (dotación inicial creada, reutilizada o no).
 */
export interface NominaCreadaEvento {
  resumen: NominaPeriodoResumen;
  siguientePaso: SiguientePasoCreacion;
  totalTrabajadoresIniciales: number;
  reutilizada: boolean;
}

type PasoWizard = 'configuracion' | 'preview';
type TabPreview = 'incluidos' | 'excluidos' | 'conflictos';

const TIPOS_NOMINA: { id: TipoNomina; label: string; descripcion: string }[] = [
  {
    id: 'mensual',
    label: 'Mensual',
    descripcion: 'Liquidación legal del mes calendario.',
  },
];

function periodoActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  return `${anio}-${mes}`;
}

function etiquetaPeriodoLegible(periodo: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return periodo;
  const fecha = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
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
  /** Período sugerido desde el shell (selector global), si está disponible. */
  readonly periodoInicial = input<string | null>(null);
  readonly creada = output<NominaCreadaEvento>();
  readonly cerrar = output<void>();

  readonly tiposNomina = TIPOS_NOMINA;

  readonly periodo = signal(periodoActual());
  readonly empresaId = signal('');
  readonly tipo = signal<TipoNomina>('mensual');
  readonly paso = signal<PasoWizard>('configuracion');
  readonly tabActiva = signal<TabPreview>('incluidos');
  readonly cargandoPreview = signal(false);
  readonly preview = signal<NominaCreatePreview | null>(null);
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

  readonly multiplesEmpresas = computed(() => this.empresas().length > 1);

  readonly empresaContexto = computed(() => this.empresaSeleccionadaNombre());

  readonly etiquetaPeriodo = computed(() => etiquetaPeriodoLegible(this.periodo()));

  readonly puedeAvanzarPreview = computed(
    () =>
      !this.cargandoPreview()
      && this.periodoEsValido()
      && this.empresaId().length > 0
      && this.tipo() === 'mensual',
  );

  readonly puedeConfirmar = computed(() => {
    const p = this.preview();
    return !this.guardando() && p !== null && p.puedeCrear;
  });

  /** Compat hacia atrás: tests previos consultan `puedeCrear()`. */
  readonly puedeCrear = computed(() => this.puedeAvanzarPreview());

  readonly filasTabActiva = computed(() => {
    const p = this.preview();
    if (!p) return [];
    switch (this.tabActiva()) {
      case 'incluidos':
        return p.incluidos;
      case 'excluidos':
        return p.excluidos;
      case 'conflictos':
        return p.conflictos;
    }
  });

  constructor() {
    effect(() => {
      const inicial = this.periodoInicial();
      if (inicial && /^\d{4}-(0[1-9]|1[0-2])$/.test(inicial)) {
        this.periodo.set(inicial);
      }
    }, { allowSignalWrites: true });

    const primera = this.empresas()[0];
    if (primera) {
      this.empresaId.set(primera.id);
    }
  }

  setPeriodo(valor: string): void {
    this.periodo.set(valor);
    if (this.paso() === 'preview') {
      this.volverAConfiguracion();
    }
  }

  setEmpresa(valor: string): void {
    this.empresaId.set(valor);
    if (this.paso() === 'preview') {
      this.volverAConfiguracion();
    }
  }

  setTipo(valor: TipoNomina): void {
    this.tipo.set(valor);
  }

  setTab(valor: TabPreview): void {
    this.tabActiva.set(valor);
  }

  volverAConfiguracion(): void {
    this.paso.set('configuracion');
    this.preview.set(null);
    this.error.set(null);
  }

  cerrarModal(): void {
    if (this.guardando() || this.cargandoPreview()) return;
    this.cerrar.emit();
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cerrarModal();
    }
  }

  /**
   * Paso 1 → Paso 2: solicita preview al servidor y muestra incluidos/excluidos.
   * No persiste la nómina.
   */
  async generarPreview(): Promise<void> {
    if (!this.puedeAvanzarPreview()) return;
    this.cargandoPreview.set(true);
    this.error.set(null);
    try {
      const preview = await this.servicio.previsualizarCreacion({
        periodo: this.periodo(),
        tipo: this.tipo(),
      });
      this.preview.set(preview);
      this.paso.set('preview');
      const tabSugerida: TabPreview = preview.conflictos.length > 0
        ? 'conflictos'
        : preview.incluidos.length === 0 && preview.excluidos.length > 0
          ? 'excluidos'
          : 'incluidos';
      this.tabActiva.set(tabSugerida);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible generar la vista previa.';
      this.error.set(mensaje);
    } finally {
      this.cargandoPreview.set(false);
    }
  }

  /**
   * Paso 2 → confirmar: persiste la nómina vía F05 con el `fingerprint`
   * emitido por F04. Si el universo cambió (40001 en BD), se vuelve al
   * paso de configuración para que el usuario regenere el preview.
   */
  async confirmar(): Promise<void> {
    const preview = this.preview();
    if (!preview || !this.puedeConfirmar()) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      const resultado: ConfirmarCreacionResultado = await this.servicio.confirmarCreacion({
        periodo: this.periodo(),
        tipo: this.tipo(),
        fingerprint: preview.fingerprint,
      });
      const resumenes = await this.servicio.listarResumenes();
      const resumen = resumenes.find(
        (r) => r.id === resultado.idNominaPeriodo
          || (r.periodo === this.periodo() && r.tipo === this.tipo()),
      );
      if (!resumen) {
        throw new Error('No fue posible recuperar la nómina recién creada.');
      }
      this.creada.emit({
        resumen,
        siguientePaso: resultado.siguientePaso,
        totalTrabajadoresIniciales: resultado.totalTrabajadores,
        reutilizada: resultado.reutilizada,
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible crear la nómina.';
      this.error.set(mensaje);
      if (/40001|cambió|cambio/i.test(mensaje)) {
        this.volverAConfiguracion();
      }
    } finally {
      this.guardando.set(false);
    }
  }
}
