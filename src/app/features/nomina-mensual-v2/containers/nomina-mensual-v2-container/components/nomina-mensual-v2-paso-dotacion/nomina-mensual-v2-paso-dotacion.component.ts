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

import {
  DataGridCellDirective,
  DataGridComponent,
  type DataGridBulkActionEvent,
  type DataGridBulkActionOption,
} from '../../../../../../shared/components/ui/data-grid';
import type {
  DetalleTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import {
  COLUMNAS_DOTACION,
  FILTROS_DOTACION,
  PERSISTENCIA_GRILLA_DOTACION,
  calcularStatsDotacion,
  etiquetaEstadoDotacion,
} from '../../../../presenters/nomina-dotacion-grid.presenter';
import { puedeAvanzarDotacion } from '../../../../rules/nomina-dotacion.rules';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2ModalIncluirTrabajadoresComponent } from '../nomina-mensual-v2-modal-incluir-trabajadores/nomina-mensual-v2-modal-incluir-trabajadores.component';

interface VistaDotacion {
  filas: FilaTrabajadorNominaResumen[];
  total: number;
}

@Component({
  selector: 'app-nomina-mensual-v2-paso-dotacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataGridComponent,
    DataGridCellDirective,
    NominaMensualV2ModalIncluirTrabajadoresComponent,
  ],
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
  readonly trabajadorDetalleInicial = input<string | null>(null);
  readonly avanceSolicitado = output<void>();
  readonly volverParametros = output<void>();
  readonly detalleInicialConsumido = output<void>();

  readonly loading = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly vista = signal<VistaDotacion>({ filas: [], total: 0 });
  readonly filtro = signal<FiltroRapidoDotacion>({});
  readonly trabajadorSeleccionado = signal<string | null>(null);
  readonly detalleTrabajador = signal<DetalleTrabajadorNomina | null>(null);
  readonly detalleTrabajadorIdentidad = signal<{ nombre: string; rut: string } | null>(null);
  readonly detalleLoading = signal(false);
  readonly confirmando = signal(false);
  readonly pagina = signal(1);
  readonly pageSize = 200;
  readonly aplicandoMasiva = signal(false);
  readonly pickerAbierto = signal(false);
  readonly aplicandoInclusion = signal(false);

  readonly columnas = COLUMNAS_DOTACION;
  readonly persistenceKey = PERSISTENCIA_GRILLA_DOTACION;
  readonly accionesMasivas: DataGridBulkActionOption[] = [
    {
      id: 'excluir-nomina',
      label: 'Excluir de la nómina',
      tone: 'warning',
      confirmLabel: 'Excluir seleccionados',
      confirmTitle: 'Excluir trabajadores',
      confirmMessage:
        'Los trabajadores seleccionados quedarán fuera del cálculo y se moverán fuera del segmento.',
    },
  ];

  readonly stats = computed(() => calcularStatsDotacion(this.vista().filas));
  readonly filtros = computed(() => FILTROS_DOTACION(this.vista().filas));
  readonly evaluacionAvance = computed(() => puedeAvanzarDotacion(this.vista().filas));
  readonly puedeAvanzar = computed(() => this.evaluacionAvance().puede);
  readonly motivoBloqueo = computed(() => this.evaluacionAvance().motivo ?? null);
  readonly idsActualesEnNomina = computed(() =>
    this.vista().filas.map((fila) => fila.trabajadorId),
  );
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.vista().total / this.pageSize)));

  etiquetaEstado = etiquetaEstadoDotacion;

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) void this.cargar();
    });
    effect(() => {
      const trabajadorId = this.trabajadorDetalleInicial();
      const id = this.nominaPeriodoId();
      if (!trabajadorId || !id || this.loading()) return;
      void this.abrirDetalle(trabajadorId).then(() => this.detalleInicialConsumido.emit());
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
      // Se carga la primera página con un tamaño grande (`pageSize=200`) porque
      // la búsqueda, ordenamiento y filtros se resuelven en `app-data-grid`. Si
      // el listado supera ese tamaño, se paginará del lado servidor en una fase
      // posterior (registrar en peticiones-estilos.md).
      const { filas, total } = await this.servicio.filtrarDotacion(id, this.filtro(), {
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

  trackFila = (_index: number, fila: FilaTrabajadorNominaResumen) => fila.trabajadorId;

  async manejarAccionMasiva(
    evento: DataGridBulkActionEvent<FilaTrabajadorNominaResumen>,
  ): Promise<void> {
    if (evento.action !== 'excluir-nomina') return;
    const id = this.nominaPeriodoId();
    if (!id || evento.rows.length === 0) return;
    const ids = evento.rows.map((fila) => fila.trabajadorId);
    this.aplicandoMasiva.set(true);
    this.errorMensaje.set(null);
    try {
      const preview = await this.servicio.previsualizarAccionMasiva(id, ids, {
        tipo: 'excluir-nomina',
      });
      if (!preview.puedeAplicar) {
        const mensajes = preview.mensajes.join(' · ');
        this.errorMensaje.set(
          mensajes
            ? `La exclusión quedó bloqueada: ${mensajes}`
            : 'La exclusión está bloqueada por incidencias críticas.',
        );
        return;
      }
      await this.servicio.aplicarAccionMasiva(id, ids, preview.accion);
      await this.cargar();
    } catch (error) {
      this.errorMensaje.set(
        error instanceof Error ? error.message : 'No fue posible aplicar la acción.',
      );
    } finally {
      this.aplicandoMasiva.set(false);
    }
  }

  abrirPicker(): void {
    if (!this.nominaPeriodoId()) return;
    this.pickerAbierto.set(true);
  }

  cerrarPicker(): void {
    if (this.aplicandoInclusion()) return;
    this.pickerAbierto.set(false);
  }

  async incluirTrabajadores(trabajadorIds: string[]): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id || trabajadorIds.length === 0) {
      this.cerrarPicker();
      return;
    }
    this.aplicandoInclusion.set(true);
    this.errorMensaje.set(null);
    try {
      await this.servicio.agregarTrabajadoresANomina(id, trabajadorIds);
      this.pickerAbierto.set(false);
      await this.cargar();
    } catch (error) {
      this.errorMensaje.set(
        error instanceof Error
          ? `No fue posible incluir los trabajadores: ${error.message}`
          : 'No fue posible incluir los trabajadores.',
      );
    } finally {
      this.aplicandoInclusion.set(false);
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
   * Diagnóstico puro de "completitud" del paso. Lo consultan el CTA del shell
   * y el stepper para deshabilitarse con razón visible antes del click.
   * Refleja las mismas precondiciones que evalúa `avanzar()` antes de
   * ejecutar `confirmarDotacion`, pero sin side-effects.
   */
  puedeContinuar(): ResultadoAvancePaso {
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
    if (!this.nominaPeriodoId()) {
      return { ok: false, razon: 'No hay una nómina activa.' };
    }
    return { ok: true };
  }

  /**
   * Comando único de avance (AG-NAV-03). Paso terminal: confirma la dotación y
   * pide al container navegar. No emite el output `avanceSolicitado` (eso lo
   * decide el container con el resultado).
   */
  async avanzar(): Promise<ResultadoAvancePaso> {
    const diagnostico = this.puedeContinuar();
    if (!diagnostico.ok) return diagnostico;
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
