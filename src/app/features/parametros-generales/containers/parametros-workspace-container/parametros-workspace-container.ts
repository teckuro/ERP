import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  isDevMode,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import {
  AfpParametro,
  ApvApvcFormaPago,
  ApvApvcInstitucion,
  CcafEntidad,
  IsapreParametro,
  Ley16744Parametro,
  OrganismoLey16744,
  ParametroGeneral,
  ParametroLegal,
  ParametrosGeneralesClienteConfig,
  PARAMETROS_CATALOGO_ARRAY_KEYS,
  ParametrosGeneralesCatalogos,
  ParametrosReferenciaMensualInfo,
  ParametrosTabId,
  PeriodoRemuneracionEstadoInfo,
  ReformaPrevisionalParametro,
  TablaImpuestoUnicoParametro,
  TrabajoPesadoParametro,
  TramoCargaParametro,
  TramoImpuestoParametro,
} from '../../models/parametro-general.model';
import { ParametrosGeneralesService } from '../../services/parametros-generales.service';
import {
  ParametrosConfigClienteBaseOpcion,
  ParametrosEstadoVisual,
  crearClienteConfigDesdeOficiales,
  evaluarCompletitudParametrosMensual,
  resolverEstadoVisualParametros,
  resolverOpcionesBaseConfigCliente,
} from '../../rules/parametros-completitud.rules';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import { SearchSelectValue } from '../../../../shared/components/ui/search-select.component';
import { DataGridColumn } from '../../../../shared/components/ui/data-grid.component';
import { CardComponent, CardContentComponent } from '../../../../shared/components/ui/card.component';
import {
  MessageBoxComponent,
  MessageBoxVariant,
} from '../../../../shared/components/ui/message-box.component';
import { PageActionsComponent } from '../../../../shared/components/ui/page-actions.component';
import { ParametrosRemuneracionesTabComponent } from '../../components/tabs/parametros-remuneraciones-tab.component';
import { ParametrosValoresTabComponent } from '../../components/tabs/parametros-valores-tab.component';
import { ParametrosConfigClienteTabComponent } from '../../components/tabs/parametros-config-cliente-tab.component';
import { ParametrosAfpTabComponent } from '../../components/tabs/parametros-afp-tab.component';
import {
  CcafMutualSubId,
  ParametrosCcafMutualesTabComponent,
} from '../../components/tabs/parametros-ccaf-mutuales-tab.component';
import { ParametrosSaludTabComponent } from '../../components/tabs/parametros-salud-tab.component';
import { ParametrosReformaTabComponent } from '../../components/tabs/parametros-reforma-tab.component';
import { ParametrosTramosCargaTabComponent } from '../../components/tabs/parametros-tramos-carga-tab.component';
import { ParametrosTramosRentaTabComponent } from '../../components/tabs/parametros-tramos-renta-tab.component';
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';

interface ParametrosTab {
  id: ParametrosTabId;
  label: string;
}

interface MonthOption {
  value: string;
  label: string;
}

type ParametrosDialogKind =
  | 'alerta'
  | 'confirmar-guardado'
  | 'confirmar-crear-parametros'
  | 'confirmar-config-cliente'
  | 'confirmar-config-cliente-extendido'
  | 'config-cliente-sin-base'
  | 'reconciliacion-diferencias';
type PeriodoCargaEstado = ParametrosEstadoVisual;
type ConfigClienteDraftSource = 'cero' | 'ultima' | 'referencia' | 'oficiales' | 'existente';
type ParametrosDialogAction =
  | 'usar-ultima-config'
  | 'usar-referencia'
  | 'usar-oficiales'
  | 'actualizar-con-oficiales'
  | 'cancelar'
  | 'mantener-config'
  | 'revisar-despues';

interface ParametrosDialogState {
  kind: ParametrosDialogKind;
  variant: MessageBoxVariant;
  title: string;
  message: string;
  detail?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  fourthLabel?: string;
  secondaryAction?: ParametrosDialogAction;
  tertiaryAction?: ParametrosDialogAction;
  fourthAction?: ParametrosDialogAction;
}

@Component({
  selector: 'app-parametros-workspace-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    PageActionsComponent,
    MessageBoxComponent,
    CardComponent,
    CardContentComponent,
    ParametrosValoresTabComponent,
    ParametrosConfigClienteTabComponent,
    ParametrosRemuneracionesTabComponent,
    ParametrosCcafMutualesTabComponent,
    ParametrosTramosCargaTabComponent,
    ParametrosTramosRentaTabComponent,
    ParametrosSaludTabComponent,
    ParametrosAfpTabComponent,
    ParametrosReformaTabComponent,
  ],
  templateUrl: './parametros-workspace-container.html',
  styleUrls: ['./parametros-workspace-container.css', './parametros-workspace-container.responsive.css'],
})
export class ParametrosWorkspaceContainer implements OnInit {
  private readonly service = inject(ParametrosGeneralesService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly periodoGlobal = inject(PeriodoActivoService);

  readonly tabs: readonly ParametrosTab[] = [
    { id: 'configCliente', label: 'Cliente' },
    { id: 'valores', label: 'Información de Valores' },
    { id: 'remuneraciones', label: 'Información de Remuneraciones' },
    { id: 'ccafMutual', label: 'CCAF y Mutual' },
    { id: 'tramosCarga', label: 'Tramos Cargas Familiares' },
    { id: 'impuestoUnico', label: 'Impuesto único' },
    { id: 'salud', label: 'Salud' },
    { id: 'prevision', label: 'Previsión' },
    { id: 'reforma', label: 'Reforma de Pensiones' },
  ];

  readonly monthOptions: readonly MonthOption[] = [
    { value: '01', label: 'ENERO' },
    { value: '02', label: 'FEBRERO' },
    { value: '03', label: 'MARZO' },
    { value: '04', label: 'ABRIL' },
    { value: '05', label: 'MAYO' },
    { value: '06', label: 'JUNIO' },
    { value: '07', label: 'JULIO' },
    { value: '08', label: 'AGOSTO' },
    { value: '09', label: 'SEPTIEMBRE' },
    { value: '10', label: 'OCTUBRE' },
    { value: '11', label: 'NOVIEMBRE' },
    { value: '12', label: 'DICIEMBRE' },
  ];

  readonly activeTab = signal<ParametrosTabId>('configCliente');
  readonly ccafMutualSubTab = signal<CcafMutualSubId>('listaCcaf');
  readonly rows = signal<ParametroGeneral[]>([]);
  readonly selectedPeriodo = signal(this.periodoGlobal.periodoYm());
  readonly catalogosOficiales = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly catalogos = signal<ParametrosGeneralesCatalogos>(this.emptyCatalogos());
  readonly parametroReferenciaAnterior = signal<ParametroGeneral | null>(null);
  readonly referenciasMensuales = signal<ParametrosReferenciaMensualInfo>(this.emptyReferenciasMensuales());
  readonly clienteConfig = signal<ParametrosGeneralesClienteConfig | null>(null);
  readonly periodosGeneralesCatalogo = signal<string[]>([]);
  readonly periodosMensualesCatalogo = signal<string[]>([]);
  readonly periodoRemuneracion = signal<PeriodoRemuneracionEstadoInfo | null>(null);
  readonly selectedCcafId = signal<number | null>(null);
  readonly selectedMutualId = signal<number | null>(null);
  readonly isLoading = signal(true);
  /** Consulta al backend solo para plantilla del último período (crear parámetros); no es guardado. */
  readonly isLoadingPlantilla = signal(false);
  readonly isSaving = signal(false);
  readonly generalesEditando = signal(false);
  /** Formulario hidratado para el periodo actual y sin error de carga pendiente. */
  readonly datosFormularioListos = signal(false);
  /** Evita doble clic mientras se prepara el modo edición (carga + copia de periodo). */
  readonly isPreparingEdit = signal(false);
  /** Refresco silencioso de flujos de edicion. */
  readonly isPreparandoDialogoCrear = signal(false);
  /** Bloquea "Modificar" tras error de carga hasta una carga exitosa. */
  readonly cargaBloqueadaPorError = signal(false);
  readonly dialogState = signal<ParametrosDialogState | null>(null);
  readonly configDraftSource = signal<ConfigClienteDraftSource>('existente');
  readonly configDraftSourcePeriodo = signal<string | null>(null);

  private cargarDepth = 0;
  private readonly reconciliacionAvisadaPeriodos = new Set<string>();

  /** Bloqueo de acciones de barra / período por carga principal, plantilla o guardado. */
  readonly parametrosUiBloqueada = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.isSaving() ||
      this.isPreparandoDialogoCrear(),
  );

  readonly modificarDeshabilitado = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.isSaving() ||
      this.isPreparingEdit() ||
      !this.datosFormularioListos() ||
      this.cargaBloqueadaPorError(),
  );

  readonly crearParametrosDeshabilitado = computed(
    () =>
      this.isLoading() ||
      this.isLoadingPlantilla() ||
      this.isSaving() ||
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
    if (this.isSaving()) {
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

  tabLabel(tabId: ParametrosTabId): string {
    switch (tabId) {
      case 'configCliente':
        return 'Cliente';
      case 'valores':
        return 'Valores';
      case 'remuneraciones':
        return 'Remuneraciones';
      case 'ccafMutual':
        return 'CCAF / Mutual';
      case 'tramosCarga':
        return 'Cargas';
      case 'impuestoUnico':
        return 'Impuesto';
      case 'salud':
        return 'Salud';
      case 'prevision':
        return 'Prevision';
      case 'reforma':
        return 'Reforma';
    }
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
        return 'Estado mensual: Parametros cargados';
      case 'pendiente_reconciliacion':
        return 'Estado mensual: Pendiente de reconciliacion';
      case 'oficial_sin_config':
        return 'Estado mensual: Parametros cargados';
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
        return 'Periodo listo para revisar.';
      case 'pendiente_reconciliacion':
        return 'Diferencias pendientes de revisar.';
      case 'oficial_sin_config':
        return 'Datos oficiales cargados. Falta configuracion cliente.';
      case 'configuracion_parcial':
        return 'Configuracion guardada. Carga oficial pendiente.';
      case 'referencia_anterior':
        return 'Carga oficial pendiente.';
      case 'sin_base':
        return 'Sin base mensual para el periodo.';
      case 'corregido':
        return 'Datos revisados por flujo controlado.';
      case 'cerrado':
        return 'Período cerrado. No se permite edición sin flujo de reapertura.';
      case 'parcial':
        return this.completitudDetalle('Periodo parcial.');
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
        return 'Configuracion parcial';
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

  readonly activeRecordKind = computed(() => {
    switch (this.activeTab()) {
      case 'configCliente':
        return 'Configuracion cliente';
      case 'valores':
      case 'remuneraciones':
        return 'Datos oficiales';
      default:
        return 'Cierre normativo';
    }
  });

  readonly activeRecordTitle = computed(() => {
    switch (this.activeTab()) {
      case 'configCliente':
        return 'Configuracion cliente del periodo';
      case 'valores':
        return 'Valores oficiales del periodo';
      case 'remuneraciones':
        return 'Parametros remuneracionales';
      case 'ccafMutual':
        return 'CCAF, mutuales y Ley 16.744';
      case 'tramosCarga':
        return 'Tramos de cargas familiares';
      case 'impuestoUnico':
        return 'Impuesto unico de segunda categoria';
      case 'salud':
        return 'Instituciones de salud';
      case 'prevision':
        return 'Prevision y AFP';
      case 'reforma':
        return 'Reforma previsional y registros asociados';
    }
  });

  readonly activeRecordDetail = computed(() => {
    switch (this.activeTab()) {
      case 'configCliente':
        return this.clienteConfig()
          ? `Configuracion vigente para ${this.periodoSeleccionadoLabel()}.`
          : `Pendiente para ${this.periodoSeleccionadoLabel()}.`;
      case 'valores':
        return this.hasSelectedInRows()
          ? 'UF, UTM y UTA del periodo.'
          : 'Carga oficial pendiente.';
      case 'remuneraciones':
        return this.hasSelectedInRows()
          ? 'Montos y topes del periodo.'
          : 'Carga mensual pendiente.';
      case 'ccafMutual':
        return `${this.catalogos().ccafEntidades.length + this.catalogos().organismosLey16744.length + this.catalogos().ley16744Parametros.length} registros.`;
      case 'tramosCarga':
        return `${this.tramosCargaPorPeriodo().length} registros.`;
      case 'impuestoUnico':
        return `${this.tramosImpuestoPorPeriodo().length + this.tablaImpuestoPorPeriodo().length} registros.`;
      case 'salud':
        return `${this.isapresPorPeriodo().length + this.saludOtrasInstitucionesPorPeriodo().length} instituciones.`;
      case 'prevision':
        return `${this.afpPorPeriodo().length} registros.`;
      case 'reforma':
        return `${this.reformaPensionesPorPeriodo().length + this.reformaPrevisionalPorPeriodo().length + this.trabajosPesadosPorPeriodo().length} registros.`;
    }
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

  readonly yearOptions = computed(() => {
    const selectedYear = Number(this.selectedYear());
    const yearsFromBd = new Set<number>();
    for (const p of [...this.periodosGeneralesCatalogo(), ...this.periodosMensualesCatalogo()]) {
      const year = Number(String(p).slice(0, 4));
      if (Number.isFinite(year)) {
        yearsFromBd.add(year);
      }
    }

    // Si la BD aún no carga, al menos no dejamos el selector vacío.
    if (yearsFromBd.size === 0) {
      const currentYear = Number(this.currentPeriodo().slice(0, 4));
      return [currentYear - 1, currentYear, currentYear + 1, selectedYear].filter((y) => Number.isFinite(y));
    }

    yearsFromBd.add(selectedYear);
    return [...yearsFromBd].sort((left, right) => right - left);
  });

  /** Catálogos aplican su política propia: periodo mensual, vigencia o catálogo global. */
  readonly periodoReferenciaAnterior = computed(() => {
    const selected = this.selectedPeriodo();
    return this.periodosMensualesCatalogo()
      .filter((periodo) => periodo < selected)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;
  });

  readonly periodoSeleccionadoLabel = computed(() => this.formatPeriodoMesAnio(this.selectedPeriodo()));

  readonly periodoReferenciaAnteriorLabel = computed(() => {
    const periodo = this.periodoReferenciaAnterior();
    return periodo ? this.formatPeriodoMesAnio(periodo) : null;
  });

  readonly periodoContextoHint = computed(() => {
    switch (this.periodoCargaEstado()) {
      case 'referencia_anterior':
        return `Periodo seleccionado: ${this.selectedPeriodo()}.`;
      case 'configuracion_parcial':
        return 'Configuracion cliente del periodo seleccionado.';
      case 'oficial_sin_config':
      case 'cargado':
      case 'pendiente_reconciliacion':
        return 'Datos oficiales del periodo seleccionado.';
      default:
        return `Periodo seleccionado: ${this.selectedPeriodo()}.`;
    }
  });

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

  readonly referenciaLey16744Label = computed(() =>
    this.formatReferenciaMensualLabel(this.referenciasMensuales().ley16744Parametros),
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
      refs.tablaImpuestoUnico ??
      refs.ley16744Parametros
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
    bindShellPageContext(inject(DestroyRef), () => ({
      breadcrumbs: [{ label: 'Parámetros' }],
    }));

    this.actualizarValidadorImm(this.form.controls.gratificacion.value);
    this.form.controls.gratificacion.valueChanges.subscribe((value) => this.actualizarValidadorImm(value));

    effect(() => {
      const g = this.periodoGlobal.periodoYm();
      if (g === this.selectedPeriodo()) {
        return;
      }
      void this.seleccionarPeriodo(g, { fromGlobal: true });
    });
  }

  private actualizarValidadorImm(gratificacion: boolean): void {
    const control = this.form.controls.immGratificacion;
    control.setValidators(gratificacion ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private formatMoneyGrid = (value: unknown): string => this.money(this.numberFromUnknown(value));

  private formatDecimal2Grid = (value: unknown): string => this.decimal(this.numberFromUnknown(value), 2);

  private formatDecimal4Grid = (value: unknown): string => this.decimal(this.numberFromUnknown(value), 4);

  private formatIntegerGrid = (value: unknown): string => {
    const numberValue = this.numberFromUnknown(value);
    return numberValue === null ? '—' : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(numberValue);
  };

  private formatPercentGrid = (value: unknown): string => {
    const numberValue = this.numberFromUnknown(value);
    return numberValue === null
      ? '—'
      : `${new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }).format(numberValue)} %`;
  };

  private formatDateGrid = (value: unknown): string => this.date(typeof value === 'string' ? value : null);

  private formatBooleanGrid = (value: unknown): string => (value ? 'Sí' : 'No');

  private formatVigenteGrid = (value: unknown): string => (value ? 'Vigente' : 'Inactivo');

  private estadoVigenciaPeriodo(row: { vigenciaInicio: string | null; vigenciaFin: string | null }): string {
    const fechaPeriodo = `${this.selectedPeriodo()}-01`;
    const inicio = row.vigenciaInicio ?? '';
    const fin = row.vigenciaFin ?? null;

    if (inicio && inicio > fechaPeriodo) {
      return 'Futuro';
    }

    if (fin && fin < fechaPeriodo) {
      return 'Historico';
    }

    return 'Vigente al periodo';
  }

  readonly tramosCargaColumns: DataGridColumn<TramoCargaParametro>[] = [
    { id: 'periodo', header: 'Periodo', field: 'periodo', sortable: true },
    { id: 'tramo', header: 'Tramo', field: 'tramo', sortable: true },
    { id: 'desde', header: 'Desde', field: 'desde', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'hasta', header: 'Hasta', field: 'hasta', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'valor', header: 'Valor', field: 'valor', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
  ];

  readonly tablaImpuestoColumns: DataGridColumn<TablaImpuestoUnicoParametro>[] = [
    { id: 'vigenciaInicio', header: 'Vigencia', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'tramo', header: 'Tramo', field: 'tramo', type: 'number', sortable: true, align: 'right' },
    { id: 'desde', header: 'Desde UTM', field: 'desde', type: 'number', sortable: true, align: 'right', format: this.formatDecimal2Grid },
    { id: 'hasta', header: 'Hasta UTM', field: 'hasta', type: 'number', sortable: true, align: 'right', format: this.formatDecimal2Grid },
    { id: 'factor', header: 'Factor', field: 'factor', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'rebaja', header: 'Rebaja UTM', field: 'rebaja', type: 'number', sortable: true, align: 'right', format: this.formatDecimal4Grid },
  ];

  readonly tramosImpuestoColumns: DataGridColumn<TramoImpuestoParametro>[] = [
    { id: 'periodo', header: 'Periodo', field: 'periodo', sortable: true },
    { id: 'desde', header: 'Desde', field: 'desde', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'hasta', header: 'Hasta', field: 'hasta', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
    { id: 'factor', header: 'Factor', field: 'factor', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'rebaja', header: 'Rebaja', field: 'rebaja', type: 'number', sortable: true, align: 'right', format: this.formatMoneyGrid },
  ];

  readonly isapreColumns: DataGridColumn<IsapreParametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
    {
      id: 'porcentajeCotizacion',
      header: 'Cotizacion',
      field: 'porcentajeCotizacion',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly afpColumns: DataGridColumn<AfpParametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    {
      id: 'tasaObligatoria',
      header: 'Obligatoria',
      field: 'tasaObligatoria',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'comision', header: 'Comision', field: 'comision', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'sis', header: 'SIS', field: 'sis', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    {
      id: 'tasaEmpleador',
      header: 'Empleador',
      field: 'tasaEmpleador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly ccafColumns: DataGridColumn<CcafEntidad>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
    { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
  ];

  readonly organismosLeyColumns: DataGridColumn<OrganismoLey16744>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    { id: 'tipo', header: 'Tipo', field: 'tipo', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly ley16744Columns: DataGridColumn<Ley16744Parametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    {
      id: 'cotizacionBasicaEmpleador',
      header: 'Cotizacion basica',
      field: 'cotizacionBasicaEmpleador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'descripcionTasaAdicional', header: 'Adicional diferenciada', field: 'descripcionTasaAdicional', sortable: true },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly parametrosLegalesColumns: DataGridColumn<ParametroLegal>[] = [
    { id: 'nombre', header: 'Parametro', field: 'nombre', sortable: true, format: (value) => this.labelParametro(String(value ?? '')) },
    {
      id: 'valorDecimal',
      header: 'Valor decimal',
      field: 'valorDecimal',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatDecimal4Grid,
    },
    { id: 'valorEntero', header: 'Valor entero', field: 'valorEntero', type: 'number', sortable: true, align: 'right', format: this.formatIntegerGrid },
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
  ];

  readonly reformaPrevisionalColumns: DataGridColumn<ReformaPrevisionalParametro>[] = [
    { id: 'vigenciaInicio', header: 'Inicio', field: 'vigenciaInicio', type: 'date', sortable: true, format: this.formatDateGrid },
    { id: 'vigenciaFin', header: 'Fin', field: 'vigenciaFin', type: 'date', sortable: true, format: this.formatDateGrid },
    {
      id: 'cuentaCapitalizacionIndividual',
      header: 'Cuenta individual',
      field: 'cuentaCapitalizacionIndividual',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'cotizacionRentabilidadProtegida',
      header: 'CRP',
      field: 'cotizacionRentabilidadProtegida',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'seguroSocialSisCev',
      header: 'Seguro Social / SIS / CEV',
      field: 'seguroSocialSisCev',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'aporteEmpleadorTotal',
      header: 'Total empleador',
      field: 'aporteEmpleadorTotal',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'estadoPeriodo',
      header: 'Estado',
      sortable: false,
      format: (_value, row) => this.estadoVigenciaPeriodo(row),
    },
    { id: 'fuente', header: 'Fuente', field: 'fuente', sortable: true },
  ];

  readonly trabajosPesadosColumns: DataGridColumn<TrabajoPesadoParametro>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true },
    {
      id: 'tasaTrabajador',
      header: 'Trabajador',
      field: 'tasaTrabajador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    {
      id: 'tasaEmpleador',
      header: 'Empleador',
      field: 'tasaEmpleador',
      type: 'number',
      sortable: true,
      align: 'right',
      format: this.formatPercentGrid,
    },
    { id: 'tasaTotal', header: 'Total', field: 'tasaTotal', type: 'number', sortable: true, align: 'right', format: this.formatPercentGrid },
    { id: 'requiereDictamenCen', header: 'Dictamen CEN', field: 'requiereDictamenCen', sortable: true, format: this.formatBooleanGrid },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly apvInstitucionesColumns: DataGridColumn<ApvApvcInstitucion>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Institucion', field: 'nombre', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  readonly apvFormasPagoColumns: DataGridColumn<ApvApvcFormaPago>[] = [
    { id: 'codigo', header: 'Codigo', field: 'codigo', sortable: true },
    { id: 'nombre', header: 'Forma', field: 'nombre', sortable: true },
    { id: 'vigente', header: 'Estado', field: 'vigente', sortable: true, format: this.formatVigenteGrid },
  ];

  async ngOnInit(): Promise<void> {
    // Carga inicial: período = contexto global (cabecera). Sin sustituir por último de BD para mantener una sola fuente de verdad.
    const periodoInicial = this.periodoGlobal.periodoYm();

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

    this.selectedPeriodo.set(periodoInicial);
    this.form.controls.periodo.setValue(periodoInicial);
    // Periodo fijo en formulario: edición solo vía selector de período / cabecera.
    this.form.controls.periodo.disable({ emitEvent: false });
    await Promise.all([this.cargar(periodoInicial), this.refrescarPeriodosDesdeBd()]);
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
    if (catalogos.trabajosPesados.length) parts.push(`Trabajo pesado ${catalogos.trabajosPesados.length}`);
    if (catalogos.reformaPrevisional.length) parts.push(`Reforma previsional ${catalogos.reformaPrevisional.length}`);
    if (catalogos.ley16744Parametros.length) parts.push(`Ley 16.744 ${catalogos.ley16744Parametros.length}`);
    if (catalogos.organismosLey16744.length) parts.push(`Mutuales ${catalogos.organismosLey16744.length}`);
    if (catalogos.ccafEntidades.length) parts.push(`CCAF ${catalogos.ccafEntidades.length}`);
    if (catalogos.apvInstituciones.length) parts.push(`APV instituciones ${catalogos.apvInstituciones.length}`);
    if (catalogos.apvFormasPago.length) parts.push(`APV formas ${catalogos.apvFormasPago.length}`);
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
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Faltan datos por completar',
      message: 'Revisa los campos marcados antes de guardar los parámetros.',
      detail: 'Hay campos obligatorios o con formato inválido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarPeriodoDuplicado(periodo: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Periodo ya registrado',
      message: `Ya existen parámetros registrados para el periodo ${periodo}.`,
      detail: 'Puedes modificar el registro existente en lugar de crear uno nuevo.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoGuardado(periodo: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: 'Parámetros guardados',
      message: 'Los parámetros del periodo fueron guardados correctamente.',
      detail: `Periodo: ${periodo}`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoActualizacion(periodo: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: 'Parámetros actualizados',
      message: 'Los parámetros del periodo fueron actualizados correctamente.',
      detail: `Periodo: ${periodo}`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoClienteConfig(
    periodo: string,
    source: ConfigClienteDraftSource = 'existente',
    sourcePeriodo: string | null = null,
  ): void {
    const detail =
      source === 'referencia' && sourcePeriodo
        ? `Configuracion creada desde referencia ${sourcePeriodo}.`
        : source === 'oficiales'
          ? 'Configuracion actualizada con valores oficiales.'
          : source === 'ultima' && sourcePeriodo
            ? `Configuracion creada desde ultima configuracion disponible (${sourcePeriodo}).`
            : `Periodo: ${periodo}`;

    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: 'Configuracion guardada',
      message: `Configuracion de ${periodo} guardada.`,
      detail,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorGuardado(mensajeError: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No se pudieron guardar los parámetros',
      message: 'Ocurrió un problema al intentar guardar los parámetros del periodo.',
      detail: mensajeError || 'Error desconocido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorActualizacion(mensajeError: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No se pudieron actualizar los parámetros',
      message: 'Ocurrió un problema al intentar actualizar los parámetros del periodo.',
      detail: mensajeError || 'Error desconocido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorClienteConfig(mensajeError: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No se pudo guardar la configuracion',
      message: 'Ocurrio un problema al guardar la configuracion del cliente.',
      detail: mensajeError || 'Error desconocido.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarSoloConfigClienteEditable(): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'info',
      title: 'Solo lectura',
      message: 'Los datos oficiales mensuales se cargan por el flujo oficial.',
      detail: 'Desde Parametros solo se puede modificar la configuracion cliente del periodo.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarPeriodoInexistenteConfig(): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Periodo no habilitado',
      message: 'No se puede guardar configuracion cliente para un periodo inexistente.',
      detail: `Primero debe existir el periodo ${this.selectedPeriodo()} en remuneraciones.`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarPeriodoCerradoSoloLectura(): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Periodo cerrado',
      message: 'El periodo esta cerrado y queda en modo solo lectura.',
      detail: 'Cualquier cambio debe pasar por reapertura o un flujo de correccion auditado.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorCargaParametros(detalleTecnico: string): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'error',
      title: 'No fue posible completar la operación',
      message: 'No fue posible cargar los parámetros del sistema.',
      detail: detalleTecnico
        ? `${detalleTecnico}\n\nPeriodo seleccionado: ${this.selectedPeriodo()}`
        : `Periodo seleccionado: ${this.selectedPeriodo()}`,
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarExitoSincronizacion(refresco: boolean): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'success',
      title: refresco ? 'Datos refrescados' : 'Datos sincronizados',
      message: refresco
        ? 'Los parámetros se actualizaron desde la base de datos.'
        : 'Los parámetros se sincronizaron correctamente desde la base de datos.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarErrorSincronizacionSinDatos(): void {
    this.dialogState.set({
      kind: 'alerta',
      variant: 'warning',
      title: 'Sin datos para sincronizar',
      message: 'No hay parámetros disponibles en la base de datos para sincronizar.',
      primaryLabel: 'Aceptar',
    });
  }

  private mostrarConfirmacionModificacion(): void {
    this.dialogState.set({
      kind: 'confirmar-guardado',
      variant: 'warning',
      title: 'Confirmar modificación',
      message: `Se actualizarán los parámetros del periodo ${this.selectedPeriodo()}.`,
      detail: 'Esta modificación puede afectar cálculos de remuneraciones asociados a este periodo.',
      primaryLabel: 'Confirmar modificación',
      secondaryLabel: 'Cancelar',
    });
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

    this.dialogState.set({
      kind: 'confirmar-config-cliente-extendido',
      variant: 'confirm',
      title: 'Configurar periodo',
      message: 'No existe configuracion cliente para este periodo.',
      detail: `Periodo: ${periodo}\nSelecciona una base para continuar. Se creara solo al guardar.`,
      primaryLabel: 'Crear desde cero',
      secondaryLabel: actions[0]?.label,
      secondaryAction: actions[0]?.action,
      tertiaryLabel: actions[1]?.label,
      tertiaryAction: actions[1]?.action,
    });
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
        return 'Usar ultima configuracion';
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
    this.dialogState.set({
      kind: 'config-cliente-sin-base',
      variant: 'info',
      title: 'Sin configuracion anterior',
      message: 'No hay una configuracion cliente anterior disponible para usar como base.',
      detail: `Periodo: ${this.selectedPeriodo()}`,
      primaryLabel: 'Crear desde cero',
      secondaryLabel: 'Cancelar',
    });
    this.cdr.markForCheck();
  }

  private mostrarAvisoReconciliacionSiCorresponde(): void {
    const periodo = this.selectedPeriodo();
    if (!this.hayReconciliacionOficialPendiente() || this.reconciliacionAvisadaPeriodos.has(periodo)) {
      return;
    }

    this.reconciliacionAvisadaPeriodos.add(periodo);
    this.mostrarReconciliacionDiferencias();
  }

  private mostrarReconciliacionDiferencias(): void {
    this.dialogState.set({
      kind: 'reconciliacion-diferencias',
      variant: 'warning',
      title: 'Hay diferencias con los valores oficiales del periodo',
      message: 'Este periodo ya tiene una configuracion guardada por el cliente, pero la carga oficial contiene valores distintos. Nada se actualizara automaticamente.',
      detail: 'Se encontro configuracion cliente guardada, datos oficiales cargados y diferencias entre ambos registros. Puedes mantener tu configuracion, actualizarla con oficiales o revisar las diferencias mas tarde.',
      primaryLabel: 'Mantener mi configuracion',
      secondaryLabel: 'Actualizar con oficiales',
      secondaryAction: 'actualizar-con-oficiales',
      tertiaryLabel: 'Revisar despues',
      tertiaryAction: 'revisar-despues',
    });
    this.cdr.markForCheck();
  }

  private async actualizarClienteConOficiales(): Promise<void> {
    const oficial = this.parametroOficialSeleccionado();
    if (!oficial) {
      this.mostrarErrorClienteConfig('No hay valores oficiales actuales para actualizar la configuracion cliente.');
      return;
    }

    this.isSaving.set(true);
    try {
      const saved = await this.service.guardarClienteConfig(
        {
          ...crearClienteConfigDesdeOficiales(oficial, this.clienteConfig(), this.selectedPeriodo()),
          estadoReconciliacionOficial: 'actualizado_con_oficiales',
          fechaReconciliacionOficial: new Date().toISOString(),
          origenReconciliacion: 'actualizar_con_oficiales',
          observacionReconciliacion: 'Cliente actualizado con parametros oficiales desde reconciliacion.',
        },
      );
      this.clienteConfig.set(saved);
      this.patchForm(this.parametroConClienteConfig(oficial, saved), this.selectedPeriodo());
      this.selectedCcafId.set(saved.idCcafEntidad);
      this.selectedMutualId.set(saved.idOrganismoAdministradorLey16744);
      this.mostrarExitoClienteConfig(saved.periodo, 'oficiales', oficial.periodo);
    } catch (err) {
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible actualizar la configuracion con oficiales.');
    } finally {
      this.isSaving.set(false);
      this.cdr.markForCheck();
    }
  }

  private async mantenerConfiguracionCliente(): Promise<void> {
    await this.registrarDecisionReconciliacion(
      'cliente_confirmado',
      'mantener_configuracion',
      'No se sobrescribio tu configuracion cliente.',
      'La decision quedo registrada para este periodo.',
    );
  }

  private async revisarReconciliacionDespues(): Promise<void> {
    await this.registrarDecisionReconciliacion(
      'revisar_despues',
      'revisar_despues',
      'La revision de diferencias quedo postergada.',
      'Nada se actualizo automaticamente. Puedes volver a revisar la configuracion cliente cuando corresponda.',
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
      this.mostrarErrorClienteConfig('No hay configuracion cliente para registrar la decision de reconciliacion.');
      return;
    }

    this.isSaving.set(true);
    try {
      const saved = await this.service.registrarReconciliacionOficialCliente({
        periodo,
        estado,
        origen,
        observacion: message,
      });
      this.clienteConfig.set(saved);
      this.dialogState.set({
        kind: 'alerta',
        variant: estado === 'cliente_confirmado' ? 'info' : 'warning',
        title: estado === 'cliente_confirmado' ? 'Configuracion mantenida' : 'Revision postergada',
        message,
        detail,
        primaryLabel: 'Aceptar',
      });
    } catch (err) {
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible registrar la decision de reconciliacion.');
    } finally {
      this.isSaving.set(false);
      this.cdr.markForCheck();
    }
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
    this.activeTab.set(tabId);
    window.requestAnimationFrame(() => {
      const root = this.hostElement.nativeElement;
      const active = root.querySelector<HTMLElement>('nav.folder-tabs button.folder-tab--active');
      active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  }

  async seleccionarAnioValue(year: string): Promise<void> {
    await this.seleccionarPeriodo(`${year}-${this.selectedMonth()}`);
  }

  async seleccionarMesValue(month: string): Promise<void> {
    await this.seleccionarPeriodo(`${this.selectedYear()}-${month}`);
  }

  async moverPeriodo(offset: number): Promise<void> {
    const [year, month] = this.selectedPeriodo().split('-').map((value) => Number(value));
    const date = new Date(year, month - 1 + offset, 1);
    const periodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    await this.seleccionarPeriodo(periodo);
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
      await this.mostrarDecisionConfigCliente();
      return;
    }

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
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible cargar la ultima configuracion cliente.');
    } finally {
      this.isLoadingPlantilla.set(false);
      this.cdr.markForCheck();
    }
  }

  private prepararConfigClienteDesdeOficiales(): void {
    const oficial = this.parametroOficialSeleccionado();
    if (!oficial || oficial.periodo !== this.selectedPeriodo()) {
      this.mostrarErrorClienteConfig('No hay valores oficiales disponibles para este periodo.');
      return;
    }

    this.patchForm(oficial, this.selectedPeriodo());
    this.selectedCcafId.set(null);
    this.selectedMutualId.set(null);
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
    this.selectedMutualId.set(null);
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
    this.selectedMutualId.set(config?.idOrganismoAdministradorLey16744 ?? null);
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

    if (this.form.invalid || this.isSaving() || !this.datosFormularioListos()) {
      if (this.form.invalid && !this.isSaving() && this.datosFormularioListos()) {
        this.mostrarFormularioInvalido();
      }
      return;
    }

    await this.ejecutarGuardarClienteConfig();
  }

  private async ejecutarGuardarClienteConfig(): Promise<void> {
    if (this.isSaving() || !this.datosFormularioListos()) {
      return;
    }

    const periodo = this.selectedPeriodo();
    this.isSaving.set(true);
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
      this.mostrarErrorClienteConfig(this.extractErrorDetail(err) || 'No fue posible guardar la configuracion cliente.');
    } finally {
      this.isSaving.set(false);
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
      idOrganismoAdministradorLey16744: this.selectedMutualId(),
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

  seleccionarMutual(value: SearchSelectValue): void {
    this.selectedMutualId.set(this.catalogIdFromSearchValue(value));
  }

  selectedYear(): string {
    return this.selectedPeriodo().slice(0, 4);
  }

  selectedMonth(): string {
    return this.selectedPeriodo().slice(5, 7);
  }

  isConfigurableTab(): boolean {
    return true;
  }

  isClienteConfigTab(): boolean {
    return this.activeTab() === 'configCliente';
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
      return 'Modificar guarda configuracion cliente; los datos oficiales solo se usan para comparar.';
    }
    return '';
  }

  selectedLey16744Rate(): number | null {
    return this.catalogos().ley16744Parametros[0]?.cotizacionBasicaEmpleador ?? null;
  }

  fechaActualizacionLabel(): string {
    const value = this.form.controls.fechaActualizacion.value;
    return value ? this.formatDateTime(value) : 'Sin información';
  }

  money(value: number | null): string {
    return value === null ? '—' : `$ ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value)}`;
  }

  decimal(value: number | null, digits = 2): string {
    return value === null
      ? '—'
      : new Intl.NumberFormat('es-CL', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(value);
  }

  date(value: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(`${value}T00:00:00`);

    if (!Number.isFinite(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(date)
      .replaceAll('/', '-');
  }

  private formatPeriodoMesAnio(periodo: string): string {
    const [year, month] = periodo.split('-');
    const monthName = this.monthOptions.find((item) => item.value === month)?.label ?? month;
    return `${monthName} ${year}`;
  }

  private formatReferenciaMensualLabel(periodo: string | null): string | null {
    return periodo ? this.formatPeriodoMesAnio(periodo) : null;
  }

  labelParametro(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private puedeAbandonarEdicionAlCambiarPeriodo(): boolean {
    if (!this.generalesEditando() || !this.form.dirty) {
      return true;
    }
    return globalThis.confirm(
      'Hay cambios sin guardar. Si continúa, se descartarán. ¿Cambiar de periodo?',
    );
  }

  private async seleccionarPeriodo(
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

    this.selectedPeriodo.set(periodo);
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
      this.dialogState.set({
        kind: 'alerta',
        variant: 'error',
        title: 'No se pudieron actualizar los parámetros',
        message: 'Los datos recibidos no coinciden con el periodo seleccionado.',
        detail: `Periodo en datos: ${row.periodo}. Periodo seleccionado: ${selected}.`,
        primaryLabel: 'Aceptar',
      });
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
    const configMutualId = config?.idOrganismoAdministradorLey16744 ?? null;

    const ccafExists = catalogos.ccafEntidades.some((row) => row.idCcafEntidad === configCcafId);
    const mutualExists = catalogos.organismosLey16744.some(
      (row) => row.idOrganismoAdministradorLey16744 === configMutualId,
    );

    this.selectedCcafId.set(ccafExists ? configCcafId : null);
    this.selectedMutualId.set(mutualExists ? configMutualId : null);
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
