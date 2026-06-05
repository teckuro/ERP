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

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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
export class NominaMensualV2PasoDotacionComponent {
  private readonly servicio = inject(NominaPeriodoService);

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
    this.trabajadorSeleccionado.set(trabajadorId);
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

  emitirVolver(): void {
    this.volverParametros.emit();
  }
}
