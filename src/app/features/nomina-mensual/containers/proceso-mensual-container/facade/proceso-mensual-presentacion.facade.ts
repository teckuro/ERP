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
  ProcesoMensualPrevalidacion,
} from '../../../models/proceso-mensual.model';
import { type RecordBreadcrumbItem } from '../../../../../shared/components/ui/record-breadcrumb.component';
import type { DataGridColumn } from '../../../../../shared/components/ui/data-grid.component';
import type { ActaOperativaPeriodoViewModel } from '../../../models/acta-operativa-periodo.model';
import { ProcesoMensualPeriodoStore } from '../store/proceso-mensual-periodo.store';
import { formatoFechaHoraNomina, formatoMontoNomina, horaCortaNomina } from '../utils/proceso-mensual-presentacion.formato';
import { validarPeriodoEntradaMensual } from '../../../entradas/rules/entradas-mensuales-periodo.rules';
import { buildActaOperativaPeriodoViewModel } from '../../../rules/acta-operativa-periodo.rules';
import {
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
import { mapSnapshotCompletoToBaseTrazabilidad } from '../../../rules/proceso-mensual-borrador-snapshot.rules';
import { buildIncidenciasPeriodo } from '../../../rules/proceso-mensual-incidencias-periodo.rules';
import {
  buildAccionRecomendadaTrabajador,
  buildDetalleMasivoTrabajador,
  buildFilasMasivasTrabajadores,
  buildMovimientosPanelPorTrabajador,
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
  buildPayrollMovementDetailRows,
  buildPayrollMovimientoRecurrenteSeguimientoItems,
  buildPayrollObservationDetailRows,
  buildPayrollParametroSeguimientoItems,
  buildPayrollRecurrentDetailRows,
  buildPayrollResultadoSeguimientoItems,
  buildPayrollResultDetailRows,
  buildPayrollWorkerDetailRows,
} from '../../../rules/proceso-mensual-payroll-seguimiento.rules';
import {
  claseChipRevision as payrollClaseChipRevision,
  clasePendienteVisual as payrollClasePendienteVisual,
  etiquetaEstadoBaseTrabajador as payrollEtiquetaEstadoBaseTrabajador,
  etiquetaPendienteVisual as payrollEtiquetaPendienteVisual,
  humanizarCopyOperativo as payrollHumanizarCopyOperativo,
} from '../utils/proceso-mensual-presentacion.labels';
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
  buildResumenRevisionTrabajadores,
  mapBitacoraRailEtapas,
  resolveNominaVisualFrame,
} from '../../../rules/proceso-mensual-workspace.rules';
import {
  buildNominaDetalleMensualMovimientosRows,
  buildNominaDetalleMensualPendientesRows,
  buildNominaDetalleMensualTodosRows,
  buildNominaDetalleMensualTrabajadorRows,
  buildNominaHistorialTablaRows,
} from '../../../rules/proceso-mensual-detalle-mensual.rules';
import {
  buildNominaWorkspaceTabsVisibleMeta,
  buildNominaWorkspaceTabVisibleSummaries,
  resolveFranjaItemTono,
  type NominaWorkspaceTabVisibleSummaryVm,
} from '../../../rules/proceso-mensual-workspace-presentacion.rules';
import { claseSegmentNavActivo } from '../../../rules/proceso-mensual-segment-nav.rules';
import {
  appendNominaFlowQuery,
  debeRehidratarDesdeFlowQuery,
  detalleTabUsaModal,
  periodoYmDesdeFlowQuery,
  resolveFlowDestinoPorFrame,
  resolveNominaEstadoRrhh,
  resolveWorkspaceTargetFromAccionLocal,
  resolveWorkspaceTargetFromDetalleTab,
  type NominaWorkspaceFlowTarget,
} from '../../../rules/proceso-mensual-flow-nav.rules';
import {
  DETALLE_OPERATIVO_TABS,
  PAYROLL_MOVEMENT_DETAIL_COLUMNS,
  PAYROLL_MOVEMENT_DETAIL_FILTERS,
  PAYROLL_OBSERVATION_DETAIL_COLUMNS,
  PAYROLL_OBSERVATION_DETAIL_FILTERS,
  PAYROLL_RECURRENT_DETAIL_COLUMNS,
  PAYROLL_RECURRENT_DETAIL_FILTERS,
  PAYROLL_RESULT_DETAIL_COLUMNS,
  PAYROLL_RESULT_DETAIL_FILTERS,
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
  ProcesoMensualOverlay,
  DetalleOperativoTab,
  EtapaOperativaActiva,
  NominaResumenSuperiorVm,
  NominaVisualFrame,
  NominaVisualFrameView,
  NominaDetalleMensualExpedienteRow,
  NominaDetalleMensualPendienteRow,
  NominaDetalleMensualVista,
  NominaWorkspaceTab,
  NominaWorkspaceTabVisible,
  ParaContinuarItemVm,
  PasoPeriodoEstado,
  PasoPeriodoView,
  PayrollMovementDetailRow,
  PayrollObservationDetailRow,
  PayrollRecurrentDetailRow,
  PayrollResultDetailRow,
  PayrollSeguimientoItem,
  PayrollWorkerDetailRow,
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

@Injectable()
export class ProcesoMensualPresentacionFacade {
  readonly store = inject(ProcesoMensualPeriodoStore);
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly flowQueryParams = toSignal(this.route.queryParams, { initialValue: {} });
  private readonly nominaCapabilities = inject(NominaMensualCapabilitiesService);
  private readonly shellContext = inject(ShellPageContextService);

  readonly nominaWorkspaceTabsVisible = NOMINA_WORKSPACE_TABS_VISIBLE;
  readonly nominaFranjaAreas = NOMINA_FRANJA_AREAS;

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
  readonly overlay = signal<ProcesoMensualOverlay>({ kind: 'cerrado' });
  private informacionPeriodoSuprimida = false;

  readonly confirmacionProceso = computed(() => {
    const current = this.overlay();
    return current.kind === 'decision' ? current.view : null;
  });

  readonly informacionPeriodo = computed(() => {
    const current = this.overlay();
    return current.kind === 'informacion' ? current.view : null;
  });

  readonly detalleOperativoAbierto = computed(() => this.overlay().kind === 'revision');

  readonly detalleOperativoTabActivo = computed(() => {
    const current = this.overlay();
    return current.kind === 'revision' ? current.tab : 'trabajadores';
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
    const estado = this.estadoOperativo();
    const resultado = this.resultadoPreliminar();
    const expediente = this.expedienteNominaPeriodo();
    return buildIncidenciasPeriodo({
      bloqueosOperativos: estado.bloqueos,
      advertenciasOperativas: estado.advertencias,
      informacionesOperativas: estado.informaciones,
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
    const workers = this.payrollWorkerDetailRows();
    return buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias: this.incidenciasPeriodo(),
      workerRowCount: workers.length,
      movementRowCount: this.payrollMovementDetailRows().length,
      recurrentRowCount: this.payrollRecurrentDetailRows().length,
      resultRowCount: this.payrollResultDetailRows().length,
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
      workerRowCount: this.payrollWorkerDetailRows().length,
      movementRowCount: this.payrollMovementDetailRows().length,
      recurrentRowCount: this.payrollRecurrentDetailRows().length,
      resultRowCount: this.payrollResultDetailRows().length,
      parametroItems: this.payrollParametroSeguimientoItems(),
      resultadoSeguimientoItems: this.payrollResultadoSeguimientoItems(),
      movementRows: this.payrollMovementDetailRows(),
      recurrentRows: this.payrollRecurrentDetailRows(),
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
  readonly nominaWorkspaceTab = signal<NominaWorkspaceTab>('parametros');
  readonly nominaWorkspaceTabVisible = signal<NominaWorkspaceTabVisible>('detalle_mensual');
  readonly nominaDetalleMensualVista = signal<NominaDetalleMensualVista>('trabajadores');

  constructor() {
    const destroyRef = inject(DestroyRef);
    bindShellPageContext(
      destroyRef,
      () => {
        const frame = this.nominaFrame();
        return {
          breadcrumbs: [
            { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
            { label: 'Nómina mensual' },
          ],
          statusChip: {
            label: frame.chip,
            tone: toneDesdeNominaFrame(frame.frame),
          },
          primaryAction:
            frame.ctaTipo === 'local' && frame.ctaAccion
              ? {
                  label: frame.ctaLabel,
                  disabled: frame.ctaDisabled,
                  loading: this.accionPeriodoEnCurso(),
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
      const periodo = periodoYmDesdeFlowQuery(params);
      if (!periodo) return;
      const rehidratar = debeRehidratarDesdeFlowQuery(params);
      untracked(() => {
        if (this.periodoActivo.periodoYm() !== periodo) {
          this.periodoActivo.setPeriodoYm(periodo);
        }
        if (rehidratar) {
          this.store.rehidratarPeriodoActivo(periodo);
          void this.router.navigate([], {
            queryParams: { periodo: null, returnTo: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });
    });
  }
  readonly nominaMasivaFiltro = signal<NominaMasivaFiltro>('todos');
  readonly nominaMasivaBusqueda = signal('');
  readonly nominaMasivaTrabajadorSeleccionadoId = signal<number | string | null>(null);
  readonly actaOperativaPreparada = signal(false);

  accionPeriodoEnCurso(): boolean {
    return this.store.accionPeriodoEnCurso();
  }

  seleccionarNominaWorkspaceTab(tab: NominaWorkspaceTab): void {
    const mapped = mapLegacyWorkspaceTabANavegacion(tab);
    this.nominaWorkspaceTab.set(mapped.legacyTab);
    this.nominaWorkspaceTabVisible.set(mapped.tabVisible);
    this.nominaDetalleMensualVista.set(mapped.detalleVista);
    if (tab === 'movimientos') {
      this.nominaMasivaFiltro.set('con_movimientos');
    } else if (tab === 'recurrentes') {
      this.nominaMasivaFiltro.set('con_recurrentes');
    }
  }

  seleccionarNominaWorkspaceTabVisible(tab: NominaWorkspaceTabVisible): void {
    this.nominaWorkspaceTabVisible.set(tab);
    if (tab === 'historial') {
      this.nominaWorkspaceTab.set('historial');
    }
  }

  seleccionarNominaDetalleMensualVista(vista: NominaDetalleMensualVista): void {
    this.nominaWorkspaceTabVisible.set('detalle_mensual');
    if (vista === 'movimientos') {
      this.nominaMasivaFiltro.set('con_movimientos');
      this.nominaDetalleMensualVista.set('trabajadores');
      this.nominaWorkspaceTab.set('movimientos');
      return;
    }
    this.nominaDetalleMensualVista.set(vista);
    const legacy = mapDetalleVistaALegacyTab(vista);
    if (legacy) {
      this.nominaWorkspaceTab.set(legacy);
    }
  }

  aplicarDestinoWorkspace(destino: NominaWorkspaceFlowTarget): void {
    if (this.overlay().kind === 'revision') {
      this.overlay.set({ kind: 'cerrado' });
    }
    this.nominaWorkspaceTabVisible.set(destino.tabVisible);
    this.nominaDetalleMensualVista.set(destino.detalleVista);
    this.nominaWorkspaceTab.set(destino.legacyTab);
    if (destino.filtroMasivo) {
      this.nominaMasivaFiltro.set(destino.filtroMasivo);
    }
  }

  navegarPendienteExterno(pendiente: ProcesoMensualPendienteVm): void {
    if (pendiente.accionLocal) {
      const destinoLocal = resolveWorkspaceTargetFromAccionLocal(pendiente.accionLocal);
      if (destinoLocal) {
        this.aplicarDestinoWorkspace(destinoLocal);
        return;
      }
      this.ejecutarAccionValidacion(pendiente.accionLocal);
      return;
    }

    const tab = resolveDetalleTabFromPendiente(pendiente);
    const destinoWorkspace = resolveWorkspaceTargetFromDetalleTab(tab);
    if (destinoWorkspace && !pendiente.ruta) {
      this.aplicarDestinoWorkspace(destinoWorkspace);
      return;
    }

    if (pendiente.ruta) {
      void this.router.navigateByUrl(
        appendNominaFlowQuery(pendiente.ruta, this.periodoSeleccionado()),
      );
      return;
    }

    this.abrirDetalleOperativo(tab);
  }

  abrirRevisionEnWorkspaceContextual(): void {
    const tab = resolveDetalleTabForRevision({
      errorEjecucion: this.store.errorEjecucion(),
      validacionCalculo: this.validacionCalculo(),
      bloqueosOperativos: this.estadoOperativo().bloqueos,
      advertenciasOperativas: this.estadoOperativo().advertencias,
    });
    const destino = resolveWorkspaceTargetFromDetalleTab(tab);
    if (destino) {
      this.aplicarDestinoWorkspace(destino);
      return;
    }
    this.abrirOverlayRevision(tab);
  }

  seleccionarFranjaArea(area: NominaAreaOperativa): void {
    if (area === 'parametros') {
      const resumen = this.dashboardResumen();
      const incidenciasParam = this.incidenciasPeriodo().porAmbito.parametros ?? [];
      const requiereModal =
        resumen.parametrosListos === false
        || incidenciasParam.some((item) => item.severidad === 'bloqueo' || item.severidad === 'advertencia');
      if (requiereModal) {
        this.abrirInformacionParametrosPeriodo();
        return;
      }
      return;
    }

    if (area === 'movimientos') {
      this.seleccionarNominaDetalleMensualVista('trabajadores');
      this.seleccionarFiltroNominaMasiva('con_movimientos');
      return;
    }

    const franja = NOMINA_FRANJA_AREAS.find((item) => item.id === area);
    if (franja?.detalleVista) {
      this.seleccionarNominaDetalleMensualVista(franja.detalleVista);
    }
  }

  private abrirInformacionParametrosPeriodo(): void {
    const incidencias = (this.incidenciasPeriodo().porAmbito.parametros ?? []).filter(
      (item) => item.severidad !== 'info',
    );
    const faltantes = incidencias.map((item) => item.titulo);
    this.overlay.set({
      kind: 'informacion',
      view: {
        tone: incidencias.some((item) => item.severidad === 'bloqueo') ? 'danger' : 'warning',
        titulo: 'Parámetros incompletos',
        bajada: 'No se puede continuar porque faltan datos requeridos del período.',
        secciones: faltantes.length
          ? [{ titulo: 'Qué revisar', items: faltantes }]
          : undefined,
        puntos: faltantes.length
          ? undefined
          : ['Complete los parámetros mensuales antes de continuar.'],
        accionPrincipal: { label: 'Abrir parámetros', destino: 'parametros' },
      },
    });
  }

  private ejecutarShellPrimaryAction(): void {
    const frame = this.nominaFrame();
    if (frame.ctaTipo === 'local' && frame.ctaAccion) {
      const destino = resolveWorkspaceTargetFromAccionLocal(frame.ctaAccion);
      if (destino) {
        this.aplicarDestinoWorkspace(destino);
        return;
      }
      this.ejecutarAccionValidacion(frame.ctaAccion);
      return;
    }
    if (frame.ctaTipo === 'ruta' && frame.ctaRuta) {
      void this.router.navigateByUrl(
        appendNominaFlowQuery(frame.ctaRuta, this.periodoSeleccionado()),
      );
    }
  }

  claseChipRevision(estado: string): string {
    return payrollClaseChipRevision(estado);
  }

  clasePendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
    return payrollClasePendienteVisual(severidad);
  }

  etiquetaPendienteVisual(severidad: ProcesoMensualEstadoSeveridad): string {
    return payrollEtiquetaPendienteVisual(severidad);
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
  readonly payrollMovementDetailColumns = PAYROLL_MOVEMENT_DETAIL_COLUMNS;
  readonly payrollMovementDetailFilters = PAYROLL_MOVEMENT_DETAIL_FILTERS;
  readonly payrollRecurrentDetailColumns = PAYROLL_RECURRENT_DETAIL_COLUMNS;
  readonly payrollRecurrentDetailFilters = PAYROLL_RECURRENT_DETAIL_FILTERS;
  readonly payrollObservationDetailColumns = PAYROLL_OBSERVATION_DETAIL_COLUMNS;
  readonly payrollObservationDetailFilters = PAYROLL_OBSERVATION_DETAIL_FILTERS;
  readonly payrollResultDetailColumns = PAYROLL_RESULT_DETAIL_COLUMNS;
  readonly payrollResultDetailFilters = PAYROLL_RESULT_DETAIL_FILTERS;
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
      format: (_value, row) => this.etiquetaMontoNominaMasiva(row.liquidoEstimado),
    },
  ];

  readonly nominaMasivaMovimientosPanelColumns = DETALLE_MENSUAL_MOVIMIENTO_COLUMNS.filter(
    (column) => column.id !== 'trabajador',
  );

  readonly baseNominaTrazabilidad = computed(
    () =>
      this.store.preNomina()?.trazabilidad
      ?? mapSnapshotCompletoToBaseTrazabilidad(this.store.snapshotCompleto()),
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
        estadoLabel: 'Nómina confirmada',
        descripcion: 'La nómina mensual quedó confirmada como base oficial del período.',
        puedeCerrar: false,
        razonNoPuedeCerrar: 'La nómina mensual ya está confirmada.',
        fechaCierreLabel: this.formatoFechaHora(cierre.fecha),
        usuarioLabel: cierre.usuarioLabel,
        observacionLabel: cierre.observacion ?? undefined,
        resumen,
      };
    }

    const razonNoPuedeCerrar = this.motivoNoPuedeCerrarNomina();
    return {
      estadoLabel: razonNoPuedeCerrar ? 'Confirmación no disponible' : 'Lista para confirmar',
      descripcion: 'La confirmación congela esta versión como base oficial para generar liquidaciones.',
      puedeCerrar: !razonNoPuedeCerrar,
      razonNoPuedeCerrar,
      resumen,
    };
  });

  readonly contextoOperativoPeriodo = computed(() =>
    inferirContextoOperativoPeriodo({
      resultado: this.store.resultado(),
      preNomina: this.store.preNomina(),
      calculo: this.store.calculo(),
      snapshot: this.store.snapshotActivo(),
    }),
  );

  readonly validacionCalculo = computed<ValidacionCalculoPreliminarView>(() =>
    buildValidacionCalculoPreliminarView({
      periodo: this.store.periodoSeleccionado(),
      resultado: this.store.resultado(),
      preNomina: this.store.preNomina(),
      base: this.baseNominaTrazabilidad(),
      errorEjecucion: this.store.errorEjecucion(),
      nominaCerradaOperativamente: this.nominaEstaCerradaOperativamente(),
      tieneSnapshotPersistido: this.store.snapshotActivo() != null,
      tieneBasePersistida: this.store.snapshotActivo()?.estado === 'borrador',
    }),
  );

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
    const resultado = this.store.resultado();
    const preNomina = this.store.preNomina();
    const calculo = this.store.calculo();
    const snapshot = this.store.snapshotActivo();
    const contexto = this.contextoOperativoPeriodo();
    const resumen = resultado?.resumen;
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
      estadoPeriodo: resultado?.estado ?? null,
      trabajadoresAptos: contexto.trabajadoresAptos,
      trabajadoresPorRevisar: resumen?.trabajadoresActivosNoAptos ?? null,
      parametrosListos: resumen?.parametrosOperativos ?? (snapshot ? true : null),
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
    const revision = this.revisionAprobacion();
    const contexto = this.contextoOperativoPeriodo();
    const resultadoPrevalidacion = this.store.resultado();
    return resolverEstadoOperativoProcesoMensual({
      periodoValido: validarPeriodoEntradaMensual(this.store.periodoSeleccionado()),
      tienePrevalidacion: contexto.tienePrevalidacion,
      parametrosOperativos: resultadoPrevalidacion?.resumen.parametrosOperativos ?? false,
      bloqueosPrevalidacion: validacion.bloqueos.map((item) => this.pendienteDesdeValidacion(item)),
      advertenciasPrevalidacion: validacion.advertencias.map((item) => this.pendienteDesdeValidacion(item, 'warning')),
      informacionesPrevalidacion: validacion.informaciones.map((item) => this.pendienteDesdeValidacion(item, 'info')),
      baseGenerada: contexto.baseGenerada,
      calculoGenerado: contexto.calculoGenerado,
      calculoConBloqueos: resultado.bloqueos.length > 0 || this.store.calculo()?.estado === 'con_bloqueos',
      calculoConAdvertencias: resultado.advertencias.length > 0,
      bloqueosCalculo: resultado.bloqueos.map((item) => this.pendienteDesdeResultado(item, 'danger')),
      advertenciasCalculo: resultado.advertencias.map((item) => this.pendienteDesdeResultado(item, 'warning')),
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
    });
  });

  readonly nominaResumenSuperior = computed<NominaResumenSuperiorVm>(() => {
    const resumen = this.dashboardResumen();
    const snapshot = this.store.snapshotActivo();
    const estado = this.estadoOperativo();
    return buildNominaResumenSuperior({
      trabajadoresAptos: resumen.trabajadoresAptos,
      parametrosListos: resumen.parametrosListos,
      movimientosAprobados: resumen.movimientosAprobados,
      movimientosPendientes: resumen.movimientosPendientes,
      asignacionesAplicables: resumen.asignacionesAplicables,
      advertenciasCount: estado.advertencias.length,
      bloqueosCount: estado.bloqueos.length,
      snapshotTotalAdvertencias: snapshot?.totalAdvertencias ?? 0,
      snapshotTotalBloqueados: snapshot?.totalBloqueados ?? 0,
    });
  });

  readonly nominaEstadoRrhh = computed(() => resolveNominaEstadoRrhh(this.nominaVisualFrame()));

  readonly nominaVisualFrame = computed<NominaVisualFrame>(() =>
    resolveNominaVisualFrame({
      validando: this.store.validando(),
      generandoPreNomina: this.store.generandoPreNomina(),
      calculandoPreliminar: this.store.calculandoPreliminar(),
      rehidratandoPeriodo: this.store.rehidratandoPeriodo(),
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
      this.nominaWorkspaceTab.set(nav.legacyTab);
      this.nominaWorkspaceTabVisible.set(nav.tabVisible);
      this.nominaDetalleMensualVista.set(nav.detalleVista);
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
    if (this.store.validando() || this.store.generandoPreNomina() || this.store.calculandoPreliminar()) {
      return;
    }
    untracked(() => this.sincronizarInformacionPeriodo());
  });

  readonly nominaFrame = computed<NominaVisualFrameView>(() => {
    const estado = this.estadoOperativo();
    return buildNominaFrameView({
      frame: this.nominaVisualFrame(),
      estadoClave: estado.estadoClave,
      accion: estado.accionPrincipal,
      periodoEtiqueta: this.periodoActivo.etiqueta(),
      bloqueosCount: estado.bloqueos.length,
      advertenciasCount: estado.advertencias.length,
      trabajadoresCount: this.dashboardResumen().trabajadoresAptos ?? this.store.snapshotActivo()?.totalTrabajadores ?? 0,
      resumenRevisionTrabajadores: this.resumenRevisionTrabajadores(),
      accionPeriodoEnCurso: this.accionPeriodoEnCurso(),
    });
  });

  readonly nominaGuiaPanel = computed(() =>
    buildNominaGuiaPanelCopy(this.nominaVisualFrame(), this.periodoActivo.etiqueta()),
  );

  readonly nominaDetallePanel = computed(() => buildNominaDetallePanelCopy(this.nominaVisualFrame()));

  readonly nominaPendientesVisuales = computed<ProcesoMensualPendienteVm[]>(() => {
    const pendientes = [
      ...this.estadoOperativo().bloqueos,
      ...this.estadoOperativo().advertencias,
    ];
    if (pendientes.length) return pendientes.slice(0, 5);

    return this.payrollWorkerDetailRows()
      .filter((row) => row.estado !== 'Listo' && row.estado !== 'Calculado')
      .slice(0, 5)
      .map((row) => ({
        codigo: row.trabajador,
        titulo: row.trabajador,
        descripcion: row.observacion,
        severidad: row.estado === 'Bloqueado' || row.estado === 'Omitido' ? 'danger' : 'warning',
        accionLabel: row.accion,
      }));
  });

  readonly nominaHistorialVisual = computed(() => {
    const snapshot = this.store.snapshotActivo();
    const cierre = snapshot?.cierreOperativo;
    const items: Array<{ hora: string; texto: string; destacado: boolean }> = [];
    if (this.store.preNomina()) items.push({ hora: this.horaCorta(this.store.preNomina()?.generadoEn), texto: 'Se generó el borrador de nómina mensual.', destacado: false });
    if (snapshot) items.push({ hora: this.horaCorta(snapshot.fechaGeneracion), texto: 'Se guardó una versión para revisión del período.', destacado: false });
    if (snapshot?.aprobacionOperativa) items.push({ hora: this.horaCorta(snapshot.aprobacionOperativa.fecha), texto: 'Se revisó la nómina mensual.', destacado: false });
    if (cierre) items.push({ hora: this.horaCorta(cierre.fecha), texto: 'Se confirmó la nómina mensual.', destacado: true });
    if (!items.length) {
      items.push({ hora: '--:--', texto: 'Aún no hay eventos del período.', destacado: false });
    }
    return items;
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
      partes.push('nomina confirmada');
    } else if (this.store.aprobacionOperativa()) {
      partes.push('lista para confirmar');
    } else if (this.store.snapshotActivo()) {
      partes.push('confirmacion pendiente');
    }
    return partes.join(' · ');
  });

  readonly bitacoraRailEtapas = computed<BitacoraRailEtapaVm[]>(() => mapBitacoraRailEtapas(this.bitacoraEtapas()));

  readonly alertasPeriodoResumen = computed<AlertasPeriodoResumenVm>(() => {
    const estado = this.estadoOperativo();
    return buildAlertasPeriodoResumen({
      validando: this.store.validando(),
      tieneResultado: this.store.resultado() != null,
      bloqueosCount: estado.bloqueos.length,
      advertenciasCount: estado.advertencias.length,
    });
  });

  valorFranjaArea(area: NominaAreaOperativa): string {
    return valorFranjaArea(area, this.nominaResumenSuperior(), {
      liquidacionesGeneradas: this.liquidacionesGeneradasCount(),
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
    });
  }

  /** Franja lateral activa: Movimientos abre Trabajadores filtrado, no comparte estado --active. */
  franjaOperativaActiva(area: NominaAreaOperativa): boolean {
    if (area === 'parametros') return false;
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
      bloqueosCount: this.estadoOperativo().bloqueos.length,
    }),
  );

  readonly nominaWorkspaceTabVisibleSummaries = computed<NominaWorkspaceTabVisibleSummaryVm[]>(() =>
    buildNominaWorkspaceTabVisibleSummaries({
      resumenSuperior: this.nominaResumenSuperior(),
      bloqueosCount: this.estadoOperativo().bloqueos.length,
      pendientesCount: this.incidenciasPeriodo().resumen.bloqueos + this.incidenciasPeriodo().resumen.advertencias,
      liquidacionesGeneradas: this.liquidacionesGeneradasCount(),
      nominaCerrada: this.nominaEstaCerradaOperativamente(),
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
        titulo: payrollHumanizarCopyOperativo(item.titulo),
        detalle: payrollHumanizarCopyOperativo(item.descripcion),
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
        : `${resumen.trabajadoresAptos} apto${resumen.trabajadoresAptos === 1 ? '' : 's'} / ${resumen.trabajadoresPorRevisar} por revisar`,
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

  readonly payrollWorkerDetailRows = computed<PayrollWorkerDetailRow[]>(() =>
    buildPayrollWorkerDetailRows({
      base: this.baseNominaTrazabilidad(),
      expediente: this.expedienteNominaPeriodo(),
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    }),
  );

  readonly payrollMovementDetailRows = computed<PayrollMovementDetailRow[]>(() =>
    buildPayrollMovementDetailRows({
      entradasMensuales: this.store.resultado()?.entradasMensuales,
      base: this.baseNominaTrazabilidad(),
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    }),
  );

  readonly payrollRecurrentDetailRows = computed<PayrollRecurrentDetailRow[]>(() =>
    buildPayrollRecurrentDetailRows({
      entradasMensuales: this.store.resultado()?.entradasMensuales,
      base: this.baseNominaTrazabilidad(),
      resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    }),
  );

  readonly payrollObservationDetailRows = computed<PayrollObservationDetailRow[]>(() =>
    buildPayrollObservationDetailRows({ incidencias: this.incidenciasPeriodo().todas }),
  );

  readonly payrollParametroSeguimientoItems = computed<PayrollSeguimientoItem[]>(() =>
    buildPayrollParametroSeguimientoItems({
      parametrosListos: this.dashboardResumen().parametrosListos,
      tieneIncidenciasParametros: this.incidenciasPeriodo().porAmbito.parametros.length > 0,
    }),
  );

  readonly payrollMovimientoRecurrenteSeguimientoItems = computed<PayrollSeguimientoItem[]>(() =>
    buildPayrollMovimientoRecurrenteSeguimientoItems(
      this.payrollMovementDetailRows(),
      this.payrollRecurrentDetailRows(),
    ),
  );

  readonly payrollResultadoSeguimientoItems = computed<PayrollSeguimientoItem[]>(() =>
    buildPayrollResultadoSeguimientoItems({
      resultado: this.resultadoPreliminar(),
      snapshot: this.store.snapshotActivo(),
    }),
  );

  readonly payrollResultDetailRows = computed<PayrollResultDetailRow[]>(() =>
    buildPayrollResultDetailRows(this.resultadoPreliminar()),
  );

  readonly nominaDetalleMensualTrabajadorRows = computed(() =>
    buildNominaDetalleMensualTrabajadorRows({
      workers: this.payrollWorkerDetailRows(),
      resultados: this.payrollResultDetailRows(),
      idPersonaPorNombre: this.idPersonaPorNombreTrabajador(),
    }),
  );

  readonly nominaDetalleMensualMovimientoRows = computed(() =>
    buildNominaDetalleMensualMovimientosRows({
      movimientos: this.payrollMovementDetailRows(),
      recurrentes: this.payrollRecurrentDetailRows(),
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
          : 'Nómina confirmada; puede generar liquidaciones',
        origenDuracion: 'â€”',
        vigencia: this.periodoActivo.etiqueta(),
        monto: 'â€”',
        accion: generadas > 0 || cerrada ? 'Ir a liquidaciones' : 'Confirmar nómina',
        severity: generadas > 0 ? 'listo' as const : 'atencion' as const,
        ruta: generadas > 0 || cerrada ? '/remuneraciones/liquidaciones' : undefined,
      },
    ];
  });

  readonly nominaDetalleMensualTodosRows = computed(() =>
    buildNominaDetalleMensualTodosRows({
      pendientes: this.nominaDetalleMensualPendienteRows(),
      movimientos: this.nominaDetalleMensualMovimientoRows(),
      trabajadores: this.nominaDetalleMensualTrabajadorRows(),
      liquidaciones: this.nominaDetalleMensualLiquidacionRows(),
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

  readonly nominaDetalleMensualFiltros: ReadonlyArray<{ id: NominaDetalleMensualVista; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'trabajadores', label: 'Trabajadores' },
    { id: 'liquidaciones', label: 'Liquidaciones' },
    { id: 'pendientes', label: 'Pendientes' },
  ];

  private readonly nominaMasivaInput = computed(() => ({
    resultadoTrabajadores: this.resultadoPreliminar().trabajadores,
    expedienteTrabajadores: this.expedienteNominaPeriodo().trabajadores,
    baseTrabajadores: this.baseNominaTrazabilidad()?.trabajadores ?? [],
    movementRows: this.payrollMovementDetailRows(),
    recurrentRows: this.payrollRecurrentDetailRows(),
    incidencias: this.incidenciasPeriodo().todas,
  }));

  readonly nominaMasivaResumen = computed(() =>
    buildResumenMasivoNomina(this.nominaMasivaInput()),
  );

  readonly nominaMasivaFilas = computed<NominaMasivaFila[]>(() =>
    buildFilasMasivasTrabajadores(this.nominaMasivaInput()),
  );

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
    }),
  );

  readonly nominaMasivaMovimientosPanelRows = computed(() => {
    const detalle = this.nominaMasivaDetalleSeleccionado();
    if (!detalle) return [];
    return buildMovimientosPanelPorTrabajador(
      detalle,
      this.periodoActivo.etiqueta() || this.store.periodoSeleccionado(),
    );
  });

  readonly nominaMasivaAccionRecomendadaPanel = computed(() => {
    const detalle = this.nominaMasivaDetalleSeleccionado();
    if (!detalle) return null;
    return buildAccionRecomendadaTrabajador(detalle.incidencias, detalle.estado);
  });

  readonly nominaMasivaTituloContexto = computed(() => {
    if (this.nominaDetalleMensualVista() !== 'trabajadores') return null;
    if (this.nominaMasivaFiltro() === 'con_movimientos') {
      return 'Trabajadores con movimientos';
    }
    return null;
  });

  private readonly syncNominaMasivaSeleccion = effect(() => {
    const filas = this.nominaMasivaFilasFiltradas();
    const seleccionado = this.nominaMasivaTrabajadorSeleccionadoId();
    if (filas.length === 0) {
      if (seleccionado != null) {
        untracked(() => this.nominaMasivaTrabajadorSeleccionadoId.set(null));
      }
      return;
    }
    if (seleccionado == null) return;
    const visible = filas.some((fila) => String(fila.idPersona) === String(seleccionado));
    if (visible) return;
    untracked(() => this.nominaMasivaTrabajadorSeleccionadoId.set(filas[0].idPersona));
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
    this.informacionPeriodoSuprimida = false;
    this.store.validarPeriodo();
  }

  generarPreNomina(): void {
    this.informacionPeriodoSuprimida = false;
    this.store.generarPreNomina();
  }

  guardarBaseNominaRevisada(): void {
    this.informacionPeriodoSuprimida = true;
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
    this.informacionPeriodoSuprimida = false;
    this.store.calcularPreliminar();
  }

  abrirOverlayRevision(tab: DetalleOperativoTab): void {
    if (this.store.snapshotActivo()) {
      this.store.asegurarSnapshotCompletoCargado();
    }
    this.overlay.set({ kind: 'revision', tab });
  }

  abrirOverlayDecision(view: ConfirmacionProcesoMensualView): void {
    this.overlay.set({ kind: 'decision', view });
  }

  abrirOverlayInformacion(view: InformacionPeriodoView | null): void {
    if (!view) {
      if (this.overlay().kind === 'informacion') {
        this.overlay.set({ kind: 'cerrado' });
      }
      return;
    }
    this.overlay.set({ kind: 'informacion', view });
  }

  cerrarOverlay(): void {
    const current = this.overlay();
    switch (current.kind) {
      case 'informacion':
        this.informacionPeriodoSuprimida = true;
        this.overlay.set({ kind: 'cerrado' });
        break;
      case 'revision':
        this.overlay.set({ kind: 'cerrado' });
        break;
      case 'decision':
        this.cancelarAccionProceso();
        break;
      case 'cerrado':
        break;
    }
  }

  sincronizarInformacionPeriodo(): void {
    if (this.informacionPeriodoSuprimida) return;
    const current = this.overlay();
    if (current.kind === 'decision' || current.kind === 'revision') return;

    const view = buildInformacionPeriodoView({
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
    });
    this.abrirOverlayInformacion(view);
  }

  cerrarInformacionPeriodo(): void {
    if (this.overlay().kind === 'informacion') {
      this.informacionPeriodoSuprimida = true;
      this.overlay.set({ kind: 'cerrado' });
    }
  }

  confirmarInformacionPeriodo(): void {
    const current = this.overlay();
    if (current.kind !== 'informacion') return;
    const info = current.view;
    const destino = info.accionPrincipal?.destino;
    const reintentarAccion = info.reintentarAccion;
    this.overlay.set({ kind: 'cerrado' });
    if (destino === 'reintentar') {
      this.informacionPeriodoSuprimida = false;
    } else {
      this.informacionPeriodoSuprimida = true;
    }
    if (!destino) return;
    this.ejecutarDestinoInformacionPeriodo(destino, reintentarAccion);
  }

  cancelarInformacionPeriodo(): void {
    this.cerrarInformacionPeriodo();
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

  abrirDetalleExpedienteFila(detalleTab?: DetalleOperativoTab, ruta?: string): void {
    if (ruta) {
      void this.router.navigateByUrl(appendNominaFlowQuery(ruta, this.periodoSeleccionado()));
      return;
    }
    if (detalleTab) {
      this.abrirDetalleOperativo(detalleTab);
    }
  }

  abrirDetalleExpedienteRow(row: NominaDetalleMensualExpedienteRow): void {
    if (row.ruta) {
      this.abrirDetalleExpedienteFila(undefined, row.ruta);
      return;
    }
    if (row.ambito === 'Trabajador' && row.idPersona != null) {
      this.abrirTrabajadorEnDetalle(row.idPersona);
      return;
    }
    if (row.detalleTab) {
      this.abrirDetalleExpedienteFila(row.detalleTab);
    }
  }

  abrirDetallePendienteRow(row: NominaDetalleMensualPendienteRow): void {
    if (row.ruta) {
      this.abrirDetalleExpedienteFila(undefined, row.ruta);
      return;
    }
    if (row.detalleTab) {
      this.abrirDetalleExpedienteFila(row.detalleTab);
    }
  }

  navegarDesdeModal(ruta: string): void {
    this.cerrarDetalleOperativo();
    void this.router.navigateByUrl(appendNominaFlowQuery(ruta, this.periodoSeleccionado()));
  }

  irAlDetalleDelPeriodoDesdeModal(tab: DetalleOperativoTab = 'trabajadores'): void {
    this.cerrarDetalleOperativo();
    this.abrirDetalleOperativo(tab);
  }

  solicitarAbrirNomina(): void {
    this.abrirOverlayDecision({
      tipo: 'abrir_nomina',
      titulo: 'Abrir nómina del período',
      mensaje: 'La nómina volverá a revisión. Podrá corregir datos antes de volver a confirmarla.',
      detalle: 'Esta acción no elimina liquidaciones ni modifica movimientos ya registrados.',
      puntos: [
        'La confirmación operativa quedará revertida para este período.',
        'Podrá revisar trabajadores, parámetros y resultado antes de confirmar de nuevo.',
      ],
      primaryLabel: 'Abrir nómina',
      secondaryLabel: 'Mantener confirmada',
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
      titulo: 'Confirmar revisión',
      mensaje: 'Se preparara la nomina mensual revisada para este periodo.',
      detalle: 'No emite liquidaciones, no confirma la nomina y no genera archivos legales.',
      puntos: [
        'Quedara disponible para la confirmacion final.',
        'Si cambias datos del periodo, deberas revisar y preparar una nueva version.',
      ],
      primaryLabel: 'Confirmar revision',
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
    this.overlay.set({ kind: 'cerrado' });
    this.informacionPeriodoSuprimida = false;
    this.actaOperativaPreparada.set(false);
  }

  recalcularYReemplazarSnapshot(): void {
    this.store.recalcularYReemplazarSnapshot();
  }

  etiquetaEstadoGlobal(estado: ProcesoMensualEstado | null): string {
    switch (estado) {
      case 'LISTO_PARA_CALCULO':
        return 'Listo para calcular';
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
    const r = this.store.resultado();
    return !!r && r.estado !== 'BLOQUEADO' && !this.nominaEstaCerradaOperativamente() && !this.store.validando() && !this.store.generandoPreNomina();
  }

  puedeCalcularPreliminar(): boolean {
    return this.validacionCalculo().puedeCalcular && !this.nominaEstaCerradaOperativamente() && !this.store.validando() && !this.store.generandoPreNomina() && !this.store.calculandoPreliminar();
  }

  aprobarResultadoPreliminar(): void {
    const revision = this.revisionAprobacion();
    const snapshot = this.store.snapshotActivo();
    if (!revision.puedeAprobar || !snapshot) return;
    const advertenciasAprobacion = revision.advertencias.map((advertencia) => advertencia.descripcion);
    if (advertenciasAprobacion.length === 0 && snapshot.totalAdvertencias > 0) {
      advertenciasAprobacion.push(`Resultado guardado con ${snapshot.totalAdvertencias} advertencia(s) no bloqueante(s).`);
    }
    this.abrirOverlayDecision({
      tipo: 'aprobar_preliminar',
      titulo: 'Confirmar revisión de nómina',
      mensaje: 'Marca la version revisable como confirmada por RRHH antes de confirmar la nomina oficial.',
      detalle: 'No emite liquidaciones, no confirma la nomina oficial y no genera archivos legales.',
      puntos: advertenciasAprobacion.length > 0
        ? [
            'Existen advertencias visibles que quedaran registradas como observaciones de revision.',
            'RRHH puede continuar si las advertencias no bloquean el proceso.',
          ]
        : [
            'La version revisable pasara a la etapa de confirmacion de nomina.',
            'Esta revision no reemplaza la confirmacion oficial del periodo.',
          ],
      primaryLabel: 'Confirmar revision',
      secondaryLabel: 'Cancelar',
      advertenciasAprobacion,
    });
  }

  private ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void {
    this.store.ejecutarAprobacionOperativa(advertenciasAprobacion);
  }

  revisarBaseNomina(): void {
    document.querySelector('#base-nomina')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  revisarBloqueosOperativos(): void {
    this.abrirRevisionGuiada();
  }

  abrirRevisionGuiada(): void {
    const destino = resolveWorkspaceTargetFromAccionLocal('revisarBloqueos');
    if (destino) {
      this.aplicarDestinoWorkspace(destino);
      return;
    }
    this.abrirDetalleOperativo('trabajadores');
  }

  abrirDetalleOperativoContextual(): void {
    this.abrirRevisionEnWorkspaceContextual();
  }

  abrirDetalleOperativo(tab: DetalleOperativoTab = 'trabajadores'): void {
    const destino = resolveWorkspaceTargetFromDetalleTab(tab);
    if (destino) {
      this.aplicarDestinoWorkspace(destino);
      return;
    }
    this.abrirOverlayRevision(tab);
  }

  cerrarDetalleOperativo(): void {
    if (this.overlay().kind === 'revision') {
      this.overlay.set({ kind: 'cerrado' });
    }
  }

  seleccionarDetalleOperativoTab(tab: DetalleOperativoTab): void {
    if (this.overlay().kind === 'revision') {
      this.overlay.set({ kind: 'revision', tab });
    }
  }

  /** Desde el modal: resumen/resultado quedan en overlay; el resto abre el panel del período. */
  seleccionarRevisionDesdeModal(tab: DetalleOperativoTab): void {
    if (detalleTabUsaModal(tab)) {
      this.seleccionarDetalleOperativoTab(tab);
      return;
    }
    this.irAlDetalleDelPeriodoDesdeModal(tab);
  }

  seleccionarFiltroNominaMasiva(filtro: NominaMasivaFiltro): void {
    this.nominaMasivaFiltro.set(filtro);
  }

  actualizarBusquedaNominaMasiva(valor: string): void {
    this.nominaMasivaBusqueda.set(valor);
  }

  seleccionarTrabajadorNominaMasiva(idPersona: number | string): void {
    this.nominaMasivaTrabajadorSeleccionadoId.set(idPersona);
  }

  esFilaMasivaSeleccionada(idPersona: number | string): boolean {
    const seleccionado = this.nominaMasivaTrabajadorSeleccionadoId();
    return seleccionado != null && String(seleccionado) === String(idPersona);
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
    if (!calc || this.store.errorEjecucion()) return false;
    if (this.store.guardandoSnapshot()) return false;
    if (calc.estado === 'con_bloqueos' || calc.issues.some((i) => i.severidad === 'BLOQUEO')) return false;
    const snapshot = this.store.snapshotActivo();
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
    if (snapshot.cierreOperativo?.estado === 'cerrado_operativamente') return 'La nomina mensual ya esta confirmada.';
    if (snapshot.aprobacionOperativa?.estado !== 'aprobado_operativamente') return 'La revision debe estar confirmada antes de confirmar la nomina.';
    if (this.resultadoPreliminar().estado === 'actualizado_sin_guardar') return 'Hay una version actualizada sin guardar.';
    if (snapshot.totalBloqueados > 0) return 'Existen trabajadores bloqueados pendientes en la version guardada.';
    if (this.store.guardandoSnapshot() || this.store.aprobandoResultado() || this.store.cerrandoNomina()) return 'Hay una operacion en curso.';
    return undefined;
  }

  abrirConfirmacionCierreNominaOperativa(): void {
    this.abrirOverlayDecision({
      tipo: 'cerrar_nomina',
      titulo: 'Confirmar nómina mensual',
      mensaje: `Vas a confirmar la nomina mensual de ${this.store.periodoSeleccionado()}.`,
      detalle: 'La version revisada quedara congelada como base oficial para liquidaciones mientras no exista un flujo de reapertura.',
      puntos: [
        'Bloquea nuevos calculos o reemplazos para el periodo.',
        'No emite liquidaciones oficiales.',
        'No genera archivos Previred, LRE, banco ni PDF.',
      ],
      primaryLabel: 'Confirmar nomina',
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
              : `Resumen de trabajadores: ${this.dashboardResumen().trabajadoresAptos} aptos y ${this.dashboardResumen().trabajadoresPorRevisar} por revisar.`,
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
    this.overlay.set({ kind: 'cerrado' });
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
      this.overlay.set({ kind: 'cerrado' });
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
    return payrollEtiquetaEstadoBaseTrabajador(estado);
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
      case 'revisarBloqueos':
        this.revisarBloqueosOperativos();
        break;
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
    if (this.store.calculo() || this.store.preNomina()) {
      return [];
    }
    const observaciones = this.store.snapshotCompleto()?.observaciones ?? [];
    return observaciones.map((issue) => ({
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

function mapLegacyWorkspaceTabANavegacion(tab: NominaWorkspaceTab): {
  tabVisible: NominaWorkspaceTabVisible;
  detalleVista: NominaDetalleMensualVista;
  legacyTab: NominaWorkspaceTab;
} {
  switch (tab) {
    case 'historial':
      return { tabVisible: 'historial', detalleVista: 'todos', legacyTab: 'historial' };
    case 'liquidaciones':
      return { tabVisible: 'detalle_mensual', detalleVista: 'liquidaciones', legacyTab: 'liquidaciones' };
    case 'movimientos':
    case 'recurrentes':
      return { tabVisible: 'detalle_mensual', detalleVista: 'trabajadores', legacyTab: tab };
    case 'trabajadores':
      return { tabVisible: 'detalle_mensual', detalleVista: 'trabajadores', legacyTab: 'trabajadores' };
    case 'parametros':
      return { tabVisible: 'detalle_mensual', detalleVista: 'pendientes', legacyTab: 'parametros' };
    default:
      return { tabVisible: 'detalle_mensual', detalleVista: 'todos', legacyTab: tab };
  }
}

function mapDetalleVistaALegacyTab(vista: NominaDetalleMensualVista): NominaWorkspaceTab | null {
  switch (vista) {
    case 'trabajadores':
      return 'trabajadores';
    case 'movimientos':
      return 'movimientos';
    case 'liquidaciones':
      return 'liquidaciones';
    case 'pendientes':
      return 'parametros';
    default:
      return null;
  }
}
