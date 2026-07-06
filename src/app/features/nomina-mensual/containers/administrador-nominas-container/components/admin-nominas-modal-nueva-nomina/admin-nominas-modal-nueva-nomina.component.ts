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

import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { EmpresaActivaService } from '../../../../../../core/services/empresa-activa.service';
import { NominaFeatureGatesService } from '../../../../services/nomina-feature-gates.service';
import { NominaPlantillaCicloService } from '../../../../services/nomina-plantilla-ciclo.service';
import { NominaPeriodoService } from '../../../../services/nomina-periodo.service';
import type { PreviewCorte } from '../../../../models/nomina-plantilla-ciclo.models';
import type { NominaPeriodoResumen, TipoNomina } from '../../../../models/nomina-periodo.models';
import {
  opcionesTipoNominaCreacion,
  tipoNominaRequiereCorte,
} from '../../../../rules/nomina-tipos-creacion.rules';
import type {
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  SiguientePasoCreacion,
  TrabajadorExcluidoPreview,
  TrabajadorIncluidoPreview,
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
  imports: [CommonModule, FormsModule, LucideAngularModule, MessageBoxComponent],
  templateUrl: './admin-nominas-modal-nueva-nomina.component.html',
  styleUrl: './admin-nominas-modal-nueva-nomina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminNominasModalNuevaNominaComponent {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly empresaActiva = inject(EmpresaActivaService);
  private readonly featureGates = inject(NominaFeatureGatesService);
  private readonly plantillas = inject(NominaPlantillaCicloService);

  readonly empresasDisponibles = input<readonly NominaPeriodoResumen[]>([]);
  /** Período sugerido desde el shell (selector global), si está disponible. */
  readonly periodoInicial = input<string | null>(null);
  readonly creada = output<NominaCreadaEvento>();
  readonly cerrar = output<void>();

  readonly tiposNomina = computed(() => opcionesTipoNominaCreacion(this.featureGates.gates()));
  readonly mostrarSelectorTipo = computed(() => this.tiposNomina().length > 1);

  readonly periodo = signal(periodoActual());
  readonly empresaId = signal('');
  readonly tipo = signal<TipoNomina>('mensual');
  readonly codigoCiclo = signal('');
  readonly cortesDisponibles = signal<readonly PreviewCorte[]>([]);
  readonly cargandoCortes = signal(false);
  readonly paso = signal<PasoWizard>('configuracion');
  readonly tabActiva = signal<TabPreview>('incluidos');
  readonly cargandoPreview = signal(false);
  readonly preview = signal<NominaCreatePreview | null>(null);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  /** BKL-10: filas paginadas de la pestaña activa (incluidos/excluidos). */
  readonly filasPreviewPagina = signal<
    readonly (TrabajadorIncluidoPreview | TrabajadorExcluidoPreview)[]
  >([]);
  readonly totalPreviewTab = signal(0);
  readonly paginaPreview = signal(1);
  readonly pageSizePreview = signal(50);
  readonly cargandoTabPreview = signal(false);

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

  readonly puedeAvanzarPreview = computed(() => {
    if (this.cargandoPreview() || !this.periodoEsValido() || this.empresaId().length === 0) {
      return false;
    }
    if (tipoNominaRequiereCorte(this.tipo()) && !this.codigoCiclo().trim()) {
      return false;
    }
    if (tipoNominaRequiereCorte(this.tipo()) && this.cargandoCortes()) {
      return false;
    }
    return true;
  });

  readonly etiquetaTipoSeleccionado = computed(() => {
    const actual = this.tiposNomina().find((t) => t.id === this.tipo());
    return actual?.label ?? 'Mensual';
  });

  readonly descripcionTipoSeleccionado = computed(() => {
    const actual = this.tiposNomina().find((t) => t.id === this.tipo());
    return actual?.descripcion ?? '';
  });

  readonly requiereCorte = computed(() => tipoNominaRequiereCorte(this.tipo()));

  readonly puedeConfirmar = computed(() => {
    const p = this.preview();
    return !this.guardando() && p !== null && p.puedeCrear;
  });

  /** Compat hacia atrás: tests previos consultan `puedeCrear()`. */
  readonly puedeCrear = computed(() => this.puedeAvanzarPreview());

  readonly filasTabActiva = computed(() => {
    const p = this.preview();
    if (!p) return [];
    if (this.tabActiva() === 'conflictos') return p.conflictos;
    return this.filasPreviewPagina();
  });

  readonly totalPaginasPreview = computed(() => {
    const total = this.totalPreviewTab();
    const size = this.pageSizePreview();
    return total > 0 ? Math.ceil(total / size) : 1;
  });

  readonly rangoPreviewVisible = computed(() => {
    const total = this.totalPreviewTab();
    if (total === 0) return '0';
    const inicio = (this.paginaPreview() - 1) * this.pageSizePreview() + 1;
    const fin = Math.min(this.paginaPreview() * this.pageSizePreview(), total);
    return `${inicio}–${fin} de ${total}`;
  });

  readonly tabUsaPaginacion = computed(() => {
    const tab = this.tabActiva();
    return tab === 'incluidos' || tab === 'excluidos';
  });

  constructor() {
    effect(() => {
      const inicial = this.periodoInicial();
      if (inicial && /^\d{4}-(0[1-9]|1[0-2])$/.test(inicial)) {
        this.periodo.set(inicial);
      }
    }, { allowSignalWrites: true });

    void this.featureGates.cargar();

    const primera = this.empresas()[0];
    if (primera) {
      this.empresaId.set(primera.id);
    }
  }

  setPeriodo(valor: string): void {
    this.periodo.set(valor);
    if (this.paso() === 'preview') {
      this.volverAConfiguracion();
    } else if (this.requiereCorte()) {
      void this.cargarCortesParaTipo();
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
    this.codigoCiclo.set('');
    this.cortesDisponibles.set([]);
    if (this.paso() === 'preview') {
      this.volverAConfiguracion();
    } else if (tipoNominaRequiereCorte(valor)) {
      void this.cargarCortesParaTipo();
    }
  }

  setCodigoCiclo(valor: string): void {
    this.codigoCiclo.set(valor);
    if (this.paso() === 'preview') {
      this.volverAConfiguracion();
    }
  }

  private codigoCicloRequest(): string | null {
    if (tipoNominaRequiereCorte(this.tipo())) {
      return this.codigoCiclo().trim() || null;
    }
    return null;
  }

  private async cargarCortesParaTipo(): Promise<void> {
    const tipo = this.tipo();
    if (!tipoNominaRequiereCorte(tipo) || !this.periodoEsValido()) {
      this.cortesDisponibles.set([]);
      return;
    }
    this.cargandoCortes.set(true);
    try {
      await this.plantillas.refrescar({ soloActivas: true });
      const codigoPlantilla = tipo === 'quincenal' ? 'QUIN' : 'SEM';
      const plantilla = this.plantillas.plantillasActivas().find(
        (p) => p.tipo === tipo && p.codigo === codigoPlantilla,
      ) ?? this.plantillas.plantillasActivas().find((p) => p.tipo === tipo);
      if (!plantilla) {
        this.cortesDisponibles.set([]);
        return;
      }
      const anio = Number(this.periodo().slice(0, 4));
      const cortes = await this.plantillas.previsualizarCortes(plantilla.id, anio);
      const mes = this.periodo();
      this.cortesDisponibles.set(
        cortes.filter((c) => c.codigoCiclo.startsWith(mes) || c.fechaInicio.startsWith(mes)),
      );
      if (this.cortesDisponibles().length === 1) {
        this.codigoCiclo.set(this.cortesDisponibles()[0].codigoCiclo);
      }
    } catch {
      this.cortesDisponibles.set([]);
    } finally {
      this.cargandoCortes.set(false);
    }
  }

  setTab(valor: TabPreview): void {
    this.tabActiva.set(valor);
    this.paginaPreview.set(1);
    if (valor === 'incluidos' || valor === 'excluidos') {
      void this.cargarPaginaPreview();
    } else {
      this.filasPreviewPagina.set([]);
      this.totalPreviewTab.set(0);
    }
  }

  volverAConfiguracion(): void {
    this.paso.set('configuracion');
    this.preview.set(null);
    this.filasPreviewPagina.set([]);
    this.totalPreviewTab.set(0);
    this.paginaPreview.set(1);
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
        codigoCiclo: this.codigoCicloRequest(),
      });
      this.preview.set(preview);
      this.paso.set('preview');
      const tabSugerida: TabPreview = preview.totales.conflictos > 0
        ? 'conflictos'
        : preview.totales.incluidos === 0 && preview.totales.excluidos > 0
          ? 'excluidos'
          : 'incluidos';
      this.tabActiva.set(tabSugerida);
      this.paginaPreview.set(1);
      if (tabSugerida === 'incluidos' || tabSugerida === 'excluidos') {
        await this.cargarPaginaPreview();
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible generar la vista previa.';
      this.error.set(mensaje);
    } finally {
      this.cargandoPreview.set(false);
    }
  }

  irPaginaPreviewAnterior(): void {
    if (this.paginaPreview() <= 1 || this.cargandoTabPreview()) return;
    this.paginaPreview.update((p) => p - 1);
    void this.cargarPaginaPreview();
  }

  irPaginaPreviewSiguiente(): void {
    if (this.paginaPreview() >= this.totalPaginasPreview() || this.cargandoTabPreview()) return;
    this.paginaPreview.update((p) => p + 1);
    void this.cargarPaginaPreview();
  }

  private async cargarPaginaPreview(): Promise<void> {
    const tab = this.tabActiva();
    if (tab !== 'incluidos' && tab !== 'excluidos') return;
    this.cargandoTabPreview.set(true);
    try {
      const pagina = await this.servicio.listarPreviewCreacionTrabajadores(
        this.periodo(),
        this.tipo(),
        tab,
        {
          page: this.paginaPreview(),
          pageSize: this.pageSizePreview(),
          total: 0,
        },
        undefined,
        this.codigoCicloRequest(),
      );
      this.filasPreviewPagina.set(pagina.filas);
      this.totalPreviewTab.set(pagina.total);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible cargar la lista.';
      this.error.set(mensaje);
    } finally {
      this.cargandoTabPreview.set(false);
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
        codigoCiclo: preview.codigoCiclo ?? this.codigoCicloRequest(),
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
