import {
  ChangeDetectorRef,
  Injectable,
  computed,
  effect,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  ParametroGeneral,
  ParametrosGeneralesClienteConfig,
  PARAMETROS_CATALOGO_ARRAY_KEYS,
  ParametrosGeneralesCatalogos,
  ParametrosReferenciaMensualInfo,
  ParametrosTabId,
  PeriodoRemuneracionEstadoInfo,
} from '../models/parametro-general.model';
import { ParametrosPresentacionFacade } from './parametros-presentacion.facade';
import type {
  ConfigClienteDraftSource,
  ParametrosAreaId,
  ParametrosDialogAction,
  PeriodoCargaEstado,
} from '../models/parametros-workspace.vm';
import { ParametrosGeneralesService } from '../services/parametros-generales.service';
import {
  ParametrosConfigClienteBaseOpcion,
  crearClienteConfigDesdeOficiales,
  debeMostrarAvisoDiferenciasParametrosOficialesMes,
  evaluarCompletitudParametrosMensual,
  huellaDiferenciasOficialesCliente,
  resolverEstadoVisualParametros,
  resolverOpcionesBaseConfigCliente,
} from '../rules/parametros-completitud.rules';
import {
  buildParametrosConfirmacionModificacionDialog,
  buildParametrosDecisionConfigClienteDialog,
  buildParametrosErrorActualizacionDialog,
  buildParametrosErrorCargaDialog,
  buildParametrosErrorClienteConfigDialog,
  buildParametrosErrorGuardadoDialog,
  buildParametrosErrorSincronizacionSinDatosDialog,
  buildParametrosExitoActualizacionDialog,
  buildParametrosExitoClienteConfigDialog,
  buildParametrosExitoGuardadoDialog,
  buildParametrosExitoSincronizacionDialog,
  buildParametrosFormularioInvalidoDialog,
  buildParametrosPeriodoCerradoSoloLecturaDialog,
  buildParametrosPeriodoDuplicadoDialog,
  buildParametrosPeriodoInexistenteConfigDialog,
  buildParametrosPeriodoNoCoincideDialog,
  buildParametrosReconciliacionDiferenciasDialog,
  buildParametrosRegistroDecisionReconciliacionDialog,
  buildParametrosSinConfigClienteAnteriorDialog,
  buildParametrosSoloConfigClienteEditableDialog,
} from '../rules/parametros-dialog.rules';
import { SearchSelectValue } from '../../../shared/components/ui/forms/search-select.component';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import {
  crearGridsParametrosWorkspace,
  formatoDecimalGridParametros,
  formatoFechaGridParametros,
  formatoMontoGridParametros,
} from '../utils/parametros-workspace-grids.presenter';
import {
  AREAS_PARAMETROS_WORKSPACE,
  MESES_PARAMETROS_WORKSPACE,
  TABS_PARAMETROS_WORKSPACE,
  areaDeTabParametros,
  detalleAreaParametros,
  detalleRegistroTabActivo,
  formatearPeriodoMesAnio,
  primerTabDeAreaParametros,
  tabsDeAreaParametros,
  tipoAreaParametros,
  tipoRegistroTabActivo,
  tituloAreaParametros,
  tituloRegistroTabActivo,
} from '../utils/parametros-workspace-tabs.presenter';

/** Carga, guardado, diálogos y formulario del workspace de parámetros mensuales. */
@Injectable()
export class ParametrosWorkspaceOrquestador {
  private readonly service = inject(ParametrosGeneralesService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly presentacion = inject(ParametrosPresentacionFacade);
  readonly periodoGlobal = inject(PeriodoActivoService);

  readonly tabs = TABS_PARAMETROS_WORKSPACE;
  readonly areas = AREAS_PARAMETROS_WORKSPACE;
  readonly monthOptions = MESES_PARAMETROS_WORKSPACE;

  private readonly gridsConfig = crearGridsParametrosWorkspace(() => this.selectedPeriodo());

  readonly tramosCargaColumns = this.gridsConfig.tramosCargaColumns;
  readonly tablaImpuestoColumns = this.gridsConfig.tablaImpuestoColumns;
  readonly tramosImpuestoColumns = this.gridsConfig.tramosImpuestoColumns;
  readonly isapreColumns = this.gridsConfig.isapreColumns;
  readonly afpColumns = this.gridsConfig.afpColumns;
  readonly ccafColumns = this.gridsConfig.ccafColumns;
  readonly organismosLeyColumns = this.gridsConfig.organismosLeyColumns;
  readonly parametrosLegalesColumns = this.gridsConfig.parametrosLegalesColumns;
  readonly reformaPrevisionalColumns = this.gridsConfig.reformaPrevisionalColumns;
  readonly trabajosPesadosColumns = this.gridsConfig.trabajosPesadosColumns;
  readonly apvInstitucionesColumns = this.gridsConfig.apvInstitucionesColumns;
  readonly apvFormasPagoColumns = this.gridsConfig.apvFormasPagoColumns;

  readonly activeTab = this.presentacion.activeTab;
  readonly activeArea = this.presentacion.activeArea;
  readonly ccafMutualSubTab = this.presentacion.ccafMutualSubTab;
  readonly saludSubTab = this.presentacion.saludSubTab;
  readonly impuestoSubTab = this.presentacion.impuestoSubTab;
  readonly rows = signal<ParametroGeneral[]>([]);
  readonly selectedPeriodo = this.presentacion.selectedPeriodo;
  readonly catalogosOficiales = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly catalogos = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly parametroReferenciaAnterior = signal<ParametroGeneral | null>(null);
  readonly referenciasMensuales = signal<ParametrosReferenciaMensualInfo>(this.emptyReferenciasMensuales());
  readonly clienteConfig = signal<ParametrosGeneralesClienteConfig | null>(null);
  readonly periodosGeneralesCatalogo = signal<string[]>([]);
  readonly periodosMensualesCatalogo = signal<string[]>([]);
  readonly periodoRemuneracion = signal<PeriodoRemuneracionEstadoInfo | null>(null);
  readonly selectedCcafId = this.presentacion.selectedCcafId;
  readonly selectedOrganismoLey16744Id = this.presentacion.selectedOrganismoLey16744Id;
  readonly isLoading = this.presentacion.isLoading;
  /** Consulta al backend solo para plantilla del último período (crear parámetros); no es guardado. */
  readonly isLoadingPlantilla = this.presentacion.isLoadingPlantilla;
  readonly guardando = this.presentacion.guardando;
  readonly generalesEditando = this.presentacion.generalesEditando;
  /** Formulario hidratado para el periodo actual y sin error de carga pendiente. */
  readonly datosFormularioListos = this.presentacion.datosFormularioListos;
  /** Evita doble clic mientras se prepara el modo edición (carga + copia de periodo). */
  readonly isPreparingEdit = this.presentacion.isPreparingEdit;
  /** Refresco silencioso de flujos de edicion. */
  readonly isPreparandoDialogoCrear = this.presentacion.isPreparandoDialogoCrear;
  /** Bloquea "Modificar" tras error de carga hasta una carga exitosa. */
  readonly cargaBloqueadaPorError = this.presentacion.cargaBloqueadaPorError;
  readonly dialogState = this.presentacion.dialogState;
  readonly configDraftSource = this.presentacion.configDraftSource;
  readonly configDraftSourcePeriodo = this.presentacion.configDraftSourcePeriodo;

  private cargarDepth = 0;
  private readonly reconciliacionAvisadaHuellas = new Map<string, string>();
  private readonly inicializado = signal(false);

  /** Bloqueo de acciones de barra / período por carga principal, plantilla o guardado. */
  readonly parametrosUiBloqueada = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.guardando() ||
      this.isPreparandoDialogoCrear(),
  );

  readonly modificarDeshabilitado = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.guardando() ||
      this.isPreparingEdit() ||
      !this.datosFormularioListos() ||
      this.cargaBloqueadaPorError(),
  );

  readonly crearParametrosDeshabilitado = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.guardando() ||
      this.isPreparingEdit() ||
      this.isPreparandoDialogoCrear() ||
      !this.isConfigurableTab() ||
      this.isClienteConfigTab() ||
      this.hasSelectedInRows() ||
      this.generalesEditando() ||
      this.cargaBloqueadaPorError(),
  );

  readonly pageActions = computed(() => {
    if (this.generalesEditando()) {
      return ['back', 'save'] as const;
    }

    return ['edit'] as const;
  });

  readonly saveLabel = computed(() => {
    if (this.guardando()) {
      return 'Guardando...';
    }
    return 'Guardar';
  });

  readonly accionConfigClienteLabel = computed(() => {
    if (this.isPreparingEdit() || this.isPreparandoDialogoCrear()) {
      return 'Preparando...';
    }
    return 'Modificar';
  });

  volverParametrosAction(): void {
    this.volverParametros();
  }

  /** Aísla filtros/paginación del DataGrid por periodo al cambiar el selector. */
  gridPersistenceKey(baseKey: string): string {
    return `${baseKey}.${this.selectedPeriodo()}`;
  }

  readonly hasSelectedInRows = computed(() => this.rows().some((row) => row.periodo === this.selectedPeriodo()));
  readonly periodoExiste = computed(() => this.periodoRemuneracion() !== null);
  readonly periodoEstaCerrado = computed(() => this.periodoRemuneracion()?.estado === 'cerrado');
  readonly parametroOficialSeleccionado = computed(
    () => this.rows().find((row) => row.periodo === this.selectedPeriodo()) ?? null,
  );
  readonly completitudParametros = computed(() =>
    evaluarCompletitudParametrosMensual({
      periodo: this.selectedPeriodo(),
      periodoRemuneracion: this.periodoRemuneracion(),
      oficial: this.parametroOficialSeleccionado(),
      clienteConfig: this.clienteConfig(),
      catalogos: this.catalogosOficiales(),
      errorTecnico: this.cargaBloqueadaPorError(),
    }),
  );
  readonly hayReferenciaVisualMensual = computed(() =>
    Object.values(this.referenciasMensuales()).some((periodo) => periodo !== null),
  );
  readonly hayDiferenciasOficialCliente = computed(() => this.completitudParametros().diferencias.length > 0);
  readonly hayReconciliacionOficialPendiente = computed(() => this.completitudParametros().reconciliacionPendiente);
  readonly periodoCargaEstado = computed<PeriodoCargaEstado>(() =>
    resolverEstadoVisualParametros({
      estadoCalculado: this.completitudParametros().estadoCalculado,
      oficialActual: this.parametroOficialSeleccionado() !== null,
      clienteConfig: this.clienteConfig() !== null,
      referenciaAnterior: this.hayReferenciaVisualMensual(),
      diferencias: this.hayReconciliacionOficialPendiente(),
      editando: this.generalesEditando(),
      errorTecnico: this.cargaBloqueadaPorError(),
    }),
  );
  readonly hasAnySyncedData = computed(() => {
    const catalogos = this.catalogos();

    return (
      this.rows().length > 0 ||
      catalogos.afp.length > 0 ||
      catalogos.isapres.length > 0 ||
      catalogos.saludInstituciones.length > 0 ||
      catalogos.tramosCarga.length > 0 ||
      catalogos.tramosImpuesto.length > 0 ||
      catalogos.tablaImpuestoUnico.length > 0 ||
      catalogos.reformaPensiones.length > 0 ||
      catalogos.trabajosPesados.length > 0 ||
      catalogos.reformaPrevisional.length > 0 ||
      catalogos.ley16744Parametros.length > 0 ||
      catalogos.organismosLey16744.length > 0 ||
      catalogos.ccafEntidades.length > 0 ||
      catalogos.apvInstituciones.length > 0 ||
      catalogos.apvFormasPago.length > 0 ||
      catalogos.afcParametros.length > 0
    );
  });

  readonly periodoEstadoTitulo = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'Estado mensual: Error';
      case 'editando':
        return 'Estado mensual: En edición';
      case 'cargado':
        return 'Estado mensual: Parámetros cargados';
      case 'pendiente_reconciliacion':
        return 'Estado mensual: Pendiente de reconciliación';
      case 'oficial_sin_config':
        return 'Estado mensual: Parámetros cargados';
      case 'configuracion_parcial':
        return 'Estado mensual: Pendiente oficial';
      case 'referencia_anterior':
        return 'Estado mensual: Pendiente oficial';
      case 'sin_base':
        return 'Estado mensual: Sin base disponible';
      case 'corregido':
        return 'Estado mensual: Corregido';
      case 'cerrado':
        return 'Estado mensual: Cerrado';
      case 'parcial':
        return 'Estado mensual: Parcial';
      case 'pendiente':
      default:
        return 'Estado mensual: Pendiente';
    }
  });

  readonly periodoEstadoDetalle = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'No se completó la carga mensual. Revisa el detalle de carga.';
      case 'editando':
        return 'Configuración guardada con pendientes. Pueden completarse valores de fin de mes.';
      case 'cargado':
        return 'Período listo para revisar.';
      case 'pendiente_reconciliacion':
        return 'Diferencias pendientes de revisar.';
      case 'oficial_sin_config':
        return 'Datos oficiales cargados. Falta configuración cliente.';
      case 'configuracion_parcial':
        return 'Configuración guardada. Carga oficial pendiente.';
      case 'referencia_anterior':
        return 'Carga oficial pendiente.';
      case 'sin_base':
        return 'Sin base mensual para el período.';
      case 'corregido':
        return 'Datos revisados por flujo controlado.';
      case 'cerrado':
        return 'Período cerrado. No se permite edición sin flujo de reapertura.';
      case 'parcial':
        return this.completitudDetalle('Período parcial.');
      case 'pendiente':
      default:
        return this.completitudDetalle('Carga oficial pendiente.');
    }
  });

  readonly periodoEstadoChip = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'Error';
      case 'editando':
        return 'Edición';
      case 'cargado':
        return 'Listo para revisar';
      case 'pendiente_reconciliacion':
        return 'Reconciliacion pendiente';
      case 'oficial_sin_config':
        return 'Sin config.';
      case 'configuracion_parcial':
        return 'Configuración parcial';
      case 'referencia_anterior':
        return this.referenciaVisualPrincipalCodigo() ? `Referencia ${this.referenciaVisualPrincipalCodigo()}` : 'Referencia anterior';
      case 'sin_base':
        return 'Sin base';
      case 'corregido':
        return 'Corregido';
      case 'cerrado':
        return 'Cerrado';
      case 'parcial':
        return 'Parcial';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  });

  readonly periodoEstadoChipClass = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'error':
        return 'period-chip--error';
      case 'editando':
        return 'period-chip--info';
      case 'cargado':
      case 'corregido':
      case 'cerrado':
        return 'period-chip--success';
      case 'pendiente_reconciliacion':
      case 'referencia_anterior':
      case 'sin_base':
        return 'period-chip--warning';
      case 'oficial_sin_config':
      case 'configuracion_parcial':
        return 'period-chip--info';
      case 'parcial':
        return 'period-chip--info';
      case 'pendiente':
      default:
        return 'period-chip--warning';
    }
  });

  readonly activeAreaTabs = computed(() => tabsDeAreaParametros(this.activeArea()));

  readonly activeAreaHasSubTabs = computed(() => this.activeAreaTabs().length > 1);

  readonly activeRecordKind = computed(() =>
    this.activeArea() === 'cierrePeriodo'
      ? tipoAreaParametros(this.activeArea())
      : tipoRegistroTabActivo(this.activeTab()),
  );

  readonly activeRecordTitle = computed(() =>
    this.activeArea() === 'cierrePeriodo'
      ? tituloAreaParametros(this.activeArea())
      : this.activeTab() === 'salud'
        ? this.saludSubTab() === 'isapre'
          ? 'ISAPRE'
          : 'Instituciones de salud'
        : this.activeTab() === 'ccafMutual'
          ? this.ccafMutualSubTab() === 'listaCcaf'
            ? 'CCAF'
            : 'Mutuales'
          : this.activeTab() === 'impuestoUnico'
            ? 'Tabla impuesto único (SII)'
        : tituloRegistroTabActivo(this.activeTab()),
  );

  readonly activeRecordDetail = computed(() => {
    if (this.activeArea() === 'cierrePeriodo') {
      return detalleAreaParametros(this.activeArea());
    }

    const catalogos = this.catalogos();

    if (this.activeTab() === 'salud') {
      const isapreCount = this.isapresPorPeriodo().length;
      const instCount = this.saludOtrasInstitucionesPorPeriodo().length;
      if (this.saludSubTab() === 'isapre') {
        return `${isapreCount} ${isapreCount === 1 ? 'ISAPRE' : 'ISAPRE'}.`;
      }
      return `${instCount} ${instCount === 1 ? 'institución' : 'instituciones'}.`;
    }

    if (this.activeTab() === 'ccafMutual') {
      const ccafCount = catalogos.ccafEntidades.length;
      const mutualCount = catalogos.organismosLey16744.length;
      if (this.ccafMutualSubTab() === 'listaCcaf') {
        return `${ccafCount} ${ccafCount === 1 ? 'registro' : 'registros'}.`;
      }
      return `${mutualCount} ${mutualCount === 1 ? 'registro' : 'registros'}.`;
    }

    if (this.activeTab() === 'impuestoUnico') {
      const tablaCount = this.tablaImpuestoPorPeriodo().length;
      return `${tablaCount} ${tablaCount === 1 ? 'tramo' : 'tramos'} según tabla mensual SII.`;
    }

    return detalleRegistroTabActivo(this.activeTab(), {
      periodoLabel: this.periodoSeleccionadoLabel(),
      tieneConfigCliente: this.clienteConfig() !== null,
      tieneDatosOficiales: this.hasSelectedInRows(),
      conteoCcafMutual:
        catalogos.ccafEntidades.length +
        catalogos.organismosLey16744.length,
      conteoTramosCarga: this.tramosCargaPorPeriodo().length,
      conteoImpuesto: this.tablaImpuestoPorPeriodo().length,
      conteoSalud: this.isapresPorPeriodo().length + this.saludOtrasInstitucionesPorPeriodo().length,
      conteoPrevision: this.afpPorPeriodo().length,
      conteoReforma:
        this.reformaPensionesPorPeriodo().length +
        this.reformaPrevisionalPorPeriodo().length,
    });
  });

  readonly cierreGrupos = computed(() => {
    const grupos = this.completitudParametros().grupos;
    return [
      {
        ...grupos.oficialesMensuales,
        id: 'oficialesMensuales',
        label: 'Datos oficiales',
        detail: 'Valores, remuneraciones, cargas e impuesto',
      },
      {
        ...grupos.configuracionCliente,
        id: 'configuracionCliente',
        label: 'Configuración cliente',
        detail: 'Gratificación, ausencias, CCAF y mutual',
      },
      {
        ...grupos.vigencias,
        id: 'vigencias',
        label: 'Catálogos necesarios',
        detail: 'Salud, AFP, CCAF/mutual y reforma de pensiones',
      },
      ...(grupos.consistencia.total > 0
        ? [{
          ...grupos.consistencia,
          id: 'consistencia',
          label: 'Consistencia',
          detail: 'Diferencias entre oficial y configuración cliente',
        }]
        : []),
    ];
  });

  readonly cierrePendientePrincipal = computed(() => {
    const completitud = this.completitudParametros();
    return completitud.errores[0] ??
      completitud.pendientes[0] ??
      completitud.advertencias[0] ??
      'Sin pendientes críticos.';
  });

  readonly cierreAlertas = computed(() => {
    const completitud = this.completitudParametros();
    return [
      ...completitud.errores.map((mensaje) => ({ kind: 'error' as const, mensaje })),
      ...completitud.pendientes.map((mensaje) => ({ kind: 'pendiente' as const, mensaje })),
      ...completitud.advertencias.map((mensaje) => ({ kind: 'advertencia' as const, mensaje })),
    ].slice(0, 6);
  });

  readonly cierreImpacto = computed(() => {
    const completitud = this.completitudParametros();
    if (completitud.errores.length > 0) {
      return 'Bloquea la lectura confiable del período hasta corregir la carga.';
    }
    if (completitud.pendientes.length > 0) {
      return 'El cierre puede quedar parcial y afectar el cálculo mensual.';
    }
    if (completitud.advertencias.length > 0) {
      return 'Revisar antes de cerrar para evitar diferencias posteriores.';
    }
    return 'Base normativa lista para revisión del período.';
  });

  readonly periodoBandaPendienteVisible = computed(() => {
    const pendiente = this.cierrePendientePrincipal();
    if (!pendiente || pendiente === 'Sin pendientes críticos.') return false;

    const detalle = this.periodoEstadoDetalle();
    return !detalle.toLocaleLowerCase().includes(pendiente.toLocaleLowerCase());
  });

  readonly cierreAccionSiguienteLabel = computed(() => {
    const completitud = this.completitudParametros();
    const pendiente = this.cierrePendientePrincipal();

    if (
      !this.clienteConfig() ||
      pendiente.includes('configuración') ||
      pendiente.includes('configuracion') ||
      pendiente.includes('CCAF') ||
      pendiente.includes('mutual')
    ) {
      return 'Completar configuración';
    }
    if (!completitud.grupos.oficialesMensuales.completo) {
      return 'Revisar datos oficiales';
    }
    if (!completitud.grupos.vigencias.completo) {
      return 'Revisar catálogos';
    }
    if (completitud.advertencias.length > 0) {
      return 'Revisar consistencia';
    }
    return 'Refrescar datos';
  });

  private completitudDetalle(base: string): string {
    const completitud = this.completitudParametros();
    // Si está parcial o pendiente, no mostrar "100%"
    if (this.periodoCargaEstado() === 'parcial' || this.periodoCargaEstado() === 'pendiente') {
      const pendiente = completitud.pendientes[0] ?? completitud.advertencias[0] ?? '';
      return pendiente ? `${base} ${pendiente}` : base;
    }
    // Si está cargado, mostrar % y diferencias si existen
    const detalleCompletitud = `Completitud ${completitud.porcentaje}%.`;
    const pendiente = completitud.errores[0] ?? completitud.advertencias[0] ?? '';
    return pendiente ? `${base} ${detalleCompletitud} ${pendiente}` : `${base} ${detalleCompletitud}`;
  }

  /** Catálogos aplican su política propia: periodo mensual, vigencia o catálogo global. */
  readonly periodoReferenciaAnterior = computed(() => {
    const selected = this.selectedPeriodo();
    return this.periodosMensualesCatalogo()
      .filter((periodo) => periodo < selected)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;
  });

  readonly periodoSeleccionadoLabel = computed(() =>
    formatearPeriodoMesAnio(this.selectedPeriodo(), this.monthOptions),
  );

  readonly periodoReferenciaAnteriorLabel = computed(() => {
    const periodo = this.periodoReferenciaAnterior();
    return periodo ? formatearPeriodoMesAnio(periodo, this.monthOptions) : null;
  });

  readonly periodoContextoHint = computed(() => 'Sincronizado con el período activo.');

  readonly referenciaParametrosGeneralesLabel = computed(() =>
    this.formatReferenciaMensualLabel(this.referenciasMensuales().parametrosGenerales),
  );

  readonly referenciaTramosCargaLabel = computed(() =>
    this.formatReferenciaMensualLabel(this.referenciasMensuales().tramosCarga),
  );

  readonly referenciaTramosImpuestoLabel = computed(() =>
    this.formatReferenciaMensualLabel(this.referenciasMensuales().tramosImpuesto),
  );

  readonly referenciaTablaImpuestoUnicoLabel = computed(() =>
    this.formatReferenciaMensualLabel(this.referenciasMensuales().tablaImpuestoUnico),
  );

  readonly referenciaVisualPrincipalLabel = computed(() => {
    return this.formatReferenciaMensualLabel(this.referenciaVisualPrincipalCodigo());
  });

  readonly referenciaVisualPrincipalCodigo = computed(() => {
    const refs = this.referenciasMensuales();
    return (
      refs.parametrosGenerales ??
      refs.tramosCarga ??
      refs.tramosImpuesto ??
      refs.tablaImpuestoUnico
    );
  });

  readonly tramosCargaPorPeriodo = computed(() => this.catalogos().tramosCarga);

  readonly tramosImpuestoPorPeriodo = computed(() => this.catalogos().tramosImpuesto);

  readonly tablaImpuestoPorPeriodo = computed(() => this.catalogos().tablaImpuestoUnico);

  readonly afpPorPeriodo = computed(() => this.catalogos().afp);

  readonly isapresPorPeriodo = computed(() => this.catalogos().isapres);

  readonly saludOtrasInstitucionesPorPeriodo = computed(() => this.catalogos().saludInstituciones);

  readonly reformaPensionesPorPeriodo = computed(() => this.catalogos().reformaPensiones);

  readonly reformaPrevisionalPorPeriodo = computed(() => this.catalogos().reformaPrevisional);

  readonly trabajosPesadosPorPeriodo = computed(() => this.catalogos().trabajosPesados);

  readonly ley16744ParametroActivo = computed(() => {
    const parametros = this.catalogos().ley16744Parametros;
    return parametros.find((row) => row.vigente) ?? parametros[0] ?? null;
  });

  readonly cotizacionLey16744Seleccionada = computed(
    () => this.ley16744ParametroActivo()?.cotizacionBasicaEmpleador ?? null,
  );

  readonly form = this.fb.group({
    periodo: [this.periodoGlobal.periodoYm(), [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    uf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    utm: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    uta: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimo: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimo18a65: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimoMenor18Mayor65: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sueldoMinimoCasaParticular: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    ingresoMinimoNoRemuneracional: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    gratificacion: this.fb.nonNullable.control(true),
    immGratificacion: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    topeAfpUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeAfp: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeIpsUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeIps: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeCesantiaUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeCesantia: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvMensualUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvMensual: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvAnualUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeApvAnual: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeDepositoConvenidoAnualUf: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeDepositoConvenidoAnual: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    topeAfpVoluntario: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    sis: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    sanna: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    seguroSocialExpectativaVida: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    aporteEmpleadorAfp: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    saludObligatoria: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    saludCcaf: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    saludFonasaConCcaf: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    descuentosBasePorDia: this.fb.nonNullable.control(false),
    afcTrabajadorIndefinido: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorIndefinido: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorPlazo: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorIndefinidoOnceAnosMas: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    afcEmpleadorCasaParticular: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoPesadoEmpleador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoPesadoTrabajador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoMenosPesadoEmpleador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    trabajoMenosPesadoTrabajador: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(100)] }),
    fechaActualizacion: this.fb.control<string | null>(null),
  });

  constructor() {
    this.actualizarValidadorImm(this.form.controls.gratificacion.value);
    this.form.controls.gratificacion.valueChanges.subscribe((value) => this.actualizarValidadorImm(value));

    effect(() => {
      if (!this.inicializado()) {
        return;
      }
      const globalYm = this.periodoGlobal.periodoYm();
      if (globalYm !== this.selectedPeriodo()) {
        void this.seleccionarPeriodo(globalYm, { fromGlobal: true });
      }
    });
  }

  private actualizarValidadorImm(gratificacion: boolean): void {
    const control = this.form.controls.immGratificacion;
    control.setValidators(gratificacion ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
    control.updateValueAndValidity({ emitEvent: false });
  }

  async inicializar(periodoDesdeRuta?: string | null): Promise<void> {
    const periodoRuta = periodoDesdeRuta?.trim() ?? '';
    const periodoRutaValido = /^\d{4}-\d{2}$/.test(periodoRuta) ? periodoRuta : null;
    const periodoInicial = periodoRutaValido ?? this.periodoGlobal.periodoYm();
    if (periodoRutaValido) {
      this.periodoGlobal.setPeriodoYm(periodoRutaValido);
    }

    try {
      const [periodos, periodosMensuales] = await Promise.all([
        this.service.listarPeriodos(),
        this.service.listarPeriodosConDatosMensuales(),
      ]);
      this.periodosGeneralesCatalogo.set(periodos);
      this.periodosMensualesCatalogo.set(periodosMensuales);
    } catch {
      // Si falla, seguimos con período global.
    }

    this.presentacion.seleccionarPeriodo(periodoInicial);
    this.form.controls.periodo.setValue(periodoInicial);
    // Periodo fijo en formulario: edición solo vía selector de período / cabecera.
    this.form.controls.periodo.disable({ emitEvent: false });
    await Promise.all([this.cargar(periodoInicial), this.refrescarPeriodosDesdeBd()]);
    this.inicializado.set(true);
  }

  asString(value: number | string): string {
    return String(value);
  }

  async cargar(periodo?: string, options?: { showLoadingOverlay?: boolean }): Promise<void> {
    const showOverlay = options?.showLoadingOverlay !== false;
    if (showOverlay) {
      this.enterCargar();
    }
    this.cargaBloqueadaPorError.set(false);
    this.datosFormularioListos.set(false);

    try {
      const selectedPeriodo = periodo ?? this.selectedPeriodo();
      this.periodoRemuneracion.set(null);
      const [rowsRaw, catalogos, periodoRemuneracion, clienteConfig] = await Promise.all([
        // Siempre se consulta por periodo seleccionado para evitar traer todo el histórico.
        this.service.listar({ periodo: selectedPeriodo }),
        this.service.listarCatalogos(selectedPeriodo),
        this.service.obtenerPeriodoRemuneracion(selectedPeriodo),
        this.service.obtenerClienteConfig(selectedPeriodo),
      ]);
      const rows = rowsRaw ?? [];
      const referenciaVisual = await this.service.obtenerReferenciaVisualMensual(
        selectedPeriodo,
        catalogos,
        rows.length === 0,
      );

      const next = [...this.rows().filter((row) => row.periodo !== selectedPeriodo), ...rows].sort(
        (left, right) => right.periodo.localeCompare(left.periodo),
      );
      this.rows.set(next);
      this.catalogosOficiales.set(catalogos);
      this.catalogos.set(referenciaVisual.catalogos);
      this.parametroReferenciaAnterior.set(referenciaVisual.parametroGeneral);
      this.referenciasMensuales.set(referenciaVisual.referencias);
      this.periodoRemuneracion.set(periodoRemuneracion);
      this.clienteConfig.set(clienteConfig);
      this.assertCatalogosArrayShape(referenciaVisual.catalogos);
      this.ensureCatalogSelection(referenciaVisual.catalogos);
      if (!rows.length) {
        // Sin oficial actual: la referencia es solo visual y el periodo del formulario sigue siendo el seleccionado.
        const baseReferencia = !clienteConfig && referenciaVisual.parametroGeneral
          ? { ...referenciaVisual.parametroGeneral, periodo: selectedPeriodo }
          : this.emptyParametroForPeriodo(selectedPeriodo);
        this.patchForm(this.parametroConClienteConfig(baseReferencia, clienteConfig), selectedPeriodo);
        this.generalesEditando.set(false);
        this.mostrarAvisoReconciliacionSiCorresponde();
        return;
      }

      this.patchForm(
        this.parametroConClienteConfig(rows.find((row) => row.periodo === selectedPeriodo) ?? rows[0], clienteConfig),
        selectedPeriodo,
      );
      this.generalesEditando.set(false);
      this.mostrarAvisoReconciliacionSiCorresponde();
    } catch (err) {
      this.cargaBloqueadaPorError.set(true);
      const detalle = this.extractErrorDetail(err);
      this.mostrarErrorCargaParametros(detalle);
    } finally {
      if (showOverlay) {
        this.leaveCargar();
      }
      this.cdr.markForCheck();
    }
  }

  /** Comprueba que every key del manifest siga siendo array (fallos tempranos ante cambios de RPC). */
  private assertCatalogosArrayShape(catalogos: ParametrosGeneralesCatalogos): void {
    if (!isDevMode()) {
      return;
    }

    for (const key of PARAMETROS_CATALOGO_ARRAY_KEYS) {
      const value = catalogos[key];

      if (!Array.isArray(value)) {
        console.error(`[Parametros] Catalogo corrupto: "${key}" no es un arreglo`, value);
      }
    }
  }

  private catalogosResumen(catalogos: ParametrosGeneralesCatalogos): string {
    const parts: string[] = [];
    if (catalogos.afp.length) parts.push(`AFP ${catalogos.afp.length}`);
    if (catalogos.isapres.length) parts.push(`ISAPRE ${catalogos.isapres.length}`);
    if (catalogos.saludInstituciones.length) parts.push(`Salud ${catalogos.saludInstituciones.length}`);
    if (catalogos.tramosCarga.length) parts.push(`Tramos carga ${catalogos.tramosCarga.length}`);
    if (catalogos.tramosImpuesto.length) parts.push(`Tramos renta ${catalogos.tramosImpuesto.length}`);
    if (catalogos.tablaImpuestoUnico.length) parts.push(`Tabla impuesto ${catalogos.tablaImpuestoUnico.length}`);
    if (catalogos.reformaPensiones.length) parts.push(`Parámetros legales ${catalogos.reformaPensiones.length}`);
    if (catalogos.reformaPrevisional.length) parts.push(`Reforma previsional ${catalogos.reformaPrevisional.length}`);
    if (catalogos.organismosLey16744.length) parts.push(`Mutuales ${catalogos.organismosLey16744.length}`);
    if (catalogos.ccafEntidades.length) parts.push(`CCAF ${catalogos.ccafEntidades.length}`);
    if (catalogos.afcParametros.length) parts.push(`AFC ${catalogos.afcParametros.length}`);
    return parts.join(', ');
  }

  private describeError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      const message = String((err as { message?: unknown }).message ?? '').trim();
      if (message) {
        return `${fallback} (${message})`;
      }
    }

    return fallback;
  }

  private extractErrorDetail(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message?: unknown }).message ?? '').trim();
    }
    return '';
  }

  private isDuplicatePeriodError(err: unknown): boolean {
    const msg = this.extractErrorDetail(err);
    return /duplicate|unique|23505|ya existe|violates unique/i.test(msg);
  }

  cerrarDialogo(): void {
    this.dialogState.set(null);
  }

  onDialogoAccionPrimaria(): void {
    const dlg = this.dialogState();
    if (!dlg) {
      return;
    }
    if (dlg.kind === 'confirmar-guardado') {
      this.dialogState.set(null);
      this.mostrarSoloConfigClienteEditable();
      return;
    }
    if (dlg.kind === 'confirmar-crear-parametros') {
      this.dialogState.set(null);
      void this.finalizarCrearParametrosConBase(true);
      return;
    }
    if (dlg.kind === 'confirmar-config-cliente' || dlg.kind === 'confirmar-config-cliente-extendido') {
      this.dialogState.set(null);
      this.iniciarEdicionConfigClienteDesdeCero();
      return;
    }
    if (dlg.kind === 'reconciliacion-diferencias') {
      this.dialogState.set(null);
      void this.mantenerConfiguracionCliente();
      return;
    }
    if (dlg.kind === 'config-cliente-sin-base') {
      this.dialogState.set(null);
      this.iniciarEdicionConfigClienteDesdeCero();
      return;
    }
    this.dialogState.set(null);
  }

  onDialogoAccionSecundaria(): void {
    const dlg = this.dialogState();
    if (dlg?.kind === 'confirmar-crear-parametros') {
      this.dialogState.set(null);
      void this.finalizarCrearParametrosConBase(false);
      return;
    }
    if (dlg?.kind === 'confirmar-config-cliente' || dlg?.kind === 'confirmar-config-cliente-extendido') {
      this.dialogState.set(null);
      void this.ejecutarAccionDialogo(dlg.secondaryAction);
      return;
    }
    if (dlg?.kind === 'reconciliacion-diferencias') {
      this.dialogState.set(null);
      void this.ejecutarAccionDialogo(dlg.secondaryAction);
      return;
    }
    if (dlg?.kind === 'config-cliente-sin-base') {
      this.cerrarDialogo();
      return;
    }
    this.cerrarDialogo();
  }

  onDialogoAccionTerciaria(): void {
    const dlg = this.dialogState();
    if (dlg?.kind === 'confirmar-config-cliente-extendido') {
      this.dialogState.set(null);
      void this.ejecutarAccionDialogo(dlg.tertiaryAction);
      return;
    }
    if (dlg?.kind === 'reconciliacion-diferencias') {
      this.dialogState.set(null);
      void this.ejecutarAccionDialogo(dlg.tertiaryAction);
      return;
    }
    this.cerrarDialogo();
  }

  onDialogoAccionCuarta(): void {
    const dlg = this.dialogState();
    if (dlg?.fourthAction) {
      this.dialogState.set(null);
      void this.ejecutarAccionDialogo(dlg.fourthAction);
      return;
    }
    this.cerrarDialogo();
  }

  private async ejecutarAccionDialogo(action: ParametrosDialogAction | undefined): Promise<void> {
    switch (action) {
      case 'usar-ultima-config':
        await this.prepararConfigClienteDesdeUltima();
        return;
      case 'usar-referencia':
        this.prepararConfigClienteDesdeReferencia();
        return;
      case 'usar-oficiales':
        this.prepararConfigClienteDesdeOficiales();
        return;
      case 'actualizar-con-oficiales':
        await this.actualizarClienteConOficiales();
        return;
      case 'mantener-config':
        await this.mantenerConfiguracionCliente();
        return;
      case 'revisar-despues':
        await this.revisarReconciliacionDespues();
        return;
      case 'cancelar':
      default:
        this.cerrarDialogo();
        return;
    }
  }

  private mostrarFormularioInvalido(): void {
    this.dialogState.set(buildParametrosFormularioInvalidoDialog());
  }

  private mostrarPeriodoDuplicado(periodo: string): void {
    this.dialogState.set(buildParametrosPeriodoDuplicadoDialog(periodo));
  }

  private mostrarExitoGuardado(periodo: string): void {
    this.dialogState.set(buildParametrosExitoGuardadoDialog(periodo));
  }

  private mostrarExitoActualizacion(periodo: string): void {
    this.dialogState.set(buildParametrosExitoActualizacionDialog(periodo));
  }

  private mostrarExitoClienteConfig(
    periodo: string,
    source: ConfigClienteDraftSource = 'existente',
    sourcePeriodo: string | null = null,
  ): void {
    this.dialogState.set(buildParametrosExitoClienteConfigDialog(periodo, source, sourcePeriodo));
  }

  private mostrarErrorGuardado(mensajeError: string): void {
    this.dialogState.set(buildParametrosErrorGuardadoDialog(mensajeError));
  }

  private mostrarErrorActualizacion(mensajeError: string): void {
    this.dialogState.set(buildParametrosErrorActualizacionDialog(mensajeError));
  }

  private mostrarErrorClienteConfig(mensajeError: string): void {
    this.dialogState.set(buildParametrosErrorClienteConfigDialog(mensajeError));
  }

  private mostrarSoloConfigClienteEditable(): void {
    this.dialogState.set(buildParametrosSoloConfigClienteEditableDialog());
  }

  private mostrarPeriodoInexistenteConfig(): void {
    this.dialogState.set(buildParametrosPeriodoInexistenteConfigDialog(this.selectedPeriodo()));
  }

  private mostrarPeriodoCerradoSoloLectura(): void {
    this.dialogState.set(buildParametrosPeriodoCerradoSoloLecturaDialog());
  }

  private mostrarErrorCargaParametros(detalleTecnico: string): void {
    this.dialogState.set(buildParametrosErrorCargaDialog(detalleTecnico, this.selectedPeriodo()));
  }

  private mostrarExitoSincronizacion(refresco: boolean): void {
    this.dialogState.set(buildParametrosExitoSincronizacionDialog(refresco));
  }

  private mostrarErrorSincronizacionSinDatos(): void {
    this.dialogState.set(buildParametrosErrorSincronizacionSinDatosDialog());
  }

  private mostrarConfirmacionModificacion(): void {
    this.dialogState.set(buildParametrosConfirmacionModificacionDialog(this.selectedPeriodo()));
  }

  private mostrarConfirmacionCrearParametros(): void {
    this.mostrarSoloConfigClienteEditable();
  }

  private async mostrarDecisionConfigCliente(): Promise<void> {
    const periodo = this.selectedPeriodo();
    const hasOficiales = this.parametroOficialSeleccionado()?.periodo === periodo;
    const hasReferencia = this.parametroReferenciaAnterior() !== null;
    let ultimaConfigDisponible = false;

    this.isLoadingPlantilla.set(true);
    try {
      ultimaConfigDisponible = (await this.service.obtenerUltimaClienteConfigHastaPeriodo(periodo)) !== null;
    } catch {
      ultimaConfigDisponible = false;
    } finally {
      this.isLoadingPlantilla.set(false);
    }

    const actions = resolverOpcionesBaseConfigCliente({
      ultimaConfigDisponible,
      referenciaAnteriorDisponible: hasReferencia,
      oficialesActualesDisponibles: hasOficiales,
    })
      .filter(
        (opcion): opcion is Exclude<ParametrosConfigClienteBaseOpcion, 'cero' | 'cancelar'> =>
          opcion !== 'cero' && opcion !== 'cancelar',
      )
      .sort((left, right) => this.configClienteBasePrioridad(left) - this.configClienteBasePrioridad(right))
      .slice(0, 2)
      .map((opcion) => ({
        label: this.configClienteBaseLabel(opcion),
        action: this.configClienteBaseAction(opcion),
      }));

    this.dialogState.set(buildParametrosDecisionConfigClienteDialog(periodo, actions));
    this.cdr.markForCheck();
  }

  private configClienteBasePrioridad(opcion: Exclude<ParametrosConfigClienteBaseOpcion, 'cero' | 'cancelar'>): number {
    switch (opcion) {
      case 'oficiales':
        return 1;
      case 'ultima':
        return 2;
      case 'referencia':
        return 3;
    }
  }

  private configClienteBaseLabel(opcion: Exclude<ParametrosConfigClienteBaseOpcion, 'cero' | 'cancelar'>): string {
    switch (opcion) {
      case 'ultima':
        return 'Usar última configuración';
      case 'referencia':
        return 'Usar referencia anterior';
      case 'oficiales':
        return 'Usar oficiales';
    }
  }

  private configClienteBaseAction(opcion: Exclude<ParametrosConfigClienteBaseOpcion, 'cero' | 'cancelar'>): ParametrosDialogAction {
    switch (opcion) {
      case 'ultima':
        return 'usar-ultima-config';
      case 'referencia':
        return 'usar-referencia';
      case 'oficiales':
        return 'usar-oficiales';
    }
  }

  private mostrarSinConfigClienteAnterior(): void {
    this.dialogState.set(buildParametrosSinConfigClienteAnteriorDialog(this.selectedPeriodo()));
    this.cdr.markForCheck();
  }

  private mostrarAvisoReconciliacionSiCorresponde(): void {
    const periodo = this.selectedPeriodo();
    const diferencias = this.completitudParametros().diferencias;
    const debeMostrar = debeMostrarAvisoDiferenciasParametrosOficialesMes({
      periodoRemuneracion: this.periodoRemuneracion(),
      tieneOficialMensual: this.parametroOficialSeleccionado() !== null,
      oficial: this.parametroOficialSeleccionado(),
      clienteConfig: this.clienteConfig(),
      diferencias,
    });
    if (!debeMostrar) {
      return;
    }

    const huella = huellaDiferenciasOficialesCliente(diferencias);
    if (this.reconciliacionAvisadaHuellas.get(periodo) === huella) {
      return;
    }

    this.reconciliacionAvisadaHuellas.set(periodo, huella);
    this.mostrarReconciliacionDiferencias(diferencias);
  }

  private mostrarReconciliacionDiferencias(
    diferencias = this.completitudParametros().diferencias,
  ): void {
    this.dialogState.set(
      buildParametrosReconciliacionDiferenciasDialog(this.selectedPeriodo(), diferencias),
    );
    this.cdr.markForCheck();
  }

  private async actualizarClienteConOficiales(): Promise<void> {
    const oficial = this.parametroOficialSeleccionado();
    if (!oficial) {
      this.mostrarErrorClienteConfig('No hay valores oficiales actuales para actualizar la configuración cliente.');
      return;
    }

    this.guardando.set(true);
    try {
      const saved = await this.service.guardarClienteConfig(
        {
          ...crearClienteConfigDesdeOficiales(oficial, this.clienteConfig(), this.selectedPeriodo()),
          estadoReconciliacionOficial: 'actualizado_con_oficiales',
          fechaReconciliacionOficial: new Date().toISOString(),
          origenReconciliacion: 'actualizar_con_oficiales',
          observacionReconciliacion: 'Cliente actualizado con parámetros oficiales desde reconciliación.',
        },
      );
      this.clienteConfig.set(saved);
      this.patchForm(this.parametroConClienteConfig(oficial, saved), this.selectedPeriodo());
      this.selectedCcafId.set(saved.idCcafEntidad);
      this.selectedOrganismoLey16744Id.set(saved.idOrganismoAdministradorLey16744);
      this.mostrarExitoClienteConfig(saved.periodo, 'oficiales', oficial.periodo);
    } catch (err) {
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible actualizar la configuración con oficiales.');
    } finally {
      this.guardando.set(false);
      this.cdr.markForCheck();
    }
  }

  private async mantenerConfiguracionCliente(): Promise<void> {
    await this.registrarDecisionReconciliacion(
      'cliente_confirmado',
      'mantener_configuracion',
      'No se sobrescribió tu configuración cliente.',
      'La decisión quedó registrada para este período.',
    );
  }

  private async revisarReconciliacionDespues(): Promise<void> {
    await this.registrarDecisionReconciliacion(
      'revisar_despues',
      'revisar_despues',
      'La revisión de diferencias quedó postergada.',
      'Nada se actualizó automáticamente. Puedes volver a revisar la configuración cliente cuando corresponda.',
    );
  }

  private async registrarDecisionReconciliacion(
    estado: 'revisar_despues' | 'cliente_confirmado',
    origen: 'mantener_configuracion' | 'revisar_despues',
    message: string,
    detail: string,
  ): Promise<void> {
    const periodo = this.selectedPeriodo();
    if (!this.clienteConfig()) {
      this.mostrarErrorClienteConfig('No hay configuración cliente para registrar la decisión de reconciliación.');
      return;
    }

    this.guardando.set(true);
    try {
      const saved = await this.service.registrarReconciliacionOficialCliente({
        periodo,
        estado,
        origen,
        observacion: message,
      });
      this.clienteConfig.set(saved);
      this.dialogState.set(buildParametrosRegistroDecisionReconciliacionDialog(estado, message, detail));
    } catch (err) {
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible registrar la decisión de reconciliación.');
    } finally {
      this.guardando.set(false);
      this.cdr.markForCheck();
    }
  }

  /** Recarga el periodo activo (p. ej. tras carga oficial externa en BD). */
  async recargarPeriodoSeleccionado(): Promise<void> {
    await this.cargar(this.selectedPeriodo());
  }

  async sincronizar(): Promise<void> {
    const hadData = this.hasAnySyncedData();
    await this.cargar();
    if (this.dialogState()?.kind === 'reconciliacion-diferencias') {
      return;
    }

    if (this.hasAnySyncedData()) {
      this.mostrarExitoSincronizacion(hadData);
      return;
    }

    this.mostrarErrorSincronizacionSinDatos();
  }

  seleccionarTab(tabId: ParametrosTabId): void {
    this.presentacion.seleccionarTab(tabId);
    this.presentacion.seleccionarArea(areaDeTabParametros(tabId));
  }

  seleccionarArea(areaId: ParametrosAreaId): void {
    this.presentacion.seleccionarArea(areaId);

    const firstTab = primerTabDeAreaParametros(areaId);
    if (firstTab) {
      this.presentacion.seleccionarTab(firstTab);
    }
  }

  async ejecutarAccionCierre(): Promise<void> {
    const label = this.cierreAccionSiguienteLabel();

    if (label === 'Completar configuración') {
      this.seleccionarArea('configuracionCliente');
      await this.editarParametros();
      return;
    }

    if (label === 'Revisar datos oficiales') {
      this.seleccionarArea('datosOficiales');
      return;
    }

    if (label === 'Revisar catálogos') {
      this.seleccionarArea('catalogosVigencias');
      return;
    }

    if (label === 'Revisar consistencia') {
      this.seleccionarArea('configuracionCliente');
      return;
    }

    await this.recargarPeriodoSeleccionado();
  }

  async verReferenciaPeriodoAnterior(): Promise<void> {
    const periodo = this.periodoReferenciaAnterior();
    if (!periodo) {
      return;
    }
    await this.seleccionarPeriodo(periodo);
  }

  nuevoPeriodo(): void {
    const periodo = this.selectedPeriodo() || this.currentPeriodo();
    this.patchForm(this.emptyParametroForPeriodo(periodo), periodo);
    this.generalesEditando.set(true);
    this.datosFormularioListos.set(true);
    this.cerrarDialogo();
  }

  async editarParametros(): Promise<void> {
    this.cerrarDialogo();

    if (this.isPreparingEdit()) {
      return;
    }

    if (!this.datosFormularioListos()) {
      this.isPreparingEdit.set(true);
      try {
        await this.cargar(this.selectedPeriodo());
      } finally {
        this.isPreparingEdit.set(false);
      }
    }

    if (!this.clienteConfig()) {
      this.seleccionarArea('configuracionCliente');
      await this.mostrarDecisionConfigCliente();
      return;
    }

    this.seleccionarArea('configuracionCliente');
    this.patchForm(
      this.parametroConClienteConfig(this.baseActualParaConfigCliente(), this.clienteConfig()),
      this.selectedPeriodo(),
    );
    this.generalesEditando.set(true);
    this.configDraftSource.set('existente');
    this.configDraftSourcePeriodo.set(this.selectedPeriodo());
    this.cdr.detectChanges();
  }

  /**
   * Crea borrador para un periodo sin registro (copia del último periodo ≤ seleccionado o valores por defecto).
   * Acción explícita; no reutiliza datos de otro periodo en modo solo lectura.
   */
  async crearParametrosParaPeriodo(): Promise<void> {
    this.mostrarSoloConfigClienteEditable();
  }

  /**
   * Tras elegir en el modal: formulario vacío (solo UI) o plantilla desde último período (consulta puntual).
   * No guarda en base de datos.
   */
  private async finalizarCrearParametrosConBase(cargarUltimoRegistrado: boolean): Promise<void> {
    void cargarUltimoRegistrado;
    this.mostrarSoloConfigClienteEditable();
  }

  private iniciarEdicionConfigClienteDesdeCero(): void {
    this.patchForm(this.baseActualParaConfigCliente(), this.selectedPeriodo());
    this.aplicarClienteConfigDraft(null);
    this.configDraftSource.set('cero');
    this.configDraftSourcePeriodo.set(this.selectedPeriodo());
    this.generalesEditando.set(true);
    this.form.markAsPristine();
    this.cdr.markForCheck();
  }

  private async prepararConfigClienteDesdeUltima(): Promise<void> {
    this.isLoadingPlantilla.set(true);
    try {
      const base = await this.service.obtenerUltimaClienteConfigHastaPeriodo(this.selectedPeriodo());
      if (!base) {
        this.mostrarSinConfigClienteAnterior();
        return;
      }

      this.patchForm(this.baseActualParaConfigCliente(), this.selectedPeriodo());
      this.aplicarClienteConfigDraft(base);
      this.configDraftSource.set('ultima');
      this.configDraftSourcePeriodo.set(base.periodo);
      this.generalesEditando.set(true);
      this.form.markAsPristine();
    } catch (err) {
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible cargar la última configuración cliente.');
    } finally {
      this.isLoadingPlantilla.set(false);
      this.cdr.markForCheck();
    }
  }

  private prepararConfigClienteDesdeOficiales(): void {
    const oficial = this.parametroOficialSeleccionado();
    if (!oficial || oficial.periodo !== this.selectedPeriodo()) {
      this.mostrarErrorClienteConfig('No hay valores oficiales disponibles para este período.');
      return;
    }

    this.patchForm(oficial, this.selectedPeriodo());
    this.selectedCcafId.set(null);
    this.selectedOrganismoLey16744Id.set(null);
    this.configDraftSource.set('oficiales');
    this.configDraftSourcePeriodo.set(oficial.periodo);
    this.generalesEditando.set(true);
    this.form.markAsPristine();
    this.cdr.markForCheck();
  }

  private prepararConfigClienteDesdeReferencia(): void {
    const referencia = this.parametroReferenciaAnterior();
    if (!referencia) {
      this.mostrarErrorClienteConfig('No hay referencia anterior disponible para usar como base.');
      return;
    }

    this.patchForm({ ...referencia, periodo: this.selectedPeriodo() }, this.selectedPeriodo());
    this.selectedCcafId.set(null);
    this.selectedOrganismoLey16744Id.set(null);
    this.configDraftSource.set('referencia');
    this.configDraftSourcePeriodo.set(referencia.periodo);
    this.generalesEditando.set(true);
    this.form.markAsPristine();
    this.cdr.markForCheck();
  }

  private aplicarClienteConfigDraft(config: ParametrosGeneralesClienteConfig | null): void {
    this.form.patchValue(
      {
        uf: config?.uf ?? null,
        utm: config?.utm ?? null,
        uta: config?.uta ?? null,
        sueldoMinimo: config?.sueldoMinimo ?? null,
        sueldoMinimo18a65: config?.sueldoMinimo18a65 ?? null,
        sueldoMinimoMenor18Mayor65: config?.sueldoMinimoMenor18Mayor65 ?? null,
        sueldoMinimoCasaParticular: config?.sueldoMinimoCasaParticular ?? null,
        ingresoMinimoNoRemuneracional: config?.ingresoMinimoNoRemuneracional ?? null,
        topeAfpUf: config?.topeAfpUf ?? null,
        topeAfp: config?.topeAfp ?? null,
        topeIpsUf: config?.topeIpsUf ?? null,
        topeIps: config?.topeIps ?? null,
        topeCesantiaUf: config?.topeCesantiaUf ?? null,
        topeCesantia: config?.topeCesantia ?? null,
        topeApvMensualUf: config?.topeApvMensualUf ?? null,
        topeApvMensual: config?.topeApvMensual ?? null,
        topeApvAnualUf: config?.topeApvAnualUf ?? null,
        topeApvAnual: config?.topeApvAnual ?? null,
        topeDepositoConvenidoAnualUf: config?.topeDepositoConvenidoAnualUf ?? null,
        topeDepositoConvenidoAnual: config?.topeDepositoConvenidoAnual ?? null,
        topeAfpVoluntario: config?.topeAfpVoluntario ?? null,
        sis: config?.sis ?? null,
        sanna: config?.sanna ?? null,
        seguroSocialExpectativaVida: config?.seguroSocialExpectativaVida ?? null,
        aporteEmpleadorAfp: config?.aporteEmpleadorAfp ?? null,
        saludObligatoria: config?.saludObligatoria ?? null,
        saludCcaf: config?.saludCcaf ?? null,
        saludFonasaConCcaf: config?.saludFonasaConCcaf ?? null,
        afcTrabajadorIndefinido: config?.afcTrabajadorIndefinido ?? null,
        afcEmpleadorIndefinido: config?.afcEmpleadorIndefinido ?? null,
        afcEmpleadorPlazo: config?.afcEmpleadorPlazo ?? null,
        afcEmpleadorIndefinidoOnceAnosMas: config?.afcEmpleadorIndefinidoOnceAnosMas ?? null,
        afcEmpleadorCasaParticular: config?.afcEmpleadorCasaParticular ?? null,
        trabajoPesadoEmpleador: config?.trabajoPesadoEmpleador ?? null,
        trabajoPesadoTrabajador: config?.trabajoPesadoTrabajador ?? null,
        trabajoMenosPesadoEmpleador: config?.trabajoMenosPesadoEmpleador ?? null,
        trabajoMenosPesadoTrabajador: config?.trabajoMenosPesadoTrabajador ?? null,
        descuentosBasePorDia: config?.descuentosBasePorDia ?? false,
        gratificacion: config?.gratificacion ?? true,
        immGratificacion: config?.immGratificacion ?? 4.75,
      },
      { emitEvent: false },
    );

    this.selectedCcafId.set(config?.idCcafEntidad ?? null);
    this.selectedOrganismoLey16744Id.set(config?.idOrganismoAdministradorLey16744 ?? null);
  }

  private baseActualParaConfigCliente(): ParametroGeneral {
    return this.parametroOficialSeleccionado() ?? this.emptyParametroForPeriodo(this.selectedPeriodo());
  }

  volverParametros(): void {
    const row = this.rows().find((item) => item.periodo === this.selectedPeriodo());
    const referencia = this.parametroReferenciaAnterior();
    const base = row ?? (!this.clienteConfig() && referencia ? { ...referencia, periodo: this.selectedPeriodo() } : this.emptyParametroForPeriodo(this.selectedPeriodo()));
    this.patchForm(
      this.parametroConClienteConfig(base, this.clienteConfig()),
      this.selectedPeriodo(),
    );
    this.ensureCatalogSelection(this.catalogos());
    this.generalesEditando.set(false);
    this.cerrarDialogo();
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.guardando() || !this.datosFormularioListos()) {
      if (this.form.invalid && !this.guardando() && this.datosFormularioListos()) {
        this.mostrarFormularioInvalido();
      }
      return;
    }

    await this.ejecutarGuardarClienteConfig();
  }

  private async ejecutarGuardarClienteConfig(): Promise<void> {
    if (this.guardando() || !this.datosFormularioListos()) {
      return;
    }

    const periodo = this.selectedPeriodo();
    this.guardando.set(true);
    this.cerrarDialogo();

    try {
      const saved = await this.guardarClienteConfigDesdeFormulario(periodo);
      this.clienteConfig.set(saved);
      this.generalesEditando.set(false);
      this.mostrarExitoClienteConfig(saved.periodo, this.configDraftSource(), this.configDraftSourcePeriodo());
      this.configDraftSource.set('existente');
      this.configDraftSourcePeriodo.set(saved.periodo);
    } catch (err) {
      if (isDevMode()) {
        console.error('[Parametros] guardarClienteConfig', err);
      }
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible guardar la configuración cliente.');
    } finally {
      this.guardando.set(false);
    }
  }

  private guardarClienteConfigDesdeFormulario(periodo: string): Promise<ParametrosGeneralesClienteConfig> {
    const raw = this.form.getRawValue();
    return this.service.guardarClienteConfig({
      periodo,
      uf: this.numberFromUnknown(raw.uf),
      utm: this.numberFromUnknown(raw.utm),
      uta: this.numberFromUnknown(raw.uta),
      sueldoMinimo: this.numberFromUnknown(raw.sueldoMinimo),
      sueldoMinimo18a65: this.numberFromUnknown(raw.sueldoMinimo18a65),
      sueldoMinimoMenor18Mayor65: this.numberFromUnknown(raw.sueldoMinimoMenor18Mayor65),
      sueldoMinimoCasaParticular: this.numberFromUnknown(raw.sueldoMinimoCasaParticular),
      ingresoMinimoNoRemuneracional: this.numberFromUnknown(raw.ingresoMinimoNoRemuneracional),
      topeAfpUf: this.numberFromUnknown(raw.topeAfpUf),
      topeAfp: this.numberFromUnknown(raw.topeAfp),
      topeIpsUf: this.numberFromUnknown(raw.topeIpsUf),
      topeIps: this.numberFromUnknown(raw.topeIps),
      topeCesantiaUf: this.numberFromUnknown(raw.topeCesantiaUf),
      topeCesantia: this.numberFromUnknown(raw.topeCesantia),
      topeApvMensualUf: this.numberFromUnknown(raw.topeApvMensualUf),
      topeApvMensual: this.numberFromUnknown(raw.topeApvMensual),
      topeApvAnualUf: this.numberFromUnknown(raw.topeApvAnualUf),
      topeApvAnual: this.numberFromUnknown(raw.topeApvAnual),
      topeDepositoConvenidoAnualUf: this.numberFromUnknown(raw.topeDepositoConvenidoAnualUf),
      topeDepositoConvenidoAnual: this.numberFromUnknown(raw.topeDepositoConvenidoAnual),
      topeAfpVoluntario: this.numberFromUnknown(raw.topeAfpVoluntario),
      sis: this.numberFromUnknown(raw.sis),
      sanna: this.numberFromUnknown(raw.sanna),
      seguroSocialExpectativaVida: this.numberFromUnknown(raw.seguroSocialExpectativaVida),
      aporteEmpleadorAfp: this.numberFromUnknown(raw.aporteEmpleadorAfp),
      saludObligatoria: this.numberFromUnknown(raw.saludObligatoria),
      saludCcaf: this.numberFromUnknown(raw.saludCcaf),
      saludFonasaConCcaf: this.numberFromUnknown(raw.saludFonasaConCcaf),
      descuentosBasePorDia: raw.descuentosBasePorDia,
      afcTrabajadorIndefinido: this.numberFromUnknown(raw.afcTrabajadorIndefinido),
      afcEmpleadorIndefinido: this.numberFromUnknown(raw.afcEmpleadorIndefinido),
      afcEmpleadorPlazo: this.numberFromUnknown(raw.afcEmpleadorPlazo),
      afcEmpleadorIndefinidoOnceAnosMas: this.numberFromUnknown(raw.afcEmpleadorIndefinidoOnceAnosMas),
      afcEmpleadorCasaParticular: this.numberFromUnknown(raw.afcEmpleadorCasaParticular),
      trabajoPesadoEmpleador: this.numberFromUnknown(raw.trabajoPesadoEmpleador),
      trabajoPesadoTrabajador: this.numberFromUnknown(raw.trabajoPesadoTrabajador),
      trabajoMenosPesadoEmpleador: this.numberFromUnknown(raw.trabajoMenosPesadoEmpleador),
      trabajoMenosPesadoTrabajador: this.numberFromUnknown(raw.trabajoMenosPesadoTrabajador),
      gratificacion: raw.gratificacion,
      immGratificacion: this.numberFromUnknown(raw.immGratificacion),
      idCcafEntidad: this.selectedCcafId(),
      idOrganismoAdministradorLey16744: this.selectedOrganismoLey16744Id(),
    });
  }

  private async ejecutarGuardarInterno(): Promise<void> {
    this.mostrarSoloConfigClienteEditable();
  }

  bloquearSiLectura(event: Event): void {
    if (!this.generalesEditando()) {
      event.preventDefault();
    }
  }

  setDescuentosBase(value: boolean): void {
    if (!this.generalesEditando()) {
      return;
    }

    this.form.controls.descuentosBasePorDia.setValue(value);
  }

  seleccionarCcaf(value: SearchSelectValue): void {
    this.selectedCcafId.set(this.catalogIdFromSearchValue(value));
  }

  seleccionarOrganismoLey16744(value: SearchSelectValue): void {
    this.selectedOrganismoLey16744Id.set(this.catalogIdFromSearchValue(value));
  }

  isConfigurableTab(): boolean {
    return true;
  }

  isClienteConfigTab(): boolean {
    return this.activeArea() === 'configuracionCliente';
  }

  hasClienteConfigEditableEnTab(): boolean {
    return this.isClienteConfigTab();
  }

  isOfficialSnapshotTab(): boolean {
    const tab = this.activeTab();
    return tab === 'valores' || tab === 'remuneraciones';
  }

  tieneDatosEditablesEnPeriodo(): boolean {
    return true;
  }

  puedeEntrarEnEdicionDesdeTab(): boolean {
    return this.tieneDatosEditablesEnPeriodo();
  }

  /** Tooltip del botón Modificar cuando la vista activa no es editable. */
  modificarTooltipConsulta(): string {
    if (this.generalesEditando()) {
      return '';
    }
    if (!this.isConfigurableTab()) {
      return 'Modificar aplica a la configuración del cliente. Los datos oficiales se muestran para referencia.';
    }
    return 'Abre edición para completar la configuración. Si el período aún no está listo, puede tardar un momento en preparar la edición.';
  }

  fechaActualizacionLabel(): string {
    const value = this.form.controls.fechaActualizacion.value;
    return value ? this.formatDateTime(value) : 'Sin información';
  }

  money(value: number | null): string {
    return value === null ? '—' : formatoMontoGridParametros(value);
  }

  decimal(value: number | null, digits = 2): string {
    return value === null ? '—' : formatoDecimalGridParametros(value, digits);
  }

  date(value: string | null): string {
    return value ? formatoFechaGridParametros(value) : '—';
  }

  private formatReferenciaMensualLabel(periodo: string | null): string | null {
    return periodo ? formatearPeriodoMesAnio(periodo, this.monthOptions) : null;
  }

  private puedeAbandonarEdicionAlCambiarPeriodo(): boolean {
    if (!this.generalesEditando() || !this.form.dirty) {
      return true;
    }
    return globalThis.confirm(
      'Hay cambios sin guardar. Si continúa, se descartarán. ¿Cambiar de período?',
    );
  }

  async seleccionarPeriodo(
    periodo: string,
    options?: { fromGlobal?: boolean },
  ): Promise<void> {
    if (periodo === this.selectedPeriodo()) {
      return;
    }
    if (!this.puedeAbandonarEdicionAlCambiarPeriodo()) {
      if (options?.fromGlobal) {
        this.periodoGlobal.setPeriodoYm(this.selectedPeriodo());
      }
      this.cdr.markForCheck();
      return;
    }

    this.presentacion.seleccionarPeriodo(periodo);
    this.form.controls.periodo.setValue(periodo, { emitEvent: false });
    this.generalesEditando.set(false);
    this.cerrarDialogo();

    await Promise.all([this.cargar(periodo), this.refrescarPeriodosDesdeBd()]);

    if (!options?.fromGlobal) {
      this.periodoGlobal.setPeriodoYm(periodo);
    }
  }

  private async prepararNuevoPeriodoDesdeBase(periodo: string): Promise<void> {
    try {
      const base = await this.service.obtenerUltimoHastaPeriodo(periodo);
      if (base) {
        this.patchForm(this.parametroConClienteConfig({ ...base, periodo }, this.clienteConfig()));
        return;
      }
    } catch {
      // Si falla la carga de base, usamos defaults.
    }

    this.patchForm(this.emptyParametroForPeriodo(periodo));
  }

  private parametroConClienteConfig(
    row: ParametroGeneral,
    config: ParametrosGeneralesClienteConfig | null,
  ): ParametroGeneral {
    if (!config || config.periodo !== row.periodo) {
      return row;
    }

    return {
      ...row,
      uf: config.uf ?? row.uf,
      utm: config.utm ?? row.utm,
      uta: config.uta ?? row.uta,
      sueldoMinimo: config.sueldoMinimo ?? row.sueldoMinimo,
      sueldoMinimo18a65: config.sueldoMinimo18a65 ?? row.sueldoMinimo18a65,
      sueldoMinimoMenor18Mayor65: config.sueldoMinimoMenor18Mayor65 ?? row.sueldoMinimoMenor18Mayor65,
      sueldoMinimoCasaParticular: config.sueldoMinimoCasaParticular ?? row.sueldoMinimoCasaParticular,
      ingresoMinimoNoRemuneracional: config.ingresoMinimoNoRemuneracional ?? row.ingresoMinimoNoRemuneracional,
      topeAfpUf: config.topeAfpUf ?? row.topeAfpUf,
      topeAfp: config.topeAfp ?? row.topeAfp,
      topeIpsUf: config.topeIpsUf ?? row.topeIpsUf,
      topeIps: config.topeIps ?? row.topeIps,
      topeCesantiaUf: config.topeCesantiaUf ?? row.topeCesantiaUf,
      topeCesantia: config.topeCesantia ?? row.topeCesantia,
      topeApvMensualUf: config.topeApvMensualUf ?? row.topeApvMensualUf,
      topeApvMensual: config.topeApvMensual ?? row.topeApvMensual,
      topeApvAnualUf: config.topeApvAnualUf ?? row.topeApvAnualUf,
      topeApvAnual: config.topeApvAnual ?? row.topeApvAnual,
      topeDepositoConvenidoAnualUf: config.topeDepositoConvenidoAnualUf ?? row.topeDepositoConvenidoAnualUf,
      topeDepositoConvenidoAnual: config.topeDepositoConvenidoAnual ?? row.topeDepositoConvenidoAnual,
      topeAfpVoluntario: config.topeAfpVoluntario ?? row.topeAfpVoluntario,
      sis: config.sis ?? row.sis,
      sanna: config.sanna ?? row.sanna,
      seguroSocialExpectativaVida: config.seguroSocialExpectativaVida ?? row.seguroSocialExpectativaVida,
      aporteEmpleadorAfp: config.aporteEmpleadorAfp ?? row.aporteEmpleadorAfp,
      saludObligatoria: config.saludObligatoria ?? row.saludObligatoria,
      saludCcaf: config.saludCcaf ?? row.saludCcaf,
      saludFonasaConCcaf: config.saludFonasaConCcaf ?? row.saludFonasaConCcaf,
      descuentosBasePorDia: config.descuentosBasePorDia ?? row.descuentosBasePorDia,
      afcTrabajadorIndefinido: config.afcTrabajadorIndefinido ?? row.afcTrabajadorIndefinido,
      afcEmpleadorIndefinido: config.afcEmpleadorIndefinido ?? row.afcEmpleadorIndefinido,
      afcEmpleadorPlazo: config.afcEmpleadorPlazo ?? row.afcEmpleadorPlazo,
      afcEmpleadorIndefinidoOnceAnosMas:
        config.afcEmpleadorIndefinidoOnceAnosMas ?? row.afcEmpleadorIndefinidoOnceAnosMas,
      afcEmpleadorCasaParticular: config.afcEmpleadorCasaParticular ?? row.afcEmpleadorCasaParticular,
      trabajoPesadoEmpleador: config.trabajoPesadoEmpleador ?? row.trabajoPesadoEmpleador,
      trabajoPesadoTrabajador: config.trabajoPesadoTrabajador ?? row.trabajoPesadoTrabajador,
      trabajoMenosPesadoEmpleador: config.trabajoMenosPesadoEmpleador ?? row.trabajoMenosPesadoEmpleador,
      trabajoMenosPesadoTrabajador: config.trabajoMenosPesadoTrabajador ?? row.trabajoMenosPesadoTrabajador,
      gratificacion: config.gratificacion ?? row.gratificacion,
      immGratificacion: config.immGratificacion ?? row.immGratificacion,
      fechaActualizacion: config.fechaActualizacion ?? row.fechaActualizacion,
    };
  }

  private patchForm(row: ParametroGeneral, expectedPeriodo?: string): void {
    const selected = expectedPeriodo ?? this.selectedPeriodo();
    if (row.periodo !== selected) {
      this.dialogState.set(buildParametrosPeriodoNoCoincideDialog(row.periodo, selected));
      this.datosFormularioListos.set(false);
      return;
    }

    this.form.reset({
      periodo: row.periodo,
      uf: row.uf,
      utm: row.utm,
      uta: row.uta,
      sueldoMinimo: row.sueldoMinimo,
      sueldoMinimo18a65: row.sueldoMinimo18a65,
      sueldoMinimoMenor18Mayor65: row.sueldoMinimoMenor18Mayor65,
      sueldoMinimoCasaParticular: row.sueldoMinimoCasaParticular,
      ingresoMinimoNoRemuneracional: row.ingresoMinimoNoRemuneracional,
      gratificacion: row.gratificacion,
      immGratificacion: row.immGratificacion,
      topeAfpUf: row.topeAfpUf,
      topeAfp: row.topeAfp,
      topeIpsUf: row.topeIpsUf,
      topeIps: row.topeIps,
      topeCesantiaUf: row.topeCesantiaUf,
      topeCesantia: row.topeCesantia,
      topeApvMensualUf: row.topeApvMensualUf,
      topeApvMensual: row.topeApvMensual,
      topeApvAnualUf: row.topeApvAnualUf,
      topeApvAnual: row.topeApvAnual,
      topeDepositoConvenidoAnualUf: row.topeDepositoConvenidoAnualUf,
      topeDepositoConvenidoAnual: row.topeDepositoConvenidoAnual,
      topeAfpVoluntario: row.topeAfpVoluntario,
      sis: row.sis,
      sanna: row.sanna,
      seguroSocialExpectativaVida: row.seguroSocialExpectativaVida,
      aporteEmpleadorAfp: row.aporteEmpleadorAfp,
      saludObligatoria: row.saludObligatoria,
      saludCcaf: row.saludCcaf,
      saludFonasaConCcaf: row.saludFonasaConCcaf,
      descuentosBasePorDia: row.descuentosBasePorDia,
      afcTrabajadorIndefinido: row.afcTrabajadorIndefinido,
      afcEmpleadorIndefinido: row.afcEmpleadorIndefinido,
      afcEmpleadorPlazo: row.afcEmpleadorPlazo,
      afcEmpleadorIndefinidoOnceAnosMas: row.afcEmpleadorIndefinidoOnceAnosMas,
      afcEmpleadorCasaParticular: row.afcEmpleadorCasaParticular,
      trabajoPesadoEmpleador: row.trabajoPesadoEmpleador,
      trabajoPesadoTrabajador: row.trabajoPesadoTrabajador,
      trabajoMenosPesadoEmpleador: row.trabajoMenosPesadoEmpleador,
      trabajoMenosPesadoTrabajador: row.trabajoMenosPesadoTrabajador,
      fechaActualizacion: row.fechaActualizacion,
    });

    this.datosFormularioListos.set(true);
  }

  private enterCargar(): void {
    this.cargarDepth += 1;
    this.isLoading.set(true);
  }

  private leaveCargar(): void {
    this.cargarDepth = Math.max(0, this.cargarDepth - 1);
    if (this.cargarDepth === 0) {
      this.isLoading.set(false);
    }
  }

  private async refrescarPeriodosDesdeBd(): Promise<void> {
    try {
      const [periodos, periodosMensuales] = await Promise.all([
        this.service.listarPeriodos(),
        this.service.listarPeriodosConDatosMensuales(),
      ]);
      this.periodosGeneralesCatalogo.set(periodos);
      this.periodosMensualesCatalogo.set(periodosMensuales);
    } catch {
      // Mantiene el catálogo previo si falla la consulta ligera.
    }
    this.cdr.markForCheck();
  }

  private ensureCatalogSelection(catalogos: ParametrosGeneralesCatalogos): void {
    const config = this.clienteConfig();
    const configCcafId = config?.idCcafEntidad ?? null;
    const ccafExists = catalogos.ccafEntidades.some((row) => row.idCcafEntidad === configCcafId);
    this.selectedCcafId.set(ccafExists ? configCcafId : null);

    const configOrganismoId = config?.idOrganismoAdministradorLey16744 ?? null;
    const organismoExists = catalogos.organismosLey16744.some(
      (row) => row.idOrganismoAdministradorLey16744 === configOrganismoId,
    );
    this.selectedOrganismoLey16744Id.set(organismoExists ? configOrganismoId : null);
  }

  /** Valores neutros para un periodo sin registro (sin datos de otros periodos). */
  private emptyParametroForPeriodo(periodo: string): ParametroGeneral {
    return {
      periodo,
      uf: null,
      utm: null,
      uta: null,
      sueldoMinimo: null,
      sueldoMinimo18a65: null,
      sueldoMinimoMenor18Mayor65: null,
      sueldoMinimoCasaParticular: null,
      ingresoMinimoNoRemuneracional: null,
      gratificacion: false,
      immGratificacion: null,
      topeAfpUf: null,
      topeAfp: null,
      topeIpsUf: null,
      topeIps: null,
      topeCesantiaUf: null,
      topeCesantia: null,
      topeApvMensualUf: null,
      topeApvMensual: null,
      topeApvAnualUf: null,
      topeApvAnual: null,
      topeDepositoConvenidoAnualUf: null,
      topeDepositoConvenidoAnual: null,
      topeAfpVoluntario: null,
      sis: null,
      sanna: null,
      seguroSocialExpectativaVida: null,
      aporteEmpleadorAfp: null,
      saludObligatoria: null,
      saludCcaf: null,
      saludFonasaConCcaf: null,
      descuentosBasePorDia: false,
      afcTrabajadorIndefinido: null,
      afcEmpleadorIndefinido: null,
      afcEmpleadorPlazo: null,
      afcEmpleadorIndefinidoOnceAnosMas: null,
      afcEmpleadorCasaParticular: null,
      trabajoPesadoEmpleador: null,
      trabajoPesadoTrabajador: null,
      trabajoMenosPesadoEmpleador: null,
      trabajoMenosPesadoTrabajador: null,
      fechaActualizacion: null,
    };
  }

  private emptyParametro(): ParametroGeneral {
    return this.emptyParametroForPeriodo(this.currentPeriodo());
  }

  private emptyCatalogos(): ParametrosGeneralesCatalogos {
    return {
      afp: [],
      isapres: [],
      saludInstituciones: [],
      tramosCarga: [],
      tramosImpuesto: [],
      tablaImpuestoUnico: [],
      reformaPensiones: [],
      trabajosPesados: [],
      reformaPrevisional: [],
      ley16744Parametros: [],
      organismosLey16744: [],
      ccafEntidades: [],
      apvInstituciones: [],
      apvFormasPago: [],
      afcParametros: [],
    };
  }

  private emptyReferenciasMensuales(): ParametrosReferenciaMensualInfo {
    return {
      parametrosGenerales: null,
      tramosCarga: null,
      tramosImpuesto: null,
      tablaImpuestoUnico: null,
      ley16744Parametros: null,
    };
  }

  private currentPeriodo(): string {
    // Usa fecha local estable (evita desfase por TZ/UTC alrededor de medianoche).
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private catalogIdFromSearchValue(value: SearchSelectValue): number | null {
    if (value === null || value === '' || value === undefined) {
      return null;
    }

    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  private numberFromUnknown(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

}
