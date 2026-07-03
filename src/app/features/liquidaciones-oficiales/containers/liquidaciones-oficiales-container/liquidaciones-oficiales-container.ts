import {

  ChangeDetectionStrategy,

  Component,

  DestroyRef,

  computed,

  effect,

  inject,

  signal,

  untracked,

} from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { toSignal } from '@angular/core/rxjs-interop';

import { LucideAngularModule } from 'lucide-angular';



import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';

import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';

import { DataGridCellDirective } from '../../../../shared/components/ui/data-grid/data-grid.directives';

import type {

  LiquidacionConcepto,

  LiquidacionTrabajador,

} from '../../models/liquidacion-oficial.model';

import {

  inicializarEstadosLiquidacionUi,

  resumirEstadosLiquidacionUi,

  siguienteEstadoLiquidacionUi,

  buildLiquidacionAccionUiView,

  estadoInicialLiquidacionUi,

  type LiquidacionAccionUiAction,

  type LiquidacionAccionUiEstado,

  type LiquidacionAccionUiEvent,

} from '../../rules/liquidaciones-acciones-ui.rules';

import {
  fusionarEstadosRevisionLiquidacion,
  guardarEstadoRevisionLiquidacion,
} from '../../rules/liquidaciones-estado-revision.storage';

import { LiquidacionesOficialesService } from '../../services/liquidaciones-oficiales.service';

import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';

import type { NominaPeriodo, NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';

import type { NominaLiquidacionResumen } from '../../../nomina-mensual/models/nomina-consolidacion.models';

import {

  formatearFechaLiquidacion,

  liquidacionVigente,

  prepararFilasLiquidacionesInternas,

} from '../../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';

import {

  calcularTrabajadoresSinLiquidacion,

  esLiquidacionesSoloLectura,

  nominasConLiquidacionesDisponibles,

  puedeRegenerarLiquidacionesInternas,

} from '../../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';

import { estadoNominaToBadge } from '../../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';

import { LiquidacionDetallePanelComponent } from '../../components/liquidacion-detalle-panel/liquidacion-detalle-panel';

import { LiquidacionesModalSeleccionNominaComponent } from '../../components/liquidaciones-modal-seleccion-nomina/liquidaciones-modal-seleccion-nomina.component';

import {

  COLUMNAS_TRABAJADORES_LIQUIDACION,

  COLUMNAS_VERSIONES_LIQUIDACION,

  COLUMNAS_SELECCION_NOMINA_LIQUIDACION,

  crearFiltrosSeleccionNominaLiquidacion,

  crearFiltrosTrabajadoresLiquidacion,

  etiquetaOpcionNominaLiquidacion,

  etiquetaOpcionVersionLiquidacion,

  PERSISTENCIA_GRILLA_TRABAJADORES_LIQ,

  PERSISTENCIA_GRILLA_VERSIONES_LIQ,

  PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ,

} from '../../presenters/liquidaciones-oficiales.presenter';

import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';



export type LiquidacionFeedbackAccionUi = {

  mensaje: string;

  tono: 'info' | 'review' | 'success' | 'danger';

};



@Component({

  selector: 'app-liquidaciones-oficiales-container',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [

    CommonModule,

    RouterLink,

    LucideAngularModule,

    MessageBoxComponent,

    DataGridComponent,

    DataGridCellDirective,

    LiquidacionDetallePanelComponent,

    LiquidacionesModalSeleccionNominaComponent,

  ],

  templateUrl: './liquidaciones-oficiales-container.html',

  styleUrl: './liquidaciones-oficiales-container.css',

})

export class LiquidacionesOficialesContainer {

  readonly periodoActivo = inject(PeriodoActivoService);

  private readonly service = inject(LiquidacionesOficialesService);

  private readonly nominaService = inject(NominaPeriodoService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });



  readonly nominaPeriodoId = computed(() => {

    const params = this.queryParams() as Record<string, unknown>;

    const id = params['nominaPeriodoId'];

    return typeof id === 'string' && id.trim() ? id.trim() : null;

  });

  readonly modoNominaInterna = computed(() => !!this.nominaPeriodoId());

  readonly nominaInterna = signal<NominaPeriodo | null>(null);

  readonly liquidacionesInternas = signal<readonly NominaLiquidacionResumen[]>([]);

  readonly cargandoNominaInterna = signal(false);

  readonly regenerandoInterna = signal(false);

  readonly confirmacionRegeneracionInternaVisible = signal(false);

  readonly nominasConLiquidaciones = signal<readonly NominaPeriodoResumen[]>([]);

  readonly nominasParaModal = computed(() => [...this.nominasConLiquidaciones()]);

  readonly cargandoNominasLista = signal(false);

  readonly modalSeleccionNominaAbierto = signal(false);

  readonly trabajadoresLiquidacion = signal<LiquidacionTrabajador[]>([]);

  readonly cargandoTrabajadoresLiquidacion = signal(false);

  readonly versionLiquidacionSeleccionada = signal<number | null>(null);

  readonly formatearFechaLiquidacion = formatearFechaLiquidacion;

  readonly estadoNominaToBadge = estadoNominaToBadge;

  readonly etiquetaOpcionNominaLiquidacion = etiquetaOpcionNominaLiquidacion;

  readonly etiquetaOpcionVersionLiquidacion = etiquetaOpcionVersionLiquidacion;

  readonly columnasVersiones = COLUMNAS_VERSIONES_LIQUIDACION;

  readonly columnasTrabajadores = COLUMNAS_TRABAJADORES_LIQUIDACION;

  readonly columnasSeleccionNomina = COLUMNAS_SELECCION_NOMINA_LIQUIDACION;

  readonly persistenciaVersiones = PERSISTENCIA_GRILLA_VERSIONES_LIQ;

  readonly persistenciaTrabajadores = PERSISTENCIA_GRILLA_TRABAJADORES_LIQ;

  readonly persistenciaSeleccionNomina = PERSISTENCIA_GRILLA_SELECCION_NOMINA_LIQ;



  readonly filasLiquidacionesInternas = computed(() =>

    prepararFilasLiquidacionesInternas(

      this.liquidacionesInternas(),

      this.nominaInterna()?.estado ?? 'borrador',

    ),

  );

  readonly soloLecturaInterna = computed(() =>

    esLiquidacionesSoloLectura(this.nominaInterna()?.estado ?? 'borrador'),

  );

  readonly puedeRegenerarInterna = computed(() =>

    puedeRegenerarLiquidacionesInternas(

      this.nominaInterna()?.estado ?? 'borrador',

      this.nominaInterna()?.evidenciaCalculo?.calculoVigente ?? false,

    ),

  );

  readonly trabajadoresSinLiquidacionInterna = computed(() => {

    const vigente = this.filasLiquidacionesInternas().find((f) => f.clasificacion === 'vigente');

    return calcularTrabajadoresSinLiquidacion(

      this.nominaInterna()?.trabajadorIds.length ?? 0,

      vigente?.totalTrabajadores,

    );

  });

  readonly versionLiquidacionActivaId = computed(() => {

    const manual = this.versionLiquidacionSeleccionada();

    if (manual != null) return manual;

    const vigente = liquidacionVigente(this.filasLiquidacionesInternas());

    return vigente?.idLiquidacionPeriodo ?? this.filasLiquidacionesInternas()[0]?.idLiquidacionPeriodo ?? null;

  });

  readonly filaVersionActiva = computed(() => {

    const id = this.versionLiquidacionActivaId();

    if (!id) return null;

    return this.filasLiquidacionesInternas().find((fila) => fila.idLiquidacionPeriodo === id) ?? null;

  });

  readonly nominaResumenActiva = computed(() => {

    const id = this.nominaPeriodoId();

    if (!id) return null;

    return this.nominasConLiquidaciones().find((nomina) => nomina.id === id) ?? null;

  });

  readonly etiquetaNominaActiva = computed(() => {

    const resumen = this.nominaResumenActiva();

    if (resumen) return etiquetaOpcionNominaLiquidacion(resumen);

    const nomina = this.nominaInterna();

    if (!nomina) return null;

    const badge = estadoNominaToBadge(nomina.estado);

    return `${nomina.periodo} · ${nomina.empresaNombre} · ${badge.label}`;

  });

  readonly contextoOrigen = computed(() => {

    const nomina = this.nominaInterna();

    if (!nomina) return null;

    const badge = estadoNominaToBadge(nomina.estado);

    const version = this.filaVersionActiva();

    return {

      empresa: nomina.empresaNombre,

      periodo: nomina.periodo,

      estadoLabel: badge.label,

      estadoVariant: badge.variant,

      versionLabel: version ? `v${version.version} · ${version.etiquetaClasificacion}` : null,

      trabajadores: nomina.trabajadorIds.length,

      soloLectura: this.soloLecturaInterna(),

    };

  });



  readonly periodoSeleccionado = computed(() => this.periodoActivo.getPeriodo());

  readonly volverNominaQuery = computed(() => ({ periodo: this.periodoSeleccionado() }));

  readonly rutaAdministradorNominas = '/remuneraciones/nominas';

  readonly error = signal<string | null>(null);

  readonly trabajadorSeleccionado = signal<LiquidacionTrabajador | null>(null);

  readonly conceptosDetalle = signal<LiquidacionConcepto[]>([]);

  readonly cargandoDetalle = signal(false);

  readonly estadosAccionTrabajador = signal<Record<number, LiquidacionAccionUiEstado>>({});

  readonly feedbackAccionTrabajador = signal<LiquidacionFeedbackAccionUi | null>(null);

  readonly evidenciaRegeneracion = signal<string | null>(null);



  readonly resumenEstadoTrabajadores = computed(() => resumirEstadosLiquidacionUi(this.estadosAccionTrabajador()));

  readonly filtrosTrabajadoresLiquidacion = computed(() =>

    crearFiltrosTrabajadoresLiquidacion(this.estadosAccionTrabajador()),

  );

  readonly filtrosSeleccionNomina = computed(() =>

    crearFiltrosSeleccionNominaLiquidacion(this.nominasConLiquidaciones()),

  );

  readonly estadoTrabajadorSeleccionado = computed(() => {

    const trabajador = this.trabajadorSeleccionado();

    if (!trabajador) return null;

    const view = this.viewTrabajador(trabajador);

    return { label: view.estadoLabel, tono: view.estadoTone };

  });



  constructor() {

    const destroyRef = inject(DestroyRef);

    bindShellPageContext(

      destroyRef,

      () => ({

        breadcrumbs: [

          { label: 'Remuneraciones', path: this.rutaAdministradorNominas },

          { label: 'Liquidaciones' },

        ],

        statusChip: this.nominaInterna()

          ? {

              label: this.nominaInterna()?.estado === 'cerrada' ? 'Congelada' : estadoNominaToBadge(this.nominaInterna()!.estado).label,

              tone: this.nominaInterna()?.estado === 'cerrada' ? 'success' : 'warning',

            }

          : {

              label: this.cargandoNominasLista()

                ? 'Cargando…'

                : `${this.nominasConLiquidaciones().length} nómina(s)`,

              tone: 'neutral',

            },

        primaryAction: undefined,

      }),

      {

        onPrimaryAction: () => {

          void this.router.navigate([this.rutaAdministradorNominas], {

            queryParams: this.volverNominaQuery(),

          });

        },

      },

    );



    effect(() => {

      const params = this.queryParams() as Record<string, unknown>;

      const periodo = params['periodo'];

      if (typeof periodo !== 'string' || !/^\d{4}-\d{2}$/.test(periodo)) return;

      untracked(() => this.periodoActivo.setPeriodoYm(periodo));

    });



    effect(() => {

      this.periodoSeleccionado();

      untracked(() => void this.cargarNominasLista());

    });



    effect(() => {

      const id = this.nominaPeriodoId();

      untracked(() => {

        if (id) {

          this.evidenciaRegeneracion.set(null);

          void this.cargarNominaInterna();

        } else {

          this.nominaInterna.set(null);

          this.liquidacionesInternas.set([]);

          this.versionLiquidacionSeleccionada.set(null);

          this.trabajadoresLiquidacion.set([]);

          this.evidenciaRegeneracion.set(null);

        }

      });

    });



    effect(() => {

      const modo = this.modoNominaInterna();

      const idVersion = this.versionLiquidacionActivaId();

      if (!modo || !idVersion) {

        untracked(() => {

          this.trabajadoresLiquidacion.set([]);

          this.trabajadorSeleccionado.set(null);

          this.conceptosDetalle.set([]);

          this.estadosAccionTrabajador.set({});

        });

        return;

      }

      untracked(() => void this.cargarTrabajadoresLiquidacion(idVersion));

    });

  }



  private async cargarNominasLista(): Promise<void> {

    this.cargandoNominasLista.set(true);

    this.error.set(null);

    try {

      const resumenes = await this.nominaService.listarResumenes();

      this.nominasConLiquidaciones.set(nominasConLiquidacionesDisponibles(resumenes));

    } catch (error) {

      this.nominasConLiquidaciones.set([]);

      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar el listado de nóminas.');

    } finally {

      this.cargandoNominasLista.set(false);

    }

  }



  private async cargarNominaInterna(): Promise<void> {

    const id = this.nominaPeriodoId();

    if (!id) {

      this.nominaInterna.set(null);

      this.liquidacionesInternas.set([]);

      return;

    }

    this.cargandoNominaInterna.set(true);

    this.versionLiquidacionSeleccionada.set(null);

    try {

      const [nomina, liquidaciones] = await Promise.all([

        this.nominaService.obtenerNomina(id),

        this.nominaService.listarLiquidacionesNomina(id),

      ]);

      if (this.nominaPeriodoId() !== id) return;

      this.nominaInterna.set(nomina);

      this.liquidacionesInternas.set(liquidaciones);

    } catch (error) {

      if (this.nominaPeriodoId() !== id) return;

      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar liquidaciones de la nómina.');

    } finally {

      if (this.nominaPeriodoId() === id) {

        this.cargandoNominaInterna.set(false);

      }

    }

  }



  solicitarRegeneracionInterna(): void {

    if (!this.puedeRegenerarInterna()) return;

    this.confirmacionRegeneracionInternaVisible.set(true);

  }



  cancelarRegeneracionInterna(): void {

    this.confirmacionRegeneracionInternaVisible.set(false);

  }



  seccionesConfirmacionRegeneracionInterna(): MessageBoxSection[] {

    const esRegenerar = this.liquidacionesInternas().length > 0;

    const maxVersion = this.filasLiquidacionesInternas().reduce((max, fila) => Math.max(max, fila.version), 0);

    const siguienteVersion = maxVersion + 1;

    return [

      {

        title: 'Qué se hará',

        text: esRegenerar

          ? `Se creará la versión v${siguienteVersion} desde el cálculo aprobado de la nómina.`

          : 'Se materializarán comprobantes internos por trabajador desde el cálculo vigente.',

      },

      {

        title: 'Condición',

        text: 'La nómina tiene cálculo vigente y permite generar o regenerar liquidaciones.',

        tone: 'info',

      },

      {

        title: 'Qué queda registrado',

        text: esRegenerar

          ? 'La versión anterior quedará como superada en el historial.'

          : 'Primera versión de liquidación del período para esta nómina.',

      },

      {

        title: 'Qué sigue',

        text: 'Revisar trabajadores en la grilla y validar totales por persona.',

        tone: 'info',

      },

    ];

  }



  async confirmarRegeneracionInterna(): Promise<void> {

    const id = this.nominaPeriodoId();

    if (!id || !this.puedeRegenerarInterna()) return;

    this.confirmacionRegeneracionInternaVisible.set(false);

    this.regenerandoInterna.set(true);

    this.error.set(null);

    try {

      await this.nominaService.generarLiquidacionesNomina(id);

      await this.cargarNominaInterna();

      const version = this.filaVersionActiva();

      if (version) {

        this.evidenciaRegeneracion.set(

          `Versión v${version.version} generada · ${version.totalTrabajadores} trabajadores · ${this.money(version.totalLiquido)} líquido total`,

        );

      }

    } catch (error) {

      this.error.set(error instanceof Error ? error.message : 'No fue posible regenerar liquidaciones.');

    } finally {

      this.regenerandoInterna.set(false);

    }

  }



  volverAdministradorNomina(): void {

    void this.router.navigate([this.rutaAdministradorNominas], {

      queryParams: this.volverNominaQuery(),

    });

  }



  abrirModalSeleccionNomina(): void {

    if (this.cargandoNominasLista()) return;

    this.modalSeleccionNominaAbierto.set(true);

  }



  cerrarModalSeleccionNomina(): void {

    this.modalSeleccionNominaAbierto.set(false);

  }



  onNominaSeleccionadaEnModal(fila: NominaPeriodoResumen): void {

    this.modalSeleccionNominaAbierto.set(false);

    this.abrirLiquidacionesNomina(fila);

  }



  seleccionarNominaDesdeEntrada(fila: NominaPeriodoResumen): void {

    this.abrirLiquidacionesNomina(fila);

  }



  abrirLiquidacionesNomina(fila: NominaPeriodoResumen): void {

    this.evidenciaRegeneracion.set(null);

    void this.router.navigate(['/remuneraciones/liquidaciones'], {

      queryParams: {

        periodo: fila.periodo,

        nominaPeriodoId: fila.id,

        ...(fila.evidenciaCalculo?.idCalculoPeriodo

          ? { idCalculoPeriodo: fila.evidenciaCalculo.idCalculoPeriodo }

          : {}),

      },

    });

  }



  cambiarVersionSeleccionada(event: Event): void {

    const raw = Number((event.target as HTMLSelectElement).value);

    if (Number.isFinite(raw) && raw > 0) {

      this.seleccionarVersionLiquidacion(raw);

    }

  }



  seleccionarVersionLiquidacion(idLiquidacionPeriodo: number): void {

    if (this.versionLiquidacionActivaId() === idLiquidacionPeriodo) return;

    this.versionLiquidacionSeleccionada.set(idLiquidacionPeriodo);

    this.trabajadorSeleccionado.set(null);

    this.conceptosDetalle.set([]);

    this.feedbackAccionTrabajador.set(null);

    this.evidenciaRegeneracion.set(null);

  }



  private async cargarTrabajadoresLiquidacion(idLiquidacionPeriodo: number): Promise<void> {

    this.cargandoTrabajadoresLiquidacion.set(true);

    this.error.set(null);

    try {

      const trabajadores = await this.service.listarTrabajadoresLiquidacion(idLiquidacionPeriodo);

      if (this.versionLiquidacionActivaId() !== idLiquidacionPeriodo) return;

      this.trabajadoresLiquidacion.set(trabajadores);

      this.estadosAccionTrabajador.set(
        fusionarEstadosRevisionLiquidacion(
          idLiquidacionPeriodo,
          inicializarEstadosLiquidacionUi(trabajadores),
        ),
      );

      this.feedbackAccionTrabajador.set(null);

    } catch (error) {

      if (this.versionLiquidacionActivaId() !== idLiquidacionPeriodo) return;

      this.trabajadoresLiquidacion.set([]);

      this.error.set(error instanceof Error ? error.message : 'No fue posible cargar trabajadores liquidados.');

    } finally {

      if (this.versionLiquidacionActivaId() === idLiquidacionPeriodo) {

        this.cargandoTrabajadoresLiquidacion.set(false);

      }

    }

  }



  ejecutarAccionTrabajador(event: LiquidacionAccionUiEvent): void {
    const trabajador = this.trabajadoresLiquidacion().find(
      (fila) => fila.idLiquidacionTrabajador === event.idLiquidacionTrabajador,
    );
    const estadoActual = this.estadosAccionTrabajador()[event.idLiquidacionTrabajador]
      ?? estadoInicialLiquidacionUi(trabajador);
    const estadoSiguiente = siguienteEstadoLiquidacionUi(estadoActual, event.tipo);
    if (estadoSiguiente === estadoActual) return;

    this.estadosAccionTrabajador.update((actual) => ({
      ...actual,
      [event.idLiquidacionTrabajador]: estadoSiguiente,
    }));

    const idVersion = this.versionLiquidacionActivaId();
    if (idVersion) {
      guardarEstadoRevisionLiquidacion(idVersion, event.idLiquidacionTrabajador, estadoSiguiente);
    }

    this.feedbackAccionTrabajador.set({
      mensaje: this.mensajeAccionTrabajador(estadoSiguiente),
      tono: this.tonoFeedbackAccionTrabajador(estadoSiguiente),
    });

    void this.service.guardarEstadoRevisionTrabajador(event.idLiquidacionTrabajador, estadoSiguiente)
      .catch(() => {
        this.feedbackAccionTrabajador.set({
          mensaje: 'Estado guardado en esta sesión. No se pudo sincronizar con el servidor.',
          tono: 'review',
        });
      });
  }



  private mensajeAccionTrabajador(estado: LiquidacionAccionUiEstado): string {

    switch (estado) {

      case 'autorizada':
        return 'Liquidación autorizada. Puede continuar con el registro de pago.';
      case 'pago_registrado':
        return 'Pago registrado. Puede enviar el documento al trabajador.';
      case 'documento_enviado':
        return 'Documento marcado como enviado.';
      case 'rectificacion_solicitada':
        return 'Rectificación solicitada: corrige desde Nómina mensual o una futura reliquidación antes de emitir una nueva versión.';
      default:
        return 'Estado actualizado.';

    }

  }



  private tonoFeedbackAccionTrabajador(estado: LiquidacionAccionUiEstado): LiquidacionFeedbackAccionUi['tono'] {

    switch (estado) {

      case 'pendiente_autorizar':

        return 'review';

      case 'rectificacion_solicitada':

        return 'danger';

      case 'documento_enviado':

        return 'success';

      default:

        return 'info';

    }

  }



  verDetalleTrabajador(trabajador: LiquidacionTrabajador): Promise<void> {

    this.trabajadorSeleccionado.set(trabajador);

    this.cargandoDetalle.set(true);

    this.conceptosDetalle.set([]);

    return this.service.obtenerDetalleTrabajador(trabajador.idLiquidacionTrabajador)

      .then((conceptos) => this.conceptosDetalle.set(conceptos))

      .catch(() => this.error.set('No se pudo consultar el detalle del trabajador.'))

      .finally(() => this.cargandoDetalle.set(false));

  }



  estadoUiTrabajador(trabajador: LiquidacionTrabajador): LiquidacionAccionUiEstado {

    return this.estadosAccionTrabajador()[trabajador.idLiquidacionTrabajador]

      ?? estadoInicialLiquidacionUi(trabajador);

  }



  viewTrabajador(trabajador: LiquidacionTrabajador) {

    return buildLiquidacionAccionUiView(this.estadoUiTrabajador(trabajador));

  }



  ejecutarAccionTrabajadorDg(trabajador: LiquidacionTrabajador, action: LiquidacionAccionUiAction): void {

    this.ejecutarAccionTrabajador({

      idLiquidacionTrabajador: trabajador.idLiquidacionTrabajador,

      tipo: action.tipo,

    });

  }



  esTrabajadorSeleccionado(trabajador: LiquidacionTrabajador): boolean {

    return this.trabajadorSeleccionado()?.idLiquidacionTrabajador === trabajador.idLiquidacionTrabajador;

  }



  trackVersion = (_index: number, fila: { idLiquidacionPeriodo: number }) => fila.idLiquidacionPeriodo;

  trackTrabajador = (_index: number, fila: LiquidacionTrabajador) => fila.idLiquidacionTrabajador;

  trackNominaOption = (_index: number, fila: NominaPeriodoResumen) => fila.id;



  money(value: number): string {

    return new Intl.NumberFormat('es-CL', {

      style: 'currency',

      currency: 'CLP',

      maximumFractionDigits: 0,

    }).format(value);

  }

}


