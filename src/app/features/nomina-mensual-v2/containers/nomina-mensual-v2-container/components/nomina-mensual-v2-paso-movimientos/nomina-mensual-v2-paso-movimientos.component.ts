/**
 * Paso Movimientos — Unificación de los 3 tabs (Configurados / Manuales / Omitidos)
 * en una sola grilla por trabajador con detalle expandible.
 *
 * Principio rector de la feature: "trabajo por excepción · el usuario NO
 * revisa todos los trabajadores". Por eso la fila principal agrega por
 * trabajador (subtotales $ haberes / $ descuentos + contadores ausencias /
 * informativos) y los conceptos quedan en el expandible.
 *
 * Idempotencia: `NominaPeriodoService.aplicarRecurrentesANomina` (y su
 * variante por trabajador) respetan la clave (nómina, persona, recurrente,
 * tipo) y NO reaplican omitidos.
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
import { LucideAngularModule } from 'lucide-angular';
import { X as XIcon } from 'lucide-angular/src/icons';

import type {
  FilaTrabajadorMovimientos,
  ItemMovimientoTrabajador,
  MovimientoCategoria,
  MovimientoTipo,
} from '../../../../../nomina-mensual/models/movimiento-nomina.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import type { FilaTrabajadorNominaResumen } from '../../../../../nomina-mensual/models/nomina-periodo.models';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import {
  DataGridCellDirective,
  DataGridComponent,
  DataGridRowDetailDirective,
} from '../../../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import {
  calcularStatsMovimientosPorTrabajador,
  COLUMNAS_MOVIMIENTOS_POR_TRABAJADOR,
  etiquetaEstadoItem,
  etiquetaOrigenItem,
  FILTROS_MOVIMIENTOS_POR_TRABAJADOR,
  itemAdmiteEliminacion,
  PERSISTENCIA_GRILLA_MOVIMIENTOS_POR_TRABAJADOR,
  type StatsMovimientosPorTrabajador,
} from '../../../../presenters/nomina-movimientos-por-trabajador.presenter';

interface BorradorManual {
  trabajadorId: string;
  tipo: MovimientoTipo;
  categoria: MovimientoCategoria;
  monto?: number;
  glosa?: string;
}

const BORRADOR_MANUAL_INICIAL: BorradorManual = {
  trabajadorId: '',
  tipo: 'haber-extra',
  categoria: 'haber',
};

@Component({
  selector: 'app-nomina-mensual-v2-paso-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataGridComponent,
    DataGridCellDirective,
    DataGridRowDetailDirective,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    LucideAngularModule,
  ],
  templateUrl: './nomina-mensual-v2-paso-movimientos.component.html',
  styleUrl: './nomina-mensual-v2-paso-movimientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2PasoMovimientosComponent implements PasoNominaPort {
  readonly closeIcon = XIcon;

  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly avanceSolicitado = output<void>();
  readonly volverDotacion = output<void>();

  readonly loading = signal(false);
  /** Hay una acción de cambio masivo en curso (cargar pendientes globales). */
  readonly aplicando = signal(false);
  /** Hay una acción de cambio en curso para un trabajador o item específico. */
  readonly trabajos = signal<Set<string>>(new Set());
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  /** Filas agrupadas por trabajador (vista unificada). */
  readonly filasTrabajadores = signal<FilaTrabajadorMovimientos[]>([]);
  /** Trabajadores de la dotación (alimenta el modal manual). */
  readonly trabajadores = signal<FilaTrabajadorNominaResumen[]>([]);
  /** Búsqueda incremental del search del modal manual. */
  readonly busquedaTrabajador = signal('');
  readonly buscandoTrabajadores = signal(false);
  private secuenciaBusquedaTrabajador = 0;

  /** Modal manual. */
  readonly modalManualAbierto = signal(false);
  readonly borradorManual = signal<BorradorManual>({ ...BORRADOR_MANUAL_INICIAL });
  /**
   * Ficha del trabajador con el que se abrió el modal desde una fila. Cuando
   * está presente la UI muestra una ficha fija (nombre + RUT + cargo) en
   * lugar del buscador + select, evitando que el usuario re-busque al
   * trabajador del que viene clickeando. `null` cuando el modal se abre desde
   * el CTA global (sin contexto).
   */
  readonly trabajadorPreseleccionadoModal = signal<{
    trabajadorId: string;
    nombre: string;
    rut: string;
    cargo?: string;
    centroCosto?: string;
  } | null>(null);

  // -- Presenter / grilla unificada -----------------------------------------

  readonly columnasGrilla = COLUMNAS_MOVIMIENTOS_POR_TRABAJADOR;
  readonly filtrosGrilla = computed(() =>
    FILTROS_MOVIMIENTOS_POR_TRABAJADOR(this.filasTrabajadores()),
  );
  readonly persistenciaGrilla = PERSISTENCIA_GRILLA_MOVIMIENTOS_POR_TRABAJADOR;
  readonly statsGlobales = computed<StatsMovimientosPorTrabajador>(() =>
    calcularStatsMovimientosPorTrabajador(this.filasTrabajadores()),
  );

  /** TrackBy estable por trabajador. */
  readonly rowKeyTrabajador = (fila: FilaTrabajadorMovimientos): string => fila.trabajadorId;
  readonly trackByTrabajador = (
    _index: number,
    fila: FilaTrabajadorMovimientos,
  ): string => fila.trabajadorId;
  /** TrackBy para items dentro del expandible. */
  readonly trackByItem = (_i: number, item: ItemMovimientoTrabajador): string => item.itemId;

  readonly etiquetaEstadoItem = etiquetaEstadoItem;
  readonly etiquetaOrigenItem = etiquetaOrigenItem;
  readonly itemAdmiteEliminacion = itemAdmiteEliminacion;

  /** Hay al menos un pendiente global → CTA "Cargar pendientes" habilitado. */
  readonly hayPendientesGlobales = computed(() => this.statsGlobales().totalPendientes > 0);

  /** El paso queda válido cuando hay al menos un movimiento aplicado. */
  readonly puedeAvanzar = computed(() =>
    this.filasTrabajadores().some((f) => f.cuentaAplicados > 0),
  );

  /** Identidades para fallback en mensajes (compatibilidad con specs previos). */
  private readonly identidadesTrabajador = new Map<
    string,
    { nombre: string; rut: string }
  >();

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar();
    });
  }

  private sincronizarIdentidades(filas: FilaTrabajadorNominaResumen[]): void {
    for (const fila of filas) {
      this.identidadesTrabajador.set(fila.trabajadorId, {
        nombre: fila.nombre,
        rut: fila.rut,
      });
    }
  }

  nombreTrabajador(trabajadorId: string): string {
    return this.identidadesTrabajador.get(trabajadorId)?.nombre ?? 'Trabajador sin identificar';
  }

  rutTrabajador(trabajadorId: string): string {
    return this.identidadesTrabajador.get(trabajadorId)?.rut ?? '';
  }

  async cargar(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [filas, dotacion] = await Promise.all([
        this.servicio.listarMovimientosPorTrabajador(id),
        this.servicio.filtrarDotacion(id, {}, { page: 1, pageSize: 1000, total: 0 }),
      ]);
      this.filasTrabajadores.set(filas);
      this.trabajadores.set(dotacion.filas);
      this.sincronizarIdentidades(dotacion.filas);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar los movimientos: ${mensaje}`);
    } finally {
      this.loading.set(false);
    }
  }

  // -- Acciones globales -----------------------------------------------------

  async cargarPendientesGlobales(): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.aplicando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    try {
      const aplicados = await this.servicio.aplicarRecurrentesANomina(id);
      const nuevos = aplicados.filter((m) => m.estado === 'aplicado').length;
      this.mensaje.set(
        nuevos === 0
          ? 'No había pendientes por cargar.'
          : `Se cargaron ${nuevos} movimientos a la nómina.`,
      );
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar los pendientes: ${mensaje}`);
    } finally {
      this.aplicando.set(false);
    }
  }

  // -- Acciones por trabajador (acción masiva por fila) ----------------------

  async cargarPendientesDeTrabajador(trabajadorId: string): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    this.marcarTrabajoActivo(`tr:${trabajadorId}`);
    this.error.set(null);
    this.mensaje.set(null);
    try {
      const aplicados = await this.servicio.aplicarRecurrentesDeTrabajador(id, trabajadorId);
      this.mensaje.set(
        aplicados.length === 0
          ? 'No había pendientes para este trabajador.'
          : `Se cargaron ${aplicados.length} movimientos al trabajador.`,
      );
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar los pendientes del trabajador: ${mensaje}`);
    } finally {
      this.terminarTrabajoActivo(`tr:${trabajadorId}`);
    }
  }

  // -- Acciones por item (dentro del expandible) -----------------------------

  async cargarItem(item: ItemMovimientoTrabajador, trabajadorId: string): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;
    if (item.estado !== 'pendiente' || !item.recurrenteId) return;
    this.marcarTrabajoActivo(`item:${item.itemId}`);
    this.error.set(null);
    try {
      await this.servicio.aplicarRecurrenteIndividual(id, trabajadorId, item.recurrenteId);
      this.mensaje.set('Movimiento cargado a la nómina.');
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible cargar el movimiento: ${mensaje}`);
    } finally {
      this.terminarTrabajoActivo(`item:${item.itemId}`);
    }
  }

  async omitirItem(item: ItemMovimientoTrabajador): Promise<void> {
    if (!item.movimientoNominaId) return;
    this.marcarTrabajoActivo(`item:${item.itemId}`);
    this.error.set(null);
    try {
      await this.servicio.omitirMovimiento(item.movimientoNominaId);
      this.mensaje.set('Movimiento omitido este mes.');
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible omitir el movimiento: ${mensaje}`);
    } finally {
      this.terminarTrabajoActivo(`item:${item.itemId}`);
    }
  }

  async reaplicarItem(item: ItemMovimientoTrabajador): Promise<void> {
    if (!item.movimientoNominaId) return;
    this.marcarTrabajoActivo(`item:${item.itemId}`);
    this.error.set(null);
    try {
      await this.servicio.aplicarMovimiento(item.movimientoNominaId);
      this.mensaje.set('Movimiento reaplicado.');
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible reaplicar el movimiento: ${mensaje}`);
    } finally {
      this.terminarTrabajoActivo(`item:${item.itemId}`);
    }
  }

  async eliminarItemManual(item: ItemMovimientoTrabajador): Promise<void> {
    if (!item.movimientoNominaId || !this.itemAdmiteEliminacion(item)) return;
    this.marcarTrabajoActivo(`item:${item.itemId}`);
    this.error.set(null);
    try {
      await this.servicio.eliminarMovimientoManual(item.movimientoNominaId);
      this.mensaje.set('Movimiento manual eliminado.');
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible eliminar el movimiento: ${mensaje}`);
    } finally {
      this.terminarTrabajoActivo(`item:${item.itemId}`);
    }
  }

  // -- Estado "trabajos en curso" -------------------------------------------

  estaTrabajando(claveTrabajo: string): boolean {
    return this.trabajos().has(claveTrabajo);
  }

  estaCargandoTrabajador(trabajadorId: string): boolean {
    return this.estaTrabajando(`tr:${trabajadorId}`);
  }

  estaCargandoItem(item: ItemMovimientoTrabajador): boolean {
    return this.estaTrabajando(`item:${item.itemId}`);
  }

  private marcarTrabajoActivo(clave: string): void {
    this.trabajos.update((s) => {
      const nuevo = new Set(s);
      nuevo.add(clave);
      return nuevo;
    });
  }

  private terminarTrabajoActivo(clave: string): void {
    this.trabajos.update((s) => {
      if (!s.has(clave)) return s;
      const nuevo = new Set(s);
      nuevo.delete(clave);
      return nuevo;
    });
  }

  // -- Banners (app-message-box) ---------------------------------------------

  descartarError(): void {
    this.error.set(null);
  }

  descartarMensaje(): void {
    this.mensaje.set(null);
  }

  // -- Modal manual ----------------------------------------------------------

  abrirModalManual(trabajadorIdPreseleccionado?: string): void {
    this.borradorManual.set({
      ...BORRADOR_MANUAL_INICIAL,
      trabajadorId: trabajadorIdPreseleccionado ?? '',
    });
    if (trabajadorIdPreseleccionado) {
      const ficha = this.resolverFichaTrabajador(trabajadorIdPreseleccionado);
      this.trabajadorPreseleccionadoModal.set(ficha);
    } else {
      this.trabajadorPreseleccionadoModal.set(null);
    }
    this.error.set(null);
    this.modalManualAbierto.set(true);
  }

  cerrarModalManual(): void {
    this.modalManualAbierto.set(false);
    this.busquedaTrabajador.set('');
    this.trabajadorPreseleccionadoModal.set(null);
  }

  private resolverFichaTrabajador(trabajadorId: string): {
    trabajadorId: string;
    nombre: string;
    rut: string;
    cargo?: string;
    centroCosto?: string;
  } {
    const dotacion = this.trabajadores().find((t) => t.trabajadorId === trabajadorId);
    if (dotacion) {
      return {
        trabajadorId,
        nombre: dotacion.nombre,
        rut: dotacion.rut,
        cargo: dotacion.cargo,
        centroCosto: dotacion.centroCosto,
      };
    }
    const filaGrilla = this.filasTrabajadores().find((f) => f.trabajadorId === trabajadorId);
    if (filaGrilla) {
      return {
        trabajadorId,
        nombre: filaGrilla.nombre,
        rut: filaGrilla.rut,
        cargo: filaGrilla.cargo,
        centroCosto: filaGrilla.centroCosto,
      };
    }
    return {
      trabajadorId,
      nombre: this.nombreTrabajador(trabajadorId),
      rut: this.rutTrabajador(trabajadorId),
    };
  }

  async crearMovimientoManual(): Promise<void> {
    const id = this.nominaPeriodoId();
    const borrador = this.borradorManual();
    if (!id || !borrador.trabajadorId) return;
    this.aplicando.set(true);
    this.error.set(null);
    try {
      await this.servicio.agregarMovimientoManual({
        nominaPeriodoId: id,
        trabajadorId: borrador.trabajadorId,
        tipo: borrador.tipo,
        categoria: borrador.categoria,
        monto: borrador.monto,
        estado: 'aplicado',
        glosa: borrador.glosa,
      });
      this.mensaje.set('Movimiento manual agregado.');
      this.cerrarModalManual();
      await this.cargar();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.error.set(`No fue posible agregar el movimiento: ${mensaje}`);
    } finally {
      this.aplicando.set(false);
    }
  }

  actualizarTrabajadorManual(valor: string): void {
    this.borradorManual.update((b) => ({ ...b, trabajadorId: valor.trim() }));
  }

  async buscarTrabajadores(valor: string): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) return;

    const busqueda = valor.trim();
    const secuencia = ++this.secuenciaBusquedaTrabajador;
    this.busquedaTrabajador.set(valor);
    this.buscandoTrabajadores.set(true);
    try {
      const pagina = await this.servicio.filtrarDotacion(
        id,
        busqueda ? { busqueda } : {},
        { page: 1, pageSize: 50, total: 0 },
      );
      if (secuencia === this.secuenciaBusquedaTrabajador) {
        this.trabajadores.set(pagina.filas);
        this.sincronizarIdentidades(pagina.filas);
      }
    } catch (error) {
      if (secuencia === this.secuenciaBusquedaTrabajador) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        this.error.set(`No fue posible buscar trabajadores: ${mensaje}`);
      }
    } finally {
      if (secuencia === this.secuenciaBusquedaTrabajador) {
        this.buscandoTrabajadores.set(false);
      }
    }
  }

  actualizarTipoManual(valor: MovimientoTipo): void {
    this.borradorManual.update((b) => ({ ...b, tipo: valor }));
  }

  actualizarCategoriaManual(valor: MovimientoCategoria): void {
    this.borradorManual.update((b) => ({ ...b, categoria: valor }));
  }

  actualizarMontoManual(valor: number | null): void {
    this.borradorManual.update((b) => ({ ...b, monto: valor ?? undefined }));
  }

  actualizarGlosaManual(valor: string): void {
    this.borradorManual.update((b) => ({ ...b, glosa: valor.trim() || undefined }));
  }

  // -- Navegación ------------------------------------------------------------

  emitirAvance(): void {
    this.avanceSolicitado.emit();
  }

  puedeContinuar(): ResultadoAvancePaso {
    if (this.loading()) {
      return { ok: false, razon: 'Cargando los movimientos.' };
    }
    if (this.aplicando()) {
      return { ok: false, razon: 'Hay movimientos aplicándose.' };
    }
    if (!this.puedeAvanzar()) {
      return {
        ok: false,
        razon: 'Carga al menos un movimiento configurado o agrega uno manual antes de continuar.',
      };
    }
    return { ok: true };
  }

  async avanzar(): Promise<ResultadoAvancePaso> {
    return this.puedeContinuar();
  }

  emitirVolver(): void {
    this.volverDotacion.emit();
  }
}
