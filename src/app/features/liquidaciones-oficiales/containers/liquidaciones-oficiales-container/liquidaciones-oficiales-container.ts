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

import {
  DocumentoLiquidacionService,
  type DocumentoLiquidacionEmpresa,
} from '../../../../core/services/documento-liquidacion.service';

import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxVariant } from '../../../../shared/components/ui/feedback/message-box/message-box.types';

import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';

import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';

import { DataGridCellDirective } from '../../../../shared/components/ui/data-grid/data-grid.directives';

import type {

  LiquidacionConcepto,

  LiquidacionEmision,

  LiquidacionRevisionEvento,

  LiquidacionTrabajador,

} from '../../models/liquidacion-oficial.model';

import {

  inicializarEstadosLiquidacionUi,

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

  liquidacionReferenciaCobertura,

  liquidacionVigente,

  prepararFilasLiquidacionesInternas,

} from '../../../nomina-mensual/presenters/nomina-liquidaciones-internas.presenter';

import {

  calcularTrabajadoresSinLiquidacion,

  esLiquidacionesSoloLectura,

  nominasConLiquidacionesDisponibles,

  puedeRegenerarDesdePantallaLiquidaciones,

} from '../../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';

import { tieneLiquidaciones } from '../../../nomina-mensual/rules/admin-nominas.rules';

import { estadoNominaToBadge } from '../../../nomina-mensual/containers/administrador-nominas-container/utils/admin-nominas-presentacion.util';

import { LiquidacionDetallePanelComponent } from '../../components/liquidacion-detalle-panel/liquidacion-detalle-panel';

import { LiquidacionPreviewModalComponent } from '../../../nomina-mensual-v2/components/liquidacion-preview-modal/liquidacion-preview-modal.component';

import type { LiquidacionCalculada } from '../../../nomina-mensual/models/proceso-mensual.model';

import { mapLiquidacionOficialAPreview, mapDocumentoExtrasDesdeLiquidacionOficial } from '../../rules/liquidaciones-preview.mapper';
import type {
  LiquidacionDocumentoCierreInput,
  LiquidacionDocumentoDetalleInput,
  LiquidacionDocumentoTrabajadorMetaInput,
} from '../../../../shared/components/documento-liquidacion-sheet';
import { ParametrosGeneralesService } from '../../../parametros-generales/services/parametros-generales.service';
import { EmpleadosService } from '../../../empleados/services/empleados.service';

import { diffVersionLiquidacionConAnterior } from '../../rules/liquidaciones-version-diff.rules';

import { presentarDiffVersionLiquidacion } from '../../presenters/liquidaciones-version-diff.presenter';

import { LiquidacionesModalDetalleTrabajadorComponent } from '../../components/liquidaciones-modal-detalle-trabajador/liquidaciones-modal-detalle-trabajador.component';
import { LiquidacionesModalHistorialNominaComponent } from '../../components/liquidaciones-modal-historial-nomina/liquidaciones-modal-historial-nomina.component';
import { LiquidacionesModalHistorialTrabajadorComponent } from '../../components/liquidaciones-modal-historial-trabajador/liquidaciones-modal-historial-trabajador.component';

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
import { PreviredExportacionModalComponent } from '../../../previred/components/previred-exportacion-modal/previred-exportacion-modal.component';
import { puedeExportarPreviredNomina } from '../../../previred/rules/previred-exportacion-ui.rules';
import { construirActaVaciaLiquidaciones } from '../../rules/liquidaciones-vacio.rules';

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

    WorkspaceLoadingComponent,

    DataGridComponent,

    DataGridCellDirective,

    LiquidacionDetallePanelComponent,

    LiquidacionPreviewModalComponent,

    LiquidacionesModalDetalleTrabajadorComponent,

    LiquidacionesModalHistorialTrabajadorComponent,

    LiquidacionesModalHistorialNominaComponent,

    PreviredExportacionModalComponent,

  ],

  templateUrl: './liquidaciones-oficiales-container.html',

  styleUrl: './liquidaciones-oficiales-container.css',

})

export class LiquidacionesOficialesContainer {

  readonly periodoActivo = inject(PeriodoActivoService);

  private readonly service = inject(LiquidacionesOficialesService);

  private readonly documentoLiquidacion = inject(DocumentoLiquidacionService);

  private readonly parametrosGenerales = inject(ParametrosGeneralesService);

  private readonly empleadosService = inject(EmpleadosService);

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

  readonly resumenesNomina = signal<readonly NominaPeriodoResumen[]>([]);

  readonly nominasParaModal = computed(() => [...this.nominasConLiquidaciones()]);

  readonly cargandoNominasLista = signal(false);

  readonly modalDetalleTrabajadorAbierto = signal(false);

  readonly historialTrabajador = signal<LiquidacionTrabajador | null>(null);

  readonly historialEventos = signal<readonly LiquidacionRevisionEvento[]>([]);

  readonly historialEmisiones = signal<readonly LiquidacionEmision[]>([]);

  readonly historialTrabajadorCargando = signal(false);

  readonly historialTrabajadorError = signal<string | null>(null);

  readonly historialNominaEntrada = signal<NominaPeriodoResumen | null>(null);

  readonly historialNominaVersion = signal<number | null>(null);

  readonly historialNominaEventos = signal<readonly LiquidacionRevisionEvento[]>([]);

  readonly historialNominaEmisiones = signal<readonly LiquidacionEmision[]>([]);

  readonly historialNominaTrabajadores = signal<readonly LiquidacionTrabajador[]>([]);

  readonly historialNominaCargando = signal(false);

  readonly historialNominaError = signal<string | null>(null);

  readonly modalExportPreviredAbierto = signal(false);

  readonly nominaExportPreviredId = signal<string | null>(null);

  readonly etiquetaExportPrevired = signal('');

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

    puedeRegenerarDesdePantallaLiquidaciones(

      this.nominaInterna()?.estado ?? 'borrador',

      this.nominaInterna()?.evidenciaCalculo?.calculoVigente ?? false,

    ),

  );

  readonly historialVersionesAbierto = signal(false);

  readonly avisoDotacionIncompletaOculto = signal(false);

  readonly sinComprobantesModalOculto = signal(false);

  readonly trabajadoresSinLiquidacionInterna = computed(() => {

    const filas = this.filasLiquidacionesInternas();

    const referencia = liquidacionReferenciaCobertura(filas);

    const dotacionIds = this.nominaInterna()?.trabajadorIds.length ?? 0;

    const totalNomina = dotacionIds > 0
      ? dotacionIds
      : (referencia?.totalTrabajadores ?? 0);

    return calcularTrabajadoresSinLiquidacion(

      totalNomina,

      referencia?.totalTrabajadores,

      { hayLotesMaterializados: filas.length > 0 },

    );

  });

  readonly nominaInternaConEstadoLiquidado = computed(() =>

    tieneLiquidaciones(this.nominaInterna()?.estado ?? 'borrador'),

  );

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

  readonly diffVersionLiquidacionActiva = computed(() =>
    presentarDiffVersionLiquidacion(
      diffVersionLiquidacionConAnterior(this.filasLiquidacionesInternas(), this.filaVersionActiva()),
    ),
  );

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

  readonly puedeExportarPrevired = computed(() => {
    const nomina = this.nominaInterna();
    const id = this.nominaPeriodoId();
    if (!nomina || !id) return false;
    if (this.filasLiquidacionesInternas().length === 0) return false;
    return puedeExportarPreviredNomina(nomina);
  });

  readonly puedeExportarPreviredNomina = puedeExportarPreviredNomina;

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

  readonly cargaNominasInicial = computed(
    () => this.cargandoNominasLista() && !this.contextoOrigen(),
  );

  readonly cargaNominaInternaInicial = computed(
    () => this.cargandoNominaInterna() && this.filasLiquidacionesInternas().length === 0,
  );

  readonly cargaNominaInternaOverlay = computed(
    () => this.cargandoNominaInterna() && this.filasLiquidacionesInternas().length > 0,
  );

  readonly actaVacia = computed(() =>
    construirActaVaciaLiquidaciones(this.resumenesNomina(), this.nominasConLiquidaciones()),
  );

  readonly periodoSeleccionado = computed(() => this.periodoActivo.getPeriodo());

  readonly volverNominaQuery = computed(() => ({ periodo: this.periodoSeleccionado() }));

  readonly rutaAdministradorNominas = '/remuneraciones/nominas';

  readonly error = signal<string | null>(null);

  readonly trabajadorSeleccionado = signal<LiquidacionTrabajador | null>(null);

  readonly conceptosDetalle = signal<LiquidacionConcepto[]>([]);

  readonly cargandoDetalle = signal(false);

  readonly estadosAccionTrabajador = signal<Record<number, LiquidacionAccionUiEstado>>({});

  readonly feedbackAccionTrabajador = signal<LiquidacionFeedbackAccionUi | null>(null);

  readonly previewPdfTrabajador = signal<LiquidacionTrabajador | null>(null);

  readonly previewPdfLiquidacion = signal<LiquidacionCalculada | null>(null);

  readonly empresaDocumento = signal<DocumentoLiquidacionEmpresa | null>(null);

  readonly previewPdfCargando = signal(false);

  readonly previewPdfExtras = signal<{
    trabajadorMeta: LiquidacionDocumentoTrabajadorMetaInput;
    detalle: LiquidacionDocumentoDetalleInput;
    cierre: LiquidacionDocumentoCierreInput;
    numeroDocumento: string;
    fechaEmision: string | null;
  } | null>(null);

  readonly evidenciaRegeneracion = signal<string | null>(null);



  readonly mostrarAvisoDotacionIncompleta = computed(
    () => this.trabajadoresSinLiquidacionInterna() > 0 && !this.avisoDotacionIncompletaOculto(),
  );

  readonly mostrarModalSinComprobantes = computed(
    () =>
      !!this.nominaInterna()
      && !this.cargaNominaInternaInicial()
      && !this.cargandoNominaInterna()
      && this.filasLiquidacionesInternas().length === 0
      && !this.sinComprobantesModalOculto(),
  );

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

  readonly accionViewTrabajadorSeleccionado = computed(() => {
    const trabajador = this.trabajadorSeleccionado();
    if (!trabajador) return null;
    return this.viewTrabajador(trabajador);
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

                : this.actaVacia().chipLabel,

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
          this.avisoDotacionIncompletaOculto.set(false);
          this.sinComprobantesModalOculto.set(false);

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

      this.resumenesNomina.set(resumenes);

      this.nominasConLiquidaciones.set(nominasConLiquidacionesDisponibles(resumenes));

    } catch (error) {

      this.resumenesNomina.set([]);

      this.nominasConLiquidaciones.set([]);

      this.error.set(
        mensajeErrorSupabaseParaUsuario(error, 'cargar el listado de nóminas'),
      );

    } finally {

      this.cargandoNominasLista.set(false);

    }

  }



  reintentarCarga(): void {

    this.error.set(null);

    if (this.nominaPeriodoId()) {

      void this.cargarNominaInterna();

      return;

    }

    void this.cargarNominasLista();

  }

  variantFeedbackAccionTrabajador(tono: LiquidacionFeedbackAccionUi['tono']): MessageBoxVariant {
    switch (tono) {
      case 'review':
        return 'warning';
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      default:
        return 'info';
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

      this.error.set(
        mensajeErrorSupabaseParaUsuario(error, 'cargar las liquidaciones de la nómina'),
      );

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

      this.error.set(
        mensajeErrorSupabaseParaUsuario(error, 'regenerar las liquidaciones'),
      );

    } finally {

      this.regenerandoInterna.set(false);

    }

  }



  volverAdministradorNomina(): void {

    void this.router.navigate([this.rutaAdministradorNominas], {

      queryParams: this.volverNominaQuery(),

    });

  }

  irAdministradorNominas(): void {
    this.volverAdministradorNomina();
  }

  irAlGeneradorNomina(): void {
    const id = this.nominaPeriodoId();
    if (!id) {
      void this.router.navigate([this.rutaAdministradorNominas], {
        queryParams: this.volverNominaQuery(),
      });
      return;
    }
    void this.router.navigate(['/remuneraciones/nominas', id, 'generador'], {
      queryParams: { paso: 'cierre' },
    });
  }

  cerrarAvisoDotacionIncompleta(): void {
    this.avisoDotacionIncompletaOculto.set(true);
  }

  cerrarFeedbackAccionTrabajador(): void {
    this.feedbackAccionTrabajador.set(null);
  }

  cerrarEvidenciaRegeneracion(): void {
    this.evidenciaRegeneracion.set(null);
  }

  cerrarModalSinComprobantes(): void {
    this.sinComprobantesModalOculto.set(true);
  }

  descartarErrorCarga(): void {
    this.error.set(null);
  }

  abrirModalDetalleTrabajador(): void {
    if (!this.trabajadorSeleccionado()) return;
    this.modalDetalleTrabajadorAbierto.set(true);
  }

  cerrarModalDetalleTrabajador(): void {
    this.modalDetalleTrabajadorAbierto.set(false);
  }

  async abrirHistorialTrabajador(trabajador: LiquidacionTrabajador): Promise<void> {
    this.historialTrabajador.set(trabajador);
    this.historialEventos.set([]);
    this.historialEmisiones.set([]);
    this.historialTrabajadorError.set(null);
    this.historialTrabajadorCargando.set(true);

    try {
      const { eventos, emisiones } = await this.service.consultarHistorialRevisionTrabajador(
        trabajador.idLiquidacionTrabajador,
      );
      if (this.historialTrabajador()?.idLiquidacionTrabajador === trabajador.idLiquidacionTrabajador) {
        this.historialEventos.set(eventos);
        this.historialEmisiones.set(emisiones);
      }
    } catch (err) {
      if (this.historialTrabajador()?.idLiquidacionTrabajador === trabajador.idLiquidacionTrabajador) {
        this.historialTrabajadorError.set(
          mensajeErrorSupabaseParaUsuario(err, 'cargar el historial de la liquidación'),
        );
      }
    } finally {
      if (this.historialTrabajador()?.idLiquidacionTrabajador === trabajador.idLiquidacionTrabajador) {
        this.historialTrabajadorCargando.set(false);
      }
    }
  }

  cerrarHistorialTrabajador(): void {
    this.historialTrabajador.set(null);
    this.historialEventos.set([]);
    this.historialEmisiones.set([]);
    this.historialTrabajadorCargando.set(false);
    this.historialTrabajadorError.set(null);
  }

  async abrirHistorialNomina(fila: NominaPeriodoResumen): Promise<void> {
    this.historialNominaEntrada.set(fila);
    this.historialNominaVersion.set(null);
    this.historialNominaEventos.set([]);
    this.historialNominaEmisiones.set([]);
    this.historialNominaTrabajadores.set([]);
    this.historialNominaError.set(null);
    this.historialNominaCargando.set(true);

    try {
      const liquidaciones = await this.nominaService.listarLiquidacionesNomina(fila.id);
      const filas = prepararFilasLiquidacionesInternas(liquidaciones, fila.estado);
      const referencia = liquidacionVigente(filas) ?? filas[0] ?? null;

      if (this.historialNominaEntrada()?.id !== fila.id) return;

      if (!referencia) return;

      this.historialNominaVersion.set(referencia.version);
      const { eventos, emisiones, trabajadores } = await this.service.consultarHistorialRevisionPeriodo(
        referencia.idLiquidacionPeriodo,
      );

      if (this.historialNominaEntrada()?.id !== fila.id) return;

      this.historialNominaEventos.set(eventos);
      this.historialNominaEmisiones.set(emisiones);
      this.historialNominaTrabajadores.set(trabajadores);
    } catch (err) {
      if (this.historialNominaEntrada()?.id === fila.id) {
        this.historialNominaError.set(
          mensajeErrorSupabaseParaUsuario(err, 'cargar el historial de la liquidación'),
        );
      }
    } finally {
      if (this.historialNominaEntrada()?.id === fila.id) {
        this.historialNominaCargando.set(false);
      }
    }
  }

  cerrarHistorialNomina(): void {
    this.historialNominaEntrada.set(null);
    this.historialNominaVersion.set(null);
    this.historialNominaEventos.set([]);
    this.historialNominaEmisiones.set([]);
    this.historialNominaTrabajadores.set([]);
    this.historialNominaCargando.set(false);
    this.historialNominaError.set(null);
  }

  ejecutarAccionTrabajadorDesdeModal(action: LiquidacionAccionUiAction): void {
    const trabajador = this.trabajadorSeleccionado();
    if (!trabajador) return;
    this.ejecutarAccionTrabajadorDg(trabajador, action);
  }

  abrirPreviewPdfDesdeModal(): void {
    const trabajador = this.trabajadorSeleccionado();
    if (!trabajador) return;
    void this.abrirPreviewPdf(trabajador);
  }

  seleccionarVersionDesdeHistorial(idLiquidacionPeriodo: number): void {
    this.seleccionarVersionLiquidacion(idLiquidacionPeriodo);
  }

  abrirExportPreviredNomina(fila: NominaPeriodoResumen): void {
    if (!puedeExportarPreviredNomina(fila)) return;
    this.nominaExportPreviredId.set(fila.id);
    this.etiquetaExportPrevired.set(`${fila.empresaNombre} · ${fila.periodo}`);
    this.modalExportPreviredAbierto.set(true);
  }

  abrirExportPreviredNominaActual(): void {
    const nomina = this.nominaInterna();
    const id = this.nominaPeriodoId();
    if (!nomina || !id || !this.puedeExportarPrevired()) return;
    this.nominaExportPreviredId.set(id);
    this.etiquetaExportPrevired.set(this.etiquetaNominaActiva() ?? `${nomina.empresaNombre} · ${nomina.periodo}`);
    this.modalExportPreviredAbierto.set(true);
  }

  cerrarExportPreviredNomina(): void {
    this.modalExportPreviredAbierto.set(false);
    this.nominaExportPreviredId.set(null);
    this.etiquetaExportPrevired.set('');
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

      this.avisoDotacionIncompletaOculto.set(false);
      this.historialVersionesAbierto.set(this.filasLiquidacionesInternas().length > 1);

      this.feedbackAccionTrabajador.set(null);

    } catch (error) {

      if (this.versionLiquidacionActivaId() !== idLiquidacionPeriodo) return;

      this.trabajadoresLiquidacion.set([]);

      this.error.set(
        mensajeErrorSupabaseParaUsuario(error, 'cargar los trabajadores liquidados'),
      );

    } finally {

      if (this.versionLiquidacionActivaId() === idLiquidacionPeriodo) {

        this.cargandoTrabajadoresLiquidacion.set(false);

      }

    }

  }



  ejecutarAccionTrabajador(event: LiquidacionAccionUiEvent): void {
    if (this.soloLecturaInterna()) return;
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

    void this.service.guardarEstadoRevisionTrabajador(
      event.idLiquidacionTrabajador,
      estadoSiguiente,
      event.tipo,
    )
      .then((actualizado) => this.actualizarTrabajadorEnMemoria(actualizado))
      .catch(() => {
        this.feedbackAccionTrabajador.set({
          mensaje: 'Estado guardado en esta sesión. No se pudo sincronizar con el servidor.',
          tono: 'review',
        });
      });
  }



  private actualizarTrabajadorEnMemoria(actualizado: LiquidacionTrabajador): void {
    this.trabajadoresLiquidacion.update((lista) =>
      lista.map((item) =>
        item.idLiquidacionTrabajador === actualizado.idLiquidacionTrabajador ? actualizado : item,
      ),
    );

    const preview = this.previewPdfTrabajador();
    if (preview?.idLiquidacionTrabajador === actualizado.idLiquidacionTrabajador) {
      this.previewPdfTrabajador.set(actualizado);
    }

    const seleccionado = this.trabajadorSeleccionado();
    if (seleccionado?.idLiquidacionTrabajador === actualizado.idLiquidacionTrabajador) {
      this.trabajadorSeleccionado.set(actualizado);
    }
  }

  private mensajeAccionTrabajador(estado: LiquidacionAccionUiEstado): string {

    switch (estado) {

      case 'autorizada':
        return 'Liquidación autorizada. Puede continuar con el registro de pago.';
      case 'pago_registrado':
        return 'Pago marcado como registrado. Puede marcar la entrega del documento.';
      case 'documento_enviado':
        return 'Documento marcado como entregado.';
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
      .catch((err) =>
        this.error.set(
          mensajeErrorSupabaseParaUsuario(err, 'consultar el detalle del trabajador'),
        ),
      )
      .finally(() => this.cargandoDetalle.set(false));
  }

  cerrarDetalleTrabajador(): void {
    this.trabajadorSeleccionado.set(null);
    this.conceptosDetalle.set([]);
    this.cargandoDetalle.set(false);
  }



  estadoUiTrabajador(trabajador: LiquidacionTrabajador): LiquidacionAccionUiEstado {

    return this.estadosAccionTrabajador()[trabajador.idLiquidacionTrabajador]

      ?? estadoInicialLiquidacionUi(trabajador);

  }



  viewTrabajador(trabajador: LiquidacionTrabajador) {

    return buildLiquidacionAccionUiView(this.estadoUiTrabajador(trabajador), {
      soloLectura: this.soloLecturaInterna(),
    });

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

  async abrirPreviewPdf(trabajador: LiquidacionTrabajador): Promise<void> {
    const periodo = this.nominaInterna()?.periodo;
    if (!periodo) return;

    this.previewPdfTrabajador.set(trabajador);
    this.previewPdfLiquidacion.set(null);
    this.previewPdfExtras.set(null);
    this.previewPdfCargando.set(true);
    this.error.set(null);
    void this.cargarEmpresaDocumento();

    try {
      let conceptos = this.conceptosDetalle();
      const mismoDetalle =
        this.trabajadorSeleccionado()?.idLiquidacionTrabajador === trabajador.idLiquidacionTrabajador
        && conceptos.length > 0;
      if (!mismoDetalle) {
        conceptos = await this.service.obtenerDetalleTrabajador(trabajador.idLiquidacionTrabajador);
      }
      if (!conceptos.length) {
        this.error.set('No hay conceptos materializados para generar la liquidación.');
        this.previewPdfTrabajador.set(null);
        return;
      }

      const [parametros, emision, ficha, configCliente, catalogos] = await Promise.all([
        this.parametrosGenerales.obtenerUltimoHastaPeriodo(periodo).catch(() => null),
        this.service.obtenerUltimaEmisionTrabajador(trabajador.idLiquidacionTrabajador).catch(() => null),
        trabajador.idPersona
          ? this.empleadosService.obtenerPorId(trabajador.idPersona).catch(() => null)
          : Promise.resolve(null),
        this.parametrosGenerales.obtenerUltimaClienteConfigHastaPeriodo(periodo).catch(() => null),
        this.parametrosGenerales.listarCatalogos(periodo).catch(() => null),
      ]);
      await this.cargarEmpresaDocumento();

      this.previewPdfLiquidacion.set(
        mapLiquidacionOficialAPreview({ trabajador, conceptos, periodo }),
      );
      this.previewPdfExtras.set(
        mapDocumentoExtrasDesdeLiquidacionOficial({
          trabajador,
          conceptos,
          periodo,
          empresa: this.empresaDocumento(),
          parametros: parametros ? { uf: parametros.uf, utm: parametros.utm } : null,
          emision,
          ficha,
          configCliente,
          catalogos,
        }),
      );
      void this.registrarEmisionSegura(trabajador.idLiquidacionTrabajador, 'vista_oficial');
    } catch {
      this.error.set('No se pudo preparar la liquidación para imprimir.');
      this.previewPdfTrabajador.set(null);
      this.previewPdfExtras.set(null);
    } finally {
      this.previewPdfCargando.set(false);
    }
  }

  cerrarPreviewPdf(): void {
    this.previewPdfTrabajador.set(null);
    this.previewPdfLiquidacion.set(null);
    this.previewPdfExtras.set(null);
  }

  private async cargarEmpresaDocumento(): Promise<void> {
    if (this.empresaDocumento()) return;
    const empresa = await this.documentoLiquidacion.obtenerEmpresaDocumento(
      this.nominaInterna()?.empresaNombre,
    );
    this.empresaDocumento.set(empresa);
  }

  imprimirPreviewPdf(): void {
    const trabajador = this.previewPdfTrabajador();
    if (trabajador) {
      void this.registrarEmisionSegura(trabajador.idLiquidacionTrabajador, 'impresion_navegador');
    }
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  private registrarEmisionSegura(
    idLiquidacionTrabajador: number,
    canal: 'vista_oficial' | 'impresion_navegador',
  ): void {
    void this.service.registrarEmisionLiquidacionTrabajador(idLiquidacionTrabajador, canal).catch(() => {
      this.feedbackAccionTrabajador.set({
        mensaje: 'La liquidación se muestra, pero no se registró la emisión en el servidor.',
        tono: 'review',
      });
    });
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


