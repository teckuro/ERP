import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronRight, Plus, RefreshCw, X } from 'lucide-angular/src/icons';

import {
  PeriodoActivoService,
  primerDiaSqlDesdeYm,
  ultimoDiaSqlDesdeYm,
} from '../../../../../core/services/periodo-activo.service';
import { ButtonComponent } from '../../../../../shared/components/ui/button.component';
import {
  DataGridCellDirective,
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../../shared/components/ui/data-grid.component';
import {
  MessageBoxComponent,
  MessageBoxVariant,
} from '../../../../../shared/components/ui/message-box.component';
import type { MessageBoxSection } from '../../../../../shared/components/ui/message-box.types';
import { CalendarInputComponent } from '../../../../../shared/components/ui/calendar-input.component';
import { FieldHelpTipComponent } from '../../../../../shared/components/ui/field-help-tip.component';
import { bindShellPageContext } from '../../../../../layout/shell-page-context.binding';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/search-select.component';
import type { EmpleadoListado } from '../../../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../../../empleados/services/empleados.service';
import {
  PERIODICIDADES_HD,
  type ConceptoListado,
  type ContratoResumenPersona,
  type HaberDescuentoAsignacionPayload,
  type HaberDescuentoAsignacionPrevalidacionMensualFila,
  type HaberDescuentoTipoValor,
  type PeriodicidadHd,
} from '../../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { HaberesDescuentosService } from '../../../../haberes-descuentos/services/haberes-descuentos.service';
import {
  NOVEDAD_MENSUAL_CATEGORIAS,
  NOVEDAD_MENSUAL_ESTADOS,
  NOVEDAD_MENSUAL_ORIGENES,
  NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO,
  type ActualizarNovedadMensualInput,
  type CrearNovedadMensualInput,
  type NovedadMensual,
  type NovedadMensualCategoria,
  type NovedadMensualEstado,
  type NovedadMensualOrigen,
  type NovedadMensualTipoMovimiento,
} from '../../models/novedad-mensual.model';
import {
  puedeAnularNovedad,
  puedeAprobarNovedad,
  puedeCambiarEstadoNovedad,
  puedeEditarNovedad,
  puedeEliminarNovedad,
  validarNovedadMensualInput,
  validarPeriodoNovedad,
} from '../../rules/novedades-mensuales.rules';
import { NovedadesMensualesService } from '../../services/novedades-mensuales.service';

type NovedadGridRow = NovedadMensual & {
  trabajadorEtiqueta: string;
  conceptoEtiqueta: string;
  categoriaEtiqueta: string;
  tipoCategoriaEtiqueta: string;
  estadoEtiqueta: string;
  origenEtiqueta: string;
  cantidadEtiqueta: string;
  fechaEventoEtiqueta: string;
  montoEtiqueta: string;
  busqueda: string;
};

type TrabajadorMovimientoRow = {
  idPersona: number;
  trabajador: string;
  rut: string;
  cargo: string;
  contrato: string;
  movimientosMes: number;
  recurrentes: number;
  revisar: number;
  estado: 'Listo' | 'Sin movimientos' | 'Revisar' | 'Incompleto';
  busqueda: string;
};

type GestionFiltro = 'todos' | 'mensual' | 'recurrente' | 'revision';

type TrabajadorDetalleState = {
  row: TrabajadorMovimientoRow;
  filtro: GestionFiltro;
};

type MovimientoGestionUnificadoRow = {
  rowId: string;
  ambito: 'mensual' | 'recurrente';
  ambitoEtiqueta: string;
  concepto: string;
  tipo: string;
  monto: string;
  vigencia: string;
  estadoEtiqueta: string;
  estadoClase: string;
  detalle: string;
  novedad: NovedadGridRow | null;
  recurrente: RecurrenteDetalleRow | null;
};

type NovedadForm = {
  periodo: string;
  idPersona: number | null;
  idContrato: number | null;
  idConcepto: number | null;
  categoria: NovedadMensualCategoria;
  tipoMovimiento: NovedadMensualTipoMovimiento;
  cantidad: number | null;
  unidad: string;
  monto: number | null;
  moneda: string;
  origen: NovedadMensualOrigen;
  fechaEvento: string;
  observacion: string;
  referenciaExterna: string;
};

type NovedadFormCampo = keyof NovedadForm;
type NovedadFormErrores = Partial<Record<NovedadFormCampo | 'general', string>>;
type RecurrenteFormCampo = 'idConcepto' | 'tipoValor' | 'monto' | 'porcentaje' | 'periodicidad' | 'vigenciaInicio' | 'vigenciaFin';
type RecurrenteFormErrores = Partial<Record<RecurrenteFormCampo | 'general', string>>;
type RecurrenteAccionPendiente = {
  idAsignacion: number;
  nombre: string;
  trabajador: string;
} | null;

type RecurrenteDetalleRow = HaberDescuentoAsignacionPrevalidacionMensualFila;

const USUARIO_UI_BASE = '00000000-0000-0000-0000-000000000000';

const ESTADO_LABELS: Record<NovedadMensualEstado, string> = {
  borrador: 'Borrador',
  pendiente_revision: 'Pendiente revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  incorporada_a_pre_nomina: 'En pre-nómina',
  calculada: 'Calculada',
  anulada: 'Anulada',
};

const CATEGORIA_LABELS: Record<NovedadMensualCategoria, string> = {
  haber_variable: 'Haber puntual',
  tiempo_trabajado_adicional: 'Horas o tiempo adicional',
  ausencia_descuento_tiempo: 'Ausencia o descuento de tiempo',
  licencia_permiso: 'Licencia o permiso',
  anticipo_descuento_unico: 'Anticipo o descuento único',
  retroactivo_reintegro: 'Retroactivo o reintegro',
  ajuste_manual_controlado: 'Ajuste controlado',
};

const ORIGEN_LABELS: Record<NovedadMensualOrigen, string> = {
  manual: 'Manual',
  asistencia: 'Asistencia',
  importacion: 'Importación',
  integracion_externa: 'Integración externa',
  ajuste_administrativo: 'Ajuste administrativo',
  regularizacion: 'Regularización',
  sistema: 'Sistema',
};

const TIPO_MOVIMIENTO_LABELS: Record<NovedadMensualTipoMovimiento, string> = {
  haber: 'Haber',
  descuento: 'Descuento',
  ajuste: 'Ajuste',
  informativo: 'Informativo',
};

function formInicial(periodo: string): NovedadForm {
  return {
    periodo,
    idPersona: null,
    idContrato: null,
    idConcepto: null,
    categoria: 'haber_variable',
    tipoMovimiento: 'haber',
    cantidad: null,
    unidad: '',
    monto: null,
    moneda: 'CLP',
    origen: 'manual',
    fechaEvento: '',
    observacion: '',
    referenciaExterna: '',
  };
}

@Component({
  selector: 'app-novedades-mensuales-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ButtonComponent,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    SearchSelectComponent,
    CalendarInputComponent,
    FieldHelpTipComponent,
  ],
  templateUrl: './novedades-mensuales-container.html',
  styleUrl: './novedades-mensuales-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadesMensualesContainer implements OnInit, OnDestroy {
  private readonly novedadesService = inject(NovedadesMensualesService);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);
  private readonly destroyRef = inject(DestroyRef);
  readonly periodoActivo = inject(PeriodoActivoService);
  private pantallaInicializada = false;
  private bodyOverflowAnterior: string | null = null;

  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;
  readonly closeIcon = X;
  readonly chevronRightIcon = ChevronRight;

  readonly estados = NOVEDAD_MENSUAL_ESTADOS;
  readonly categorias = NOVEDAD_MENSUAL_CATEGORIAS;
  readonly origenes = NOVEDAD_MENSUAL_ORIGENES;
  readonly tiposMovimiento = NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO;
  readonly periodicidadesHd = PERIODICIDADES_HD;

  readonly periodoActual = computed(() => this.periodoActivo.periodoYm());
  readonly periodoFechaMin = computed(() => primerDiaSqlDesdeYm(this.periodoActual()));
  readonly periodoFechaMax = computed(() => ultimoDiaSqlDesdeYm(this.periodoActual()));
  readonly recurrenteVigenciaFinMin = computed(() => this.recurrenteVigenciaInicio() || this.periodoFechaMin());
  readonly formTrabajadorBloqueado = computed(
    () => this.retornoGestionTrabajador() != null && this.form().idPersona != null,
  );
  readonly loading = signal(false);
  readonly soporteLoading = signal(false);
  readonly contratosLoading = signal(false);
  readonly guardando = signal(false);
  readonly empleadosListado = signal<EmpleadoListado[]>([]);
  readonly empleadoOptions = signal<SearchSelectOption<number>[]>([]);
  readonly conceptos = signal<ConceptoListado[]>([]);
  readonly contratosPersona = signal<ContratoResumenPersona[]>([]);
  readonly filas = signal<NovedadGridRow[]>([]);
  readonly recurrentesPeriodo = signal<HaberDescuentoAsignacionPrevalidacionMensualFila[]>([]);
  readonly trabajadorDetalle = signal<TrabajadorDetalleState | null>(null);
  readonly retornoGestionTrabajador = signal<TrabajadorMovimientoRow | null>(null);
  readonly retornoGestionFiltro = signal<GestionFiltro>('todos');
  readonly formAbierto = signal(false);
  readonly recurrenteFormAbierto = signal(false);
  readonly recurrenteGuardando = signal(false);
  readonly recurrenteEditandoId = signal<number | null>(null);
  readonly recurrenteTrabajador = signal<TrabajadorMovimientoRow | null>(null);
  readonly recurrenteConceptoId = signal<number | null>(null);
  readonly recurrenteTipoValor = signal<HaberDescuentoTipoValor>('FIJO');
  readonly recurrenteIdContrato = signal<number | null>(null);
  readonly recurrenteMonto = signal<number>(0);
  readonly recurrentePorcentaje = signal<number>(0);
  readonly recurrentePeriodicidad = signal<PeriodicidadHd>('MENSUAL');
  readonly recurrenteVigenciaInicio = signal<string>('');
  readonly recurrenteVigenciaFin = signal<string>('');
  readonly recurrenteObservacion = signal<string>('');
  readonly recurrenteErrores = signal<RecurrenteFormErrores>({});
  readonly recurrenteCerrarPendiente = signal<RecurrenteAccionPendiente>(null);
  readonly novedadEditando = signal<NovedadMensual | null>(null);
  readonly form = signal<NovedadForm>(formInicial(''));
  readonly formSnapshot = signal('');
  readonly formErrores = signal<NovedadFormErrores>({});
  readonly formValidacionActiva = signal(false);
  readonly formCamposTocados = signal<Partial<Record<NovedadFormCampo, boolean>>>({});
  readonly confirmarCancelarAbierto = signal(false);
  readonly confirmarCancelarRecurrenteAbierto = signal(false);
  readonly recurrenteSnapshot = signal('');
  readonly recurrenteConCambios = computed(
    () => this.recurrenteFormAbierto() && this.serializarRecurrente() !== this.recurrenteSnapshot(),
  );
  readonly observacionAccion = signal('');
  readonly mensaje = signal<{
    variant: MessageBoxVariant;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  readonly totalNovedades = computed(() => this.filas().length);
  readonly movimientosPendientesAccion = computed(() =>
    this.filas().some((fila) => this.puedeRechazar(fila) || this.puedeAnular(fila)),
  );
  readonly conceptoOptions = computed<SearchSelectOption<number>[]>(() =>
    this.conceptos().map((concepto) => ({
      value: concepto.idConcepto,
      label: `${concepto.nombre} (${concepto.codigo})`,
      description: concepto.tipo ?? undefined,
    })),
  );
  readonly conceptoRecurrenteSeleccionado = computed(() => {
    const id = this.recurrenteConceptoId();
    return id == null ? null : (this.conceptos().find((concepto) => concepto.idConcepto === id) ?? null);
  });
  readonly mostrarCuotasRecurrente = computed(() => {
    const concepto = this.conceptoRecurrenteSeleccionado();
    if (!concepto) {
      return false;
    }
    const texto = this.normalizarTexto(
      [concepto.codigo, concepto.nombre, concepto.tipo, concepto.naturaleza].filter(Boolean).join(' '),
    );
    return ['prestamo', 'anticipo', 'reintegro', 'cuota', 'pactado'].some((token) => texto.includes(token));
  });
  readonly conteosEstado = computed(() =>
    this.estados.map((estado) => ({
      estado,
      label: this.etiquetaEstado(estado),
      total: this.filas().filter((fila) => fila.estado === estado).length,
    })),
  );
  readonly resumenPeriodo = computed(() => {
    const trabajadores = this.trabajadoresMovimientos();
    return [
      { label: 'Trabajadores activos', total: trabajadores.length },
      { label: 'Con movimientos', total: trabajadores.filter((row) => row.movimientosMes > 0).length },
      { label: 'Con recurrentes', total: trabajadores.filter((row) => row.recurrentes > 0).length },
      { label: 'Por revisar', total: trabajadores.filter((row) => row.revisar > 0).length },
    ];
  });
  readonly trabajadoresMovimientos = computed<TrabajadorMovimientoRow[]>(() => {
    const movimientos = this.filas();
    const recurrentes = this.recurrentesPeriodo();

    return this.empleadosListado()
      .filter((empleado) => empleado.estado !== 'inactivo' && empleado.estado !== 'desvinculado')
      .map((empleado) => {
        const movimientosPersona = movimientos.filter((mov) => mov.idPersona === empleado.id);
        const recurrentesPersona = recurrentes.filter(
          (item) => item.asignacion.idPersona === empleado.id && item.intersectaPeriodo && item.asignacion.estado,
        );
        const revisar = movimientosPersona.filter((mov) => mov.estado === 'pendiente_revision').length;
        const incompleto = !empleado.aptoParaRemuneraciones || empleado.estadoFicha !== 'VALIDO';
        const estado: TrabajadorMovimientoRow['estado'] = incompleto
          ? 'Incompleto'
          : revisar > 0
            ? 'Revisar'
            : movimientosPersona.length === 0 && recurrentesPersona.length === 0
              ? 'Sin movimientos'
              : 'Listo';
        const row: TrabajadorMovimientoRow = {
          idPersona: empleado.id,
          trabajador: empleado.nombre,
          rut: empleado.rut,
          cargo: empleado.cargo || 'Sin cargo',
          contrato: empleado.idContrato ? `Contrato ${empleado.idContrato}` : 'Sin contrato visible',
          movimientosMes: movimientosPersona.length,
          recurrentes: recurrentesPersona.length,
          revisar,
          estado,
          busqueda: `${empleado.nombre} ${empleado.rut} ${empleado.cargo} ${estado}`.toLowerCase(),
        };
        return row;
      });
  });
  readonly formConCambios = computed(() => this.formAbierto() && this.serializarForm(this.form()) !== this.formSnapshot());
  readonly resumenFormulario = computed(() => {
    const form = this.form();
    const trabajadorCtx = this.retornoGestionTrabajador();
    const trabajador =
      trabajadorCtx?.trabajador ?? (form.idPersona == null ? '' : this.etiquetaTrabajador(form.idPersona));
    const concepto = form.idConcepto == null ? '' : this.etiquetaConcepto(form.idConcepto);
    const monto = form.monto == null ? '' : `${form.moneda || 'CLP'} ${Number(form.monto).toLocaleString('es-CL')}`;
    const tipo = this.etiquetaTipoMovimiento(form.tipoMovimiento);
    const faltantes: string[] = [];
    if (!concepto) {
      faltantes.push('seleccionar concepto');
    }
    if (form.monto == null) {
      faltantes.push('indicar monto');
    }
    if (!trabajador && form.idPersona == null) {
      faltantes.push('seleccionar trabajador');
    }
    const datosPrincipales = trabajador && concepto && form.monto != null;
    return {
      trabajador,
      concepto,
      monto,
      tipo,
      periodo: this.periodoActivo.etiqueta(),
      principal: datosPrincipales ? `${tipo} de ${monto} para ${trabajador}.` : '',
      faltante: faltantes.length > 0 ? `Falta ${faltantes.join(' y ')} para completar el resumen.` : '',
      visible: form.idPersona != null || form.idConcepto != null || form.monto != null || !!trabajadorCtx,
    };
  });

  readonly trabajadorColumns: DataGridColumn<TrabajadorMovimientoRow>[] = [
    {
      id: 'trabajador',
      header: 'Trabajador',
      field: 'trabajador',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
      minWidth: '15rem',
    },
    {
      id: 'contrato',
      header: 'Contrato',
      field: 'contrato',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '9rem',
    },
    {
      id: 'movimientosMes',
      header: 'Mov. mes',
      field: 'movimientosMes',
      type: 'number',
      align: 'center',
      sortable: true,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'recurrentes',
      header: 'Recurrentes',
      field: 'recurrentes',
      type: 'number',
      align: 'center',
      sortable: true,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'revisar',
      header: 'Revisar',
      field: 'revisar',
      type: 'number',
      align: 'center',
      sortable: true,
      filterable: false,
      minWidth: '7rem',
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'acciones',
      header: 'Accion',
      align: 'center',
      sortable: false,
      hideable: false,
      filterable: false,
      minWidth: '7rem',
    },
  ];

  readonly movimientosDetalleColumns: DataGridColumn<NovedadGridRow>[] = [
    {
      id: 'concepto',
      header: 'Concepto',
      field: 'conceptoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '12rem',
      priorityResponsive: 'primary',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      field: 'tipoCategoriaEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '10rem',
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'montoEtiqueta',
      type: 'text',
      align: 'right',
      sortable: false,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estadoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'ultimaAccion',
      header: 'Última acción',
      sortable: false,
      filterable: false,
      minWidth: '11rem',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
      filterable: false,
      minWidth: '13rem',
    },
  ];
  readonly movimientosInfoColumns: DataGridColumn<NovedadGridRow>[] = this.movimientosDetalleColumns.filter(
    (column) => column.id !== 'acciones',
  );
  readonly movimientosGestionColumns: DataGridColumn<NovedadGridRow>[] = this.movimientosDetalleColumns.filter(
    (column) => column.id !== 'ultimaAccion',
  );

  readonly recurrentesDetalleColumns: DataGridColumn<RecurrenteDetalleRow>[] = [
    {
      id: 'concepto',
      header: 'Concepto',
      sortable: false,
      filterable: false,
      minWidth: '12rem',
      priorityResponsive: 'primary',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      sortable: false,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'monto',
      header: 'Monto mensual',
      align: 'right',
      sortable: false,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'vigencia',
      header: 'Vigencia',
      sortable: false,
      filterable: false,
      minWidth: '10rem',
    },
    {
      id: 'estado',
      header: 'Estado',
      sortable: false,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'impacto',
      header: 'Impacto',
      sortable: false,
      filterable: false,
      minWidth: '9rem',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
      filterable: false,
      minWidth: '14rem',
    },
  ];
  readonly recurrentesInfoColumns: DataGridColumn<RecurrenteDetalleRow>[] = this.recurrentesDetalleColumns.filter(
    (column) => column.id !== 'acciones',
  );
  readonly recurrentesGestionColumns: DataGridColumn<RecurrenteDetalleRow>[] = this.recurrentesDetalleColumns.filter(
    (column) => column.id !== 'impacto',
  );

  readonly gestionUnificadaColumnsGeneric: DataGridColumn<MovimientoGestionUnificadoRow>[] = [
    {
      id: 'ambito',
      header: 'Ámbito',
      field: 'ambitoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '7.5rem',
      priorityResponsive: 'primary',
    },
    {
      id: 'concepto',
      header: 'Concepto',
      field: 'concepto',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '12rem',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      field: 'tipo',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '9rem',
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'text',
      align: 'right',
      sortable: false,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'vigencia',
      header: 'Vigencia / fecha',
      field: 'vigencia',
      type: 'text',
      sortable: false,
      filterable: false,
      minWidth: '10rem',
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estadoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
      filterable: false,
      minWidth: '14rem',
    },
  ];

  readonly gestionUnificadaColumns: DataGridColumn<MovimientoGestionUnificadoRow>[] = [
    {
      id: 'ambito',
      header: 'Ámbito',
      field: 'ambitoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '7.5rem',
    },
    {
      id: 'concepto',
      header: 'Concepto',
      field: 'concepto',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '12rem',
      priorityResponsive: 'primary',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      field: 'tipo',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '9rem',
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'text',
      align: 'right',
      sortable: false,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'vigencia',
      header: 'Vigencia / fecha',
      field: 'vigencia',
      type: 'text',
      sortable: false,
      filterable: false,
      minWidth: '10rem',
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estadoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
      minWidth: '8rem',
    },
    {
      id: 'detalle',
      header: 'Detalle',
      field: 'detalle',
      type: 'text',
      sortable: false,
      filterable: false,
      minWidth: '10rem',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
      filterable: false,
      minWidth: '14rem',
    },
  ];

  readonly trabajadorFilters: DataGridFilter<TrabajadorMovimientoRow>[] = [
    {
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      options: [
        { value: 'Listo', label: 'Listo' },
        { value: 'Sin movimientos', label: 'Sin movimientos' },
        { value: 'Revisar', label: 'Revisar' },
        { value: 'Incompleto', label: 'Incompleto' },
      ],
    },
    {
      id: 'tipoConteo',
      label: 'Con movimientos',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      options: [
        { value: 'mes', label: 'Mov. mes' },
        { value: 'recurrentes', label: 'Recurrentes' },
        { value: 'revisar', label: 'Por revisar' },
        { value: 'sin', label: 'Sin movimientos' },
      ],
      predicate: (row, value) => {
        switch (value) {
          case 'mes':
            return row.movimientosMes > 0;
          case 'recurrentes':
            return row.recurrentes > 0;
          case 'revisar':
            return row.revisar > 0;
          case 'sin':
            return row.movimientosMes === 0 && row.recurrentes === 0;
          default:
            return true;
        }
      },
    },
    {
      id: 'busqueda',
      label: 'Buscar trabajador',
      field: 'busqueda',
      type: 'text',
      operator: 'contains',
      placeholder: 'Nombre, RUT o cargo',
    },
  ];

  readonly trackTrabajador = (_index: number, row: TrabajadorMovimientoRow): number => row.idPersona;
  readonly trackNovedadDetalle = (_index: number, row: NovedadGridRow): number => row.idNovedad;
  readonly trackRecurrenteDetalle = (_index: number, row: RecurrenteDetalleRow): number => row.asignacion.idAsignacion;
  readonly trackGestionUnificada = (_index: number, row: MovimientoGestionUnificadoRow): string => row.rowId;
  readonly filtrosGestion: GestionFiltro[] = ['todos', 'mensual', 'recurrente', 'revision'];


  constructor() {
    bindShellPageContext(
      this.destroyRef,
      () => ({
        breadcrumbs: [
          { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
          { label: 'Movimientos' },
        ],
        primaryAction: {
          label: 'Registrar movimiento del mes',
          actionId: 'registrar-movimiento',
        },
      }),
      { onPrimaryAction: () => this.abrirNuevo() },
    );

    effect(() => {
      const periodo = this.periodoActual();
      untracked(() => this.form.update((actual) => ({ ...actual, periodo })));
      if (!this.pantallaInicializada) {
        return;
      }
      untracked(() => {
        this.formAbierto.set(false);
        this.recurrenteFormAbierto.set(false);
        this.recurrenteCerrarPendiente.set(null);
        this.restaurarScrollPagina();
        this.novedadEditando.set(null);
        this.confirmarCancelarAbierto.set(false);
        this.trabajadorDetalle.set(null);
        this.formErrores.set({});
        this.contratosPersona.set([]);
        this.observacionAccion.set('');
        this.mensaje.set(null);
        this.filas.set([]);
        void this.cargarNovedades();
      });
    });
  }

  ngOnInit(): void {
    const periodo = this.periodoActivo.periodoYm();
    this.form.set(formInicial(periodo));
    void this.inicializarPantalla();
  }

  ngOnDestroy(): void {
    this.restaurarScrollPagina();
  }

  etiquetaEstado(estado: NovedadMensualEstado): string {
    return ESTADO_LABELS[estado] ?? estado;
  }

  etiquetaCategoria(categoria: NovedadMensualCategoria): string {
    return CATEGORIA_LABELS[categoria] ?? categoria;
  }

  etiquetaOrigen(origen: NovedadMensualOrigen): string {
    return ORIGEN_LABELS[origen] ?? origen;
  }

  etiquetaTipoMovimiento(tipo: NovedadMensualTipoMovimiento): string {
    return TIPO_MOVIMIENTO_LABELS[tipo] ?? tipo;
  }

  async cargarNovedades(): Promise<void> {
    const periodo = this.periodoActual().trim();
    if (!validarPeriodoNovedad(periodo)) {
      this.filas.set([]);
      this.mensaje.set({
        variant: 'warning',
        title: 'Periodo no valido',
        message: 'Use el formato YYYY-MM para consultar movimientos del mes.',
      });
      return;
    }

    this.loading.set(true);
    try {
      const [novedades, recurrentes] = await Promise.all([
        this.novedadesService.listarNovedadesPeriodo(periodo),
        this.haberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo),
      ]);
      this.filas.set(novedades.map((novedad) => this.aGridRow(novedad)));
      this.recurrentesPeriodo.set(recurrentes);
    } catch (err) {
      this.filas.set([]);
      this.recurrentesPeriodo.set([]);
      this.mostrarError(err, 'No se pudieron cargar los movimientos del periodo.');
    } finally {
      this.loading.set(false);
    }
  }

  abrirNuevo(): void {
    this.novedadEditando.set(null);
    this.contratosPersona.set([]);
    this.abrirFormularioCon(formInicial(this.periodoActual()));
  }

  tonoResumenPeriodo(label: string): string {
    const normalizado = label.toLowerCase();
    if (normalizado.includes('revisar')) {
      return 'nm-context-card--review';
    }
    if (normalizado.includes('movimientos')) {
      return 'nm-context-card--info';
    }
    if (normalizado.includes('recurrentes')) {
      return 'nm-context-card--ok';
    }
    return 'nm-context-card--neutral';
  }

  claseEstadoTrabajador(estado: TrabajadorMovimientoRow['estado']): string {
    switch (estado) {
      case 'Revisar':
        return 'nm-worker-status nm-worker-status--review';
      case 'Listo':
        return 'nm-worker-status nm-worker-status--ok';
      case 'Incompleto':
        return 'nm-worker-status nm-worker-status--muted';
      case 'Sin movimientos':
        return 'nm-worker-status nm-worker-status--neutral';
      default:
        return 'nm-worker-status';
    }
  }

  abrirNuevoParaTrabajador(row: TrabajadorMovimientoRow, filtro: GestionFiltro = 'mensual'): void {
    this.prepararRetornoGestion(row, filtro);
    const form = {
      ...formInicial(this.periodoActual()),
      idPersona: row.idPersona,
      fechaEvento: this.periodoFechaMin(),
    };
    this.novedadEditando.set(null);
    this.abrirFormularioCon(form);
    void this.onTrabajadorChange(row.idPersona);
  }

  abrirDetalleTrabajador(row: TrabajadorMovimientoRow, filtro: GestionFiltro = 'todos'): void {
    this.trabajadorDetalle.set({ row, filtro });
  }

  cambiarFiltroGestion(filtro: GestionFiltro): void {
    const detalle = this.trabajadorDetalle();
    if (!detalle) {
      return;
    }
    this.trabajadorDetalle.set({ ...detalle, filtro });
  }

  cerrarDetalleTrabajador(): void {
    this.trabajadorDetalle.set(null);
  }

  gestionFiltroActivo(): GestionFiltro {
    return this.trabajadorDetalle()?.filtro ?? 'todos';
  }

  etiquetaFiltroGestion(filtro: GestionFiltro): string {
    switch (filtro) {
      case 'mensual':
        return 'Mensual';
      case 'recurrente':
        return 'Recurrentes';
      case 'revision':
        return 'Por revisar';
      default:
        return 'Todos';
    }
  }

  mostrarFiltroGestion(filtro: GestionFiltro, row: TrabajadorMovimientoRow): boolean {
    switch (filtro) {
      case 'mensual':
        return row.movimientosMes > 0;
      case 'recurrente':
        return row.recurrentes > 0;
      case 'revision':
        return row.revisar > 0;
      default:
        return true;
    }
  }

  abrirRecurrenteParaTrabajador(
    row: TrabajadorMovimientoRow,
    recurrente?: HaberDescuentoAsignacionPrevalidacionMensualFila,
    filtro: GestionFiltro = 'recurrente',
  ): void {
    this.prepararRetornoGestion(row, filtro);
    this.recurrenteTrabajador.set(row);
    this.recurrenteEditandoId.set(recurrente?.asignacion.idAsignacion ?? null);
    this.recurrenteConceptoId.set(recurrente?.asignacion.idConcepto ?? null);
    this.recurrenteTipoValor.set(recurrente?.asignacion.tipoValor === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
    this.recurrenteMonto.set(recurrente?.asignacion.monto ?? 0);
    this.recurrentePorcentaje.set(recurrente?.asignacion.porcentaje ?? 0);
    this.recurrentePeriodicidad.set(this.periodicidadRecurrenteSegura(recurrente?.asignacion.periodicidad));
    this.recurrenteVigenciaInicio.set(recurrente?.asignacion.vigenciaInicio ?? primerDiaSqlDesdeYm(this.periodoActual()));
    this.recurrenteVigenciaFin.set(recurrente?.asignacion.vigenciaFin ?? '');
    this.recurrenteObservacion.set(recurrente?.asignacion.observacion ?? '');
    this.recurrenteErrores.set({});
    this.contratosPersona.set([]);
    this.recurrenteIdContrato.set(recurrente?.asignacion.idContrato ?? null);
    this.recurrenteFormAbierto.set(true);
    this.confirmarCancelarRecurrenteAbierto.set(false);
    this.recurrenteSnapshot.set(this.serializarRecurrente());
    this.bloquearScrollPagina();
    void this.prepararContratosRecurrente(row.idPersona, recurrente?.asignacion.idContrato ?? null);
  }

  /** Cierre por X en modal padre (sin botón Cerrar en pie). */
  etiquetaCerrarModalPadre(): string {
    return 'Cerrar gestión del trabajador';
  }

  /** Cierre por X en modales hijo (sin Cancelar en pie). */
  etiquetaCerrarModalHijo(): string {
    return this.retornoGestionTrabajador() ? 'Cerrar y volver al trabajador' : 'Cerrar formulario';
  }

  mensajeDescartarCambios(tipo: 'mensual' | 'recurrente'): string {
    const alcance = tipo === 'mensual' ? 'el movimiento del mes' : 'el recurrente';
    return `Si cierras ahora, se perderán los datos de ${alcance} sin guardar.`;
  }

  seccionesDescartarCambios(tipo: 'mensual' | 'recurrente'): MessageBoxSection[] {
    const alcance = tipo === 'mensual' ? 'el movimiento del mes' : 'el recurrente';
    return [
      {
        label: 'Situación detectada',
        body: `Hay cambios sin guardar en ${alcance}.`,
      },
      {
        label: 'Impacto si cierras ahora',
        body: 'Los datos ingresados en este formulario no quedarán registrados.',
        tone: 'warning',
      },
      {
        label: 'Acción recomendada',
        body: 'Seguir editando si aún debes registrar o ajustar el movimiento.',
        tone: 'info',
      },
    ];
  }

  seccionesFinalizarRecurrente(trabajador: string, nombre: string): MessageBoxSection[] {
    return [
      {
        label: 'Movimiento',
        body: `${trabajador} · ${nombre}`,
      },
      {
        label: 'Impacto',
        body: 'El recurrente dejará de aplicar en períodos futuros y quedará disponible solo como historial.',
        tone: 'warning',
      },
      {
        label: 'Acción recomendada',
        body: 'Finalizar solo si confirmas que no debe seguir aplicándose.',
        tone: 'info',
      },
    ];
  }

  verRecurrentesTrabajador(row: TrabajadorMovimientoRow): void {
    this.abrirDetalleTrabajador(row, 'recurrente');
  }

  private abrirFormularioCon(form: NovedadForm): void {
    this.form.set(form);
    this.formErrores.set({});
    this.formValidacionActiva.set(false);
    this.formCamposTocados.set({});
    this.confirmarCancelarAbierto.set(false);
    this.formSnapshot.set(this.serializarForm(form));
    this.formAbierto.set(true);
    this.bloquearScrollPagina();
  }

  editarNovedad(novedad: NovedadMensual): void {
    if (!this.puedeEditar(novedad)) {
      return;
    }
    this.novedadEditando.set(novedad);
    this.abrirFormularioCon({
      periodo: novedad.periodo,
      idPersona: novedad.idPersona,
      idContrato: novedad.idContrato,
      idConcepto: novedad.idConcepto,
      categoria: novedad.categoria,
      tipoMovimiento: novedad.tipoMovimiento,
      cantidad: novedad.cantidad,
      unidad: novedad.unidad ?? '',
      monto: novedad.monto,
      moneda: novedad.moneda,
      origen: novedad.origen,
      fechaEvento: novedad.fechaEvento ?? '',
      observacion: novedad.observacion ?? '',
      referenciaExterna: novedad.referenciaExterna ?? '',
    });
    if (novedad.idPersona) {
      void this.cargarContratosPersona(novedad.idPersona);
    } else {
      this.contratosPersona.set([]);
    }
  }

  cerrarRecurrente(): void {
    this.recurrenteFormAbierto.set(false);
    this.recurrenteEditandoId.set(null);
    this.recurrenteTrabajador.set(null);
    this.recurrenteErrores.set({});
    this.contratosPersona.set([]);
    this.restaurarScrollPagina();
  }

  cancelarRecurrente(): void {
    if (this.retornoGestionTrabajador()) {
      this.volverAGestionDesdeRecurrente();
      return;
    }
    if (this.recurrenteConCambios()) {
      this.confirmarCancelarRecurrenteAbierto.set(true);
      return;
    }
    this.cerrarRecurrente();
    this.limpiarRetornoGestion();
  }

  cancelarFormularioMensual(): void {
    if (this.retornoGestionTrabajador()) {
      this.volverAGestionDesdeFormulario();
      return;
    }
    this.cerrarFormulario();
  }

  volverAGestionDesdeFormulario(): void {
    if (this.formConCambios()) {
      this.confirmarCancelarAbierto.set(true);
      return;
    }
    this.cerrarFormularioDirecto();
    if (!this.trabajadorDetalle()) {
      this.restaurarGestionSiCorresponde();
    }
  }

  volverAGestionDesdeRecurrente(): void {
    if (this.recurrenteConCambios()) {
      this.confirmarCancelarRecurrenteAbierto.set(true);
      return;
    }
    this.cerrarRecurrente();
    this.restaurarGestionSiCorresponde();
  }

  confirmarDescartarRecurrente(): void {
    this.confirmarCancelarRecurrenteAbierto.set(false);
    const restaurar = this.retornoGestionTrabajador() != null;
    this.cerrarRecurrente();
    if (restaurar && !this.trabajadorDetalle()) {
      this.restaurarGestionSiCorresponde();
    } else if (!restaurar) {
      this.limpiarRetornoGestion();
    }
  }

  cerrarConfirmacionCancelarRecurrente(): void {
    this.confirmarCancelarRecurrenteAbierto.set(false);
  }

  private prepararRetornoGestion(row: TrabajadorMovimientoRow, filtro: GestionFiltro): void {
    this.retornoGestionTrabajador.set(row);
    this.retornoGestionFiltro.set(filtro);
  }

  private limpiarRetornoGestion(): void {
    this.retornoGestionTrabajador.set(null);
    this.retornoGestionFiltro.set('todos');
  }

  private restaurarGestionSiCorresponde(): void {
    const row = this.retornoGestionTrabajador();
    if (!row) {
      return;
    }
    const filtro = this.retornoGestionFiltro();
    this.limpiarRetornoGestion();
    const actualizado = this.trabajadoresMovimientos().find((item) => item.idPersona === row.idPersona) ?? row;
    const detalle = this.trabajadorDetalle();
    if (detalle) {
      this.trabajadorDetalle.set({ row: actualizado, filtro: detalle.filtro });
    } else {
      this.abrirDetalleTrabajador(actualizado, filtro);
    }
  }

  onConceptoRecurrenteChange(idConcepto: number | null): void {
    this.recurrenteConceptoId.set(idConcepto);
    this.limpiarErrorRecurrente('idConcepto');
  }

  onTipoValorRecurrenteChange(raw: string): void {
    this.recurrenteTipoValor.set(raw === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
    this.limpiarErrorRecurrente('tipoValor');
  }

  actualizarRecurrenteMonto(valor: number): void {
    this.recurrenteMonto.set(valor);
    this.limpiarErrorRecurrente('monto');
  }

  actualizarRecurrentePorcentaje(valor: number): void {
    this.recurrentePorcentaje.set(valor);
    this.limpiarErrorRecurrente('porcentaje');
  }

  actualizarRecurrentePeriodicidad(valor: PeriodicidadHd): void {
    this.recurrentePeriodicidad.set(valor);
    this.limpiarErrorRecurrente('periodicidad');
  }

  actualizarRecurrenteVigenciaInicio(valor: string): void {
    this.recurrenteVigenciaInicio.set(valor);
    this.limpiarErrorRecurrente('vigenciaInicio');
  }

  actualizarRecurrenteVigenciaFin(valor: string): void {
    this.recurrenteVigenciaFin.set(valor);
    this.limpiarErrorRecurrente('vigenciaFin');
  }

  errorRecurrente(campo: RecurrenteFormCampo): string {
    return this.recurrenteErrores()[campo] ?? '';
  }

  async guardarRecurrente(): Promise<void> {
    const trabajador = this.recurrenteTrabajador();
    if (!trabajador) {
      return;
    }

    const payload = this.payloadRecurrente(trabajador.idPersona);
    const errores = this.validarRecurrente(payload);
    if (Object.keys(errores).length > 0) {
      this.recurrenteErrores.set(errores);
      this.mensaje.set({
        variant: 'warning',
        title: 'Datos incompletos',
        message: errores.general ?? 'Revisa los datos del movimiento recurrente.',
      });
      return;
    }

    this.recurrenteGuardando.set(true);
    try {
      const editandoId = this.recurrenteEditandoId();
      if (editandoId == null) {
        await this.haberesDescuentosService.crear(payload);
      } else {
        await this.haberesDescuentosService.actualizar(editandoId, payload);
      }
      this.mensaje.set({
        variant: 'success',
        title: editandoId == null ? 'Recurrente registrado' : 'Recurrente actualizado',
        message:
          editandoId == null
            ? 'El movimiento recurrente fue registrado correctamente.'
            : 'El movimiento recurrente fue actualizado correctamente.',
        detail: trabajador.trabajador,
      });
      await this.cargarNovedades();
      this.cerrarRecurrente();
      if (this.trabajadorDetalle()) {
        const retorno = this.retornoGestionTrabajador();
        if (retorno) {
          const actualizado =
            this.trabajadoresMovimientos().find((item) => item.idPersona === retorno.idPersona) ?? retorno;
          this.trabajadorDetalle.set({
            row: actualizado,
            filtro: this.trabajadorDetalle()!.filtro,
          });
          this.limpiarRetornoGestion();
        }
      } else {
        this.restaurarGestionSiCorresponde();
      }
    } catch (err) {
      this.mostrarError(err, 'No se pudo guardar el movimiento recurrente.');
    } finally {
      this.recurrenteGuardando.set(false);
    }
  }

  editarMovimientoDesdeDetalle(novedad: NovedadMensual): void {
    const detalle = this.trabajadorDetalle();
    if (detalle) {
      this.prepararRetornoGestion(detalle.row, detalle.filtro);
    }
    this.editarNovedad(novedad);
  }

  cerrarFormulario(): void {
    if (this.formConCambios()) {
      this.confirmarCancelarAbierto.set(true);
      return;
    }
    this.cerrarFormularioDirecto();
  }

  confirmarDescartarFormulario(): void {
    this.confirmarCancelarAbierto.set(false);
    this.cerrarFormularioDirecto();
    if (!this.trabajadorDetalle()) {
      this.restaurarGestionSiCorresponde();
    }
  }

  cerrarConfirmacionCancelar(): void {
    this.confirmarCancelarAbierto.set(false);
  }

  cerrarFormularioDirecto(): void {
    this.formAbierto.set(false);
    this.restaurarScrollPagina();
    this.novedadEditando.set(null);
    this.formErrores.set({});
    this.formValidacionActiva.set(false);
    this.formCamposTocados.set({});
    this.confirmarCancelarAbierto.set(false);
    this.contratosPersona.set([]);
    this.form.set(formInicial(this.periodoActual()));
    this.formSnapshot.set(this.serializarForm(this.form()));
    if (!this.retornoGestionTrabajador()) {
      this.limpiarRetornoGestion();
    }
  }

  actualizarForm<K extends keyof NovedadForm>(campo: K, valor: NovedadForm[K]): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
    this.limpiarErrorCampo(campo);
  }

  async onTrabajadorChange(idPersona: number | null): Promise<void> {
    this.actualizarForm('idPersona', idPersona);
    this.actualizarForm('idContrato', null);
    this.contratosPersona.set([]);
    if (idPersona == null) {
      return;
    }

    await this.cargarContratosPersona(idPersona);
    const contratos = this.contratosPersona();
    if (contratos.length === 1) {
      this.actualizarForm('idContrato', contratos[0].idContrato);
    }
  }

  onConceptoChange(idConcepto: number | null): void {
    this.actualizarForm('idConcepto', idConcepto);
  }

  async guardarFormulario(): Promise<void> {
    this.formValidacionActiva.set(true);
    const input = this.inputDesdeForm();
    const resultado = validarNovedadMensualInput({ ...input, estado: this.novedadEditando()?.estado ?? 'borrador' });
    if (!resultado.valido) {
      this.formErrores.set(this.erroresDesdeValidacion(resultado.errores));
      this.mensaje.set({
        variant: 'warning',
        title: 'Datos incompletos',
        message: this.mensajeOperativo(resultado.errores[0]?.mensaje) ?? 'Revise los datos del movimiento del mes.',
      });
      this.enfocarPrimerError();
      return;
    }

    this.formErrores.set({});
    this.guardando.set(true);
    try {
      const editando = this.novedadEditando();
      if (editando) {
        await this.novedadesService.actualizarNovedad(editando.idNovedad, input);
        this.mensaje.set({
          variant: 'success',
          title: 'Movimiento actualizado',
          message: 'El movimiento quedo actualizado.',
        });
      } else {
        await this.novedadesService.crearNovedad(input);
        this.mensaje.set({
          variant: 'success',
          title: 'Movimiento guardado',
          message: 'Movimiento guardado correctamente.',
        });
      }
      this.cerrarFormularioDirecto();
      await this.cargarNovedades();
      if (this.trabajadorDetalle()) {
        const retorno = this.retornoGestionTrabajador();
        if (retorno) {
          const actualizado =
            this.trabajadoresMovimientos().find((item) => item.idPersona === retorno.idPersona) ?? retorno;
          this.trabajadorDetalle.set({
            row: actualizado,
            filtro: this.trabajadorDetalle()!.filtro,
          });
          this.limpiarRetornoGestion();
        }
      } else {
        this.restaurarGestionSiCorresponde();
      }
    } catch (err) {
      this.mostrarError(err, 'No se pudo guardar el movimiento del mes.');
    } finally {
      this.guardando.set(false);
    }
  }

  puedeEditar(novedad: Pick<NovedadMensual, 'estado'>): boolean {
    return puedeEditarNovedad(novedad).valido && novedad.estado !== 'incorporada_a_pre_nomina' && novedad.estado !== 'anulada';
  }

  puedeEnviarRevision(novedad: NovedadMensual): boolean {
    return puedeCambiarEstadoNovedad(novedad.estado, 'pendiente_revision').valido;
  }

  puedeAprobar(novedad: NovedadMensual): boolean {
    return puedeAprobarNovedad(novedad).valido;
  }

  puedeRechazar(novedad: NovedadMensual): boolean {
    return puedeCambiarEstadoNovedad(novedad.estado, 'rechazada').valido;
  }

  puedeAnular(novedad: Pick<NovedadMensual, 'estado'>): boolean {
    return puedeAnularNovedad(novedad).valido;
  }

  puedeEliminar(novedad: Pick<NovedadMensual, 'estado'>): boolean {
    return puedeEliminarNovedad(novedad).valido;
  }

  async enviarRevision(novedad: NovedadMensual): Promise<void> {
    await this.ejecutarAccion(
      () => this.novedadesService.enviarARevision(novedad.idNovedad),
      'Movimiento enviado a revisión.',
      'No se pudo enviar el movimiento a revisión.',
    );
  }

  async aprobar(novedad: NovedadMensual): Promise<void> {
    await this.ejecutarAccion(
      () => this.novedadesService.aprobarNovedad(novedad.idNovedad, USUARIO_UI_BASE),
      'Movimiento aprobado.',
      'No se pudo aprobar el movimiento.',
    );
  }

  async rechazar(novedad: NovedadMensual): Promise<void> {
    await this.ejecutarAccion(
      () => this.novedadesService.rechazarNovedad(novedad.idNovedad, this.observacionAccion().trim()),
      'Movimiento rechazado.',
      'No se pudo rechazar el movimiento.',
    );
  }

  async observarDesdeDetalle(novedad: NovedadMensual): Promise<void> {
    this.observacionAccion.set('Observado desde Movimientos de remuneración.');
    await this.rechazar(novedad);
  }

  async anular(novedad: NovedadMensual): Promise<void> {
    await this.ejecutarAccion(
      () => this.novedadesService.anularNovedad(novedad.idNovedad, this.observacionAccion().trim() || null),
      'Movimiento anulado.',
      'No se pudo anular el movimiento.',
    );
  }

  async eliminar(novedad: NovedadMensual): Promise<void> {
    await this.ejecutarAccion(
      async () => {
        await this.novedadesService.eliminarSoloBorrador(novedad.idNovedad);
        return undefined;
      },
      'Movimiento eliminado.',
      'No se pudo eliminar el movimiento.',
    );
  }

  cerrarMensaje(): void {
    this.mensaje.set(null);
  }

  errorCampo(campo: NovedadFormCampo): string {
    const errores = this.formErrores();
    if (!errores[campo]) {
      return '';
    }
    if (!this.formValidacionActiva() && !this.formCamposTocados()[campo]) {
      return '';
    }
    return errores[campo] ?? '';
  }

  marcarCampoFormularioTocado(campo: NovedadFormCampo): void {
    if (!this.formCamposTocados()[campo]) {
      this.formCamposTocados.update((actual) => ({ ...actual, [campo]: true }));
    }
  }

  contratoEtiquetaTrabajador(row: TrabajadorMovimientoRow): string {
    return row.contrato?.trim() ? row.contrato : 'Sin contrato específico';
  }

  textoPendienteRevision(row: NovedadGridRow): string {
    const partes = [row.conceptoEtiqueta, row.estadoEtiqueta];
    const observacion = row.observacion?.trim();
    if (observacion) {
      partes.push(observacion);
    }
    return partes.join(' · ');
  }

  etiquetaGuardarFormulario(): string {
    if (this.guardando()) {
      return 'Guardando...';
    }
    return this.novedadEditando() ? 'Guardar cambios' : 'Guardar movimiento';
  }

  tipoRecurrenteEtiqueta(item: HaberDescuentoAsignacionPrevalidacionMensualFila): string {
    return item.asignacion.tipoConcepto === 'DESCUENTO' ? 'Descuento' : 'Haber';
  }

  movimientosMesTrabajador(idPersona: number): NovedadGridRow[] {
    return this.filas().filter((fila) => fila.idPersona === idPersona);
  }

  movimientosRevisionTrabajador(idPersona: number): NovedadGridRow[] {
    return this.movimientosMesTrabajador(idPersona).filter((fila) => fila.estado === 'pendiente_revision');
  }

  filasGestionUnificada(idPersona: number, filtro?: GestionFiltro): MovimientoGestionUnificadoRow[] {
    const mensual: MovimientoGestionUnificadoRow[] = this.movimientosMesTrabajador(idPersona).map((row) => ({
      rowId: `mes-${row.idNovedad}`,
      ambito: 'mensual',
      ambitoEtiqueta: 'Mensual',
      concepto: row.conceptoEtiqueta,
      tipo: row.tipoCategoriaEtiqueta,
      monto: row.montoEtiqueta,
      vigencia: row.fechaEventoEtiqueta !== '—' ? row.fechaEventoEtiqueta : `Período ${this.periodoActivo.etiqueta()}`,
      estadoEtiqueta: row.estadoEtiqueta,
      estadoClase: this.claseEstado(row.estado),
      detalle: this.ultimaAccionMovimiento(row),
      novedad: row,
      recurrente: null,
    }));

    const recurrente: MovimientoGestionUnificadoRow[] = this.recurrentesTrabajador(idPersona).map((item) => ({
      rowId: `rec-${item.asignacion.idAsignacion}`,
      ambito: 'recurrente',
      ambitoEtiqueta: 'Recurrente',
      concepto: item.asignacion.nombreConcepto,
      tipo: item.asignacion.tipoConcepto || 'Concepto',
      monto: this.montoRecurrenteEtiqueta(item),
      vigencia: this.vigenciaRecurrenteEtiqueta(item),
      estadoEtiqueta: item.asignacion.estadoVigenciaEtiqueta || item.estadoVigencia,
      estadoClase: 'nm-chip nm-chip--ok',
      detalle: this.impactoRecurrenteEtiqueta(item),
      novedad: null,
      recurrente: item,
    }));

    const ordenadas = [...mensual, ...recurrente].sort((a, b) => {
      if (a.ambito !== b.ambito) {
        return a.ambito === 'mensual' ? -1 : 1;
      }
      return a.concepto.localeCompare(b.concepto, 'es');
    });

    const activo = filtro ?? this.trabajadorDetalle()?.filtro ?? 'todos';
    switch (activo) {
      case 'mensual':
        return ordenadas.filter((fila) => fila.ambito === 'mensual');
      case 'recurrente':
        return ordenadas.filter((fila) => fila.ambito === 'recurrente');
      case 'revision':
        return ordenadas.filter((fila) => fila.novedad?.estado === 'pendiente_revision');
      default:
        return ordenadas;
    }
  }

  emptyGestionTitulo(filtro: GestionFiltro): string {
    switch (filtro) {
      case 'mensual':
        return 'Sin movimientos del mes';
      case 'recurrente':
        return 'Sin recurrentes vigentes';
      case 'revision':
        return 'Sin movimientos por revisar';
      default:
        return 'Sin movimientos registrados';
    }
  }

  emptyGestionDescripcion(filtro: GestionFiltro): string {
    switch (filtro) {
      case 'mensual':
        return 'Agrega un movimiento del mes para este trabajador.';
      case 'recurrente':
        return 'Registra un recurrente que impacte el período activo.';
      case 'revision':
        return 'No hay movimientos pendientes de revisión en este filtro.';
      default:
        return 'Agrega un movimiento del mes o un recurrente para este trabajador.';
    }
  }

  tieneAccionesGestionUnificada(row: MovimientoGestionUnificadoRow): boolean {
    if (row.novedad) {
      const novedad = row.novedad;
      return (
        this.puedeEditar(novedad) ||
        this.puedeEnviarRevision(novedad) ||
        this.puedeAprobar(novedad) ||
        this.puedeRechazar(novedad)
      );
    }
    if (row.recurrente) {
      const recurrente = row.recurrente;
      return this.puedeEditarRecurrente(recurrente) || this.puedeFinalizarRecurrente(recurrente);
    }
    return false;
  }

  claseAmbitoGestion(ambito: MovimientoGestionUnificadoRow['ambito']): string {
    return ambito === 'mensual' ? 'nm-chip nm-chip--mes' : 'nm-chip nm-chip--recurrente';
  }

  ultimaAccionMovimiento(row: NovedadGridRow): string {
    const fecha = row.fechaActualizacion || row.fechaCreacion;
    return fecha ? this.formatearFecha(fecha.slice(0, 10)) : 'Sin fecha';
  }

  totalMovimientosTrabajador(idPersona: number): string {
    const total = this.movimientosMesTrabajador(idPersona).reduce((acum, mov) => acum + (mov.monto ?? 0), 0);
    return this.formatearMonto(total);
  }

  recurrentesTrabajador(idPersona: number): HaberDescuentoAsignacionPrevalidacionMensualFila[] {
    return this.recurrentesPeriodo().filter(
      (item) => item.asignacion.idPersona === idPersona && item.intersectaPeriodo && item.asignacion.estado,
    );
  }

  editarRecurrenteDesdeDetalle(item: HaberDescuentoAsignacionPrevalidacionMensualFila): void {
    const detalle = this.trabajadorDetalle();
    if (!detalle?.row || !this.puedeEditarRecurrente(item)) {
      return;
    }
    this.abrirRecurrenteParaTrabajador(detalle.row, item, detalle.filtro);
  }

  pedirFinalizarRecurrente(item: HaberDescuentoAsignacionPrevalidacionMensualFila): void {
    const row = this.trabajadorDetalle()?.row;
    if (!row || !this.puedeFinalizarRecurrente(item)) {
      return;
    }
    this.recurrenteCerrarPendiente.set({
      idAsignacion: item.asignacion.idAsignacion,
      nombre: item.asignacion.nombreConcepto,
      trabajador: row.trabajador,
    });
  }

  cerrarConfirmacionRecurrente(): void {
    this.recurrenteCerrarPendiente.set(null);
  }

  async confirmarFinalizarRecurrente(): Promise<void> {
    const pendiente = this.recurrenteCerrarPendiente();
    if (!pendiente) {
      return;
    }
    try {
      await this.haberesDescuentosService.cerrarAsignacion(pendiente.idAsignacion);
      this.recurrenteCerrarPendiente.set(null);
      this.mensaje.set({
        variant: 'success',
        title: 'Recurrente finalizado',
        message: 'El movimiento recurrente dejó de aplicar desde este período.',
        detail: `${pendiente.trabajador} · ${pendiente.nombre}`,
      });
      await this.cargarNovedades();
    } catch (err) {
      this.mostrarError(err, 'No se pudo finalizar el movimiento recurrente.');
    }
  }

  totalRecurrentesTrabajador(idPersona: number): string {
    const total = this.recurrentesTrabajador(idPersona).reduce((acum, item) => acum + (item.asignacion.monto ?? 0), 0);
    return this.formatearMonto(total);
  }

  montoRecurrenteEtiqueta(item: HaberDescuentoAsignacionPrevalidacionMensualFila): string {
    const asignacion = item.asignacion;
    if (asignacion.monto != null) {
      return this.formatearMonto(asignacion.monto);
    }
    if (asignacion.porcentaje != null) {
      return `${asignacion.porcentaje}%`;
    }
    return 'Monto no informado';
  }

  vigenciaRecurrenteEtiqueta(item: HaberDescuentoAsignacionPrevalidacionMensualFila): string {
    const { vigenciaInicio, vigenciaFin } = item.asignacion;
    const desde = vigenciaInicio ? this.formatearFecha(vigenciaInicio) : 'sin inicio';
    const hasta = vigenciaFin ? this.formatearFecha(vigenciaFin) : 'sin termino';
    return `${desde} a ${hasta}`;
  }

  impactoRecurrenteEtiqueta(item: HaberDescuentoAsignacionPrevalidacionMensualFila): string {
    if (!item.intersectaPeriodo) {
      return 'Fuera del período';
    }
    return item.estadoVigencia === 'ACTIVA' || item.estadoVigencia === 'FUTURA'
      ? 'Impacta el período'
      : 'Sin impacto activo';
  }

  puedeEditarRecurrente(item: HaberDescuentoAsignacionPrevalidacionMensualFila): boolean {
    return item.estadoVigencia === 'ACTIVA' || item.estadoVigencia === 'FUTURA';
  }

  puedeFinalizarRecurrente(item: HaberDescuentoAsignacionPrevalidacionMensualFila): boolean {
    return item.estadoVigencia === 'ACTIVA' || item.estadoVigencia === 'FUTURA';
  }

  claseEstado(estado: NovedadMensualEstado): string {
    switch (estado) {
      case 'aprobada':
      case 'incorporada_a_pre_nomina':
      case 'calculada':
        return 'nm-chip nm-chip--ok';
      case 'pendiente_revision':
        return 'nm-chip nm-chip--warn';
      case 'rechazada':
      case 'anulada':
        return 'nm-chip nm-chip--muted';
      default:
        return 'nm-chip nm-chip--neutral';
    }
  }

  private async ejecutarAccion(
    accion: () => Promise<NovedadMensual | void>,
    mensajeExito: string,
    fallbackError: string,
  ): Promise<void> {
    try {
      await accion();
      this.observacionAccion.set('');
      this.mensaje.set({
        variant: 'success',
        title: 'Accion registrada',
        message: mensajeExito,
      });
      await this.cargarNovedades();
    } catch (err) {
      this.mostrarError(err, fallbackError);
    }
  }

  private async inicializarPantalla(): Promise<void> {
    await this.cargarDatosSoporte();
    await this.cargarNovedades();
    this.pantallaInicializada = true;
  }

  private async cargarDatosSoporte(): Promise<void> {
    this.soporteLoading.set(true);
    try {
      const [empleados, conceptos] = await Promise.all([
        this.empleadosService.listar(),
        this.haberesDescuentosService.listarConceptos(),
      ]);
      this.empleadosListado.set(empleados);
      this.empleadoOptions.set(
        empleados.map((empleado) => ({
          value: empleado.id,
          label: `${empleado.nombre} · ${empleado.rut}`,
          description: empleado.cargo || undefined,
        })),
      );
      this.conceptos.set(conceptos);
    } catch (err) {
      this.mostrarError(err, 'No se pudieron cargar los datos necesarios para registrar movimientos del mes.');
    } finally {
      this.soporteLoading.set(false);
    }
  }

  private async cargarContratosPersona(idPersona: number): Promise<void> {
    this.contratosLoading.set(true);
    try {
      this.contratosPersona.set(await this.haberesDescuentosService.listarContratosPersona(idPersona));
    } catch (err) {
      this.contratosPersona.set([]);
      this.mostrarError(err, 'No se pudieron cargar los contratos del trabajador.');
    } finally {
      this.contratosLoading.set(false);
    }
  }

  private inputDesdeForm(): CrearNovedadMensualInput & ActualizarNovedadMensualInput {
    const form = this.form();
    return {
      periodo: this.periodoActual().trim(),
      idPersona: form.idPersona ?? 0,
      idContrato: form.idContrato,
      idConcepto: form.idConcepto ?? 0,
      categoria: form.categoria,
      tipoMovimiento: form.tipoMovimiento,
      cantidad: form.cantidad,
      unidad: form.unidad.trim() || null,
      monto: form.monto,
      moneda: form.moneda.trim() || 'CLP',
      origen: form.origen,
      fechaEvento: form.fechaEvento.trim() || null,
      observacion: form.observacion.trim() || null,
      referenciaExterna: form.referenciaExterna.trim() || null,
    };
  }

  private async prepararContratosRecurrente(idPersona: number, idContratoActual: number | null = null): Promise<void> {
    await this.cargarContratosPersona(idPersona);
    const contratos = this.contratosPersona();
    this.recurrenteIdContrato.set(idContratoActual ?? (contratos.length === 1 ? contratos[0].idContrato : null));
  }

  private periodicidadRecurrenteSegura(valor: string | null | undefined): PeriodicidadHd {
    return PERIODICIDADES_HD.includes(valor as PeriodicidadHd) ? (valor as PeriodicidadHd) : 'MENSUAL';
  }

  private payloadRecurrente(idPersona: number): HaberDescuentoAsignacionPayload {
    const concepto = this.conceptoRecurrenteSeleccionado();
    const tipoValor = this.recurrenteTipoValor();
    return {
      idPersona,
      idConcepto: this.recurrenteConceptoId() ?? 0,
      idContrato: this.recurrenteIdContrato(),
      tipoValor,
      monto: tipoValor === 'FIJO' ? this.recurrenteMonto() : null,
      porcentaje: tipoValor === 'PORCENTAJE' ? this.recurrentePorcentaje() : null,
      tipohaber: concepto?.naturaleza ?? null,
      periodicidad: this.recurrentePeriodicidad(),
      vigenciaInicio: this.recurrenteVigenciaInicio().trim() || null,
      vigenciaFin: this.recurrenteVigenciaFin().trim() || null,
      observacion: this.recurrenteObservacion().trim() || null,
      estado: true,
    };
  }

  private validarRecurrente(payload: HaberDescuentoAsignacionPayload): RecurrenteFormErrores {
    const errores: RecurrenteFormErrores = {};
    if (!payload.idConcepto) {
      errores.idConcepto = 'Selecciona un concepto.';
    }
    if (!payload.periodicidad || !PERIODICIDADES_HD.includes(payload.periodicidad)) {
      errores.periodicidad = 'Selecciona una periodicidad válida.';
    }
    if (!payload.vigenciaInicio) {
      errores.vigenciaInicio = 'Indica la fecha de inicio.';
    }
    if (payload.vigenciaFin && payload.vigenciaInicio && payload.vigenciaFin < payload.vigenciaInicio) {
      errores.vigenciaFin = 'La vigencia fin debe ser mayor o igual al inicio.';
    }
    if (payload.tipoValor === 'FIJO' && (payload.monto == null || payload.monto < 0)) {
      errores.monto = 'El monto debe ser mayor o igual a 0.';
    }
    if (payload.tipoValor === 'PORCENTAJE') {
      const porcentaje = payload.porcentaje ?? 0;
      if (porcentaje < 0 || porcentaje > 100) {
        errores.porcentaje = 'El porcentaje debe estar entre 0 y 100.';
      }
    }
    return errores;
  }

  private limpiarErrorRecurrente(campo: RecurrenteFormCampo): void {
    const actual = this.recurrenteErrores();
    if (!actual[campo] && !actual.general) {
      return;
    }
    const { [campo]: _campo, general: _general, ...rest } = actual;
    this.recurrenteErrores.set(rest);
  }

  private limpiarErrorCampo(campo: NovedadFormCampo): void {
    const actual = this.formErrores();
    if (!actual[campo] && !actual.general) {
      return;
    }
    const { [campo]: _campo, general: _general, ...rest } = actual;
    this.formErrores.set(rest);
  }

  private erroresDesdeValidacion(errores: { codigo: string; mensaje: string }[]): NovedadFormErrores {
    const formErrores: NovedadFormErrores = {};
    for (const item of errores) {
      const mensaje = this.mensajeOperativo(item.mensaje) ?? item.mensaje;
      switch (item.codigo) {
        case 'NOVEDAD_PERIODO_INVALIDO':
          formErrores.periodo ??= mensaje;
          break;
        case 'NOVEDAD_PERSONA_REQUERIDA':
          formErrores.idPersona ??= mensaje;
          break;
        case 'NOVEDAD_CONCEPTO_REQUERIDO':
          formErrores.idConcepto ??= mensaje;
          break;
        case 'NOVEDAD_CATEGORIA_INVALIDA':
          formErrores.categoria ??= mensaje;
          break;
        case 'NOVEDAD_TIPO_MOVIMIENTO_INVALIDO':
          formErrores.tipoMovimiento ??= mensaje;
          break;
        case 'NOVEDAD_ORIGEN_INVALIDO':
          formErrores.origen ??= mensaje;
          break;
        case 'NOVEDAD_MONTO_INVALIDO':
        case 'NOVEDAD_MONTO_REQUERIDO':
          formErrores.monto ??= mensaje;
          break;
        case 'NOVEDAD_CANTIDAD_INVALIDA':
        case 'NOVEDAD_CANTIDAD_REQUERIDA':
          formErrores.cantidad ??= mensaje;
          break;
        case 'NOVEDAD_MONEDA_INVALIDA':
          formErrores.moneda ??= mensaje;
          break;
        default:
          formErrores.general ??= mensaje;
      }
    }
    return formErrores;
  }

  private enfocarPrimerError(): void {
    setTimeout(() => {
      if (typeof document === 'undefined') {
        return;
      }
      const el = document.querySelector<HTMLElement>('[data-nm-error="true"] input, [data-nm-error="true"] select, [data-nm-error="true"] textarea, [data-nm-error="true"] button');
      el?.focus();
    });
  }

  private serializarForm(form: NovedadForm): string {
    return JSON.stringify(form);
  }

  private serializarRecurrente(): string {
    return JSON.stringify({
      idConcepto: this.recurrenteConceptoId(),
      tipoValor: this.recurrenteTipoValor(),
      idContrato: this.recurrenteIdContrato(),
      monto: this.recurrenteMonto(),
      porcentaje: this.recurrentePorcentaje(),
      periodicidad: this.recurrentePeriodicidad(),
      vigenciaInicio: this.recurrenteVigenciaInicio(),
      vigenciaFin: this.recurrenteVigenciaFin(),
      observacion: this.recurrenteObservacion(),
    });
  }

  private bloquearScrollPagina(): void {
    if (typeof document === 'undefined' || this.bodyOverflowAnterior !== null) {
      return;
    }
    this.bodyOverflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private restaurarScrollPagina(): void {
    if (typeof document === 'undefined' || this.bodyOverflowAnterior === null) {
      return;
    }
    document.body.style.overflow = this.bodyOverflowAnterior;
    this.bodyOverflowAnterior = null;
  }

  private aGridRow(novedad: NovedadMensual): NovedadGridRow {
    const trabajadorEtiqueta = this.etiquetaTrabajador(novedad.idPersona);
    const conceptoEtiqueta = this.etiquetaConcepto(novedad.idConcepto);
    const categoriaEtiqueta = this.etiquetaCategoria(novedad.categoria);
    const tipoCategoriaEtiqueta = `${this.etiquetaTipoMovimiento(novedad.tipoMovimiento)} / ${categoriaEtiqueta}`;
    const estadoEtiqueta = this.etiquetaEstado(novedad.estado);
    const origenEtiqueta = this.etiquetaOrigen(novedad.origen);
    const cantidadEtiqueta = novedad.cantidad == null ? '-' : `${novedad.cantidad}${novedad.unidad ? ` ${novedad.unidad}` : ''}`;
    const fechaEventoEtiqueta = novedad.fechaEvento ? this.formatearFecha(novedad.fechaEvento) : '-';
    const montoEtiqueta = novedad.monto == null ? '-' : `${novedad.moneda} ${Number(novedad.monto).toLocaleString('es-CL')}`;
    const busqueda = [
      trabajadorEtiqueta,
      conceptoEtiqueta,
      tipoCategoriaEtiqueta,
      categoriaEtiqueta,
      estadoEtiqueta,
      origenEtiqueta,
      novedad.observacion ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return {
      ...novedad,
      trabajadorEtiqueta,
      conceptoEtiqueta,
      categoriaEtiqueta,
      tipoCategoriaEtiqueta,
      estadoEtiqueta,
      origenEtiqueta,
      cantidadEtiqueta,
      fechaEventoEtiqueta,
      montoEtiqueta,
      busqueda,
    };
  }

  private formatearFecha(fecha: string): string {
    const [yyyy, mm, dd] = fecha.split('-');
    return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : fecha;
  }

  private formatearMonto(valor: number): string {
    return `CLP ${Number(valor).toLocaleString('es-CL')}`;
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private etiquetaTrabajador(idPersona: number | null): string {
    if (idPersona == null) {
      return 'Trabajador sin ficha visible';
    }
    const empleado = this.empleadosListado().find((item) => item.id === idPersona);
    return empleado ? `${empleado.nombre} · ${empleado.rut}` : 'Trabajador sin ficha visible';
  }

  private etiquetaConcepto(idConcepto: number | null): string {
    if (idConcepto == null) {
      return 'Concepto no disponible';
    }
    const concepto = this.conceptos().find((item) => item.idConcepto === idConcepto);
    return concepto ? `${concepto.nombre} (${concepto.codigo})` : 'Concepto no disponible';
  }

  private mostrarError(err: unknown, fallback: string): void {
    const message = err instanceof Error && err.message.trim() ? err.message : fallback;
    this.mensaje.set({
      variant: 'error',
      title: 'Error',
      message: this.mensajeOperativo(message) ?? fallback,
    });
  }

  private mensajeOperativo(message: string | undefined): string | undefined {
    return message
      ?.replace(/novedades mensuales/gi, 'movimientos del mes')
      .replace(/novedad mensual/gi, 'movimiento del mes')
      .replace(/novedades/gi, 'movimientos')
      .replace(/novedad/gi, 'movimiento');
  }
}
