/**
 * Administrador de Nóminas — bandeja de N nóminas por período.
 *
 * Pantalla rectora de F2 (`NOM-REBUILD-NOMINA-MENSUAL-01`). En F3 (fusion)
 * pasa a consumir el servicio productivo `NominaPeriodoService` contra BD real.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { DataGridCellDirective } from '../../../../shared/components/ui/data-grid/data-grid.directives';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { NominaPeriodoService } from '../../services/nomina-periodo.service';
import type {
  NominaPeriodoResumen,
  ResumenValidacionNomina,
} from '../../models/nomina-periodo.models';
import {
  COLUMNAS_ADMIN_NOMINAS,
  PERSISTENCIA_GRILLA_ADMIN,
  crearFiltrosAdminNominas,
  ordenarResumenesOperativos,
} from '../../presenters/admin-nominas.presenter';
import { nominaRequiereAccion } from '../../rules/nomina-periodo-state.rules';
import {
  desgloseIncidencias,
  estadoNominaToBadge,
  etiquetaMaximoPasoCompletado,
  formatearActualizada,
  formatearActualizadaCompleta,
  mostrarEnCurso,
  proximoPasoToIcon,
  proximoPasoToLabel,
  tipoNominaToLabel,
} from './utils/admin-nominas-presentacion.util';
import { AdminNominasModalNuevaNominaComponent } from './components/admin-nominas-modal-nueva-nomina/admin-nominas-modal-nueva-nomina.component';
import { AdminNominasModalResumenNominaComponent } from './components/admin-nominas-modal-resumen-nomina/admin-nominas-modal-resumen-nomina.component';
import {
  puedeEliminar,
  puedeReabrir,
  tieneLiquidaciones,
} from '../../rules/admin-nominas.rules';

type AccionAdministrativa = 'eliminar' | 'reabrir';

interface AccionAdministrativaPendiente {
  tipo: AccionAdministrativa;
  nomina: NominaPeriodoResumen;
}

@Component({
  selector: 'app-administrador-nominas-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    AdminNominasModalNuevaNominaComponent,
    AdminNominasModalResumenNominaComponent,
  ],
  templateUrl: './administrador-nominas-container.html',
  styleUrl: './administrador-nominas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministradorNominasContainer {
  private readonly router = inject(Router);
  private readonly servicio = inject(NominaPeriodoService);
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly resumenes = signal<NominaPeriodoResumen[]>([]);
  readonly modalNuevaAbierto = signal(false);
  readonly resumenSeleccionado = signal<ResumenValidacionNomina | null>(null);
  readonly nominaSeleccionada = signal<NominaPeriodoResumen | null>(null);
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly accionPendiente = signal<AccionAdministrativaPendiente | null>(null);
  readonly motivoAccion = signal('');
  readonly ejecutandoAccion = signal(false);
  readonly errorAccion = signal<string | null>(null);

  readonly columnas = COLUMNAS_ADMIN_NOMINAS;
  readonly persistenceKey = PERSISTENCIA_GRILLA_ADMIN;

  readonly filtros = computed(() => crearFiltrosAdminNominas(this.resumenes()));
  readonly resumenesOrdenados = computed(() => ordenarResumenesOperativos(this.resumenes()));

  readonly subtitulo = computed(() => {
    const resumenes = this.resumenes();
    if (resumenes.length === 0) {
      return 'Crea la primera nómina para iniciar el proceso del período.';
    }
    const requierenAccion = resumenes.filter(
      (fila) => nominaRequiereAccion(fila.estado) && (fila.requiereAccion ?? true),
    ).length;
    const conCriticas = resumenes.filter((fila) => fila.totalIncidenciasCriticas > 0).length;
    if (conCriticas > 0) {
      return `${conCriticas} nómina${conCriticas === 1 ? '' : 's'} con incidencias críticas pendientes.`;
    }
    if (requierenAccion > 0) {
      return `${requierenAccion} nómina${requierenAccion === 1 ? '' : 's'} requiere${requierenAccion === 1 ? '' : 'n'} seguimiento en el generador.`;
    }
    return 'Revisa el avance de cada nómina y continúa en el generador cuando corresponda.';
  });

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => this.abrirNuevaNomina(),
    });
    void this.cargarResumenes();
  }

  private computeShellContext(): ShellPageContext {
    return {
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
        { label: 'Administrador de nóminas' },
      ],
      pageTitle: 'Administrador de nóminas',
      pageSubtitle: this.subtitulo(),
      primaryAction: {
        label: 'Nueva nómina',
        disabled: this.cargando(),
        loading: false,
        actionId: 'admin-nominas-nueva',
      },
    };
  }

  readonly trackResumen = (_index: number, fila: NominaPeriodoResumen): string => fila.id;

  estadoNominaToBadge = estadoNominaToBadge;
  tipoNominaToLabel = tipoNominaToLabel;
  formatearActualizada = formatearActualizada;
  formatearActualizadaCompleta = formatearActualizadaCompleta;
  proximoPasoToLabel = proximoPasoToLabel;
  proximoPasoToIcon = proximoPasoToIcon;
  desgloseIncidencias = desgloseIncidencias;
  etiquetaMaximoPasoCompletado = etiquetaMaximoPasoCompletado;
  mostrarEnCurso = mostrarEnCurso;
  puedeEliminar = puedeEliminar;
  puedeReabrir = puedeReabrir;
  tieneLiquidaciones = tieneLiquidaciones;

  /**
   * Marca visual de prioridad para la celda "Siguiente acción". Se activa
   * cuando la fila requiere acción del equipo (estado abierto) o cuando tiene
   * incidencias críticas pendientes. No depende del filtro activo, refleja la
   * situación real del registro.
   */
  esFilaPrioritaria(fila: NominaPeriodoResumen): boolean {
    if (fila.totalIncidenciasCriticas > 0) return true;
    return nominaRequiereAccion(fila.estado) && (fila.requiereAccion ?? true);
  }

  async cargarResumenes(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      const lista = await this.servicio.listarResumenes();
      this.resumenes.set(lista);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible cargar las nóminas.';
      this.errorCarga.set(mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  abrirNuevaNomina(): void {
    this.modalNuevaAbierto.set(true);
  }

  cerrarNuevaNomina(): void {
    this.modalNuevaAbierto.set(false);
  }

  onNominaCreada(resumen: NominaPeriodoResumen): void {
    this.resumenes.update((lista) => [resumen, ...lista]);
    this.modalNuevaAbierto.set(false);
    this.abrirGenerador(resumen);
  }

  async abrirResumen(fila: NominaPeriodoResumen): Promise<void> {
    this.nominaSeleccionada.set(fila);
    try {
      const resumen = await this.servicio.obtenerResumenValidacionNomina(fila.id);
      this.resumenSeleccionado.set(resumen);
    } catch {
      this.resumenSeleccionado.set({
        totalTrabajadores: fila.totalTrabajadores,
        listosParaCalculo: 0,
        conIncidenciasCriticas: fila.totalIncidenciasCriticas,
        conAdvertencias: fila.totalAdvertencias,
        conMovimientosEspeciales: 0,
        puedeCalcular: false,
        puedeCerrar: false,
        incidenciasCriticas: [],
        advertencias: [],
      });
    }
  }

  cerrarResumen(): void {
    this.resumenSeleccionado.set(null);
    this.nominaSeleccionada.set(null);
  }

  abrirGenerador(fila: NominaPeriodoResumen): void {
    void this.router.navigate(['/remuneraciones/nominas', fila.id, 'generador']);
  }

  solicitarAccion(tipo: AccionAdministrativa, nomina: NominaPeriodoResumen): void {
    this.accionPendiente.set({ tipo, nomina });
    this.motivoAccion.set('');
    this.errorAccion.set(null);
  }

  cancelarAccion(): void {
    if (this.ejecutandoAccion()) return;
    this.accionPendiente.set(null);
    this.motivoAccion.set('');
    this.errorAccion.set(null);
  }

  accionTituloModal(tipo: AccionAdministrativa): string {
    if (tipo === 'reabrir') return 'Reabrir nómina';
    return 'Eliminar nómina';
  }

  accionMessageBoxVariant(tipo: AccionAdministrativa): 'warning' | 'danger' {
    return tipo === 'reabrir' ? 'warning' : 'danger';
  }

  accionRequiereMotivo(tipo: AccionAdministrativa): boolean {
    return tipo === 'reabrir';
  }

  accionDetalle(tipo: AccionAdministrativa): string {
    if (tipo === 'eliminar') {
      return 'Se eliminará la nómina junto con sus segmentos, movimientos, incidencias y eventos de auditoría. Esta operación no se puede deshacer. Tras eliminar podrás crear una nueva nómina para esta empresa, período y tipo.';
    }
    return '';
  }

  async confirmarAccion(): Promise<void> {
    if (this.ejecutandoAccion()) return;
    const pendiente = this.accionPendiente();
    if (!pendiente) return;
    const motivo = this.motivoAccion().trim();
    if (pendiente.tipo === 'reabrir' && !motivo) {
      this.errorAccion.set('Debes indicar el motivo de la acción.');
      return;
    }
    this.ejecutandoAccion.set(true);
    this.errorAccion.set(null);
    try {
      if (pendiente.tipo === 'eliminar') {
        await this.servicio.eliminarNomina(pendiente.nomina.id);
      } else {
        await this.servicio.reabrirNomina(pendiente.nomina.id, { motivo });
      }
      this.accionPendiente.set(null);
      this.motivoAccion.set('');
      this.errorAccion.set(null);
      await this.cargarResumenes();
    } catch (error) {
      this.errorAccion.set(error instanceof Error ? error.message : 'No fue posible completar la acción.');
    } finally {
      this.ejecutandoAccion.set(false);
    }
  }

  verLiquidaciones(fila: NominaPeriodoResumen): void {
    if (!tieneLiquidaciones(fila.estado) || !fila.evidenciaCalculo?.idCalculoPeriodo) return;
    void this.router.navigate(['/remuneraciones/liquidaciones'], {
      queryParams: {
        periodo: fila.periodo,
        nominaPeriodoId: fila.id,
        idCalculoPeriodo: fila.evidenciaCalculo.idCalculoPeriodo,
      },
    });
  }
}
