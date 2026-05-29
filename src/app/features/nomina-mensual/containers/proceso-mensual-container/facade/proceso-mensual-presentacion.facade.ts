import { DestroyRef, HostListener, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import { bindShellPageContext } from '../../../../../layout/shell-page-context.binding';
import {
  ShellPageContextService,
  type ShellStatusChipTone,
} from '../../../../../layout/shell-page-context.service';
import type {
  BaseNominaParametrosEstado,
  BaseNominaTrabajadorEstado,
  MotorCalculoPeriodoResultado,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualArea,
  ProcesoMensualEstado,
  ProcesoMensualItemEstado,
  ProcesoMensualMensaje,
  ProcesoMensualPreNominaEstado,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualGrupoParametro,
  ProcesoMensualPrevalidacion,
} from '../../../models/proceso-mensual.model';
import { type RecordBreadcrumbItem } from '../../../../../shared/components/ui/layout/record-breadcrumb.component';
import type { DataGridColumn } from '../../../../../shared/components/ui/data-grid';
import type { ActaOperativaPeriodoViewModel } from '../../../models/acta-operativa-periodo.model';
import { ProcesoMensualPeriodoStore } from '../store/proceso-mensual-periodo.store';
import { formatoFechaHoraNomina, formatoMontoNomina, horaCortaNomina } from '../utils/proceso-mensual-presentacion.formato';
import { validarPeriodoEntradaMensual } from '../../../entradas/rules/entradas-mensuales-periodo.rules';
import { buildActaOperativaPeriodoViewModel } from '../../../rules/acta-operativa-periodo.rules';
import {
  contarBloqueosConfiguracionPeriodo,
  hayPendientesRevisionTrabajadores,
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualAccionLocal,
  type ProcesoMensualEstadoSeveridad,
  type ProcesoMensualPendienteVm,
} from '../../../rules/proceso-mensual-estado-operativo.rules';
import { inferirContextoOperativoPeriodo } from '../../../rules/proceso-mensual-rehidratacion.rules';
import { buildValidacionCalculoPreliminarView } from '../../../rules/proceso-mensual-validacion-calculo.rules';
import {
  buildDetalleRevisionFooterAccion,
  buildDetalleRevisionModalLead,
  buildDetalleRevisionTabPanel,
  buildDetalleRevisionTabsMeta,
  buildExpedienteRevisionCtaForTab,
  claseDetalleRevisionTab,
  DETALLE_REVISION_MODAL_TITULO,
  normalizeDetalleOperativoTab,
  type DetalleRevisionTabMeta,
} from '../../../rules/proceso-mensual-detalle-modal.rules';
import {
  buildExpedienteNominaPeriodo,
} from '../../../rules/proceso-mensual-expediente-periodo.rules';
import {
  buildAccionesNominaPeriodo,
  mostrarAccionesPeriodoNomina,
  type AccionNominaPeriodoId,
} from '../../../rules/proceso-mensual-acciones-periodo.rules';
import { resolveBaseNominaTrazabilidad } from '../../../rules/proceso-mensual-borrador-snapshot.rules';
import {
  buildIncidenciasPeriodo,
  esIncidenciaPeriodoSinPendienteReal,
  filterIncidenciasAlcancePeriodoNomina,
  filterIncidenciasAlcanceTrabajador,
  etiquetaAmbitoIncidencia,
} from '../../../rules/proceso-mensual-incidencias-periodo.rules';
import {
  buildAccionRecomendadaTrabajador,
  buildDetalleMasivoTrabajador,
  buildFilasMasivasTrabajadores,
  buildMovimientosPanelPorTrabajador,
  buildResumenMasivoDesdeFilas,
  buildResumenMasivoNomina,
  filtrarFilasMasivasTrabajadores,
  type NominaMasivaEstado,
  type NominaMasivaFila,
  type NominaMasivaFiltro,
} from '../../../rules/proceso-mensual-masivo-layout.rules';
import { NominaMensualCapabilitiesService } from '../../../services/nomina-mensual-capabilities.service';
import { buildResultadoPreliminarView } from '../../../rules/proceso-mensual-resultado-preliminar.rules';
import { buildRevisionAprobacionView } from '../../../rules/proceso-mensual-revision-aprobacion.rules';
import {
  construirFilasDetalleMovimientoNomina,
  construirItemsSeguimientoMovimientoRecurrenteNomina,
  construirFilasDetalleObservacionNomina,
  construirItemsSeguimientoParametrosNomina,
  construirFilasDetalleRecurrenteNomina,
  construirItemsSeguimientoResultadoNomina,
  construirFilasDetalleResultadoNomina,
  construirFilasDetalleTrabajadorNomina,
  resolverEntradasMensualesPeriodo,
} from '../../../rules/proceso-mensual-payroll-seguimiento.rules';
import {
  claseChipRevision as claseChipRevisionNomina,
  clasePendienteVisual as clasePendienteVisualNomina,
  etiquetaEstadoBaseTrabajador as etiquetaEstadoBaseTrabajadorNomina,
  etiquetaPendienteVisual as etiquetaPendienteVisualNomina,
  humanizarCopyOperativo as humanizarCopyOperativoNomina,
} from '../utils/proceso-mensual-presentacion.labels';
import {
  buildActaPreparacionCentral,
  informacionDebeAbrirModalEnPreparacion,
  mensajePreparacionNominaEnCurso,
  puedeEncadenarGeneracionTrasVerificacion,
  actaPendienteMuestraAccionInline,
  shellDebeOcultarCtaParametros,
  type ActaPreparacionCentralVm,
  type ActaPreparacionPendienteVm,
} from '../../../rules/proceso-mensual-acta-preparacion.rules';
import { mensajeErrorPrenominaParaUsuario } from '../../../rules/prenomina-validacion-ui.rules';
import {
  buildInformacionPeriodoView,
  mapDestinoToDetalleTab,
  resolveDetalleTabForRevision,
  resolveDetalleTabFromPendiente,
} from '../../../rules/proceso-mensual-informacion-periodo.rules';
import {
  buildAlertasPeriodoResumen,
  buildBitacoraEtapas,
  buildNominaDetallePanelCopy,
  buildNominaFrameView,
  buildNominaGuiaPanelCopy,
  buildNominaResumenSuperior,
  buildPreparacionNominaProgresoVm,
  buildResumenRevisionTrabajadores,
  mapBitacoraRailEtapas,
  resolveNominaVisualFrame,
  type PreparacionNominaEtapaClave,
} from '../../../rules/proceso-mensual-workspace.rules';
import {
  buildNominaDetalleMensualMovimientosRows,
  buildNominaDetalleMensualPendientesRows,
  buildAlertasExpedienteInformacionView,
  buildExpedienteCabeceraAlertas,
  buildNominaDetalleMensualSituacion,
  buildNominaDetalleMensualTodosRows,
  buildNominaDetalleMensualTrabajadorRows,
  buildNominaHistorialTablaRows,
  movimientoRowsAExpediente,
} from '../../../rules/proceso-mensual-detalle-mensual.rules';
import { mergeSnapshotsHistorialPeriodo } from '../../../rules/proceso-mensual-historial-periodo.rules';
import {
  buildNominaConfiguracionPeriodoItems,
  buildNominaWorkspaceTabsVisibleMeta,
  buildNominaWorkspaceTabVisibleSummaries,
  resolveFranjaItemTono,
  type NominaConfiguracionPeriodoAccion,
  type NominaWorkspaceTabVisibleSummaryVm,
} from '../../../rules/proceso-mensual-workspace-presentacion.rules';
import { claseSegmentNavActivo } from '../../../rules/proceso-mensual-segment-nav.rules';
import {
  buildFilasMasivasDesdePendientesRevision,
  buildIncidenciasFichaPendiente,
  mergeFilasMasivasConPendientesRevision,
  rutaFichaEmpleadoPendiente,
} from '../../../rules/proceso-mensual-trabajadores-prevalidacion.rules';
import {
  filtroInicialRevisionTrabajadores,
  idPersonaPreseleccionRevision,
  incidenciasPorPersonaMap,
  refineRevisionRailCta,
  resolveAccionCorreccionDesdeFranjaArea,
  resolveAccionCorreccionDesdeFrameCta,
  resolveAccionCorreccionDesdeIncidencia,
  resolveAccionCorreccionDesdePendienteVm,
  resolveAccionCorreccionDesdeExpedienteRow,
  resolveAccionCorreccionDesdePendienteRow,
  resolveAccionCorreccionFilaMasiva,
  type AccionCorreccionVm,
} from '../../../rules/proceso-mensual-correccion.rules';
import {
  AVISO_DRIFT_PARAMETROS_CON_BASE,
  etiquetaClasificacionGrupoParametro,
  tonoGrupoParametro,
  etiquetaGrupoParametroUi,
  NOTA_SOLO_VERIFICACION_PARAMETROS,
  buildParametrosOverlayContexto,
  mapParametrosGruposParaModal,
  etiquetaEstadoConfiguracionPeriodoModal,
  nominaFrameCongeladoObsoleto,
  resolverAccionesFooterModalParametros,
  resolveParametrosListosPeriodo,
  resolveParametrosOperativosPeriodo,
  resolverEstadoPeriodoRemuneracionDesdePrevalidacion,
  type DriftParametrosVm,
} from '../../../rules/proceso-mensual-parametros-refresh.rules';
import {
  buildRevisionPeriodoPreview,
  type RevisionPeriodoPreviewAccion,
} from '../../../rules/proceso-mensual-revision-periodo-preview.rules';
import { buildLiquidacionPreviewTrabajador } from '../../../rules/proceso-mensual-liquidacion-preview-trabajador.rules';
import type { IncidenciaPeriodo } from '../../../rules/proceso-mensual-incidencias-periodo.rules';
import {
  appendNominaFlowQuery,
  buildRevisionRailCta,
  type RevisionRailContext,
  debeRehidratarDesdeFlowQuery,
  detalleTabUsaModal,
  filtrarPendientesRailSecundarios,
  mostrarResumenAmpliadoEnRail,
  resolveFlowDestinoPorFrame,
  resolveWorkspaceTargetFromAccionLocal,
  resolveWorkspaceTargetFromDetalleTab,
  type NominaWorkspaceFlowTarget,
} from '../../../rules/proceso-mensual-flow-nav.rules';
import {
  aplicarFlowQueryNominaMensual,
  crearCorreccionNavegacionPort,
  ejecutarAccionCorreccionDesdeModalEnPort,
  ejecutarAccionCorreccionEnPort,
} from './proceso-mensual-navegacion';
import { ProcesoMensualOverlaysPort } from './proceso-mensual-overlays.port';
import { ProcesoMensualRevisionTrabajadoresPort } from './proceso-mensual-revision-trabajadores.port';
import { ProcesoMensualWorkspacePort } from './proceso-mensual-workspace.port';
import {
  DETALLE_OPERATIVO_TABS,
  NOMINA_DETALLE_MOVIMIENTO_COLUMNS,
  NOMINA_DETALLE_MOVIMIENTO_FILTERS,
  NOMINA_DETALLE_OBSERVACION_COLUMNS,
  NOMINA_DETALLE_OBSERVACION_FILTERS,
  NOMINA_DETALLE_RECURRENTE_COLUMNS,
  NOMINA_DETALLE_RECURRENTE_FILTERS,
  NOMINA_DETALLE_RESULTADO_COLUMNS,
  NOMINA_DETALLE_RESULTADO_FILTERS,
  DETALLE_MENSUAL_EXPEDIENTE_COLUMNS,
  DETALLE_MENSUAL_MOVIMIENTO_COLUMNS,
  DETALLE_MENSUAL_MOVIMIENTO_FILTERS,
  DETALLE_MENSUAL_PENDIENTE_COLUMNS,
  DETALLE_MENSUAL_TRABAJADOR_COLUMNS,
  DETALLE_MENSUAL_TRABAJADOR_FILTERS,
  NOMINA_HISTORIAL_TABLA_COLUMNS,
} from '../models/proceso-mensual-grid.config';
import type {
  AlertasPeriodoResumenVm,
  AprobacionOperativaRegistroView,
  BitacoraEtapaVm,
  BitacoraRailEtapaVm,
  CierreOperativoView,
  ConfirmacionProcesoMensualView,
  InformacionPeriodoDestino,
  InformacionPeriodoView,
  DetalleOperativoTab,
  EtapaOperativaActiva,
  NominaResumenSuperiorVm,
  NominaVisualFrame,
  NominaVisualFrameView,
  NominaDetalleMensualExpedienteRow,
  NominaDetalleMensualMovimientoRow,
  NominaDetalleMensualPendienteRow,
  NominaDetalleMensualVista,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
  ParaContinuarItemVm,
  PasoPeriodoEstado,
  PasoPeriodoView,
  FilaDetalleMovimientoNomina,
  FilaDetalleObservacionNomina,
  FilaDetalleRecurrenteNomina,
  FilaDetalleResultadoNomina,
  ItemSeguimientoNomina,
  FilaDetalleTrabajadorNomina,
  ResultadoObservacionView,
  ResultadoPreliminarEstado,
  ResultadoPreliminarView,
  RevisionAprobacionEstado,
  RevisionAprobacionView,
  RevisionChecklistEstado,
  ValidacionCalculoEstado,
  TrabajadorResultadoPreliminarView,
  ValidacionAccionLocal,
  ValidacionCalculoPreliminarView,
  ValidacionOperativaItemView,
} from '../models/proceso-mensual-container.vm';
import {
  NOMINA_FRANJA_AREAS,
  valorFranjaArea,
  type NominaAreaOperativa,
} from '../models/proceso-mensual-area-orden.config';
import { NOMINA_WORKSPACE_TABS_VISIBLE } from '../models/proceso-mensual-container.vm';

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

@Injectable()
export class ProcesoMensualPresentacionFacade {
  readonly store = inject(ProcesoMensualPeriodoStore);
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly flowQueryParams = toSignal(this.route.queryParams, { initialValue: {} });
  private readonly nominaCapabilities = inject(NominaMensualCapabilitiesService);
  private readonly shellContext = inject(ShellPageContextService);
  private readonly overlaysPort = inject(ProcesoMensualOverlaysPort);
  private readonly workspacePort = inject(ProcesoMensualWorkspacePort);
  private readonly revisionTrabajadoresPort = inject(ProcesoMensualRevisionTrabajadoresPort);

  readonly nominaWorkspaceTabsVisible = NOMINA_WORKSPACE_TABS_VISIBLE;
  readonly nominaFranjaAreas = NOMINA_FRANJA_AREAS;

  private readonly parametrosDriftAvisoSignal = signal<string | null>(null);
  readonly parametrosDriftAviso = this.parametrosDriftAvisoSignal.asReadonly();

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones/proceso-mensual' },
    { label: 'Nómina mensual' },
  ];

  readonly periodoSeleccionado = this.store.periodoSeleccionado;
  readonly resultado = this.store.resultado;
  readonly preNomina = this.store.preNomina;
  readonly calculo = this.store.calculo;
  readonly snapshotActivo = this.store.snapshotActivo;
  readonly validando = this.store.validando;
  readonly consultandoParametros = this.store.consultandoParametros;
  readonly consultaParametrosPeriodo = this.store.consultaParametrosPeriodo;
  readonly generandoPreNomina = this.store.generandoPreNomina;
  readonly calculandoPreliminar = this.store.calculandoPreliminar;
  readonly guardandoSnapshot = this.store.guardandoSnapshot;
  readonly consultandoSnapshot = this.store.consultandoSnapshot;
  readonly consultandoSnapshotCompleto = this.store.consultandoSnapshotCompleto;
  readonly rehidratandoPeriodo = this.store.rehidratandoPeriodo;
  readonly errorEjecucion = this.store.errorEjecucion;
  readonly errorGuardadoResultado = this.store.errorGuardadoResultado;
  readonly errorAprobacionOperativa = this.store.errorAprobacionOperativa;
  readonly errorCierreOperativo = this.store.errorCierreOperativo;

  readonly errorAprobacionOperativaUi = computed(() =>
    mensajeErrorPrenominaParaUsuario(this.errorAprobacionOperativa()),
  );
  readonly errorCierreOperativoUi = computed(() =>
    mensajeErrorPrenominaParaUsuario(this.errorCierreOperativo()),
  );
  readonly errorSnapshotCompleto = this.store.errorSnapshotCompleto;
  readonly exitoGuardadoResultado = this.store.exitoGuardadoResultado;
  readonly identificadorResultadoGuardadoActual = this.store.identificadorResultadoGuardadoActual;
  readonly aprobacionOperativa = this.store.aprobacionOperativa;
  readonly aprobandoResultado = this.store.aprobandoResultado;
  readonly cerrandoNomina = this.store.cerrandoNomina;
  readonly snapshotCompleto = this.store.snapshotCompleto;
  readonly liquidacionesGeneradasCount = this.store.liquidacionesGeneradasCount;
  readonly gestionandoAccionPeriodo = this.store.gestionandoAccionPeriodo;
  readonly errorAccionPeriodo = this.store.errorAccionPeriodo;
  readonly exitoAccionPeriodo = this.store.exitoAccionPeriodo;
  readonly overlay = this.overlaysPort.overlay;

  private readonly encadenarGeneracionTrasVerificacion = signal(false);
  /** Verificar + generar borrador (+ cálculo preliminar) como un solo paso visible para RRHH. */
  private readonly preparacionNominaUnificadaSignal = signal(false);

  private configuracionPeriodoItemsCongelados: ReturnType<
    typeof buildNominaConfiguracionPeriodoItems
  > | null = null;

  private bitacoraRailEtapasCongeladas: BitacoraRailEtapaVm[] | null = null;

  readonly preparacionNominaUnificada = this.preparacionNominaUnificadaSignal.asReadonly();

  readonly flujoEnCurso = computed(
    () => this.store.accionPeriodoEnCurso() || this.preparacionNominaUnificada(),
  );

  readonly preparacionNominaProgreso = computed(() => {
    if (!this.preparacionNominaUnificada()) {
      return null;
    }
    const etapa = this.resolveEtapaPreparacionNomina();
    return buildPreparacionNominaProgresoVm({
      titulo: mensajePreparacionNominaEnCurso(),
      etapaActiva: etapa,
    });
  });

  readonly flujoEnCursoMensaje = computed(() => {
    if (this.preparacionNominaUnificada()) {
      const progreso = this.preparacionNominaProgreso();
      return progreso?.subtitulo ?? mensajePreparacionNominaEnCurso();
    }
    if (this.store.validando()) return 'Verificando período';
    if (this.store.generandoPreNomina()) return 'Generando nómina';
    if (this.store.calculandoPreliminar()) return 'Calculando nómina';
    if (this.store.guardandoSnapshot()) return 'Guardando versión revisada';
    if (this.store.rehidratandoPeriodo() || this.store.consultandoSnapshot() || this.store.consultandoSnapshotCompleto()) {
      return 'Cargando bitácora del período';
    }
    if (this.store.aprobandoResultado()) return 'Registrando revisión';
    if (this.store.cerrandoNomina()) return 'Confirmando nómina';
    if (this.store.gestionandoAccionPeriodo()) return 'Aplicando cambios del período';
    if (this.store.accionPeriodoEnCurso()) {
      return 'Procesando cambios del período';
    }
    return '';
  });

  readonly confirmacionProceso = computed(() => {
    const current = this.overlay();
    return current.kind === 'decision' ? current.view : null;
  });

  readonly informacionPeriodo = computed(() => {
    const current = this.overlay();
    return current.kind === 'informacion' ? current.view : null;
  });

  /** Banner inline cuando hay error de ejecución y el modal de información no está abierto. */
  readonly errorBannerPeriodo = computed(() => {
    if (!this.store.errorEjecucion()) return null;
    if (this.overlay().kind === 'informacion') return null;
    return this.buildInformacionPeriodoPreview();
  });

  readonly detalleOperativoAbierto = computed(() => this.overlay().kind === 'revision');

  readonly detalleOperativoTabActivo = computed(() => {
    const current = this.overlay();
    return current.kind === 'revision'
      ? normalizeDetalleOperativoTab(current.tab)
      : 'trabajadores';
  });
  readonly detalleRevisionModalTitulo = DETALLE_REVISION_MODAL_TITULO;
  readonly detalleRevisionModalLead = computed(() =>
    buildDetalleRevisionModalLead({
      periodoEtiqueta: this.periodoActivo.etiqueta(),
      estadoTitulo: this.estadoOperativo().titulo,
    }),
  );
  readonly detalleRevisionFooterAccion = computed(() =>
    buildDetalleRevisionFooterAccion(this.detalleOperativoTabActivo()),
  );
  readonly incidenciasPeriodo = computed(() => {
    const pendientes = this.pendientesOperativosPeriodo();
    const expediente = this.expedienteNominaPeriodo();
    return buildIncidenciasPeriodo({
      bloqueosOperativos: pendientes.bloqueos,
      advertenciasOperativas: pendientes.advertencias,
      informacionesOperativas: pendientes.informaciones,
      // Ya incluidos en estado.bloqueos / advertencias vía bloqueosCalculo y advertenciasCalculo.
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
      expedienteProblemas: [
        ...expediente.problemas.map((problema) => ({
          severidad: problema.severidad,
          titulo: problema.titulo,
          detalle: problema.detalle,
          trabajador: problema.trabajador,
        })),
        ...this.snapshotIssuesParaIncidencias(),
      ],
    });
  });

  private readonly accionesNominaPeriodoInput = computed(() => ({
    tieneNominaGenerada: this.store.snapshotActivo() != null && this.store.snapshotActivo()?.estado !== 'borrador',
    tieneNominaConfirmada: this.nominaEstaCerradaOperativamente(),
    liquidacionesGeneradas: this.store.liquidacionesGeneradasCount(),
    esAdmin: this.nominaCapabilities.esAdmin(),
    modoPruebas: this.nominaCapabilities.modoPruebas(),
  }));

  readonly mostrarAccionesPeriodoNomina = computed(() =>
    mostrarAccionesPeriodoNomina(this.accionesNominaPeriodoInput()),
  );

  readonly accionesNominaPeriodoNormales = computed(
    () => buildAccionesNominaPeriodo(this.accionesNominaPeriodoInput()).normales,
  );

  readonly accionesNominaPeriodoAdmin = computed(
    () => buildAccionesNominaPeriodo(this.accionesNominaPeriodoInput()).admin,
  );

  readonly detalleRevisionTabs = computed<DetalleRevisionTabMeta[]>(() => {
    const workers = this.filasDetalleTrabajadorNomina();
    return buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias: this.incidenciasPeriodo(),
      cantidadFilasTrabajadores: workers.length,
      cantidadFilasMovimientos: this.filasDetalleMovimientoNomina().length,
      cantidadFilasRecurrentes: this.filasDetalleRecurrenteNomina().length,
      cantidadFilasResultado: this.filasDetalleResultadoNomina().length,
      parametrosListos: this.dashboardResumen().parametrosListos,
      tieneActividadPeriodo:
        this.store.preNomina() != null
        || this.store.calculo() != null
        || this.store.snapshotActivo() != null,
    });
  });
  readonly detalleRevisionTabActivoPanel = computed(() => {
    const tab = this.detalleOperativoTabActivo();
    const tabMeta = this.detalleRevisionTabs().find((item) => item.id === tab);
    return buildDetalleRevisionTabPanel({
      tab,
      tabSeveridad: tabMeta?.severidad ?? 'neutral',
      periodoEtiqueta: this.periodoActivo.etiqueta(),
      estadoTitulo: this.estadoOperativo().titulo,
      incidencias: this.incidenciasPeriodo(),
      cantidadFilasTrabajadores: this.filasDetalleTrabajadorNomina().length,
      cantidadFilasMovimientos: this.filasDetalleMovimientoNomina().length,
      cantidadFilasRecurrentes: this.filasDetalleRecurrenteNomina().length,
      cantidadFilasResultado: this.filasDetalleResultadoNomina().length,
      itemsParametros: this.itemsSeguimientoParametrosNomina(),
      itemsSeguimientoResultado: this.itemsSeguimientoResultadoNomina(),
      filasMovimientos: this.filasDetalleMovimientoNomina(),
      filasRecurrentes: this.filasDetalleRecurrenteNomina(),
      nominaGenerada: this.contextoOperativoPeriodo().baseGenerada,
      preNomina: this.store.preNomina(),
      baseTrazabilidad: this.store.preNomina()?.trazabilidad ?? null,
    });
  });
  readonly expedienteRevisionCta = computed(() => {
    const expediente = this.expedienteNominaPeriodo();
    const principal = expediente.accionPrincipal;
    return buildExpedienteRevisionCtaForTab(this.detalleOperativoTabActivo(), {
      accion: principal?.accion,
      label: principal?.label,
      puedeConfirmarNomina: this.puedeCerrarNominaOperativa(),
      motivoNoPuedeConfirmar: this.motivoNoPuedeCerrarNomina(),
      liquidacionesDisponibles: this.store.liquidacionesGeneradasCount() > 0,
      nominaConfirmada: this.nominaEstaCerradaOperativamente(),
    });
  });
  readonly expedienteNominaPeriodo = computed(() =>
    buildExpedienteNominaPeriodo({
      snapshotActivo: this.store.snapshotActivo(),
      snapshotCompleto: this.store.snapshotCompleto(),
      consultandoSnapshotCompleto: this.consultandoSnapshotCompleto(),
      errorSnapshotCompleto: this.store.errorSnapshotCompleto(),
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
      liquidacionesDisponibles: this.store.liquidacionesGeneradasCount() > 0,
    }),
  );
  readonly nominaWorkspaceTab = this.workspacePort.nominaWorkspaceTab;
  readonly nominaWorkspaceTabVisible = this.workspacePort.nominaWorkspaceTabVisible;
  readonly nominaDetalleMensualVista = this.workspacePort.nominaDetalleMensualVista;

  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(
      destroyRef,
      () => {
        const frame = this.nominaFrame();
        const enPreparacion = this.preparacionNominaUnificada();
        const actaVisible = this.mostrarActaPreparacionCentral();
        const acta = actaVisible ? this.actaPreparacionCentral() : null;
        const ocultarCtaShell = acta != null && shellDebeOcultarCtaParametros(acta);
        return {
          breadcrumbs: [
            { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
            { label: 'Nómina mensual' },
          ],
          statusChip: {
            label: enPreparacion ? 'En curso' : frame.chip,
            tone: enPreparacion ? 'neutral' : toneDesdeNominaFrame(frame.frame),
          },
          primaryAction: ocultarCtaShell || enPreparacion
            ? undefined
            : frame.ctaTipo === 'local' && frame.ctaAccion
              ? {
                  label: frame.ctaLabel,
                  disabled: frame.ctaDisabled,
                  loading: this.flujoEnCurso(),
                  actionId: frame.ctaAccion,
                }
              : frame.ctaTipo === 'ruta' && frame.ctaRuta
                ? {
                    label: frame.ctaLabel,
                    disabled: frame.ctaDisabled,
                    loading: false,
                    actionId: `ruta:${frame.ctaRuta}`,
                  }
                : undefined,
        };
      },
      { onPrimaryAction: () => this.ejecutarShellPrimaryAction() },
    );

    effect(() => {
      const params = this.flowQueryParams();
      untracked(() => {
        const rehidratar = debeRehidratarDesdeFlowQuery(params);
        aplicarFlowQueryNominaMensual(params, this.correccionNavegacionPort());
        if (rehidratar) {
          void this.refrescarParametrosSilencioso();
        }
      });
    });
  }

  private correccionNavegacionPort() {
    return crearCorreccionNavegacionPort({
      periodoActivoYm: () => this.periodoActivo.periodoYm(),
      periodoSeleccionadoYm: () => this.periodoSeleccionado(),
      setPeriodoYm: (periodo) => this.periodoActivo.setPeriodoYm(periodo),
      rehidratarPeriodoActivo: (periodo) => this.store.rehidratarPeriodoActivo(periodo),
      router: this.router,
      cerrarDetalleOperativo: () => this.cerrarDetalleOperativo(),
      abrirTrabajadorEnDetalle: (id, filtro) => this.abrirTrabajadorEnDetalle(id, filtro),
      aplicarDestinoWorkspace: (destino) => this.aplicarDestinoWorkspace(destino),
      seleccionarTrabajadorNominaMasiva: (id) => this.seleccionarTrabajadorNominaMasiva(id),
      abrirInformacionParametrosPeriodo: () => {
        void this.entrarVistaParametros();
      },
      abrirDetalleOperativo: (tab) => this.abrirDetalleOperativo(tab),
    });
  }
  readonly nominaMasivaFiltro = this.revisionTrabajadoresPort.nominaMasivaFiltro;
  readonly nominaMasivaBusqueda = this.revisionTrabajadoresPort.nominaMasivaBusqueda;
  readonly nominaMasivaTrabajadorSeleccionadoId = this.revisionTrabajadoresPort.nominaMasivaTrabajadorSeleccionadoId;
  readonly actaOperativaPreparada = this.workspacePort.actaOperativaPreparada;

  accionPeriodoEnCurso(): boolean {
    return this.store.accionPeriodoEnCurso();
  }

  seleccionarNominaWorkspaceTab(tab: NominaWorkspaceTab): void {
    const filtro = this.workspacePort.seleccionarLegacyTab(tab);
    if (filtro) {
      this.revisionTrabajadoresPort.seleccionarFiltro(filtro);
    }
  }

  seleccionarNominaWorkspaceTabVisible(tab: NominaWorkspaceTabVisible): void {
    this.workspacePort.seleccionarTabVisible(tab);
  }

  seleccionarNominaDetalleMensualVista(vista: NominaDetalleMensualVista): void {
    const filtro = this.workspacePort.seleccionarDetalleMensualVista(vista);
    if (filtro) {
      this.revisionTrabajadoresPort.seleccionarFiltro(filtro);
    }
  }

  ejecutarConfiguracionPeriodo(accion: NominaConfiguracionPeriodoAccion): void {
    switch (accion) {
      case 'abrir_parametros':
        void this.entrarVistaParametros();
        break;
      case 'verificar_periodo':
        this.validarPeriodo();
        break;
      case 'generar_nomina':
        if (this.contextoOperativoPeriodo().tienePrevalidacion) {
          this.generarPreNomina();
        } else {
          this.validarPeriodo();
        }
        break;
      case 'revisar_bloqueos_nomina':
        this.revisarBloqueosOperativos();
        break;
      case 'revisar_trabajadores':
        this.seleccionarNominaDetalleMensualVista('trabajadores');
        break;
      case 'revisar_movimientos':
        this.seleccionarNominaDetalleMensualVista('movimientos');
        break;
      case 'generar_liquidaciones':
      case 'ver_liquidaciones':
        void this.router.navigateByUrl(
          appendNominaFlowQuery('/remuneraciones/liquidaciones', this.periodoSeleccionado()),
        );
        break;
    }
  }

  aplicarDestinoWorkspace(destino: NominaWorkspaceFlowTarget): void {
    if (this.overlay().kind === 'revision') {
      this.overlaysPort.cerrar();
    }
    this.workspacePort.aplicarDestino(destino);
    if (destino.filtroMasivo) {
      this.revisionTrabajadoresPort.seleccionarFiltro(destino.filtroMasivo);
    }
  }

  navegarPendienteExterno(pendiente: ProcesoMensualPendienteVm): void {
    const accion = resolveAccionCorreccionDesdePendienteVm(pendiente);
    if (accion) {
      this.ejecutarAccionCorreccion(accion);
      return;
    }
    if (pendiente.accionLocal) {
      this.ejecutarAccionValidacion(pendiente.accionLocal);
    }
  }

  abrirRevisionEnWorkspaceContextual(): void {
    const tab = resolveDetalleTabForRevision({
      errorEjecucion: this.store.errorEjecucion(),
      validacionCalculo: this.validacionCalculo(),
      bloqueosOperativos: this.estadoOperativo().bloqueos,
      advertenciasOperativas: this.estadoOperativo().advertencias,
      parametrosListos: this.dashboardResumen().parametrosListos === true,
    });
    const destino = resolveWorkspaceTargetFromDetalleTab(tab);
    if (destino) {
      this.aplicarDestinoWorkspace(destino);
      return;
    }
    this.abrirOverlayRevision(tab);
  }

  ejecutarRevisionRailPrincipal(): void {
    const cta = this.revisionRailCta();
    if (cta.accionCorreccion) {
      this.ejecutarAccionCorreccion(cta.accionCorreccion);
      return;
    }
    if (cta.accionLocal === 'generarBase') {
      this.generarPreNomina();
      return;
    }
    if (cta.accionLocal === 'calcularPreliminar') {
      this.calcularPreliminar();
      return;
    }
    if (cta.accionLocal === 'confirmarNomina') {
      this.confirmarNominaMensual();
      return;
    }
    if (cta.revisarFichasGuiada) {
      this.abrirRevisionFichasPrevalidacionGuiada();
      return;
    }
    if (cta.usarPanel) {
      this.abrirRevisionTrabajadoresGuiada();
      return;
    }
    this.ejecutarAccionCorreccion({
      label: cta.label,
      kind: 'modal_tab',
      tabModal: cta.tabModal ?? 'resumen',
    });
  }

  ejecutarRevisionPeriodoPreviewAccion(accion: RevisionPeriodoPreviewAccion | null): void {
    if (!accion) return;
    switch (accion.tipo) {
      case 'validar_periodo':
        this.validarPeriodo();
        return;
      case 'revisar_fichas':
        this.abrirRevisionFichasPrevalidacionGuiada();
        return;
      case 'generar_nomina':
        this.generarPreNomina();
        return;
      case 'pendiente': {
        const codigo = accion.codigoPendiente?.trim();
        if (!codigo) {
          this.ejecutarRevisionRailPrincipal();
          return;
        }
        const pendiente =
          this.estadoOperativo().queFaltaAhora.find((p) => p.codigo === codigo)
          ?? this.estadoOperativo().bloqueos.find((p) => p.codigo === codigo)
          ?? this.estadoOperativo().advertencias.find((p) => p.codigo === codigo);
        if (pendiente) {
          this.navegarPendienteExterno(pendiente);
        } else {
          this.ejecutarRevisionRailPrincipal();
        }
        return;
      }
      default:
        return;
    }
  }

  private readonly incidenciasMasivaPorPersona = computed(() =>
    incidenciasPorPersonaMap(this.incidenciasRevisionTrabajadores()),
  );

  accionCorreccionFilaMasiva(row: NominaMasivaFila): AccionCorreccionVm {
    const clave = this.clavePersonaNominaMasiva(row.idPersona);
    const incidencias = this.incidenciasMasivaPorPersona().get(clave) ?? [];
    return resolveAccionCorreccionFilaMasiva(row, incidencias);
  }

  ejecutarAccionCorreccion(accion: AccionCorreccionVm): void {
    ejecutarAccionCorreccionEnPort(this.correccionNavegacionPort(), accion);
  }

  ejecutarAccionCorreccionDesdeIncidencia(incidencia: IncidenciaPeriodo): void {
    const accion = resolveAccionCorreccionDesdeIncidencia(incidencia);
    if (accion) {
      this.ejecutarAccionCorreccion(accion);
    }
  }

  ejecutarAccionCorreccionFilaMasiva(row: NominaMasivaFila, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const accion = this.accionCorreccionFilaMasiva(row);
    if (accion.kind === 'panel_trabajador') {
      this.abrirTrabajadorEnDetalle(row.idPersona, accion.filtroMasivo);
      return;
    }
    this.seleccionarTrabajadorNominaMasiva(row.idPersona);
    this.ejecutarAccionCorreccion(accion);
  }

  seleccionarFranjaArea(area: NominaAreaOperativa): void {
    if (area === 'parametros') {
      void this.entrarVistaParametros();
      return;
    }
    const incidenciasParam = this.incidenciasPeriodo().porAmbito.parametros ?? [];
    const parametrosListos = this.dashboardResumen().parametrosListos === true;
    const accion = resolveAccionCorreccionDesdeFranjaArea(area, {
      parametrosListos,
      parametrosConIncidenciaRevision: this.parametrosConIncidenciaRevision(parametrosListos, incidenciasParam),
    });
    if (accion) {
      this.ejecutarAccionCorreccion(accion);
    }
  }

  async entrarVistaParametros(opciones?: { silencioso?: boolean }): Promise<void> {
    if (!opciones?.silencioso) {
      const ctx = this.contextoOperativoPeriodo();
      if (!ctx.baseGenerada && !ctx.calculoGenerado && !ctx.resultadoGuardado) {
        this.overlaysPort.iniciarVerificacionParametros({
          frame: this.buildNominaFrameViewActual(),
          resultado: this.store.resultado(),
          workspace: {
            tabVisible: this.nominaWorkspaceTabVisible(),
            detalleVista: this.nominaDetalleMensualVista(),
            legacyTab: this.nominaWorkspaceTab(),
          },
        });
      }
      this.abrirInformacionParametrosPeriodo({ consultando: true });
    }
    const drift = await this.store.refrescarParametrosPeriodo();
    if (opciones?.silencioso) {
      if (drift?.huboCambio && drift.regresion && this.parametrosDriftAfectaLiquidaciones()) {
        this.parametrosDriftAvisoSignal.set(AVISO_DRIFT_PARAMETROS_CON_BASE);
      }
      return;
    }
    this.abrirInformacionParametrosPeriodo({ drift });
  }

  refrescarParametrosSilencioso(): Promise<void> {
    return this.entrarVistaParametros({ silencioso: true });
  }

  descartarAvisoDriftParametros(): void {
    this.parametrosDriftAvisoSignal.set(null);
  }

  /** Parámetros en vivo impactan cálculo/liquidaciones, no re-bloquean generar base si ya existe. */
  private parametrosDriftAfectaLiquidaciones(): boolean {
    const ctx = this.contextoOperativoPeriodo();
    return ctx.baseGenerada || ctx.calculoGenerado || ctx.resultadoGuardado;
  }

  private abrirInformacionParametrosPeriodo(input?: {
    consultando?: boolean;
    drift?: DriftParametrosVm | null;
  }): void {
    this.overlaysPort.abrirInformacion(this.buildParametrosInformacionView(input));
  }

  private buildParametrosInformacionView(input?: {
    consultando?: boolean;
    drift?: DriftParametrosVm | null;
  }): InformacionPeriodoView {
    const prevalidacionParametros = this.store.resultado();
    const gruposEnVivo = this.parametrosGruposEnVivo();
    const consultaParametros = this.store.consultaParametrosPeriodo();
    const parametrosOperativos = resolveParametrosOperativosPeriodo({
      consultaParametrosOperativos: consultaParametros?.parametrosOperativos,
      prevalidacionParametrosOperativos: prevalidacionParametros?.resumen.parametrosOperativos,
    });
    const overlayCtx = buildParametrosOverlayContexto({
      parametrosOperativos,
      parametrosGrupos: gruposEnVivo,
      prevalidacion: prevalidacionParametros,
    });
    const contextoParametros = {
      soloVerificacionParametros: true as const,
      tipoRemuneracionLabel: 'Nómina mensual',
      estadoRemuneracionLabel: etiquetaEstadoConfiguracionPeriodoModal(overlayCtx.estadoCalendario),
      notaSoloVerificacion: NOTA_SOLO_VERIFICACION_PARAMETROS,
    };

    if (input?.consultando) {
      return {
        tone: 'info',
        titulo: 'Parámetros del período',
        consultando: true,
        ...contextoParametros,
        notaSoloVerificacion: undefined,
        bajada: undefined,
      };
    }

    const incidencias = (this.incidenciasPeriodo().porAmbito.parametros ?? []).filter(
      (item) => item.severidad !== 'info',
    );
    const incidenciasRevision = incidencias.filter(
      (item) => item.severidad === 'bloqueo' || (!parametrosOperativos && item.severidad === 'advertencia'),
    );
    const parametrosGrupos = mapParametrosGruposParaModal({
      grupos: gruposEnVivo,
      parametrosOperativos,
      estadoCalendario: overlayCtx.estadoCalendario,
    });
    const avisoDrift =
      input?.drift?.regresion && this.parametrosDriftAfectaLiquidaciones()
        ? AVISO_DRIFT_PARAMETROS_CON_BASE
        : undefined;
    const ctxOperativo = this.contextoOperativoPeriodo();
    const footer = resolverAccionesFooterModalParametros({
      tienePrevalidacion: ctxOperativo.tienePrevalidacion,
      baseGenerada: ctxOperativo.baseGenerada,
      calculoGenerado: ctxOperativo.calculoGenerado,
      resultadoGuardado: ctxOperativo.resultadoGuardado,
      parametrosOperativos,
      preparacionNominaEnCurso: this.preparacionNominaUnificada(),
      flujoPrincipalEnCurso: this.flujoEnCurso(),
    });

    if (parametrosOperativos && incidenciasRevision.length === 0) {
      return {
        tone: incidencias.length ? 'warning' : 'success',
        titulo: 'Parámetros del período',
        bajada: overlayCtx.bajada,
        parametrosGrupos,
        avisoDrift,
        ...contextoParametros,
        accionPrincipal: footer.accionPrincipal,
        accionSecundaria: footer.accionSecundaria,
      };
    }

    return {
      tone: incidencias.some((item) => item.severidad === 'bloqueo') || !parametrosOperativos
        ? 'danger'
        : 'warning',
      titulo: 'Parámetros del período',
      bajada: overlayCtx.bajada,
      parametrosGrupos,
      avisoDrift,
      ...contextoParametros,
      accionPrincipal: footer.accionPrincipal ?? { label: 'Abrir parámetros', destino: 'parametros_app' },
      accionSecundaria: footer.accionSecundaria,
    };
  }

  private parametrosGruposEnVivo(): readonly ProcesoMensualGrupoParametro[] {
    const gruposResultado = this.store.resultado()?.resumen.parametrosGrupos;
    if (gruposResultado?.length) {
      return gruposResultado;
    }
    return this.store.consultaParametrosPeriodo()?.parametrosGrupos ?? [];
  }

  private etiquetaEstadoRemuneracionParametros(): string {
    const prevalidacion = this.store.resultado();
    if (prevalidacion) {
      return resolverEstadoPeriodoRemuneracionDesdePrevalidacion(prevalidacion);
    }
    const consulta = this.store.consultaParametrosPeriodo();
    if (consulta) {
      return consulta.parametrosOperativos ? 'Listo' : 'Faltan datos';
    }
    return 'Sin evaluar';
  }

  private parametrosConIncidenciaRevision(parametrosListos: boolean, incidencias: IncidenciaPeriodo[]): boolean {
    return incidencias.some(
      (item) => item.severidad === 'bloqueo' || (!parametrosListos && item.severidad === 'advertencia'),
    );
  }

  private ejecutarShellPrimaryAction(): void {
    const frame = this.nominaFrame();
    if (
      !this.contextoOperativoPeriodo().baseGenerada
      && frame.ctaTipo === 'local'
      && (frame.ctaAccion === 'validarPeriodo' || frame.ctaAccion === 'generarBase')
    ) {
      this.ejecutarPreparacionPrincipal();
      return;
    }
    if (frame.ctaTipo === 'local' && frame.ctaAccion) {
      this.ejecutarAccionValidacion(frame.ctaAccion);
      return;
    }
    const accion = resolveAccionCorreccionDesdeFrameCta({
      ctaTipo: frame.ctaTipo,
      ctaLabel: frame.ctaLabel,
      ctaRuta: frame.ctaRuta,
      ctaAccion: frame.ctaAccion,
    });
    if (accion) {
      this.ejecutarAccionCorreccion(accion);
    }
  }

  ejecutarAccionCorreccionDesdeModal(input: {
    ruta?: string;
    accionTab?: DetalleOperativoTab;
    label?: string;
  }): void {
    ejecutarAccionCorreccionDesdeModalEnPort(this.correccionNavegacionPort(), input);
  }

  claseChipRevision(estado: string): string {
    return claseChipRevisionNomina(estado);
  }

  clasePendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
    return clasePendienteVisualNomina(severidad);
  }

  etiquetaPendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
    return etiquetaPendienteVisualNomina(severidad);
  }

  /** @deprecated Usar detalleRevisionTabs en el modal de revisión. */
  readonly detalleOperativoTabs = DETALLE_OPERATIVO_TABS;

  claseDetalleRevisionTab(tab: DetalleRevisionTabMeta): string {
    return claseDetalleRevisionTab(tab.severidad, this.detalleOperativoTabActivo() === tab.id);
  }

  esFiltroMasivoActivo(filtro: NominaMasivaFiltro): boolean {
    return this.nominaMasivaFiltro() === filtro;
  }

  claseFiltroNominaMasiva(filtro: NominaMasivaFiltro): string {
    return claseSegmentNavActivo(this.esFiltroMasivoActivo(filtro));
  }

  claseFiltroMasivoStat(filtro: NominaMasivaFiltro): string {
    return claseSegmentNavActivo(this.esFiltroMasivoActivo(filtro), 'stat');
  }

  etiquetaEstadoNominaMasiva(estado: NominaMasivaEstado): string {
    switch (estado) {
      case 'bloqueado':
        return 'Bloqueado';
      case 'observacion':
        return 'Con observaciones';
      case 'no_calculado':
        return 'No calculado';
      case 'listo':
      default:
        return 'Listo';
    }
  }

  claseEstadoNominaMasiva(estado: NominaMasivaEstado): string {
    switch (estado) {
      case 'bloqueado':
        return 'payroll-state-chip payroll-state-chip--danger';
      case 'observacion':
        return 'payroll-state-chip payroll-state-chip--warning';
      case 'no_calculado':
        return 'payroll-state-chip payroll-state-chip--info';
      case 'listo':
      default:
        return 'payroll-state-chip payroll-state-chip--success';
    }
  }

  etiquetaMontoNominaMasiva(valor: number | null): string {
    return valor == null ? 'Monto no disponible' : this.formatoMonto(valor);
  }

  etiquetaPendientesNominaMasiva(cantidad: number): string {
    if (cantidad <= 0) return 'Sin pendientes';
    if (cantidad === 1) return '1 pendiente';
    return `${cantidad} pendientes`;
  }

  ejecutarExpedienteAccionPrincipal(): void {
    const cta = this.expedienteRevisionCta();
    switch (cta.kind) {
      case 'tab':
        this.seleccionarDetalleOperativoTab(cta.tab);
        break;
      case 'confirmar_nomina':
        if (cta.disabled) return;
        this.cerrarNominaOperativa();
        break;
      case 'navegar':
        if (cta.disabled) return;
        this.cerrarOverlay();
        void this.router.navigateByUrl(
          appendNominaFlowQuery(cta.ruta, this.periodoSeleccionado()),
        );
        break;
      case 'none':
        break;
    }
  }
  readonly columnasDetalleMovimientoNomina = NOMINA_DETALLE_MOVIMIENTO_COLUMNS;
  readonly filtrosDetalleMovimientoNomina = NOMINA_DETALLE_MOVIMIENTO_FILTERS;
  readonly columnasDetalleRecurrenteNomina = NOMINA_DETALLE_RECURRENTE_COLUMNS;
  readonly filtrosDetalleRecurrenteNomina = NOMINA_DETALLE_RECURRENTE_FILTERS;
  readonly columnasDetalleObservacionNomina = NOMINA_DETALLE_OBSERVACION_COLUMNS;
  readonly filtrosDetalleObservacionNomina = NOMINA_DETALLE_OBSERVACION_FILTERS;
  readonly columnasDetalleResultadoNomina = NOMINA_DETALLE_RESULTADO_COLUMNS;
  readonly filtrosDetalleResultadoNomina = NOMINA_DETALLE_RESULTADO_FILTERS;
  readonly detalleMensualTrabajadorColumns = DETALLE_MENSUAL_TRABAJADOR_COLUMNS;
  readonly detalleMensualTrabajadorFilters = DETALLE_MENSUAL_TRABAJADOR_FILTERS;
  readonly detalleMensualMovimientoColumns = DETALLE_MENSUAL_MOVIMIENTO_COLUMNS;
  readonly detalleMensualMovimientoFilters = DETALLE_MENSUAL_MOVIMIENTO_FILTERS;
  readonly detalleMensualExpedienteColumns = DETALLE_MENSUAL_EXPEDIENTE_COLUMNS;
  readonly detalleMensualPendienteColumns = DETALLE_MENSUAL_PENDIENTE_COLUMNS;
  readonly nominaHistorialTablaColumns = NOMINA_HISTORIAL_TABLA_COLUMNS;
  readonly nominaMasivaPageSizeOptions = [25, 50, 100];
  readonly nominaMasivaTrabajadoresColumns: DataGridColumn<NominaMasivaFila>[] = [
    { id: 'estado', header: 'Estado', field: 'estado', sortable: true, minWidth: '120px' },
    { id: 'trabajador', header: 'Trabajador', field: 'trabajador', sortable: true, priorityResponsive: 'primary', minWidth: '170px' },
    { id: 'movimientosCount', header: 'Movimientos', field: 'movimientosCount', align: 'center', sortable: true, minWidth: '96px' },
    { id: 'incidenciasCount', header: 'Incidencias', field: 'incidenciasCount', align: 'center', sortable: true, minWidth: '96px' },
    {
      id: 'liquidoEstimado',
      header: 'Líquido estimado',
      field: 'liquidoEstimado',
      align: 'right',
      sortable: true,
      minWidth: '120px',
      format: (_value, row) =>
        this.etiquetaMontoRevisionTrabajador(row.liquidoEstimado, row.monedaContrato),
    },
    { id: 'accion', header: 'Acción', field: 'idPersona', minWidth: '128px' },
  ];

  readonly nominaMasivaMovimientosPanelColumns = DETALLE_MENSUAL_MOVIMIENTO_COLUMNS.filter(
    (column) => column.id !== 'trabajador',
  );

  readonly baseNominaTrazabilidad = computed(() =>
    resolveBaseNominaTrazabilidad({
      preNomina: this.store.preNomina(),
      snapshotActivo: this.store.snapshotActivo(),
      snapshotCompleto: this.store.snapshotCompleto(),
    }),
  );

  readonly cierreOperativo = computed<CierreOperativoView>(() => {
    const snapshot = this.store.snapshotActivo();
    const cierre = snapshot?.cierreOperativo ?? null;
    const resumen = snapshot ? {
      periodo: snapshot.periodo,
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      trabajadoresCalculados: snapshot.totalTrabajadores,
      totalHaberesLabel: this.formatoMonto(snapshot.totalHaberes),
      totalDescuentosLabel: this.formatoMonto(snapshot.totalDescuentos),
      totalLiquidoLabel: this.formatoMonto(snapshot.totalLiquido),
      advertenciasLabel: snapshot.totalAdvertencias > 0
        ? `${snapshot.totalAdvertencias} advertencia(s) visibles quedaran registradas en la trazabilidad interna.`
        : 'Sin advertencias visibles al cierre.',
    } : null;

    if (cierre) {
      return {
        estadoLabel: 'Proceso cerrado',
        descripcion: 'El proceso mensual del período quedó cerrado operativamente.',
        puedeCerrar: false,
        razonNoPuedeCerrar: 'El proceso mensual ya está cerrado.',
        fechaCierreLabel: this.formatoFechaHora(cierre.fecha),
        usuarioLabel: cierre.usuarioLabel,
        observacionLabel: cierre.observacion ?? undefined,
        resumen,
      };
    }

    const razonNoPuedeCerrar = this.motivoNoPuedeCerrarNomina();
    return {
      estadoLabel: razonNoPuedeCerrar ? 'Cierre no disponible' : 'Pendiente de cierre',
      descripcion: 'El cierre congela esta versión como base oficial del período.',
      puedeCerrar: !razonNoPuedeCerrar,
      razonNoPuedeCerrar,
      resumen,
    };
  });

  /** Prevalidación usada por flujo/bitácora/CTA; congela mientras el modal de parámetros está abierto. */
  readonly resultadoFlujoNomina = computed(() => {
    if (this.overlaysPort.verificacionParametrosActiva()) {
      const flujoAvanzo =
        this.store.preNomina() != null
        || this.store.calculo() != null
        || this.store.snapshotActivo() != null;
      if (!flujoAvanzo) {
        return this.overlaysPort.resultadoCongelado();
      }
    }
    return this.store.resultado();
  });

  readonly contextoOperativoPeriodo = computed(() =>
    inferirContextoOperativoPeriodo({
      resultado: this.resultadoFlujoNomina(),
      preNomina: this.store.preNomina(),
      calculo: this.store.calculo(),
      snapshot: this.store.snapshotActivo(),
    }),
  );

  readonly trabajadoresPendientesRevision = computed(() => {
    if (this.nominaEstaCerradaOperativamente()) {
      return [];
    }
    return this.resultadoFlujoNomina()?.trabajadoresPendientesRevision ?? [];
  });

  readonly revisionSoloFichasPrevalidacion = computed(
    () =>
      !this.contextoOperativoPeriodo().baseGenerada
      && this.trabajadoresPendientesRevision().length > 0,
  );

  /** @deprecated Alias para plantillas; usar revisionSoloFichasPrevalidacion. */
  readonly mostrarPanelFichasPrevalidacion = this.revisionSoloFichasPrevalidacion;

  readonly incidenciasRevisionTrabajadores = computed(() => {
    const base = filterIncidenciasAlcanceTrabajador(this.incidenciasPeriodo().todas);
    if (this.nominaEstaCerradaOperativamente()) {
      return base;
    }
    if (this.contextoOperativoPeriodo().baseGenerada) {
      return base;
    }
    return [...base, ...buildIncidenciasFichaPendiente(this.trabajadoresPendientesRevision())];
  });

  readonly incidenciasSituacionNominaRevision = computed(() =>
    filterIncidenciasAlcancePeriodoNomina(this.incidenciasPeriodo().todas),
  );

  readonly revisionTrabajadoresPanel = this.revisionTrabajadoresPort.revisionTrabajadoresPanel;

  readonly mostrarPanelSituacionNominaRevision = computed(
    () => this.incidenciasSituacionNominaRevision().length > 0,
  );

  readonly validacionCalculo = computed<ValidacionCalculoPreliminarView>(() =>
    buildValidacionCalculoPreliminarView({
      periodo: this.store.periodoSeleccionado(),
      resultado: this.resultadoFlujoNomina(),
      preNomina: this.store.preNomina(),
      base: this.baseNominaTrazabilidad(),
      errorEjecucion: this.store.errorEjecucion(),
      nominaCerradaOperativamente: this.nominaEstaCerradaOperativamente(),
      tieneSnapshotPersistido: this.store.snapshotActivo() != null,
      tieneBasePersistida: this.store.snapshotActivo()?.estado === 'borrador',
    }),
  );

  /** Pendientes operativos sin depender de estadoOperativo (evita ciclo con nominaMasivaResumen). */
  readonly pendientesOperativosPeriodo = computed(() => {
    if (this.nominaEstaCerradaOperativamente()) {
      return { bloqueos: [], advertencias: [], informaciones: [] };
    }
    const validacion = this.validacionCalculo();
    const resultado = this.resultadoPreliminar();
    return {
      bloqueos: [
        ...validacion.bloqueos.map((item) => this.pendienteDesdeValidacion(item)),
        ...resultado.bloqueos.map((item) => this.pendienteDesdeResultado(item, 'danger')),
      ],
      advertencias: [
        ...validacion.advertencias.map((item) => this.pendienteDesdeValidacion(item, 'warning')),
        ...resultado.advertencias.map((item) => this.pendienteDesdeResultado(item, 'warning')),
      ],
      informaciones: validacion.informaciones.map((item) => this.pendienteDesdeValidacion(item, 'info')),
    };
  });

  readonly resultadoPreliminar = computed<ResultadoPreliminarView>(() =>
    buildResultadoPreliminarView({
      calculo: this.store.calculo(),
      base: this.baseNominaTrazabilidad(),
      snapshotActivo: this.store.snapshotActivo(),
      snapshotCompleto: this.store.snapshotCompleto(),
      errorGuardadoResultado: this.store.errorGuardadoResultado(),
      identificadorResultadoGuardadoActual: this.store.identificadorResultadoGuardadoActual(),
      puedeCalcular: this.validacionCalculo().puedeCalcular,
      puedeGuardarPreliminar: this.puedeGuardarSnapshot(),
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
      nominaCerradaOperativamente: this.nominaEstaCerradaOperativamente(),
      errorEjecucion: this.store.errorEjecucion(),
      guardandoSnapshot: this.store.guardandoSnapshot(),
    }),
  );

  readonly revisionAprobacion = computed<RevisionAprobacionView>(() =>
    buildRevisionAprobacionView({
      resultadoPreliminar: this.resultadoPreliminar(),
      validacionCalculo: this.validacionCalculo(),
      hayResultadoActual: this.store.calculo() != null,
      snapshotHash: this.store.snapshotActivo()?.hashSnapshot ?? null,
      aprobacionOperativa: this.store.aprobacionOperativa(),
      guardandoSnapshot: this.store.guardandoSnapshot(),
      aprobandoResultado: this.store.aprobandoResultado(),
      nominaCerradaOperativamente: this.nominaEstaCerradaOperativamente(),
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
    }),
  );

  readonly dashboardResumen = computed(() => {
    const resultadoLive = this.store.resultado();
    const resultadoFlujo = this.resultadoFlujoNomina();
    const preNomina = this.store.preNomina();
    const calculo = this.store.calculo();
    const snapshot = this.store.snapshotActivo();
    const contexto = this.contextoOperativoPeriodo();
    const resumenPersistido = snapshot?.borradorPersist?.resumenPrevalidacion ?? null;
    const resumen = resultadoFlujo?.resumen ?? resumenPersistido;
    const resumenParametros = resultadoLive?.resumen ?? resumenPersistido;
    const conteoEstados = resumen?.conteoEntradasPorEstado ?? {};
    const movimientosAprobados =
      (conteoEstados['aprobada'] ?? 0) +
      (conteoEstados['incorporada_a_pre_nomina'] ?? 0) +
      (conteoEstados['calculada'] ?? 0) +
      (resumen?.conteoMovimientosPorEstado['VALIDADO'] ?? 0);
    const movimientosPendientes =
      (conteoEstados['borrador'] ?? 0) +
      (conteoEstados['pendiente_revision'] ?? 0) +
      (resumen?.conteoMovimientosPorEstado['BORRADOR'] ?? 0);

    return {
      estadoPeriodo: resultadoFlujo?.estado ?? null,
      trabajadoresAptos: contexto.trabajadoresAptos ?? resumen?.trabajadoresActivosAptos ?? snapshot?.totalTrabajadores ?? null,
      trabajadoresPorRevisar: resumen?.trabajadoresActivosNoAptos ?? null,
      parametrosListos: resolveParametrosListosPeriodo({
        consultaParametrosOperativos: this.store.consultaParametrosPeriodo()?.parametrosOperativos,
        prevalidacionParametrosOperativos: resumenParametros?.parametrosOperativos,
        persistidoParametrosOperativos: resumen?.parametrosOperativos,
      }),
      movimientosAprobados,
      movimientosPendientes,
      asignacionesAplicables: resumen?.recurrentesAplicablesAlPeriodo ?? null,
      asignacionesPorRevisar: resumen ? resumen.recurrentesInvalidas + resumen.recurrentesFueraDelMes : null,
      resultadoPreliminar: snapshot
        ? 'Guardado para revision'
        : calculo
          ? 'Calculado preliminar'
          : preNomina
            ? 'Base generada'
            : 'Sin calculo',
    };
  });

  readonly estadoOperativo = computed(() => {
    const validacion = this.validacionCalculo();
    const resultado = this.resultadoPreliminar();
    const resultadoBloqueos = asArray(resultado.bloqueos);
    const resultadoAdvertencias = asArray(resultado.advertencias);
    const revision = this.revisionAprobacion();
    const contexto = this.contextoOperativoPeriodo();
    const resultadoPrevalidacion = this.resultadoFlujoNomina();
    return resolverEstadoOperativoProcesoMensual({
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
      tienePrevalidacion: contexto.tienePrevalidacion,
      parametrosOperativos: resultadoPrevalidacion?.resumen.parametrosOperativos ?? false,
      bloqueosPrevalidacion: validacion.bloqueos.map((item) => this.pendienteDesdeValidacion(item)),
      advertenciasPrevalidacion: validacion.advertencias.map((item) => this.pendienteDesdeValidacion(item, 'warning')),
      informacionesPrevalidacion: validacion.informaciones.map((item) => this.pendienteDesdeValidacion(item, 'info')),
      baseGenerada: contexto.baseGenerada,
      calculoGenerado: contexto.calculoGenerado,
      calculoConBloqueos: resultadoBloqueos.length > 0 || this.store.calculo()?.estado === 'con_bloqueos',
      calculoConAdvertencias: resultadoAdvertencias.length > 0,
      bloqueosCalculo: resultadoBloqueos.map((item) => this.pendienteDesdeResultado(item, 'danger')),
      advertenciasCalculo: resultadoAdvertencias.map((item) => this.pendienteDesdeResultado(item, 'warning')),
      resultadoGuardado: contexto.resultadoGuardado,
      aprobadoOperativamente: this.store.aprobacionOperativa() != null,
      cerradoOperativamente: this.nominaEstaCerradaOperativamente(),
      liquidacionesDisponibles: this.store.liquidacionesGeneradasCount() > 0,
      puedeGenerarBase: this.puedeGenerarPreNomina(),
      puedeCalcular: this.puedeCalcularPreliminar(),
      puedeGuardarResultado: resultado.acciones.puedeGuardarPreliminar,
      puedeAprobar: revision.puedeAprobar,
      puedeCerrar: this.puedeCerrarNominaOperativa(),
      razonNoPuedeGuardar: resultado.acciones.razonNoPuedeGuardar,
      razonNoPuedeAprobar: revision.razonNoPuedeAprobar,
      razonNoPuedeCerrar: this.cierreOperativo().razonNoPuedeCerrar,
      revisionTrabajadoresCompleta: this.revisionTrabajadoresCompleta(),
    });
  });

  private revisionTrabajadoresCompleta(): boolean {
    const resumen = this.nominaMasivaResumen();
    return (
      resumen.totalTrabajadores > 0
      && resumen.bloqueados === 0
      && resumen.conObservaciones === 0
    );
  }

  readonly nominaResumenSuperior = computed<NominaResumenSuperiorVm>(() => {
    const resumen = this.dashboardResumen();
    const snapshot = this.store.snapshotActivo();
    const estado = this.estadoOperativo();
    const advertencias = asArray(estado.advertencias);
    const bloqueos = asArray(estado.bloqueos);
    return buildNominaResumenSuperior({
      trabajadoresAptos: resumen.trabajadoresAptos,
      parametrosListos: resumen.parametrosListos,
      movimientosAprobados: resumen.movimientosAprobados,
      movimientosPendientes: resumen.movimientosPendientes,
      asignacionesAplicables: resumen.asignacionesAplicables,
      advertenciasCount: advertencias.length,
      bloqueosCount: bloqueos.length,
      snapshotTotalAdvertencias: snapshot?.totalAdvertencias ?? 0,
      snapshotTotalBloqueados: snapshot?.totalBloqueados ?? 0,
    });
  });

  readonly nominaVisualFrame = computed<NominaVisualFrame>(() =>
    resolveNominaVisualFrame({
      validando: this.store.validando(),
      generandoPreNomina: this.store.generandoPreNomina(),
      calculandoPreliminar: this.store.calculandoPreliminar(),
      rehidratandoPeriodo: this.store.rehidratandoPeriodo(),
      preparacionNominaUnificada: this.preparacionNominaUnificada(),
      estadoClave: this.estadoOperativo().estadoClave,
    }),
  );

  readonly nominaWorkspaceNavigationSugerida = computed(() =>
    resolveFlowDestinoPorFrame(this.nominaVisualFrame()),
  );

  private readonly idPersonaPorNombreTrabajador = computed(() => {
    const map = new Map<string, number | string>();
    for (const fila of this.nominaMasivaFilas()) {
      const clave = fila.trabajador.trim().toLowerCase();
      if (clave && !map.has(clave)) {
        map.set(clave, fila.idPersona);
      }
    }
    return map;
  });

  private readonly syncNominaWorkspaceTab = effect(() => {
    const nav = this.nominaWorkspaceNavigationSugerida();
    untracked(() => {
      if (this.preparacionNominaUnificada()) {
        return;
      }
      if (this.overlaysPort.verificacionParametrosActiva()) {
        return;
      }
      if (this.overlaysPort.consumirOmitirProximaSyncNav()) {
        return;
      }
      this.workspacePort.aplicarDestino(nav);
    });
  });

  private readonly syncInformacionPeriodoEffect = effect(() => {
    this.store.errorEjecucion();
    this.store.resultado();
    this.store.preNomina();
    this.store.calculo();
    this.store.snapshotActivo();
    this.validacionCalculo();
    this.estadoOperativo();
    this.nominaVisualFrame();
    this.store.validando();
    this.store.generandoPreNomina();
    this.store.calculandoPreliminar();
    this.preparacionNominaUnificada();
    if (
      this.preparacionNominaUnificada()
      || this.store.validando()
      || this.store.generandoPreNomina()
      || this.store.calculandoPreliminar()
    ) {
      return;
    }
    if (this.overlaysPort.verificacionParametrosActiva()) {
      return;
    }
    untracked(() => this.sincronizarInformacionPeriodo());
  });

  private readonly encadenarPostValidacionEffect = effect(() => {
    const validando = this.store.validando();
    const encadenar = this.encadenarGeneracionTrasVerificacion();
    const tienePrevalidacion = this.contextoOperativoPeriodo().tienePrevalidacion;
    if (!encadenar || validando || !tienePrevalidacion) {
      return;
    }
    untracked(() => {
      this.encadenarGeneracionTrasVerificacion.set(false);
      if (this.puedeEncadenarGeneracionTrasVerificacion()) {
        this.generarPreNomina();
      } else {
        this.finalizarPreparacionNominaUnificada();
      }
    });
  });

  private readonly finalizarPreparacionNominaUnificadaEffect = effect(() => {
    if (!this.preparacionNominaUnificada()) {
      return;
    }
    const ocupado =
      this.store.validando()
      || this.store.generandoPreNomina()
      || this.store.calculandoPreliminar()
      || this.store.guardandoSnapshot()
      || this.store.consultandoSnapshotCompleto()
      || this.store.rehidratandoPeriodo();
    if (ocupado) {
      return;
    }
    untracked(() => this.finalizarPreparacionNominaUnificada());
  });

  private finalizarPreparacionNominaUnificada(): void {
    this.preparacionNominaUnificadaSignal.set(false);
    this.store.desactivarPreparacionEncadenada();
    this.configuracionPeriodoItemsCongelados = null;
    this.bitacoraRailEtapasCongeladas = null;
  }

  private iniciarPreparacionNominaUnificada(): void {
    this.preparacionNominaUnificadaSignal.set(true);
    this.store.activarPreparacionEncadenada();
    this.configuracionPeriodoItemsCongelados = this.configuracionPeriodoItemsLive();
    this.bitacoraRailEtapasCongeladas = [...this.bitacoraRailEtapasLive()];
  }

  private resolveEtapaPreparacionNomina(): PreparacionNominaEtapaClave | null {
    const desdeStore = this.store.etapaPreparacionNomina();
    if (desdeStore) {
      return desdeStore;
    }
    if (this.store.validando()) return 'verificar';
    if (this.store.generandoPreNomina() && !this.store.calculo()) return 'borrador';
    if (this.store.calculandoPreliminar()) return 'calculo';
    if (this.store.guardandoSnapshot()) return 'guardar';
    if (this.store.consultandoSnapshotCompleto() || this.store.rehidratandoPeriodo()) {
      return 'bitacora';
    }
    return null;
  }

  readonly nominaFrame = computed<NominaVisualFrameView>(() => {
    const actual = this.buildNominaFrameViewActual();
    if (this.overlaysPort.verificacionParametrosActiva()) {
      const congelado = this.overlaysPort.nominaFrameCongelado();
      if (congelado && !nominaFrameCongeladoObsoleto(congelado, actual)) {
        return congelado;
      }
    }
    return actual;
  });

  private buildNominaFrameViewActual(): NominaVisualFrameView {
    const estado = this.estadoOperativo();
    const bloqueos = asArray(estado.bloqueos);
    const advertencias = asArray(estado.advertencias);
    return buildNominaFrameView({
      frame: this.nominaVisualFrame(),
      estadoClave: estado.estadoClave,
      accion: estado.accionPrincipal,
      periodoEtiqueta: this.periodoActivo.etiqueta(),
      bloqueosCount: bloqueos.length,
      advertenciasCount: advertencias.length,
      trabajadoresCount: this.dashboardResumen().trabajadoresAptos ?? this.store.snapshotActivo()?.totalTrabajadores ?? 0,
      resumenRevisionTrabajadores: this.resumenRevisionTrabajadores(),
      accionPeriodoEnCurso: this.accionPeriodoEnCurso(),
      preparacionNominaUnificada: this.preparacionNominaUnificada(),
    });
  }

  readonly nominaGuiaPanel = computed(() =>
    buildNominaGuiaPanelCopy(
      this.nominaVisualFrame(),
      this.periodoActivo.etiqueta(),
      this.estadoOperativo().estadoClave,
    ),
  );

  readonly nominaDetallePanel = computed(() => buildNominaDetallePanelCopy(this.nominaVisualFrame()));

  readonly revisionRailCta = computed(() => {
    const estado = this.estadoOperativo();
    const parametrosListos = this.dashboardResumen().parametrosListos === true;
    const incidenciasParam = this.incidenciasPeriodo().porAmbito.parametros ?? [];
    const tab = resolveDetalleTabForRevision({
      errorEjecucion: this.store.errorEjecucion(),
      validacionCalculo: this.validacionCalculo(),
      bloqueosOperativos: estado.bloqueos,
      advertenciasOperativas: estado.advertencias,
      parametrosListos,
    });
    const destino = resolveWorkspaceTargetFromDetalleTab(tab);
    const ctx: RevisionRailContext = {
      baseGenerada: this.contextoOperativoPeriodo().baseGenerada,
      puedeGenerarNomina: this.puedeGenerarPreNomina(),
      puedeCalcular: this.puedeCalcularPreliminar(),
      hayPendientesRevisionTrabajadores: hayPendientesRevisionTrabajadores([
        ...estado.bloqueos,
        ...estado.advertencias,
      ]),
      hayFichasPendientesPrevalidacion: this.trabajadoresPendientesRevision().length > 0,
      revisionTrabajadoresCompleta: this.revisionTrabajadoresCompleta(),
    };
    const cta = buildRevisionRailCta(tab, destino, ctx);
    return refineRevisionRailCta(cta, destino, {
      parametrosListos,
      parametrosConIncidenciaRevision: this.parametrosConIncidenciaRevision(parametrosListos, incidenciasParam),
      incidencias: this.incidenciasPeriodo(),
    });
  });

  readonly nominaPendientesRailSecundarios = computed<ProcesoMensualPendienteVm[]>(() =>
    filtrarPendientesRailSecundarios(
      [...this.estadoOperativo().bloqueos, ...this.estadoOperativo().advertencias],
      this.revisionRailCta().label,
      2,
      { omitirParametrosSiListos: this.dashboardResumen().parametrosListos === true },
    ),
  );

  readonly mostrarResumenAmpliadoEnRail = computed(() =>
    mostrarResumenAmpliadoEnRail({
      nominaGenerada: this.contextoOperativoPeriodo().baseGenerada,
      vistaTrabajadores:
        this.nominaWorkspaceTabVisible() === 'detalle_mensual'
        && this.nominaDetalleMensualVista() === 'trabajadores',
    }),
  );

  readonly nominaHistorialVisual = computed(() => {
    const snapshots = mergeSnapshotsHistorialPeriodo(
      this.store.historialSnapshotsPeriodo(),
      this.store.snapshotActivo(),
    );
    const items: Array<{ hora: string; texto: string; destacado: boolean; etapa: string; usuario: string; resultado: string }> = [];

    if (this.store.preNomina()) {
      items.push({
        hora: this.horaCorta(this.store.preNomina()?.generadoEn),
        etapa: 'Generación',
        usuario: '—',
        resultado: 'Borrador generado',
        texto: 'Se generó el borrador de nómina mensual.',
        destacado: false,
      });
    }

    for (const s of snapshots) {
      items.push({
        hora: this.horaCorta(s.fechaGeneracion),
        etapa: s.estado === 'borrador' ? 'Generación' : 'Revisión',
        usuario: s.usuarioGenerador || '—',
        resultado: s.estado === 'borrador' ? 'Borrador generado' : 'Versión guardada',
        texto: s.estado === 'borrador'
          ? 'Se generó el borrador de nómina mensual.'
          : 'Se guardó una versión para revisión del período.',
        destacado: false,
      });

      if (s.aprobacionOperativa) {
        items.push({
          hora: this.horaCorta(s.aprobacionOperativa.fecha),
          etapa: 'Revisión RRHH',
          usuario: s.aprobacionOperativa.usuarioLabel || '—',
          resultado: 'Revisión registrada',
          texto: 'Se registró la revisión de RRHH del período.',
          destacado: false,
        });
      }

      if (s.cierreOperativo) {
        items.push({
          hora: this.horaCorta(s.cierreOperativo.fecha),
          etapa: 'Cierre',
          usuario: s.cierreOperativo.usuarioLabel || '—',
          resultado: 'Cerrada',
          texto: 'Se cerró el proceso mensual del período.',
          destacado: true,
        });
      }

      if (s.reaperturaOperativa) {
        items.push({
          hora: this.horaCorta(s.reaperturaOperativa.fecha),
          etapa: 'Reapertura',
          usuario: s.reaperturaOperativa.usuarioLabel || '—',
          resultado: 'Reabierta',
          texto: 'Se reabrió la nómina para revisión.',
          destacado: false,
        });
      }

      if (s.anulacion) {
        items.push({
          hora: this.horaCorta(s.anulacion.fecha),
          etapa: 'Descarte',
          usuario: s.anulacion.usuarioLabel || '—',
          resultado: 'Descartada',
          texto: 'Se descartó la versión generada del período.',
          destacado: false,
        });
      }
    }

    // Orden descendente por hora (HH:mm), estable para la grilla.
    return items.sort((a, b) => String(b.hora).localeCompare(String(a.hora)));
  });

  readonly etapaOperativaActiva = computed<EtapaOperativaActiva>(() => {
    return this.estadoOperativo().disclosureActivo;
  });

  readonly bitacoraEtapas = computed<BitacoraEtapaVm[]>(() => {
    const contexto = this.contextoOperativoPeriodo();
    return buildBitacoraEtapas({
      estado: this.estadoOperativo(),
      tieneResultado: contexto.tienePrevalidacion,
      tienePreNomina: contexto.baseGenerada,
      tieneCalculo: contexto.calculoGenerado,
      tieneSnapshot: contexto.resultadoGuardado,
      tieneAprobacion: this.store.aprobacionOperativa() != null,
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
    });
  });

  readonly registroPeriodoLinea = computed(() => {
    const partes = [
      this.store.resultado() ? 'periodo revisado' : 'nomina sin generar',
      this.store.preNomina() ? 'borrador generado' : 'borrador pendiente',
      this.store.calculo() ? 'trabajadores revisados' : 'revision pendiente',
      this.store.snapshotActivo() ? 'version revisable guardada' : 'version revisable pendiente',
    ];
    if (this.nominaEstaCerradaOperativamente()) {
      partes.push('proceso cerrado');
    } else if (this.store.aprobacionOperativa()) {
      partes.push('nómina aprobada');
    } else if (this.store.snapshotActivo()) {
      partes.push('aprobación pendiente');
    }
    return partes.join(' · ');
  });

  readonly bitacoraRailEtapas = computed<BitacoraRailEtapaVm[]>(() => {
    if (this.preparacionNominaUnificada() && this.bitacoraRailEtapasCongeladas) {
      return this.bitacoraRailEtapasCongeladas;
    }
    return this.bitacoraRailEtapasLive();
  });

  private bitacoraRailEtapasLive(): BitacoraRailEtapaVm[] {
    return mapBitacoraRailEtapas(this.bitacoraEtapas());
  }

  readonly configuracionPeriodoItems = computed(() => {
    if (this.preparacionNominaUnificada() && this.configuracionPeriodoItemsCongelados) {
      const live = this.configuracionPeriodoItemsLive();
      const parametrosLive = live.find((item) => item.id === 'parametros');
      if (!parametrosLive) {
        return this.configuracionPeriodoItemsCongelados;
      }
      return this.configuracionPeriodoItemsCongelados.map((item) =>
        item.id === 'parametros' ? parametrosLive : item,
      );
    }
    return this.configuracionPeriodoItemsLive();
  });

  private configuracionPeriodoItemsLive() {
    const dash = this.dashboardResumen();
    const estado = this.estadoOperativo();
    const bloqueosCfg = contarBloqueosConfiguracionPeriodo(asArray(estado.bloqueos));
    const ctx = this.contextoOperativoPeriodo();
    return buildNominaConfiguracionPeriodoItems({
      parametrosListos: dash.parametrosListos,
      parametrosConsultando:
        this.store.consultandoParametros()
        && this.overlaysPort.overlay().kind !== 'informacion',
      trabajadoresAptos: dash.trabajadoresAptos,
      trabajadoresPorRevisar: dash.trabajadoresPorRevisar ?? 0,
      bloqueosTrabajadoresCount: bloqueosCfg.trabajadores,
      bloqueosNominaCount: bloqueosCfg.nomina,
      advertenciasCount: asArray(estado.advertencias).length,
      movimientosAprobados: dash.movimientosAprobados,
      movimientosPendientes: dash.movimientosPendientes,
      recurrentesAplicables: dash.asignacionesAplicables,
      nominaFrame: this.nominaVisualFrame(),
      nominaGenerada: ctx.baseGenerada,
      tienePrevalidacion: ctx.tienePrevalidacion,
      nominaConfirmada: this.nominaEstaCerradaOperativamente(),
      nominaAprobada: this.store.snapshotActivo()?.aprobacionOperativa?.estado === 'aprobado_operativamente',
      liquidacionesGeneradas: this.liquidacionesGeneradasCount(),
    });
  }

  readonly mostrarActaPreparacionCentral = computed(() => {
    const ctx = this.contextoOperativoPeriodo();
    if (ctx.baseGenerada || this.flujoEnCurso() || this.preparacionNominaUnificada()) {
      return false;
    }
    return ctx.tienePrevalidacion;
  });

  readonly actaPreparacionCentral = computed<ActaPreparacionCentralVm>(() => {
    const estado = this.estadoOperativo();
    const dash = this.dashboardResumen();
    const bloqueos = asArray(estado.bloqueos);
    const advertencias = asArray(estado.advertencias);
    const validacion = this.validacionCalculo();
    const bloqueosValidacion = asArray(validacion.bloqueos).filter((item) => item.codigo !== 'BLOQ-005');
    const advertenciasValidacion = asArray(validacion.advertencias);
    const pendientes = this.trabajadoresPendientesRevision();
    const ctx = this.contextoOperativoPeriodo();
    const informacionPeriodo = this.buildInformacionPeriodoPreview();
    const parametrosOperativos =
      this.store.resultado()?.resumen.parametrosOperativos
      ?? this.store.consultaParametrosPeriodo()?.parametrosOperativos
      ?? false;
    return buildActaPreparacionCentral({
      etapasRail: this.bitacoraRailEtapas(),
      accionPrincipal: estado.accionPrincipal,
      tienePrevalidacion: ctx.tienePrevalidacion,
      trabajadoresAptos: dash.trabajadoresAptos,
      trabajadoresPorRevisar: dash.trabajadoresPorRevisar,
      trabajadoresPendientesRevisionCount: pendientes.length,
      bloqueosCount: bloqueos.length,
      advertenciasCount: advertencias.length,
      validacionCriticos: bloqueosValidacion.length,
      validacionAdvertencias: advertenciasValidacion.length,
      accionPeriodoEnCurso: this.accionPeriodoEnCurso(),
      validando: this.store.validando(),
      generandoPreNomina: this.store.generandoPreNomina(),
      preparacionNominaUnificada: this.preparacionNominaUnificada(),
      frameTexto: this.nominaFrame().texto,
      periodoEtiqueta: this.periodoActivo.etiqueta(),
      informacionPeriodo,
      parametrosGrupos: this.parametrosGruposEnVivo(),
      textosDetalleParametros: this.textosDetalleParametrosDesde(informacionPeriodo),
      parametrosOperativos,
      estadoConfiguracionPeriodo: resolverEstadoPeriodoRemuneracionDesdePrevalidacion(
        this.store.resultado(),
      ),
    });
  });

  private textosDetalleParametrosDesde(_info: InformacionPeriodoView | null): string[] {
    const out: string[] = [];
    const prevalidacion = this.store.resultado();
    const pushTextoParametros = (texto: string | undefined) => {
      const limpio = texto?.trim();
      if (limpio) {
        out.push(limpio);
      }
    };
    for (const bloqueo of prevalidacion?.bloqueos ?? []) {
      if (bloqueo.area === 'PARAMETROS') {
        pushTextoParametros(bloqueo.texto);
      }
    }
    for (const advertencia of prevalidacion?.advertencias ?? []) {
      if (advertencia.area === 'PARAMETROS') {
        pushTextoParametros(advertencia.texto);
      }
    }
    for (const grupo of this.parametrosGruposEnVivo()) {
      pushTextoParametros(grupo.detalle);
    }
    return out;
  }

  readonly alertasPeriodoResumen = computed<AlertasPeriodoResumenVm>(() => {
    const estado = this.estadoOperativo();
    const bloqueos = asArray(estado.bloqueos);
    const advertencias = asArray(estado.advertencias);
    return buildAlertasPeriodoResumen({
      validando: this.store.validando(),
      tieneResultado: this.contextoOperativoPeriodo().tienePrevalidacion,
      nominaGenerada: this.contextoOperativoPeriodo().baseGenerada,
      bloqueosCount: bloqueos.length,
      advertenciasCount: advertencias.length,
    });
  });

  readonly revisionPeriodoPreview = computed(() => {
    const dash = this.dashboardResumen();
    return buildRevisionPeriodoPreview({
      baseGenerada: this.contextoOperativoPeriodo().baseGenerada,
      tienePrevalidacion: this.contextoOperativoPeriodo().tienePrevalidacion,
      puedeGenerarNomina: this.puedeGenerarPreNomina(),
      prevalidacionEstado: this.store.resultado()?.estado ?? null,
      queFaltaAhora: this.estadoOperativo().queFaltaAhora,
      validacionCalculo: this.validacionCalculo(),
      dashboard: {
        parametrosListos: dash.parametrosListos,
        trabajadoresAptos: dash.trabajadoresAptos,
        trabajadoresPorRevisar: dash.trabajadoresPorRevisar,
        movimientosAprobados: dash.movimientosAprobados,
        movimientosPendientes: dash.movimientosPendientes,
        asignacionesAplicables: dash.asignacionesAplicables,
        asignacionesPorRevisar: dash.asignacionesPorRevisar,
      },
      fichasPendientesCount: this.trabajadoresPendientesRevision().length,
      incidencias: this.incidenciasPeriodo(),
    });
  });

  valorFranjaArea(area: NominaAreaOperativa): string {
    if (area === 'parametros' && this.store.consultandoParametros()) {
      return 'Consultando…';
    }
    return valorFranjaArea(area, this.nominaResumenSuperior(), {
      liquidacionesGeneradas: this.liquidacionesGeneradasCount(),
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
    });
  }

  /** Franja lateral activa: Parámetros usa consulta en vivo; Movimientos abre Trabajadores filtrado. */
  franjaOperativaActiva(area: NominaAreaOperativa): boolean {
    if (area === 'parametros') {
      return this.overlaysPort.verificacionParametrosActiva();
    }
    if (this.nominaWorkspaceTabVisible() !== 'detalle_mensual') return false;
    const vista = this.nominaDetalleMensualVista();
    if (area === 'movimientos') return false;
    if (area === 'trabajadores') return vista === 'trabajadores';
    const franja = NOMINA_FRANJA_AREAS.find((item) => item.id === area);
    return franja?.detalleVista != null && vista === franja.detalleVista;
  }

  franjaItemClase(area: NominaAreaOperativa): string {
    const valor = this.valorFranjaArea(area);
    const tono = resolveFranjaItemTono(valor);
    const activo = this.franjaOperativaActiva(area);
    return [
      'payroll-franja-operativa__item',
      `payroll-franja-operativa__item--${tono}`,
      activo ? 'payroll-franja-operativa__item--active' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  readonly nominaWorkspaceTabsMeta = computed(() =>
    buildNominaWorkspaceTabsVisibleMeta({
      tabs: NOMINA_WORKSPACE_TABS_VISIBLE,
      detalleTabs: this.detalleRevisionTabs(),
      incidencias: this.incidenciasPeriodo(),
      tieneActividadPeriodo:
        this.store.preNomina() != null
        || this.store.calculo() != null
        || this.store.snapshotActivo() != null,
      liquidacionesGeneradas: this.store.liquidacionesGeneradasCount() > 0,
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
      bloqueosCount: asArray(this.estadoOperativo().bloqueos).length,
    }),
  );

  readonly nominaWorkspaceTabVisibleSummaries = computed<NominaWorkspaceTabVisibleSummaryVm[]>(() =>
    buildNominaWorkspaceTabVisibleSummaries({
      resumenSuperior: this.nominaResumenSuperior(),
      bloqueosCount: asArray(this.estadoOperativo().bloqueos).length,
      pendientesCount: this.incidenciasPeriodo().resumen.bloqueos + this.incidenciasPeriodo().resumen.advertencias,
      liquidacionesGeneradas: this.liquidacionesGeneradasCount(),
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
      eventosHistorialCount: this.nominaHistorialVisual().length,
    }),
  );

  readonly nominaWorkspaceTabVisibleSummary = computed(() => {
    const active = this.nominaWorkspaceTabVisible();
    return this.nominaWorkspaceTabVisibleSummaries().find((summary) => summary.id === active) ?? null;
  });

  readonly paraContinuarLista = computed<ParaContinuarItemVm[]>(() =>
    this.estadoOperativo()
      .queFaltaAhora.slice(0, 6)
      .map((item) => ({
        titulo: humanizarCopyOperativoNomina(item.titulo),
        detalle: humanizarCopyOperativoNomina(item.descripcion),
      }))
      .filter((item) => item.titulo.length > 0),
  );

  readonly actaPreparacion = computed<ActaOperativaPeriodoViewModel>(() => {
    const estadoOperativo = this.estadoOperativo();
    const resumen = this.dashboardResumen();
    const resultado = this.resultadoPreliminar();
    const snapshot = this.store.snapshotActivo();
    const bloqueos = [
      ...estadoOperativo.bloqueos.map((item) => item.titulo),
      ...resultado.bloqueos.map((item) => item.titulo),
    ];
    const advertencias = [
      ...estadoOperativo.advertencias.map((item) => item.titulo),
      ...resultado.advertencias.map((item) => item.titulo),
    ];
    const tieneValidacionMinima = validarPeriodoEntradaMensual(this.store.periodoSeleccionado()) && (
      this.store.resultado() != null || this.store.preNomina() != null || this.store.calculo() != null || snapshot != null
    );
    return buildActaOperativaPeriodoViewModel({
      periodoLabel: this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
      tieneValidacionMinima,
      actaPreparadaEnSesion: this.actaOperativaPreparada(),
      estadoPeriodoLabel: estadoOperativo.titulo,
      parametrosLabel: resumen.parametrosListos == null ? 'Pendiente de validacion' : resumen.parametrosListos ? 'Listos' : 'Por revisar',
      trabajadoresLabel: resumen.trabajadoresAptos == null
        ? 'Pendiente de validacion'
        : `${resumen.trabajadoresAptos} listo${resumen.trabajadoresAptos === 1 ? '' : 's'} para nomina / ${resumen.trabajadoresPorRevisar} bloqueado${resumen.trabajadoresPorRevisar === 1 ? '' : 's'}`,
      movimientosLabel: `${resumen.movimientosAprobados} aprobados / ${resumen.movimientosPendientes} pendientes`,
      asignacionesLabel: resumen.asignacionesAplicables == null
        ? 'Pendiente de validacion'
        : `${resumen.asignacionesAplicables} aplicables / ${resumen.asignacionesPorRevisar} por revisar`,
      resultadoPreliminarLabel: resumen.resultadoPreliminar,
      resultadoGuardado: snapshot != null,
      bloqueos,
      advertencias,
      pendientes: estadoOperativo.queFaltaAhora.map((item) => item.titulo),
    });
  });

  readonly filasDetalleTrabajadorNomina = computed<FilaDetalleTrabajadorNomina[]>(() =>
    construirFilasDetalleTrabajadorNomina({
      base: this.baseNominaTrazabilidad(),
      expediente: this.expedienteNominaPeriodo(),
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    }),
  );

  private readonly entradasMensualesPeriodo = computed(() =>
    resolverEntradasMensualesPeriodo(
      this.resultadoFlujoNomina()?.entradasMensuales,
      this.store.snapshotActivo()?.borradorPersist?.entradasMensuales,
      this.store.entradasMensualesPeriodoCache(),
    ),
  );

  readonly filasDetalleMovimientoNomina = computed<FilaDetalleMovimientoNomina[]>(() =>
    construirFilasDetalleMovimientoNomina({
      entradasMensuales: this.entradasMensualesPeriodo(),
      base: this.baseNominaTrazabilidad(),
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    }),
  );

  readonly filasDetalleRecurrenteNomina = computed<FilaDetalleRecurrenteNomina[]>(() =>
    construirFilasDetalleRecurrenteNomina({
      entradasMensuales: this.entradasMensualesPeriodo(),
      base: this.baseNominaTrazabilidad(),
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    }),
  );

  readonly filasDetalleObservacionNomina = computed<FilaDetalleObservacionNomina[]>(() =>
    construirFilasDetalleObservacionNomina({ incidencias: this.incidenciasPeriodo().todas }),
  );

  readonly itemsSeguimientoParametrosNomina = computed<ItemSeguimientoNomina[]>(() =>
    construirItemsSeguimientoParametrosNomina({
      parametrosListos: this.dashboardResumen().parametrosListos,
      tieneIncidenciasParametros: this.parametrosConIncidenciaRevision(
        this.dashboardResumen().parametrosListos === true,
        this.incidenciasPeriodo().porAmbito.parametros,
      ),
    }),
  );

  readonly itemsSeguimientoMovimientoRecurrenteNomina = computed<ItemSeguimientoNomina[]>(() =>
    construirItemsSeguimientoMovimientoRecurrenteNomina(
      this.filasDetalleMovimientoNomina(),
      this.filasDetalleRecurrenteNomina(),
    ),
  );

  readonly itemsSeguimientoResultadoNomina = computed<ItemSeguimientoNomina[]>(() =>
    construirItemsSeguimientoResultadoNomina({
      resultado: this.resultadoPreliminar(),
      snapshot: this.store.snapshotActivo(),
    }),
  );

  readonly filasDetalleResultadoNomina = computed<FilaDetalleResultadoNomina[]>(() =>
    construirFilasDetalleResultadoNomina(this.resultadoPreliminar()),
  );

  readonly nominaDetalleMensualTrabajadorRows = computed(() =>
    buildNominaDetalleMensualTrabajadorRows({
      workers: this.filasDetalleTrabajadorNomina(),
      resultados: this.filasDetalleResultadoNomina(),
      idPersonaPorNombre: this.idPersonaPorNombreTrabajador(),
    }),
  );

  readonly nominaDetalleMensualMovimientoRows = computed(() =>
    buildNominaDetalleMensualMovimientosRows({
      movimientos: this.filasDetalleMovimientoNomina(),
      recurrentes: this.filasDetalleRecurrenteNomina(),
      periodoEtiqueta: this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
    }),
  );

  readonly nominaDetalleMensualPendienteRows = computed(() =>
    buildNominaDetalleMensualPendientesRows(this.incidenciasPeriodo()),
  );

  readonly nominaDetalleMensualLiquidacionRows = computed(() => {
    const generadas = this.liquidacionesGeneradasCount();
    const cerrada = this.nominaEstaCerradaOperativamente();
    if (!cerrada && generadas === 0) {
      return [];
    }
    return [
      {
        estado: generadas > 0 ? 'Generado' : 'Pendiente',
        ambito: 'Liquidación' as const,
        trabajador: 'Período',
        conceptoSituacion: generadas > 0
          ? `${generadas} liquidación${generadas === 1 ? '' : 'es'} del período`
          : 'Nómina aprobada. Puede generar liquidaciones',
        origenDuracion: '—',
        vigencia: this.periodoActivo.etiqueta(),
        monto: '—',
        accion: generadas > 0 || cerrada ? 'Ir a liquidaciones' : 'Generar liquidaciones',
        severity: generadas > 0 ? 'listo' as const : 'atencion' as const,
        ruta: generadas > 0 || cerrada ? '/remuneraciones/liquidaciones' : undefined,
      },
    ];
  });

  readonly nominaDetalleMensualSituacion = computed(() =>
    buildNominaDetalleMensualSituacion(this.nominaDetalleMensualPendienteRows()),
  );

  readonly expedienteCabeceraAlertas = computed(() =>
    buildExpedienteCabeceraAlertas(this.nominaDetalleMensualSituacion()),
  );

  readonly nominaDetalleMensualTodosRows = computed(() =>
    buildNominaDetalleMensualTodosRows({
      pendientes: this.nominaDetalleMensualPendienteRows(),
    }),
  );

  readonly nominaHistorialTablaRows = computed(() =>
    buildNominaHistorialTablaRows(this.nominaHistorialVisual()),
  );

  readonly liquidacionesPendientesCopy = computed(() => {
    if (this.nominaEstaCerradaOperativamente() || this.liquidacionesGeneradasCount() > 0) {
      return null;
    }
    return {
      titulo: 'Liquidaciones pendientes',
      descripcion: 'Primero confirma la nómina del período. Luego podrás generar liquidaciones oficiales.',
    };
  });

  private readonly monedaContratoPorPersona = computed(
    () => this.store.resultado()?.monedaContratoPorPersona ?? {},
  );

  private readonly nominaMasivaInput = computed(() => {
    const contexto = this.contextoOperativoPeriodo();
    const nominaCerrada = this.nominaEstaCerradaOperativamente();
    return {
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
      expedienteTrabajadores: this.expedienteNominaPeriodo().trabajadores,
      baseTrabajadores: nominaCerrada ? [] : (this.baseNominaTrazabilidad()?.trabajadores ?? []),
      filasMovimientos: this.filasDetalleMovimientoNomina(),
      filasRecurrentes: this.filasDetalleRecurrenteNomina(),
      incidencias: this.incidenciasRevisionTrabajadores(),
      montosOficialesDisponibles: contexto.calculoGenerado || contexto.resultadoGuardado,
      monedaContratoPorPersona: this.monedaContratoPorPersona(),
    };
  });

  readonly nominaMasivaResumen = computed(() =>
    buildResumenMasivoDesdeFilas(this.nominaMasivaFilas()),
  );

  readonly nominaMasivaStatFiltrosVisibles = computed<
    ReadonlyArray<{ id: NominaMasivaFiltro; label: string; value: number }>
  >(() => {
    const resumen = this.nominaMasivaResumen();
    return [
      { id: 'todos', label: 'Total', value: resumen.totalTrabajadores },
      { id: 'listos', label: 'Listos', value: resumen.listos },
      { id: 'observaciones', label: 'Con observaciones', value: resumen.conObservaciones },
      { id: 'bloqueados', label: 'Bloqueados', value: resumen.bloqueados },
    ];
  });

  readonly nominaMasivaFilas = computed<NominaMasivaFila[]>(() => {
    const input = this.nominaMasivaInput();
    const base = buildFilasMasivasTrabajadores(input);
    if (this.nominaEstaCerradaOperativamente()) {
      return base;
    }
    if (this.contextoOperativoPeriodo().baseGenerada) {
      if (base.length > 0) {
        return base;
      }
      const pendientes = buildFilasMasivasDesdePendientesRevision(this.trabajadoresPendientesRevision());
      return mergeFilasMasivasConPendientesRevision(base, pendientes);
    }
    const pendientes = buildFilasMasivasDesdePendientesRevision(this.trabajadoresPendientesRevision());
    return mergeFilasMasivasConPendientesRevision(base, pendientes);
  });

  readonly nominaMasivaFilasFiltradas = computed<NominaMasivaFila[]>(() =>
    filtrarFilasMasivasTrabajadores(
      this.nominaMasivaFilas(),
      this.nominaMasivaFiltro(),
      this.nominaMasivaBusqueda(),
    ),
  );

  readonly nominaMasivaDetalleSeleccionado = computed(() =>
    buildDetalleMasivoTrabajador({
      ...this.nominaMasivaInput(),
      idPersona: this.nominaMasivaTrabajadorSeleccionadoId(),
    }) ?? this.nominaMasivaDetalleSeleccionadoDesdeFilaVisible(),
  );

  readonly liquidacionPreviewTrabajadorSeleccionado = computed(() => {
    const idPersona = this.nominaMasivaTrabajadorSeleccionadoId();
    const detalle = this.nominaMasivaDetalleSeleccionado();
    if (idPersona == null || !detalle) {
      return buildLiquidacionPreviewTrabajador({
        idPersona: idPersona ?? '',
        periodo: this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
        estadoLabel: '',
        haberes: null,
        descuentos: null,
        liquido: null,
        calculo: this.store.calculo(),
        snapshotCompleto: this.store.snapshotCompleto(),
        incidenciasInfo: [],
      });
    }
    const incidenciasInfo = this.incidenciasRevisionTrabajadores().filter(
      (incidencia) =>
        incidencia.severidad === 'info'
        && (
          incidencia.idPersona == null
          || this.mismaPersonaNominaMasiva(incidencia.idPersona, idPersona)
        ),
    );
    return buildLiquidacionPreviewTrabajador({
      idPersona,
      periodo: this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
      estadoLabel: this.etiquetaEstadoNominaMasiva(detalle.estado),
      haberes: detalle.haberes,
      descuentos: detalle.descuentos,
      liquido: detalle.liquidoEstimado,
      monedaContrato: detalle.monedaContrato,
      calculo: this.store.calculo(),
      snapshotCompleto: this.store.snapshotCompleto(),
      incidenciasInfo,
    });
  });

  readonly nominaMasivaMovimientosPanelRows = computed(() => {
    const detalle = this.nominaMasivaDetalleSeleccionado();
    if (!detalle) return [];
    return buildMovimientosPanelPorTrabajador(
      detalle,
      this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
    );
  });

  private nominaMasivaDetalleSeleccionadoDesdeFilaVisible() {
    const seleccionado = this.nominaMasivaTrabajadorSeleccionadoId();
    if (seleccionado == null) return null;
    const fila = this.nominaMasivaFilas().find(
      (item) => this.mismaPersonaNominaMasiva(item.idPersona, seleccionado),
    );
    if (!fila) return null;
    const incidencias =
      this.incidenciasMasivaPorPersona().get(this.clavePersonaNominaMasiva(fila.idPersona))
      ?? [];
    return {
      idPersona: fila.idPersona,
      trabajador: fila.trabajador,
      rut: fila.rut,
      estado: fila.estado,
      haberes: fila.haberes,
      descuentos: fila.descuentos,
      liquidoEstimado: fila.liquidoEstimado,
      monedaContrato: fila.monedaContrato,
      movimientos: [],
      recurrentes: [],
      incidencias,
    };
  }

  readonly nominaMasivaAccionRecomendadaPanel = computed(() => {
    const detalle = this.nominaMasivaDetalleSeleccionado();
    if (!detalle) return null;
    const fila = this.nominaMasivaFilas().find(
      (item) => this.mismaPersonaNominaMasiva(item.idPersona, detalle.idPersona),
    );
    return buildAccionRecomendadaTrabajador(detalle.incidencias, detalle.estado, fila);
  });

  readonly nominaMasivaTituloContexto = computed(() => {
    if (this.nominaDetalleMensualVista() !== 'trabajadores') return null;
    const cantidad = this.nominaMasivaFilasFiltradas().length;
    if (this.revisionSoloFichasPrevalidacion()) {
      return `Fichas por corregir · ${this.etiquetaCantidadTrabajadores(cantidad)}`;
    }
    return `${this.etiquetaFiltroNominaMasiva(this.nominaMasivaFiltro())} · ${this.etiquetaCantidadTrabajadores(cantidad)}`;
  });

  etiquetaMontoRevisionTrabajador(
    monto: number | null | undefined,
    monedaContrato?: string | null,
  ): string {
    const contexto = this.contextoOperativoPeriodo();
    if (!contexto.baseGenerada && (monto == null || monto === 0)) {
      return 'Sin nómina generada';
    }
    if (
      contexto.baseGenerada
      && !contexto.calculoGenerado
      && !contexto.resultadoGuardado
      && (monto == null || monto === 0)
    ) {
      return 'Pendiente de cálculo';
    }
    if (monto == null) {
      return 'Monto no disponible';
    }
    return formatoMontoNomina(monto, monedaContrato);
  }

  private readonly syncNominaMasivaSeleccion = effect(() => {
    const filas = this.nominaMasivaFilasFiltradas();
    const seleccionado = this.nominaMasivaTrabajadorSeleccionadoId();
    if (filas.length === 0) {
      if (seleccionado != null) {
        untracked(() => this.revisionTrabajadoresPort.limpiarTrabajadorSeleccionado());
      }
      return;
    }
    if (seleccionado == null) {
      return;
    }
    const visible = filas.some((fila) => this.mismaPersonaNominaMasiva(fila.idPersona, seleccionado));
    if (visible) return;
    untracked(() => this.revisionTrabajadoresPort.limpiarTrabajadorSeleccionado());
  });

  mostrarDetalleOperativo(etapa: EtapaOperativaActiva): boolean {
    const estado = this.estadoOperativo().estadoClave;
    const orden: Record<EtapaOperativaActiva, number> = {
      base: 1,
      calculo: 2,
      resultado: 2,
      guardado: 3,
      aprobacion: 4,
      cierre: 5,
      liquidaciones: 6,
    };
    const etapaPorEstado: Record<string, number> = {
      pendiente_validacion: 0,
      periodo_con_pendientes: 1,
      listo_para_generar_base: 1,
      base_lista: 2,
      resultado_con_bloqueos: 2,
      resultado_preliminar_revisable: 2,
      resultado_listo_para_guardar: 2,
      resultado_guardado: 4,
      aprobado_operativamente: 5,
      nomina_cerrada: 6,
      liquidaciones_disponibles: 6,
    };
    const maxEtapa = etapaPorEstado[estado] ?? 0;
    return orden[etapa] <= maxEtapa && maxEtapa > 0;
  }

  readonly pasosPeriodo = computed<PasoPeriodoView[]>(() => {
    return this.estadoOperativo().timeline;
  });

  readonly siguienteAccion = computed(() => {
    const accion = this.validacionCalculo().siguienteAccion;
    const calculo = this.store.calculo();
    const snapshot = this.store.snapshotActivo();

    if (!calculo) {
      return `${accion.label}: ${accion.descripcion}`;
    }
    if (!snapshot) {
      return 'Confirma la revision para dejar la nomina lista.';
    }
    return 'Nomina mensual disponible para revision.';
  });

  validarPeriodo(): void {
    if (this.overlay().kind === 'informacion') {
      this.overlaysPort.cerrar();
    }
    if (!this.store.modoPreparacionEncadenada()) {
      this.overlaysPort.habilitarInformacionPeriodo();
    }
    this.store.validarPeriodo();
  }

  generarPreNomina(): void {
    if (this.overlay().kind === 'informacion') {
      this.overlaysPort.cerrar();
    }
    if (!this.store.modoPreparacionEncadenada()) {
      this.overlaysPort.habilitarInformacionPeriodo();
    }
    this.store.generarPreNomina();
  }

  guardarBaseNominaRevisada(): void {
    this.overlaysPort.suprimirInformacionPeriodo();
    this.store.guardarBaseNominaRevisada();
  }

  exitoGuardadoBaseNomina(): string | null {
    return this.store.exitoGuardadoResultado();
  }

  errorGuardadoBaseNomina(): string | null {
    return this.store.errorGuardadoResultado();
  }

  puedeGuardarBaseNominaRevisada(): boolean {
    const preNomina = this.store.preNomina();
    return !!preNomina
      && this.store.snapshotActivo() == null
      && preNomina.estado !== 'NO_GENERABLE'
      && preNomina.codigosBloqueo.length === 0
      && preNomina.codigosAdvertencia.length > 0
      && !this.store.guardandoSnapshot()
      && !this.nominaEstaCerradaOperativamente();
  }

  calcularPreliminar(): void {
    if (!this.puedeCalcularPreliminar()) return;
    if (this.overlay().kind === 'informacion') {
      this.overlaysPort.cerrar();
    }
    this.overlaysPort.habilitarInformacionPeriodo();
    this.store.calcularPreliminar();
  }

  abrirOverlayRevision(tab: DetalleOperativoTab): void {
    if (this.store.snapshotActivo()) {
      this.store.asegurarSnapshotCompletoCargado();
    }
    this.overlaysPort.abrirRevision(tab);
  }

  abrirOverlayDecision(view: ConfirmacionProcesoMensualView): void {
    this.overlaysPort.abrirDecision(view);
  }

  abrirOverlayInformacion(view: InformacionPeriodoView | null): void {
    if (!view) {
      if (this.overlay().kind === 'informacion') {
        this.overlaysPort.cerrar();
      }
      return;
    }
    this.overlaysPort.abrirInformacion(view);
  }

  cerrarOverlay(): void {
    const current = this.overlay();
    switch (current.kind) {
      case 'informacion':
        this.overlaysPort.cerrarInformacionSuprimida();
        break;
      case 'revision':
        this.overlaysPort.cerrar();
        break;
      case 'decision':
        this.cancelarAccionProceso();
        break;
      case 'cerrado':
        break;
    }
  }

  sincronizarInformacionPeriodo(): void {
    if (this.overlaysPort.informacionPeriodoSuprimida()) return;
    if (this.overlaysPort.verificacionParametrosActiva()) return;
    const current = this.overlay();
    if (current.kind === 'informacion' && current.view.soloVerificacionParametros) return;
    if (current.kind === 'informacion' && current.view.soloAlertasExpediente) return;
    if (current.kind === 'decision' || current.kind === 'revision') return;

    const ctx = this.contextoOperativoPeriodo();
    if (ctx.baseGenerada || ctx.calculoGenerado || ctx.resultadoGuardado) {
      if (current.kind === 'informacion') {
        this.overlaysPort.cerrar();
      }
      return;
    }

    const view = this.buildInformacionPeriodoPreview();
    const actaVisible = this.mostrarActaPreparacionCentral();
    if (actaVisible && !informacionDebeAbrirModalEnPreparacion(view, true)) {
      if (current.kind === 'informacion') {
        this.overlaysPort.cerrar();
      }
      return;
    }
    this.abrirOverlayInformacion(view);
  }

  private buildInformacionPeriodoPreview() {
    return buildInformacionPeriodoView({
      errorEjecucion: this.store.errorEjecucion(),
      validacionCalculo: this.validacionCalculo(),
      paraContinuar: this.paraContinuarLista(),
      bloqueosOperativos: this.estadoOperativo().bloqueos,
      advertenciasOperativas: this.estadoOperativo().advertencias,
      nominaFrame: this.nominaVisualFrame(),
      tienePrevalidacion: this.store.resultado() != null,
      puedeGenerarNomina: this.puedeGenerarPreNomina(),
      tienePreNomina: this.store.preNomina() != null,
      tieneCalculo: this.store.calculo() != null,
      tieneResultado: this.store.snapshotActivo() != null,
      trabajadoresPendientesRevision: this.trabajadoresPendientesRevision(),
      prevalidacionEstado: this.store.resultado()?.estado ?? null,
    });
  }

  private puedeEncadenarGeneracionTrasVerificacion(): boolean {
    return puedeEncadenarGeneracionTrasVerificacion({
      tienePrevalidacion: this.contextoOperativoPeriodo().tienePrevalidacion,
      puedeGenerarNomina: this.puedeGenerarPreNomina(),
      prevalidacionEstado: this.store.resultado()?.estado ?? null,
      validacionCalculo: this.validacionCalculo(),
      trabajadoresPendientesCount: this.trabajadoresPendientesRevision().length,
    });
  }

  ejecutarPreparacionPrincipal(): void {
    const acta = this.actaPreparacionCentral();
    if (acta.accionCorreccion && acta.ctaLabel === acta.accionCorreccion.label) {
      this.overlaysPort.suprimirInformacionPeriodo();
      this.ejecutarDestinoInformacionPeriodo(acta.accionCorreccion.destino);
      return;
    }
    const ctx = this.contextoOperativoPeriodo();
    const accion = this.estadoOperativo().accionPrincipal;
    if (!ctx.baseGenerada) {
      if (!ctx.tienePrevalidacion) {
        this.overlaysPort.suprimirInformacionPeriodo();
        this.iniciarPreparacionNominaUnificada();
        this.encadenarGeneracionTrasVerificacion.set(true);
        this.validarPeriodo();
        return;
      }
      if (accion.accionLocal === 'generarBase' && !accion.disabled) {
        this.iniciarPreparacionNominaUnificada();
        this.generarPreNomina();
        return;
      }
    }
    this.ejecutarAccionPrincipalEstadoOperativo();
  }

  ejecutarAccionSecundariaActa(): void {
    const secundaria = this.actaPreparacionCentral().accionSecundaria;
    if (!secundaria) return;
    this.overlaysPort.suprimirInformacionPeriodo();
    this.ejecutarDestinoInformacionPeriodo(secundaria.destino);
  }

  actaPendienteMuestraAccionInline(
    pendiente: ActaPreparacionPendienteVm,
    acta: ActaPreparacionCentralVm,
  ): boolean {
    return actaPendienteMuestraAccionInline(pendiente, acta);
  }

  ejecutarPendienteActa(pendiente: ActaPreparacionPendienteVm): void {
    this.overlaysPort.suprimirInformacionPeriodo();
    if (pendiente.idPersona != null) {
      this.irACorregirFichaDesdeVerificacion(pendiente.idPersona);
      return;
    }
    if (pendiente.destino) {
      this.ejecutarDestinoInformacionPeriodo(pendiente.destino);
      return;
    }
    this.abrirModalAlertasExpediente();
  }

  cerrarInformacionPeriodo(): void {
    if (this.overlay().kind === 'informacion') {
      if (this.informacionPeriodo()?.soloVerificacionParametros) {
        this.overlaysPort.marcarOmitirProximaSyncNav();
      }
      this.overlaysPort.cerrarInformacionSuprimida();
    }
  }

  confirmarInformacionPeriodo(): void {
    const current = this.overlay();
    if (current.kind !== 'informacion') return;
    const info = current.view;
    const destino = info.accionPrincipal?.destino;
    const reintentarAccion = info.reintentarAccion;
    this.overlaysPort.cerrar();
    if (destino === 'reintentar') {
      this.overlaysPort.habilitarInformacionPeriodo();
    } else {
      this.overlaysPort.suprimirInformacionPeriodo();
    }
    if (!destino) return;
    this.ejecutarDestinoInformacionPeriodo(destino, reintentarAccion);
  }

  cancelarInformacionPeriodo(): void {
    if (this.overlay().kind === 'informacion') {
      if (this.informacionPeriodo()?.soloVerificacionParametros) {
        this.overlaysPort.marcarOmitirProximaSyncNav();
      }
      this.overlaysPort.cerrarInformacionSuprimida();
    }
  }

  confirmarErrorBannerPeriodo(): void {
    const view = this.errorBannerPeriodo();
    if (!view?.accionPrincipal) return;
    const destino = view.accionPrincipal.destino;
    if (destino === 'cerrar') {
      this.descartarErrorEjecucion();
      return;
    }
    this.ejecutarDestinoInformacionPeriodo(destino, view.reintentarAccion);
  }

  cerrarErrorBannerPeriodo(): void {
    this.descartarErrorEjecucion();
  }

  descartarErrorEjecucion(): void {
    this.store.errorEjecucion.set(null);
  }

  ejecutarAccionSecundariaInformacionPeriodo(): void {
    const current = this.overlay();
    if (current.kind !== 'informacion') return;
    const destino = current.view.accionSecundaria?.destino;
    if (!destino || destino === 'cerrar') return;
    this.overlaysPort.cerrar();
    this.overlaysPort.suprimirInformacionPeriodo();
    this.ejecutarDestinoInformacionPeriodo(destino);
  }

  irACorregirFichaDesdeVerificacion(idPersona: number): void {
    this.cerrarInformacionPeriodo();
    void this.router.navigateByUrl(rutaFichaEmpleadoPendiente(idPersona));
  }

  private ejecutarDestinoInformacionPeriodo(
    destino: InformacionPeriodoDestino,
    reintentarAccion?: ValidacionAccionLocal,
  ): void {
    if (destino === 'reintentar') {
      if (reintentarAccion) {
        this.ejecutarAccionValidacion(reintentarAccion);
      }
      return;
    }
    if (destino === 'cerrar') return;
    if (destino === 'generar_nomina') {
      this.ejecutarAccionValidacion('generarBase');
      return;
    }
    if (destino === 'parametros_app' || destino === 'parametros') {
      this.ejecutarAccionCorreccion({ label: 'Abrir parámetros', kind: 'ruta', ruta: '/parametros' });
      return;
    }
    if (destino === 'validar_periodo') {
      this.validarPeriodo();
      return;
    }
    if (destino === 'trabajadores_fichas') {
      this.abrirRevisionFichasPrevalidacionGuiada();
      return;
    }
    const tab = mapDestinoToDetalleTab(destino);
    if (tab) {
      this.abrirDetalleOperativo(tab);
    }
  }

  abrirTrabajadorEnDetalle(idPersona: number | string, filtroMasivo?: NominaMasivaFiltro): void {
    this.aplicarDestinoWorkspace({
      tabVisible: 'detalle_mensual',
      detalleVista: 'trabajadores',
      legacyTab: 'trabajadores',
      filtroMasivo,
    });
    this.seleccionarTrabajadorNominaMasiva(idPersona);
  }

  abrirDetalleExpedienteRow(row: NominaDetalleMensualExpedienteRow): void {
    this.ejecutarAccionCorreccion(resolveAccionCorreccionDesdeExpedienteRow(row));
  }

  ejecutarAccionCorreccionMovimientoPanel(row: NominaDetalleMensualMovimientoRow): void {
    const idPersona = this.nominaMasivaTrabajadorSeleccionadoId();
    const [expediente] = movimientoRowsAExpediente([row], this.idPersonaPorNombreTrabajador());
    this.ejecutarAccionCorreccion(
      resolveAccionCorreccionDesdeExpedienteRow({
        ...expediente,
        idPersona: idPersona ?? expediente.idPersona,
      }),
    );
  }

  abrirModalAlertasExpediente(): void {
    const situacion = this.nominaDetalleMensualSituacion();
    if (!buildExpedienteCabeceraAlertas(situacion).tieneAlertas) {
      return;
    }
    this.overlaysPort.abrirInformacion(buildAlertasExpedienteInformacionView(situacion));
  }

  abrirAlertaExpedienteDesdeModal(fila: NominaDetalleMensualPendienteRow): void {
    this.cerrarInformacionPeriodo();
    this.abrirDetallePendienteRow(fila);
  }

  abrirDetallePendienteRow(row: NominaDetalleMensualPendienteRow): void {
    this.ejecutarAccionCorreccion(resolveAccionCorreccionDesdePendienteRow(row));
  }

  irAlDetalleDelPeriodoDesdeModal(tab: DetalleOperativoTab = 'trabajadores'): void {
    this.ejecutarAccionCorreccionDesdeModal({
      accionTab: tab,
      label: 'Ir al detalle del período',
    });
  }

  solicitarAbrirNomina(): void {
    this.abrirOverlayDecision({
      tipo: 'abrir_nomina',
      titulo: 'Abrir nómina del período',
      mensaje: 'La nómina volverá a revisión. Podrá corregir datos antes de volver a aprobarla.',
      detalle: 'Esta acción no elimina liquidaciones ni modifica movimientos ya registrados.',
      puntos: [
        'La aprobación operativa quedará revertida para este período.',
        'Podrá revisar trabajadores, parámetros y resultado antes de aprobar de nuevo.',
      ],
      primaryLabel: 'Abrir nómina',
      secondaryLabel: 'Mantener cerrada',
    });
  }

  solicitarDescartarNomina(): void {
    this.abrirOverlayDecision({
      tipo: 'descartar_nomina',
      titulo: 'Descartar nómina generada',
      mensaje:
        'Se eliminará la versión generada del período. Esta acción solo está permitida porque no existen liquidaciones generadas.',
      detalle: 'El período volverá al estado previo a guardar la versión revisable.',
      puntos: [
        'No se generan liquidaciones ni archivos legales con esta acción.',
        'Si necesita conservar evidencia, exporte o revise el detalle antes de continuar.',
      ],
      primaryLabel: 'Descartar nómina',
      secondaryLabel: 'Conservar nómina',
    });
  }

  solicitarForzarApertura(): void {
    this.abrirOverlayDecision({
      tipo: 'forzar_apertura',
      titulo: 'Forzar apertura de nómina',
      mensaje:
        'Esta es una acción administrativa para pruebas. Puede dejar la nómina en revisión aunque existan liquidaciones generadas.',
      detalle: 'No sustituye el flujo productivo de reversa de liquidaciones.',
      puntos: [
        'Queda registrada en la trazabilidad del período.',
        'Use solo en ambiente de pruebas con rol administrador.',
      ],
      primaryLabel: 'Forzar apertura',
      secondaryLabel: 'Cancelar',
    });
  }

  solicitarForzarEliminacion(): void {
    this.abrirOverlayDecision({
      tipo: 'forzar_eliminacion',
      titulo: 'Forzar eliminación de nómina',
      mensaje:
        'Esta es una acción administrativa para pruebas. Puede dejar el período sin nómina generada aunque existan datos relacionados.',
      detalle: 'No sustituye el flujo productivo de anulación de liquidaciones.',
      puntos: [
        'La versión activa del período quedará anulada.',
        'Use solo en ambiente de pruebas con rol administrador.',
      ],
      primaryLabel: 'Forzar eliminación',
      secondaryLabel: 'Cancelar',
    });
  }

  ejecutarAccionNominaPeriodo(id: AccionNominaPeriodoId): void {
    switch (id) {
      case 'abrir_nomina':
        this.solicitarAbrirNomina();
        break;
      case 'descartar_nomina':
        this.solicitarDescartarNomina();
        break;
      case 'forzar_apertura':
        this.solicitarForzarApertura();
        break;
      case 'forzar_eliminacion':
        this.solicitarForzarEliminacion();
        break;
    }
  }

  guardarSnapshotPreliminar(): void {
    this.abrirOverlayDecision({
      tipo: 'guardar_preliminar',
      variant: 'decision',
      eyebrow: 'Revisión de nómina',
      titulo: 'Guardar revisión del período',
      mensaje: 'Se guardará la versión revisada de la nómina mensual de este período.',
      detalle: 'No es la confirmación oficial ni genera liquidaciones.',
      puntosTitulo: 'Qué queda registrado',
      puntos: [
        'Versión revisada disponible para registrar la revisión de remuneraciones.',
        'Si cambian datos del período, deberá revisar y guardar una nueva versión.',
      ],
      mostrarProximaAccion: true,
      proximaAccion: 'Registrar la revisión de RRHH y luego confirmar la nómina del período.',
      primaryLabel: 'Guardar revisión',
      secondaryLabel: 'Cancelar',
    });
  }

  private ejecutarGuardarSnapshotPreliminar(): void {
    this.store.ejecutarGuardarSnapshotPreliminar();
  }

  verSnapshotActivo(): void {
    this.store.verSnapshotActivo();
  }

  consultarDetalleResultadoGuardado(): void {
    this.store.consultarDetalleResultadoGuardado();
  }

  private resetearEstadoPeriodo(): void {
    this.store.resetearEstadoPeriodo();
    this.overlaysPort.cerrar();
    this.overlaysPort.habilitarInformacionPeriodo();
    this.actaOperativaPreparada.set(false);
  }

  recalcularYReemplazarSnapshot(): void {
    this.store.recalcularYReemplazarSnapshot();
  }

  etiquetaEstadoGlobal(estado: ProcesoMensualEstado | null): string {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'Listo para revisar nómina';
      case 'CON_ADVERTENCIAS':
        return 'Con advertencias';
      case 'BLOQUEADO':
        return 'Bloqueado';
      case 'SIN_EVALUAR':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantEstado(estado: ProcesoMensualEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'success';
      case 'CON_ADVERTENCIAS':
        return 'warning';
      case 'BLOQUEADO':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoPreNomina(estado: ProcesoMensualPreNominaEstado | null): string {
    switch (estado) {
      case 'GENERADA':
        return 'Nomina mensual generada';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'Nomina generada con advertencias';
      case 'NO_GENERABLE':
        return 'Nomina no generable';
      default:
        return 'Sin generar';
    }
  }

  badgeVariantPreNomina(estado: ProcesoMensualPreNominaEstado | null): 'success' | 'warning' | 'error' | 'default' {
    switch (estado) {
      case 'GENERADA':
        return 'success';
      case 'GENERADA_CON_ADVERTENCIAS':
        return 'warning';
      case 'NO_GENERABLE':
        return 'error';
      default:
        return 'default';
    }
  }

  puedeGenerarPreNomina(): boolean {
    const r = this.resultadoFlujoNomina();
    const ctx = this.contextoOperativoPeriodo();
    if (!r || this.nominaEstaCerradaOperativamente() || this.store.validando() || this.store.generandoPreNomina()) {
      return false;
    }
    if (ctx.baseGenerada || ctx.calculoGenerado || ctx.resultadoGuardado) {
      return false;
    }
    return r.estado !== 'BLOQUEADO' && r.resumen.parametrosOperativos;
  }

  puedeCalcularPreliminar(): boolean {
    return this.validacionCalculo().puedeCalcular && !this.nominaEstaCerradaOperativamente() && !this.store.validando() && !this.store.generandoPreNomina() && !this.store.calculandoPreliminar();
  }

  aprobarResultadoPreliminar(): void {
    const revision = this.revisionAprobacion();
    const snapshot = this.store.snapshotActivo();
    if (!revision.puedeAprobar || !snapshot) return;
    const advertenciasAprobacion = (revision.advertencias ?? []).map((advertencia) => advertencia.descripcion);
    if (advertenciasAprobacion.length === 0 && (snapshot.totalAdvertencias ?? 0) > 0) {
      advertenciasAprobacion.push(`Resultado guardado con ${snapshot.totalAdvertencias} advertencia(s) no bloqueante(s).`);
    }
    this.abrirOverlayDecision({
      tipo: 'aprobar_preliminar',
      variant: 'decision',
      eyebrow: 'Revisión de nómina',
      titulo: 'Aprobar nómina',
      mensaje: 'Registra que remuneraciones revisó y aprobó la versión guardada de este período.',
      detalle: 'No cierra el período ni genera liquidaciones en este paso.',
      puntosTitulo: 'Qué implica',
      puntos: advertenciasAprobacion.length > 0
        ? [
            'Las advertencias visibles quedarán como observaciones de la revisión.',
            'Puede continuar si no bloquean el proceso.',
          ]
        : [
            'Queda respaldo interno de la aprobación operativa.',
            'El siguiente paso es emitir liquidaciones desde la barra superior.',
      ],
      mostrarProximaAccion: true,
      proximaAccion: 'Generar liquidaciones del período antes de cerrar el proceso mensual.',
      primaryLabel: 'Aprobar nómina',
      secondaryLabel: 'Cancelar',
      advertenciasAprobacion,
    });
  }

  confirmarNominaMensual(): void {
    const estado = this.estadoOperativo().estadoClave;
    if (estado === 'base_lista') {
      this.calcularPreliminar();
      return;
    }
    if (estado === 'resultado_listo_para_guardar') {
      this.guardarSnapshotPreliminar();
      return;
    }
    if (estado === 'resultado_guardado') {
      // Split del flujo: tras guardar, el paso es aprobar (no cerrar).
      this.aprobarResultadoPreliminar();
      return;
    }
    if (estado === 'aprobado_operativamente') {
      // Si ya hay liquidaciones emitidas, cierra; si no, dirige a emitir liquidaciones.
      if (this.store.liquidacionesGeneradasCount() > 0) {
        this.cerrarNominaOperativa();
      } else {
        void this.router.navigateByUrl(
          appendNominaFlowQuery('/remuneraciones/liquidaciones', this.periodoSeleccionado()),
        );
      }
      return;
    }
    if (estado === 'nomina_cerrada' || estado === 'liquidaciones_disponibles') {
      void this.router.navigateByUrl(
        appendNominaFlowQuery('/remuneraciones/liquidaciones', this.periodoSeleccionado()),
      );
      return;
    }
    this.revisarBloqueosOperativos();
  }

  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[] = []): void {
    this.store.ejecutarAprobacionOperativa(advertenciasAprobacion);
  }

  revisarBaseNomina(): void {
    document.querySelector('#base-nomina')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  revisarBloqueosOperativos(): void {
    this.abrirRevisionTrabajadoresGuiada();
  }

  abrirRevisionGuiada(): void {
    this.abrirRevisionTrabajadoresGuiada();
  }

  private abrirRevisionFichasPrevalidacionGuiada(): void {
    this.abrirDetalleOperativo('trabajadores');
    this.seleccionarFiltroNominaMasiva('observaciones');
    let filas = filtrarFilasMasivasTrabajadores(
      this.nominaMasivaFilas(),
      this.nominaMasivaFiltro(),
      this.nominaMasivaBusqueda(),
    );
    if (filas.length === 0) {
      this.seleccionarFiltroNominaMasiva('todos');
      filas = filtrarFilasMasivasTrabajadores(
        this.nominaMasivaFilas(),
        'todos',
        this.nominaMasivaBusqueda(),
      );
    }
    const idPersona =
      idPersonaPreseleccionRevision(filas)
      ?? this.trabajadoresPendientesRevision()[0]?.idPersona
      ?? null;
    if (idPersona != null) {
      this.seleccionarTrabajadorNominaMasiva(idPersona);
    }
  }

  private abrirRevisionTrabajadoresGuiada(): void {
    const destino = resolveWorkspaceTargetFromAccionLocal('revisarBloqueos');
    if (destino) {
      this.aplicarDestinoWorkspace(destino);
    } else {
      this.abrirDetalleOperativo('trabajadores');
    }
    const estado = this.estadoOperativo();
    const filtro = filtroInicialRevisionTrabajadores({
      bloqueosCount: asArray(estado.bloqueos).length,
      advertenciasCount: asArray(estado.advertencias).length,
    });
    this.seleccionarFiltroNominaMasiva(filtro);
    let filas = filtrarFilasMasivasTrabajadores(
      this.nominaMasivaFilas(),
      filtro,
      this.nominaMasivaBusqueda(),
    );
    if (filas.length === 0 && this.nominaMasivaFilas().length > 0) {
      this.seleccionarFiltroNominaMasiva('todos');
      filas = filtrarFilasMasivasTrabajadores(
        this.nominaMasivaFilas(),
        'todos',
        this.nominaMasivaBusqueda(),
      );
    }
    const idPersona = idPersonaPreseleccionRevision(filas);
    if (idPersona != null) {
      this.seleccionarTrabajadorNominaMasiva(idPersona);
    }
  }

  abrirDetalleOperativoContextual(): void {
    this.abrirRevisionEnWorkspaceContextual();
  }

  abrirDetalleOperativo(tab: DetalleOperativoTab = 'trabajadores'): void {
    const tabNormalizado = normalizeDetalleOperativoTab(tab);
    const destino = resolveWorkspaceTargetFromDetalleTab(tabNormalizado);
    if (destino) {
      this.aplicarDestinoWorkspace(destino);
      return;
    }
    this.abrirOverlayRevision(tabNormalizado);
  }

  cerrarDetalleOperativo(): void {
    if (this.overlay().kind === 'revision') {
      this.overlaysPort.cerrar();
    }
  }

  seleccionarDetalleOperativoTab(tab: DetalleOperativoTab): void {
    if (this.overlay().kind === 'revision') {
      this.overlaysPort.abrirRevision(tab);
      if (tab === 'parametros') {
        void this.refrescarParametrosSilencioso();
      }
    }
  }

  /** Desde el modal: resumen/resultado quedan en overlay; el resto abre el panel del período. */
  seleccionarRevisionDesdeModal(tab: DetalleOperativoTab, label?: string): void {
    if (detalleTabUsaModal(tab)) {
      this.seleccionarDetalleOperativoTab(tab);
      return;
    }
    this.cerrarDetalleOperativo();
    this.ejecutarAccionCorreccionDesdeModal({ accionTab: tab, label });
  }

  seleccionarFiltroNominaMasiva(filtro: NominaMasivaFiltro): void {
    this.revisionTrabajadoresPort.seleccionarFiltro(filtro);
  }

  seleccionarRevisionTrabajadoresPanel(
    modo: 'trabajadores' | 'situacion_periodo',
  ): void {
    this.revisionTrabajadoresPort.seleccionarPanel(modo);
  }

  claseRevisionTrabajadoresPanel(modo: 'trabajadores' | 'situacion_periodo'): string {
    return claseSegmentNavActivo(this.revisionTrabajadoresPanel() === modo);
  }

  etiquetaAmbitoIncidenciaRevision(incidencia: IncidenciaPeriodo): string {
    return etiquetaAmbitoIncidencia(incidencia.ambito);
  }

  etiquetaFiltroNominaMasiva(filtro: NominaMasivaFiltro): string {
    switch (filtro) {
      case 'bloqueados':
        return 'Bloqueados';
      case 'observaciones':
        return 'Con observaciones';
      case 'listos':
        return 'Listos';
      case 'con_movimientos':
        return 'Con movimientos';
      case 'sin_movimientos':
        return 'Sin movimientos';
      case 'con_recurrentes':
        return 'Con recurrentes';
      case 'todos':
      default:
        return 'Total';
    }
  }

  etiquetaCantidadTrabajadores(cantidad: number): string {
    if (cantidad === 1) return '1 trabajador';
    return `${cantidad} trabajadores`;
  }

  actualizarBusquedaNominaMasiva(valor: string): void {
    this.revisionTrabajadoresPort.actualizarBusqueda(valor);
  }

  seleccionarTrabajadorNominaMasiva(idPersona: number | string): void {
    this.revisionTrabajadoresPort.seleccionarTrabajador(idPersona);
  }

  limpiarSeleccionTrabajadorNominaMasiva(): void {
    this.revisionTrabajadoresPort.limpiarTrabajadorSeleccionado();
  }

  esFilaMasivaSeleccionada(idPersona: number | string): boolean {
    const seleccionado = this.nominaMasivaTrabajadorSeleccionadoId();
    return seleccionado != null && this.mismaPersonaNominaMasiva(seleccionado, idPersona);
  }

  private clavePersonaNominaMasiva(idPersona: number | string | null | undefined): string {
    return this.revisionTrabajadoresPort.clavePersona(idPersona);
  }

  private mismaPersonaNominaMasiva(a: number | string | null | undefined, b: number | string | null | undefined): boolean {
    return this.revisionTrabajadoresPort.mismaPersona(a, b);
  }

  claseAccionRecomendadaMasiva(tono: 'listo' | 'atencion' | 'bloqueo' | 'neutral'): string {
    switch (tono) {
      case 'bloqueo':
        return 'payroll-revision-trabajadores__accion payroll-revision-trabajadores__accion--bloqueo';
      case 'atencion':
        return 'payroll-revision-trabajadores__accion payroll-revision-trabajadores__accion--atencion';
      case 'listo':
        return 'payroll-revision-trabajadores__accion payroll-revision-trabajadores__accion--listo';
      default:
        return 'payroll-revision-trabajadores__accion';
    }
  }

  etiquetaConteoMasivo(cantidad: number, singular: string, plural: string): string {
    if (cantidad <= 0) return `Sin ${plural}`;
    if (cantidad === 1) return `1 ${singular}`;
    return `${cantidad} ${plural}`;
  }

  @HostListener('document:keydown.escape')
  cerrarModalesConEscape(): void {
    if (this.overlay().kind !== 'cerrado') {
      this.cerrarOverlay();
    }
  }

  enfocarPanelApoyo(): void {
    document.querySelector('#payroll-support-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  puedeGuardarSnapshot(): boolean {
    const calc = this.store.calculo();
    if (!validarPeriodoEntradaMensual(this.store.periodoSeleccionado())) return false;
    if (this.nominaEstaCerradaOperativamente()) return false;
    if (this.store.errorEjecucion() || this.store.guardandoSnapshot()) return false;
    const snapshot = this.store.snapshotActivo();
    const completo = this.store.snapshotCompleto();
    const tieneCalculoPersistido =
      calc != null
      || (completo != null && completo.trabajadores.length > 0 && snapshot?.estado !== 'borrador');
    if (!tieneCalculoPersistido) return false;
    if (calc) {
      if (calc.estado === 'con_bloqueos' || calc.issues.some((i) => i.severidad === 'BLOQUEO')) return false;
    } else if ((snapshot?.totalBloqueados ?? 0) > 0) {
      return false;
    }
    if (snapshot?.estado === 'borrador') return true;
    return !snapshot || this.store.identificadorResultadoGuardadoActual() !== snapshot.hashSnapshot;
  }

  nominaEstaCerradaOperativamente(): boolean {
    return this.store.nominaEstaCerradaOperativamente();
  }

  puedeCerrarNominaOperativa(): boolean {
    return !this.motivoNoPuedeCerrarNomina();
  }

  motivoNoPuedeCerrarNomina(): string | undefined {
    const snapshot = this.store.snapshotActivo();
    if (!validarPeriodoEntradaMensual(this.store.periodoSeleccionado())) return 'El periodo seleccionado no es valido.';
    if (!snapshot?.idCalculoPeriodo) return 'Primero debe existir una version revisable guardada vigente.';
    if (snapshot.cierreOperativo?.estado === 'cerrado_operativamente') return 'El proceso mensual ya está cerrado.';
    if (snapshot.aprobacionOperativa?.estado !== 'aprobado_operativamente') return 'Primero aprueba la nómina del período.';
    // Orden del flujo: aprobar -> emitir -> cerrar. El cierre exige liquidaciones ya emitidas.
    if (this.store.liquidacionesGeneradasCount() <= 0) return 'Primero emite las liquidaciones del período antes de cerrarlo.';
    if (this.resultadoPreliminar().estado === 'actualizado_sin_guardar') return 'Hay una version actualizada sin guardar.';
    if (snapshot.totalBloqueados > 0) return 'Existen trabajadores bloqueados pendientes en la version guardada.';
    if (this.store.guardandoSnapshot() || this.store.aprobandoResultado() || this.store.cerrandoNomina()) return 'Hay una operacion en curso.';
    return undefined;
  }

  abrirConfirmacionCierreNominaOperativa(): void {
    this.abrirOverlayDecision({
      tipo: 'cerrar_nomina',
      variant: 'warning',
      eyebrow: 'Cierre del período',
      titulo: 'Cerrar proceso mensual',
      mensaje: `Cierra el proceso mensual de ${this.periodoActivo.etiqueta() || this.store.periodoSeleccionado()} como versión oficial del período.`,
      detalle: 'La versión aprobada quedará congelada. Las liquidaciones ya deben estar emitidas.',
      puntosTitulo: 'Qué ocurre',
      puntos: [
        'Congela esta versión mientras no exista reapertura del período.',
        'No emite liquidaciones en este paso.',
        'No genera archivos Previred, LRE, banco ni PDF.',
      ],
      mostrarProximaAccion: true,
      proximaAccion: 'El período quedará en estado cerrado para consulta.',
      primaryLabel: 'Cerrar proceso mensual',
      secondaryLabel: 'Cancelar',
    });
  }

  badgeVariantPasoPeriodo(estado: PasoPeriodoEstado): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (estado) {
      case 'Completo':
        return 'success';
      case 'Actual':
        return 'info';
      case 'Bloqueada':
        return 'error';
      default:
        return 'default';
    }
  }

  badgeVariantEstadoOperativo(severidad: ProcesoMensualEstadoSeveridad): 'success' | 'warning' | 'error' | 'default' | 'info' {
    switch (severidad) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
        return 'info';
      case 'neutral':
      default:
        return 'default';
    }
  }

  cerrarNominaOperativa(): void {
    const snapshot = this.store.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo || !this.puedeCerrarNominaOperativa()) return;
    this.abrirConfirmacionCierreNominaOperativa();
  }

  prepararActaOperativaPeriodo(): void {
    const acta = this.actaPreparacion();
    if (!acta.accionDisponible) return;
    const tieneObservaciones = acta.estado === 'REQUIERE_REVISION';
    this.abrirOverlayDecision({
      tipo: 'preparar_acta',
      titulo: 'Preparar acta operativa del periodo',
      mensaje: 'Se dejara preparada una evidencia visual del contexto revisado para continuar hacia Liquidaciones oficiales.',
      detalle: 'No genera liquidaciones, no cierra el periodo, no guarda un acta definitiva y no exporta PDF.',
      puntos: [
        'Periodo, estado de validacion y resumen de trabajadores.',
        'Movimientos del mes, asignaciones recurrentes y observaciones visibles.',
        'Proxima accion: revisar Liquidaciones oficiales con este contexto como respaldo.',
      ],
      secciones: [
        {
          titulo: 'Que se incluye',
          items: [
            `Periodo ${this.periodoActivo.etiqueta() || this.store.periodoSeleccionado()}.`,
            `Estado actual: ${this.estadoOperativo().titulo}.`,
            this.dashboardResumen().trabajadoresAptos == null
              ? 'Resumen de trabajadores pendiente de validacion.'
              : `Resumen de trabajadores: ${this.dashboardResumen().trabajadoresAptos} listos para nomina y ${this.dashboardResumen().trabajadoresPorRevisar} bloqueados.`,
            `Movimientos y asignaciones: ${this.dashboardResumen().movimientosAprobados} movimientos aprobados y ${this.dashboardResumen().asignacionesAplicables ?? 0} recurrentes aplicables.`,
            tieneObservaciones ? 'Observaciones visibles para revision.' : 'Sin observaciones bloqueantes visibles.',
          ],
        },
        {
          titulo: 'Que no hace todavia',
          items: [
            'No genera liquidaciones.',
            'No cierra el periodo.',
            'No guarda un acta definitiva.',
            'No exporta PDF.',
          ],
        },
      ],
      primaryLabel: tieneObservaciones ? 'Preparar con observaciones' : 'Preparar acta',
      secondaryLabel: 'Cancelar',
    });
  }

  verEvidenciaActaOperativa(): void {
    this.abrirDetalleOperativo('resumen');
  }

  private ejecutarCierreNominaOperativa(): void {
    if (!this.puedeCerrarNominaOperativa()) return;
    this.store.ejecutarCierreNominaOperativa();
  }

  confirmarAccionProceso(): void {
    const current = this.overlay();
    if (current.kind !== 'decision') return;
    const confirmacion = current.view;
    this.overlaysPort.cerrar();
    switch (confirmacion.tipo) {
      case 'guardar_preliminar':
        this.ejecutarGuardarSnapshotPreliminar();
        break;
      case 'aprobar_preliminar':
        this.ejecutarAprobacionOperativa(confirmacion.advertenciasAprobacion ?? []);
        break;
      case 'cerrar_nomina':
        this.ejecutarCierreNominaOperativa();
        break;
      case 'preparar_acta':
        this.actaOperativaPreparada.set(true);
        break;
      case 'abrir_nomina':
        this.store.ejecutarAbrirNomina({
          observacion: 'Apertura solicitada desde el workspace del período.',
        });
        break;
      case 'descartar_nomina':
        this.store.ejecutarDescartarNomina('Descartada por usuario desde el workspace del período.');
        break;
      case 'forzar_apertura':
        this.store.ejecutarAbrirNomina({
          observacion: 'Forzar apertura administrativa de prueba.',
          forzar: true,
        });
        break;
      case 'forzar_eliminacion':
        this.store.ejecutarDescartarNomina(
          'Forzar eliminación administrativa de prueba desde el workspace del período.',
        );
        break;
    }
  }

  cancelarAccionProceso(): void {
    if (this.overlay().kind === 'decision') {
      this.overlaysPort.cerrar();
    }
  }

  etiquetaArea(area: ProcesoMensualArea, fallback?: string): string {
    switch (area) {
      case 'PARAMETROS':
        return 'Parametros';
      case 'TRABAJADORES':
        return 'Trabajadores';
      case 'CONCEPTOS':
        return 'Conceptos de remuneracion';
      case 'HABERES_RECURRENTES':
        return 'Movimientos recurrentes';
      case 'ENTRADAS_MENSUALES':
      case 'MOVIMIENTOS_VARIABLES':
        return 'Movimientos del periodo';
      case 'PROCESO':
        return 'Nomina mensual';
      default:
        return fallback ?? area;
    }
  }

  etiquetaItemEstado(estado: ProcesoMensualItemEstado): string {
    switch (estado) {
      case 'LISTO':
        return 'Listo';
      case 'CON_PROBLEMAS':
        return 'Revisar';
      case 'PENDIENTE_INTEGRACION':
        return 'Pendiente de integracion';
      case 'NO_EVALUADO':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantItemEstado(estado: ProcesoMensualItemEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'LISTO':
        return 'success';
      case 'CON_PROBLEMAS':
        return 'error';
      case 'PENDIENTE_INTEGRACION':
        return 'info';
      default:
        return 'default';
    }
  }

  accionArea(area: ProcesoMensualArea): { label: string; route: string } | null {
    switch (area) {
      case 'PARAMETROS':
        return { label: 'Revisar parámetros', route: '/parametros' };
      case 'CONCEPTOS':
        return { label: 'Revisar conceptos', route: '/remuneraciones/conceptos' };
      case 'HABERES_RECURRENTES':
        return { label: 'Revisar recurrentes', route: '/remuneraciones/haberes-descuentos' };
      case 'ENTRADAS_MENSUALES':
      case 'MOVIMIENTOS_VARIABLES':
        return { label: 'Revisar movimientos', route: '/remuneraciones/novedades-mensuales' };
      default:
        return null;
    }
  }

  referenciaTecnica(mensaje: ProcesoMensualMensaje): string {
    return `Referencia tecnica: ${mensaje.codigo}`;
  }

  etiquetaEstadoTrabajador(estado: string): string {
    switch (estado) {
      case 'calculado_preliminar':
        return 'Calculado preliminar';
      case 'con_advertencias':
        return 'Con advertencias';
      case 'con_bloqueos':
        return 'Con bloqueos';
      default:
        return estado;
    }
  }

  badgeVariantResultadoPreliminar(estado: ResultadoPreliminarEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'no_guardado':
      case 'guardado':
        return 'success';
      case 'actualizado_sin_guardar':
        return 'warning';
      case 'error_guardado':
      case 'con_bloqueos':
        return 'error';
      case 'sin_resultado':
      default:
        return 'default';
    }
  }

  badgeVariantRevisionAprobacion(estado: RevisionAprobacionEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
      case 'aprobado':
        return 'success';
      case 'aprobado_desactualizado':
      case 'pendiente_revision':
      case 'actualizado_sin_guardar':
        return 'warning';
      case 'no_apto':
        return 'error';
      case 'pendiente_guardado':
        return 'info';
      case 'sin_resultado_guardado':
      default:
        return 'default';
    }
  }

  badgeVariantRevisionChecklist(estado: RevisionChecklistEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'Completo':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Requiere atencion':
        return 'error';
      case 'No aplica':
      default:
        return 'default';
    }
  }

  badgeVariantEstadoResultadoTrabajador(
    estado: TrabajadorResultadoPreliminarView['estadoLabel'],
  ): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'Calculado':
        return 'success';
      case 'Con observaciones':
        return 'warning';
      case 'Omitido':
      case 'No calculado':
        return 'error';
      default:
        return 'default';
    }
  }

  etiquetaEstadoBaseTrabajador(estado: BaseNominaTrabajadorEstado): string {
    return etiquetaEstadoBaseTrabajadorNomina(estado);
  }

  badgeVariantEstadoBaseTrabajador(
    estado: BaseNominaTrabajadorEstado,
  ): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
        return 'success';
      case 'con_observaciones':
        return 'warning';
      case 'bloqueado':
        return 'error';
      case 'excluido':
        return 'default';
      default:
        return 'default';
    }
  }

  etiquetaParametrosBase(estado: BaseNominaParametrosEstado): string {
    switch (estado) {
      case 'listos':
        return 'Listos';
      case 'con_observaciones':
        return 'Con observaciones';
      case 'por_revisar':
        return 'Por revisar';
      case 'sin_evaluar':
      default:
        return 'Sin evaluar';
    }
  }

  badgeVariantParametrosBase(estado: BaseNominaParametrosEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listos':
        return 'success';
      case 'con_observaciones':
        return 'warning';
      case 'por_revisar':
        return 'error';
      default:
        return 'default';
    }
  }

  badgeVariantValidacionCalculo(estado: ValidacionCalculoEstado): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (estado) {
      case 'listo':
        return 'success';
      case 'advertencias':
        return 'warning';
      case 'bloqueado':
        return 'error';
      case 'pendiente':
      default:
        return 'default';
    }
  }

  ejecutarAccionValidacion(accion: ValidacionAccionLocal): void {
    switch (accion) {
      case 'validarPeriodo':
        this.validarPeriodo();
        break;
      case 'generarBase':
      case 'actualizarBase':
        this.generarPreNomina();
        break;
      case 'calcularPreliminar':
        this.calcularPreliminar();
        break;
      case 'guardarResultado':
        this.guardarSnapshotPreliminar();
        break;
      case 'aprobarResultado':
        this.aprobarResultadoPreliminar();
        break;
      case 'cerrarNomina':
        this.cerrarNominaOperativa();
        break;
      case 'confirmarNomina':
        this.confirmarNominaMensual();
        break;
      case 'revisarBloqueos':
        this.revisarBloqueosOperativos();
        break;
    }
  }

  ejecutarAccionPrincipalEstadoOperativo(): void {
    const accion = this.estadoOperativo().accionPrincipal;
    if (accion.tipo === 'local' && accion.accionLocal) {
      if (accion.disabled) return;
      this.ejecutarAccionValidacion(accion.accionLocal);
      return;
    }
    if (accion.tipo === 'ruta' && accion.ruta) {
      void this.router.navigateByUrl(
        appendNominaFlowQuery(accion.ruta, this.periodoSeleccionado()),
      );
    }
  }

  private pendienteDesdeValidacion(
    item: ValidacionOperativaItemView,
    severidad: ProcesoMensualEstadoSeveridad = item.severidad === 'bloqueo' ? 'danger' : item.severidad === 'advertencia' ? 'warning' : 'info',
  ): ProcesoMensualPendienteVm {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad,
      ruta: item.ruta,
      accionLocal: item.accionLocal,
      accionLabel: item.accionLabel,
    };
  }

  private pendienteDesdeResultado(
    item: ResultadoObservacionView,
    severidad: ProcesoMensualEstadoSeveridad,
  ): ProcesoMensualPendienteVm {
    return {
      codigo: item.codigo,
      titulo: item.titulo,
      descripcion: item.descripcion,
      severidad,
      ruta: item.ruta,
      accionLabel: item.accionLabel,
    };
  }

  formatoMonto(valor: number | null | undefined): string {
    return formatoMontoNomina(valor);
  }

  private snapshotIssuesParaIncidencias(): Array<{
    severidad: 'bloqueo' | 'advertencia' | 'info';
    titulo: string;
    detalle: string;
  }> {
    if (this.nominaEstaCerradaOperativamente() || this.store.calculo() || this.store.preNomina()) {
      return [];
    }
    const observaciones = this.store.snapshotCompleto()?.observaciones ?? [];
    return observaciones
      .filter(
        (issue) =>
          !esIncidenciaPeriodoSinPendienteReal({
            titulo: issue.codigo,
            detalle: issue.mensaje,
            codigo: issue.codigo,
          }),
      )
      .map((issue) => ({
        severidad:
          issue.severidad === 'BLOQUEO'
            ? 'bloqueo'
            : issue.severidad === 'ADVERTENCIA'
              ? 'advertencia'
              : 'info',
        titulo: issue.codigo,
        detalle: issue.mensaje,
      }));
  }

  private formatoFechaHora(valor: string | null | undefined): string {
    return formatoFechaHoraNomina(valor);
  }

  private horaCorta(valor: string | null | undefined): string {
    return horaCortaNomina(valor);
  }

  private resumenRevisionTrabajadores(): string {
    const trazabilidad = this.baseNominaTrazabilidad();
    if (trazabilidad) {
      return buildResumenRevisionTrabajadores({
        listos: trazabilidad.listosParaCalculo,
        porRevisar: trazabilidad.conObservaciones,
        bloqueados: trazabilidad.bloqueados,
        tieneDatos: true,
      });
    }
    const resultado = this.resultadoPreliminar();
    if (resultado.trabajadores.length) {
      return buildResumenRevisionTrabajadores({
        listos: resultado.resumen.trabajadoresCalculados,
        porRevisar: resultado.resumen.trabajadoresConObservaciones,
        bloqueados: resultado.resumen.trabajadoresOmitidos,
        tieneDatos: true,
      });
    }
    return buildResumenRevisionTrabajadores({ listos: 0, porRevisar: 0, bloqueados: 0, tieneDatos: false });
  }

}

function toneDesdeNominaFrame(frame: NominaVisualFrame): ShellStatusChipTone {
  switch (frame) {
    case 'con_pendientes':
    case 'generando':
      return 'warning';
    case 'lista_para_confirmar':
    case 'confirmada':
    case 'liquidaciones_generadas':
      return 'success';
    case 'sin_generar':
    default:
      return 'neutral';
  }
}
