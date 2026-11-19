/**
 * Paso Dotación — F07 paginación servidor.
 *
 * - `NominaPeriodoService.filtrarDotacion` + `obtenerResumenDotacion` (RPC).
 * - `app-data-grid` en modo `serverSide` (50 filas/página).
 * - Conteos agregados sin cargar todas las filas.
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
  type DataGridServerQuery,
} from '../../../../../../shared/components/ui/data-grid';
import { WorkspaceLoadingComponent } from '../../../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import type {
  DetalleTrabajadorNomina,
  DotacionResumenNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import {
  COLUMNAS_DOTACION,
  FILTROS_DOTACION,
  PERSISTENCIA_GRILLA_DOTACION,
  etiquetaEstadoDotacion,
  filtroDotacionDesdeGrid,
  statsDesdeResumenDotacion,
} from '../../../../presenters/nomina-dotacion-grid.presenter';
import { puedeAvanzarDotacionResumen } from '../../../../rules/nomina-dotacion.rules';
import type {
  PasoNominaPort,
  ResultadoAvancePaso,
} from '../../facade/nomina-mensual-v2-navegacion';
import { NominaMensualV2ModalIncluirTrabajadoresComponent } from '../nomina-mensual-v2-modal-incluir-trabajadores/nomina-mensual-v2-modal-incluir-trabajadores.component';
import { PuedeEscribirDirective } from '../../../../../../core/auth/puede-escribir.directive';

interface VistaDotacion {
  filas: FilaTrabajadorNominaResumen[];
  total: number;
}

const RESUMEN_VACIO: DotacionResumenNomina = {
  total: 0,
  listos: 0,
  conAdvertencias: 0,
  conCriticos: 0,
  bloqueados: 0,
};

@Component({
  selector: 'app-nomina-mensual-v2-paso-dotacion',
  standalone: true,
  imports: [PuedeEscribirDirective, 
    CommonModule,
    FormsModule,
    DataGridComponent,
    DataGridCellDirective,
    WorkspaceLoadingComponent,
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
  readonly preparacionExterna = input(false);
  readonly detalleInicialConsumido = output<void>();

  readonly loading = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly vista = signal<VistaDotacion>({ filas: [], total: 0 });
  readonly resumen = signal<DotacionResumenNomina>(RESUMEN_VACIO);
  readonly filtro = signal<FiltroRapidoDotacion>({});
  readonly pagina = signal(1);
  readonly pageSize = signal(50);
  readonly trabajadorSeleccionado = signal<string | null>(null);
  readonly detalleTrabajador = signal<DetalleTrabajadorNomina | null>(null);
  readonly detalleTrabajadorIdentidad = signal<{ nombre: string; rut: string } | null>(null);
  readonly detalleLoading = signal(false);
  readonly confirmando = signal(false);
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

  readonly stats = computed(() => statsDesdeResumenDotacion(this.resumen()));
  readonly filtros = computed(() => FILTROS_DOTACION([]));
  readonly evaluacionAvance = computed(() => puedeAvanzarDotacionResumen(this.resumen()));
  readonly puedeAvanzar = computed(() => this.evaluacionAvance().puede);
  readonly motivoBloqueo = computed(() => this.evaluacionAvance().motivo ?? null);

  etiquetaEstado = etiquetaEstadoDotacion;

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (id) {
        this.pagina.set(1);
        this.filtro.set({});
        void this.cargar(true);
      } else {
        this.vista.set({ filas: [], total: 0 });
        this.resumen.set(RESUMEN_VACIO);
      }
    });
    effect(() => {
      const trabajadorId = this.trabajadorDetalleInicial();
      const id = this.nominaPeriodoId();
      if (!trabajadorId || !id || this.loading()) return;
      void this.abrirDetalle(trabajadorId).then(() => this.detalleInicialConsumido.emit());
    });
  }

  async cargar(refrescarResumen = false): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) {
      this.vista.set({ filas: [], total: 0 });
      this.resumen.set(RESUMEN_VACIO);
      return;
    }
    this.loading.set(true);
    this.errorMensaje.set(null);
    try {
      const paginacion = {
        page: this.pagina(),
        pageSize: this.pageSize(),
        total: 0,
      };
      const [filasResult, resumenResult] = await Promise.all([
        this.servicio.filtrarDotacion(id, this.filtro(), paginacion),
        refrescarResumen
          ? this.servicio.obtenerResumenDotacion(id)
          : Promise.resolve(this.resumen()),
      ]);
      this.vista.set(filasResult);
      if (refrescarResumen) {
        this.resumen.set(resumenResult);
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.errorMensaje.set(`No fue posible cargar la dotación: ${mensaje}`);
      this.vista.set({ filas: [], total: 0 });
      if (refrescarResumen) {
        this.resumen.set(RESUMEN_VACIO);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async manejarConsultaServidor(consulta: DataGridServerQuery): Promise<void> {
    this.pagina.set(consulta.page);
    this.pageSize.set(consulta.pageSize);
    this.filtro.set(filtroDotacionDesdeGrid(consulta.filterValues));
    await this.cargar(false);
  }

  trackFila = (_index: number, fila: FilaTrabajadorNominaResumen) => fila.trabajadorId;

  async manejarAccionMasiva(
    evento: DataGridBulkActionEvent<FilaTrabajadorNominaResumen>,
  ): Promise<void> {
    if (evento.action !== 'excluir-nomina') return;
    const id = this.nominaPeriodoId();
    if (!id) return;
    if (evento.scope !== 'all-filtered' && evento.rows.length === 0) return;
    this.aplicandoMasiva.set(true);
    this.errorMensaje.set(null);
    try {
      // F07b: con alcance "universo filtrado" los ids se resuelven en servidor
      // con los filtros vigentes, no solo con las filas de la página visible.
      const ids =
        evento.scope === 'all-filtered'
          ? await this.servicio.listarIdsDotacion(id, this.filtro())
          : evento.rows.map((fila) => fila.trabajadorId);
      if (ids.length === 0) return;
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
      await this.cargar(true);
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
      await this.cargar(true);
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
}
