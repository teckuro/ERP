/**
 * Paso Dotación — F3 fusion (F3e-2).
 *
 * Unifica los antiguos pasos "Alcance" y "Empleados" en una sola grilla operativa
 * sobre la nómina identificada por `nominaPeriodoId`. Se apoya en:
 *
 * - `NominaPeriodoService.filtrarDotacion` para listar trabajadores (paginación cliente).
 * - `NominaPeriodoService.previsualizarAccionMasiva` para validar acciones masivas.
 * - `NominaPeriodoService.obtenerDetalleTrabajador` para el panel lateral.
 *
 * La grilla actual es HTML/CSS — no integra `app-data-grid` aún. La integración con
 * el data-grid productivo y la administración de segmentos se completan en una
 * iteración posterior (declarado en `peticiones-estilos.md`).
 */

import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import type {
  DetalleTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import {
  calcularStatsDotacion,
  etiquetaEstadoDotacion,
  hayFiltrosActivos,
  listaEstadosDotacion,
} from '../../../../presenters/nomina-dotacion-grid.presenter';
import { puedeAvanzarDotacion } from '../../../../rules/nomina-dotacion.rules';
import type { PreviewAccionMasivaTrabajadores } from '../../../../../nomina-mensual/models/movimiento-nomina.models';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';

interface VistaDotacion {
  filas: FilaTrabajadorNominaResumen[];
  total: number;
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-dotacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nomina-mensual-v2-paso-dotacion.component.html',
  styleUrl: './nomina-mensual-v2-paso-dotacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoDotacionComponent implements PasoNominaPort {
  private readonly servicio = inject(NominaPeriodoService);
  private readonly doc = inject(DOCUMENT);

  @ViewChild('detalleAside') private detalleAsideRef?: ElementRef<HTMLElement>;
  private elementoOrigenDetalle: HTMLElement | null = null;

  readonly nominaPeriodoId = input<string | null>(null);
  readonly avanceSolicitado = output<void>();
  readonly volverParametros = output<void>();

  readonly loading = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly vista = signal<VistaDotacion>({ filas: [], total: 0 });
  readonly filtro = signal<FiltroRapidoDotacion>({});
  readonly busquedaInput = signal('');
  readonly seleccion = signal<Set<string>>(new Set());
  readonly trabajadorSeleccionado = signal<string | null>(null);
  readonly detalleTrabajador = signal<DetalleTrabajadorNomina | null>(null);
  readonly detalleTrabajadorIdentidad = signal<{ nombre: string; rut: string } | null>(null);
  readonly detalleLoading = signal(false);
  readonly confirmando = signal(false);
  readonly pagina = signal(1);
  readonly pageSize = 50;
  readonly previewMasivo = signal<PreviewAccionMasivaTrabajadores | null>(null);
  readonly aplicandoMasiva = signal(false);

  readonly estadosDisponibles = listaEstadosDotacion();

  readonly stats = computed(() => calcularStatsDotacion(this.vista().filas));
  readonly hayFiltros = computed(() => hayFiltrosActivos(this.filtro()));
  readonly evaluacionAvance = computed(() => puedeAvanzarDotacion(this.vista().filas));
  readonly puedeAvanzar = computed(() => this.evaluacionAvance().puede);
  readonly motivoBloqueo = computed(() => this.evaluacionAvance().motivo ?? null);
  readonly totalSeleccionados = computed(() => this.seleccion().size);
  readonly puedeAplicarMasiva = computed(() => this.totalSeleccionados() > 0);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.vista().total / this.pageSize)));

  etiquetaEstado = etiquetaEstadoDotacion;

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar();
    });
  }

  async cargar(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) {
      this.vista.set({ filas: [], total: 0 });
      return;
    }
    this.loading.set(true);
    this.errorMensaje.set(null);
    try {
      const filtroActual: FiltroRapidoDotacion = {
        ...this.filtro(),
        busqueda: this.busquedaInput().trim() || undefined,
      };
      const { filas, total } = await this.servicio.filtrarDotacion(id, filtroActual, {
        page: this.pagina(),
        pageSize: this.pageSize,
        total: 0,
      });
      this.vista.set({ filas, total });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.errorMensaje.set(`No fue posible cargar la dotación: ${mensaje}`);
      this.vista.set({ filas: [], total: 0 });
    } finally {
      this.loading.set(false);
    }
  }

  aplicarFiltroEstado(estado: FilaTrabajadorNominaResumen['estado'] | null): void {
    this.pagina.set(1);
    this.filtro.update((actual) => ({ ...actual, estado: estado ?? undefined }));
    void this.cargar();
  }

  cambiarFiltroIncidencias(value: 'todas' | 'con' | 'sin'): void {
    this.pagina.set(1);
    this.filtro.update((actual) => ({
      ...actual,
      conIncidencias: value === 'todas' ? undefined : value === 'con',
    }));
    void this.cargar();
  }

  cambiarFiltroMovimientos(value: 'todas' | 'con' | 'sin'): void {
    this.pagina.set(1);
    this.filtro.update((actual) => ({
      ...actual,
      conMovimientos: value === 'todas' ? undefined : value === 'con',
    }));
    void this.cargar();
  }

  limpiarFiltros(): void {
    this.pagina.set(1);
    this.filtro.set({});
    this.busquedaInput.set('');
    void this.cargar();
  }

  buscar(): void {
    this.pagina.set(1);
    void this.cargar();
  }

  paginaAnterior(): void {
    if (this.pagina() <= 1) return;
    this.pagina.update((pagina) => pagina - 1);
    this.limpiarSeleccion();
    void this.cargar();
  }

  paginaSiguiente(): void {
    if (this.pagina() >= this.totalPaginas()) return;
    this.pagina.update((pagina) => pagina + 1);
    this.limpiarSeleccion();
    void this.cargar();
  }

  toggleSeleccion(trabajadorId: string): void {
    this.seleccion.update((actual) => {
      const proximo = new Set(actual);
      if (proximo.has(trabajadorId)) proximo.delete(trabajadorId);
      else proximo.add(trabajadorId);
      return proximo;
    });
  }

  seleccionarTodos(): void {
    const ids = this.vista().filas.map((f) => f.trabajadorId);
    this.seleccion.set(new Set(ids));
  }

  limpiarSeleccion(): void {
    this.seleccion.set(new Set());
  }

  async previsualizarExclusion(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || this.seleccion().size === 0) return;
    this.errorMensaje.set(null);
    try {
      this.previewMasivo.set(await this.servicio.previsualizarAccionMasiva(
        id,
        [...this.seleccion()],
        { tipo: 'excluir-nomina' },
      ));
    } catch (error) {
      this.errorMensaje.set(error instanceof Error ? error.message : 'No fue posible previsualizar la acción.');
    }
  }

  async confirmarAccionMasiva(): Promise<void> {
    const id = this.nominaPeriodoId();
    const preview = this.previewMasivo();
    if (!id || !preview?.puedeAplicar) return;
    this.aplicandoMasiva.set(true);
    this.errorMensaje.set(null);
    try {
      await this.servicio.aplicarAccionMasiva(id, [...this.seleccion()], preview.accion);
      this.previewMasivo.set(null);
      this.limpiarSeleccion();
      await this.cargar();
    } catch (error) {
      this.errorMensaje.set(error instanceof Error ? error.message : 'No fue posible aplicar la acción.');
    } finally {
      this.aplicandoMasiva.set(false);
    }
  }

  async abrirDetalle(trabajadorId: string): Promise<void> {
    this.elementoOrigenDetalle = this.doc.activeElement as HTMLElement | null;
    this.trabajadorSeleccionado.set(trabajadorId);
    const fila = this.vista().filas.find((f) => f.trabajadorId === trabajadorId);
    this.detalleTrabajadorIdentidad.set(
      fila ? { nombre: fila.nombre, rut: fila.rut } : null,
    );
    // Tras el render del aside, mover el foco a su contenedor (tabindex=-1)
    queueMicrotask(() => this.detalleAsideRef?.nativeElement?.focus());

    const id = this.nominaPeriodoId();
    if (!id) return;
    this.detalleLoading.set(true);
    try {
      const detalle = await this.servicio.obtenerDetalleTrabajador(id, trabajadorId);
      this.detalleTrabajador.set(detalle);
    } catch (error) {
      console.error('[Dotación] No fue posible cargar el detalle', error);
      this.detalleTrabajador.set(null);
    } finally {
      this.detalleLoading.set(false);
    }
  }

  cerrarDetalle(): void {
    this.trabajadorSeleccionado.set(null);
    this.detalleTrabajador.set(null);
    this.detalleTrabajadorIdentidad.set(null);
    const origen = this.elementoOrigenDetalle;
    this.elementoOrigenDetalle = null;
    if (origen && typeof origen.focus === 'function') {
      queueMicrotask(() => origen.focus());
    }
  }

  async emitirAvance(): Promise<void> {
    if (!this.puedeAvanzar()) return;
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.confirmando.set(true);
    this.errorMensaje.set(null);
    try {
      await this.servicio.confirmarDotacion(id);
      this.avanceSolicitado.emit();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.errorMensaje.set(`No fue posible confirmar la dotación: ${mensaje}`);
    } finally {
      this.confirmando.set(false);
    }
  }

  /**
   * Comando único de avance (AG-NAV-03). Paso terminal: confirma la dotación y
   * pide al container navegar. No emite el output `avanceSolicitado` (eso lo
   * decide el container con el resultado).
   */
  async avanzar(): Promise<ResultadoAvancePaso> {
    if (this.loading()) {
      return { ok: false, razon: 'Cargando la dotación.' };
    }
    if (this.confirmando()) {
      return { ok: false, razon: 'Confirmación en curso.' };
    }
    if (!this.puedeAvanzar()) {
      return {
        ok: false,
        razon: this.motivoBloqueo() ?? 'Hay incidencias por resolver en la dotación.',
      };
    }
    const id = this.nominaPeriodoId();
    if (!id) {
      return { ok: false, razon: 'No hay una nómina activa.' };
    }
    this.confirmando.set(true);
    this.errorMensaje.set(null);
    try {
      await this.servicio.confirmarDotacion(id);
      return { ok: true };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.errorMensaje.set(`No fue posible confirmar la dotación: ${mensaje}`);
      return { ok: false, razon: `No fue posible confirmar la dotación: ${mensaje}` };
    } finally {
      this.confirmando.set(false);
    }
  }

  emitirVolver(): void {
    this.volverParametros.emit();
  }
}
