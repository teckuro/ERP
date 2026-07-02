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
import { NominaPeriodoCalculoAdapterService } from '../../services/nomina-periodo-calculo-adapter.service';
import { NominaMensualCapabilitiesService } from '../../services/nomina-mensual-capabilities.service';
import { NominaFeatureGatesService } from '../../services/nomina-feature-gates.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { resolverUsuarioResponsableActual } from '../../../../core/auth/auth-user-label';
import type {
  EventoAuditoriaNomina,
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
  calcularKpisAdminNominas,
  desgloseIncidencias,
  estadoNominaToBadge,
  etiquetaMaximoPasoCompletado,
  etiquetaMetaNomina,
  formatearActualizada,
  formatearActualizadaCompleta,
  formatearRangoLegal,
  mostrarEnCurso,
  proximoPasoToIcon,
  proximoPasoToLabel,
  tooltipAvanceFila,
} from './utils/admin-nominas-presentacion.util';
import {
  AdminNominasModalNuevaNominaComponent,
  type NominaCreadaEvento,
} from './components/admin-nominas-modal-nueva-nomina/admin-nominas-modal-nueva-nomina.component';
import {
  AdminNominasModalRectificacionComponent,
  type RectificacionCreadaEvento,
} from './components/admin-nominas-modal-rectificacion/admin-nominas-modal-rectificacion.component';
import { AdminNominasModalResumenNominaComponent } from './components/admin-nominas-modal-resumen-nomina/admin-nominas-modal-resumen-nomina.component';
import { AdminNominasModalHistorialNominaComponent } from './components/admin-nominas-modal-historial-nomina/admin-nominas-modal-historial-nomina.component';
import { AdminNominasModalCadenaRectificacionComponent } from './components/admin-nominas-modal-cadena-rectificacion/admin-nominas-modal-cadena-rectificacion.component';
import {
  puedeEliminar,
  puedeEliminarConPermiso,
  puedeReabrir,
  puedeReabrirConPermiso,
  puedeCrearRectificacion,
  tieneLiquidaciones,
} from '../../rules/admin-nominas.rules';
import type { TotalesRectificacionVista } from '../../rules/proceso-mensual-motor-rectificacion.rules';
import {
  agruparRectificacionesPorOrigen,
  etiquetaAccionPrimariaFila,
  puedeConsultarOriginal,
  rectificacionesDeOrigen,
} from '../../rules/nomina-rectificacion-ui.rules';
import {
  etiquetaCadenaEnOriginal,
  etiquetaSublineaRectificacion,
} from '../../presenters/nomina-rectificacion-ui.presenter';

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
    AdminNominasModalRectificacionComponent,
    AdminNominasModalResumenNominaComponent,
    AdminNominasModalHistorialNominaComponent,
    AdminNominasModalCadenaRectificacionComponent,
  ],
  templateUrl: './administrador-nominas-container.html',
  styleUrl: './administrador-nominas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministradorNominasContainer {
  private readonly router = inject(Router);
  private readonly servicio = inject(NominaPeriodoService);
  private readonly calculoAdapter = inject(NominaPeriodoCalculoAdapterService);
  private readonly capabilities = inject(NominaMensualCapabilitiesService);
  private readonly featureGates = inject(NominaFeatureGatesService);
  private readonly authService = inject(AuthService);
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly resumenes = signal<NominaPeriodoResumen[]>([]);
  readonly modalNuevaAbierto = signal(false);
  readonly rectificacionOrigen = signal<NominaPeriodoResumen | null>(null);
  readonly cadenaRectificacionOrigen = signal<NominaPeriodoResumen | null>(null);
  readonly resumenSeleccionado = signal<ResumenValidacionNomina | null>(null);
  readonly totalesRectificacionSeleccionada = signal<TotalesRectificacionVista | null>(null);
  readonly nominaSeleccionada = signal<NominaPeriodoResumen | null>(null);
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly accionPendiente = signal<AccionAdministrativaPendiente | null>(null);
  readonly motivoAccion = signal('');
  readonly ejecutandoAccion = signal(false);
  readonly errorAccion = signal<string | null>(null);

  readonly historialNomina = signal<NominaPeriodoResumen | null>(null);
  readonly historialEventos = signal<EventoAuditoriaNomina[]>([]);
  readonly historialLoading = signal(false);
  readonly historialError = signal<string | null>(null);

  /**
   * Resolver de etiquetas de usuario para el historial. Hoy resolvemos sólo
   * al usuario actual (auth metadata); para otros usuarios se mostrará
   * "Usuario no informado". Esto evita expandir el `select` del repository en
   * el piloto F17 y mantiene el comportamiento sobrio del manual NOIA.
   */
  readonly resolverUsuarioHistorial = (usuarioId: string | undefined): string | null => {
    if (!usuarioId) return null;
    const responsable = resolverUsuarioResponsableActual(this.authService.currentUser());
    if (responsable.id && responsable.id === usuarioId) {
      return responsable.nombre;
    }
    return null;
  };

  readonly columnas = COLUMNAS_ADMIN_NOMINAS;
  readonly persistenceKey = PERSISTENCIA_GRILLA_ADMIN;

  readonly filtros = computed(() => crearFiltrosAdminNominas(this.resumenes()));
  readonly resumenesOrdenados = computed(() => ordenarResumenesOperativos(this.resumenes()));

  readonly rectificacionesPorOrigen = computed(() =>
    agruparRectificacionesPorOrigen(this.resumenes()),
  );

  readonly etiquetaAccionPrimariaFila = etiquetaAccionPrimariaFila;
  readonly puedeConsultarOriginalFila = puedeConsultarOriginal;
  readonly etiquetaSublineaRectificacion = etiquetaSublineaRectificacion;
  readonly etiquetaCadenaEnOriginal = etiquetaCadenaEnOriginal;
  readonly kpis = computed(() => calcularKpisAdminNominas(this.resumenes()));

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
    void this.featureGates.cargar();
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
        disabled: this.cargando() || !this.capabilities.puedeEscribirNomina(),
        loading: false,
        actionId: 'admin-nominas-nueva',
        tooltip: !this.capabilities.puedeEscribirNomina()
          ? 'Tu perfil es de solo consulta. No puedes crear nóminas.'
          : null,
      },
    };
  }

  readonly trackResumen = (_index: number, fila: NominaPeriodoResumen): string => fila.id;

  estadoNominaToBadge = estadoNominaToBadge;
  formatearActualizada = formatearActualizada;
  formatearActualizadaCompleta = formatearActualizadaCompleta;
  proximoPasoToLabel = proximoPasoToLabel;
  proximoPasoToIcon = proximoPasoToIcon;
  desgloseIncidencias = desgloseIncidencias;
  tooltipAvanceFila = tooltipAvanceFila;
  mostrarEnCurso = mostrarEnCurso;
  etiquetaMaximoPasoCompletado = etiquetaMaximoPasoCompletado;
  etiquetaMetaNomina = etiquetaMetaNomina;
  formatearRangoLegal = formatearRangoLegal;
  puedeEliminar = puedeEliminar;
  puedeReabrir = puedeReabrir;
  tieneLiquidaciones = tieneLiquidaciones;

  puedeEliminarFila(fila: NominaPeriodoResumen): boolean {
    return puedeEliminarConPermiso(fila.estado, this.capabilities.esAdmin());
  }

  puedeReabrirFila(fila: NominaPeriodoResumen): boolean {
    return puedeReabrirConPermiso(fila.estado, this.capabilities.esAdmin());
  }

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
    if (!this.capabilities.puedeEscribirNomina()) return;
    this.modalNuevaAbierto.set(true);
  }

  cerrarNuevaNomina(): void {
    this.modalNuevaAbierto.set(false);
  }

  abrirRectificacion(fila: NominaPeriodoResumen): void {
    if (!this.puedeCrearRectificacionFila(fila)) return;
    this.rectificacionOrigen.set(fila);
  }

  cerrarRectificacion(): void {
    this.rectificacionOrigen.set(null);
  }

  onRectificacionCreada(evento: RectificacionCreadaEvento): void {
    this.resumenes.update((lista) => {
      const sinDuplicado = lista.filter((r) => r.id !== evento.resumen.id);
      return [evento.resumen, ...sinDuplicado];
    });
    this.rectificacionOrigen.set(null);
    this.abrirGenerador(evento.resumen, {
      from: 'create',
      siguientePaso: evento.resultado.siguientePaso,
      totalIniciales: evento.resultado.totalTrabajadores,
      reutilizada: false,
    });
  }

  puedeCrearRectificacionFila(fila: NominaPeriodoResumen): boolean {
    return puedeCrearRectificacion({
      estado: fila.estado,
      gateRectificacion: this.featureGates.gates().rectificacion,
      puedeEscribir: this.capabilities.puedeRectificarNomina(),
    });
  }

  onNominaCreada(evento: NominaCreadaEvento): void {
    // Si la nómina ya existía (idempotencia F05), evitamos duplicar en la
    // lista; si es nueva, la insertamos arriba para que el usuario la vea.
    this.resumenes.update((lista) => {
      const sinDuplicado = lista.filter((r) => r.id !== evento.resumen.id);
      return [evento.resumen, ...sinDuplicado];
    });
    this.modalNuevaAbierto.set(false);
    this.abrirGenerador(evento.resumen, {
      from: 'create',
      siguientePaso: evento.siguientePaso,
      totalIniciales: evento.totalTrabajadoresIniciales,
      reutilizada: evento.reutilizada,
    });
  }

  async abrirResumen(fila: NominaPeriodoResumen): Promise<void> {
    this.nominaSeleccionada.set(fila);
    this.totalesRectificacionSeleccionada.set(null);
    try {
      const [resumen, totales] = await Promise.all([
        this.servicio.obtenerResumenValidacionNomina(fila.id),
        fila.naturaleza === 'rectificacion'
          ? this.calculoAdapter.obtenerTotalesRectificacion(fila.id)
          : Promise.resolve(null),
      ]);
      if (this.nominaSeleccionada()?.id !== fila.id) return;
      this.resumenSeleccionado.set(resumen);
      this.totalesRectificacionSeleccionada.set(totales);
    } catch {
      if (this.nominaSeleccionada()?.id !== fila.id) return;
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

  consultarOriginalDesdeResumen(): void {
    const fila = this.nominaSeleccionada();
    if (!fila?.nominaOrigenId) return;
    const origen = this.resumenes().find((r) => r.id === fila.nominaOrigenId);
    if (!origen) return;
    void this.abrirResumen(origen);
  }

  conteoRectificaciones(fila: NominaPeriodoResumen): number {
    return rectificacionesDeOrigen(this.resumenes(), fila.id).length;
  }

  abrirCadenaRectificacion(fila: NominaPeriodoResumen): void {
    if (fila.estado !== 'cerrada' || this.conteoRectificaciones(fila) === 0) return;
    this.cadenaRectificacionOrigen.set(fila);
  }

  cerrarCadenaRectificacion(): void {
    this.cadenaRectificacionOrigen.set(null);
  }

  onAbrirRectificacionDesdeCadena(fila: NominaPeriodoResumen): void {
    this.cadenaRectificacionOrigen.set(null);
    this.abrirGenerador(fila);
  }

  onConsultarOriginalDesdeCadena(): void {
    const origen = this.cadenaRectificacionOrigen();
    if (!origen) return;
    this.cadenaRectificacionOrigen.set(null);
    void this.abrirResumen(origen);
  }

  cerrarResumen(): void {
    this.resumenSeleccionado.set(null);
    this.nominaSeleccionada.set(null);
    this.totalesRectificacionSeleccionada.set(null);
  }

  async abrirHistorial(fila: NominaPeriodoResumen): Promise<void> {
    this.historialNomina.set(fila);
    this.historialEventos.set([]);
    this.historialError.set(null);
    this.historialLoading.set(true);
    try {
      const eventos = await this.servicio.listarEventosAuditoria(fila.id);
      // Si el usuario cerró el modal o abrió otra fila mientras cargábamos,
      // evitamos pisar el estado: solo aplicamos si seguimos en la misma.
      if (this.historialNomina()?.id === fila.id) {
        this.historialEventos.set(eventos);
      }
    } catch (err) {
      if (this.historialNomina()?.id === fila.id) {
        const mensaje = err instanceof Error ? err.message : 'No fue posible cargar el historial.';
        this.historialError.set(mensaje);
      }
    } finally {
      if (this.historialNomina()?.id === fila.id) {
        this.historialLoading.set(false);
      }
    }
  }

  cerrarHistorial(): void {
    this.historialNomina.set(null);
    this.historialEventos.set([]);
    this.historialLoading.set(false);
    this.historialError.set(null);
  }

  abrirGenerador(
    fila: NominaPeriodoResumen,
    contexto?: {
      from?: 'create';
      siguientePaso?: 'parameters' | 'dotacion';
      totalIniciales?: number;
      reutilizada?: boolean;
    },
  ): void {
    const queryParams = contexto
      ? {
          from: contexto.from ?? null,
          paso: contexto.siguientePaso ?? null,
          dotacion: contexto.totalIniciales ?? null,
          reutilizada: contexto.reutilizada ? '1' : null,
        }
      : undefined;
    void this.router.navigate(['/remuneraciones/nominas', fila.id, 'generador'], {
      queryParams,
      queryParamsHandling: queryParams ? '' : 'preserve',
    });
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

  consultarOriginal(fila: NominaPeriodoResumen): void {
    if (!puedeConsultarOriginal(fila) || !fila.nominaOrigenId) return;
    const origen = this.resumenes().find((r) => r.id === fila.nominaOrigenId);
    if (origen) void this.abrirResumen(origen);
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
