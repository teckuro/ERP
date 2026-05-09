import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, RefreshCw } from 'lucide-angular/src/icons';

import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import { ButtonComponent } from '../../../../../shared/components/ui/button.component';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../../shared/components/ui/card.component';
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
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../../shared/components/ui/record-breadcrumb.component';
import {
  SearchSelectComponent,
  type SearchSelectOption,
} from '../../../../../shared/components/ui/search-select.component';
import type { EmpleadoListado } from '../../../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../../../empleados/services/empleados.service';
import type {
  ConceptoListado,
  ContratoResumenPersona,
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
  estadoEtiqueta: string;
  origenEtiqueta: string;
  cantidadEtiqueta: string;
  montoEtiqueta: string;
  busqueda: string;
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

const USUARIO_UI_BASE = '00000000-0000-0000-0000-000000000000';

const ESTADO_LABELS: Record<NovedadMensualEstado, string> = {
  borrador: 'Borrador',
  pendiente_revision: 'Pendiente revision',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  incorporada_a_pre_nomina: 'En pre-nomina',
  calculada: 'Calculada',
  anulada: 'Anulada',
};

const CATEGORIA_LABELS: Record<NovedadMensualCategoria, string> = {
  haber_variable: 'Haber variable',
  tiempo_trabajado_adicional: 'Tiempo adicional',
  ausencia_descuento_tiempo: 'Ausencia o descuento de tiempo',
  licencia_permiso: 'Licencia o permiso',
  anticipo_descuento_unico: 'Anticipo o descuento unico',
  retroactivo_reintegro: 'Retroactivo o reintegro',
  ajuste_manual_controlado: 'Ajuste manual controlado',
};

const ORIGEN_LABELS: Record<NovedadMensualOrigen, string> = {
  manual: 'Manual',
  asistencia: 'Asistencia',
  importacion: 'Importacion',
  integracion_externa: 'Integracion externa',
  ajuste_administrativo: 'Ajuste administrativo',
  regularizacion: 'Regularizacion',
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
    RecordBreadcrumbComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    SearchSelectComponent,
  ],
  templateUrl: './novedades-mensuales-container.html',
  styleUrl: './novedades-mensuales-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovedadesMensualesContainer implements OnInit {
  private readonly novedadesService = inject(NovedadesMensualesService);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);
  readonly periodoActivo = inject(PeriodoActivoService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones' },
    { label: 'Movimientos del mes' },
  ];

  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;

  readonly estados = NOVEDAD_MENSUAL_ESTADOS;
  readonly categorias = NOVEDAD_MENSUAL_CATEGORIAS;
  readonly origenes = NOVEDAD_MENSUAL_ORIGENES;
  readonly tiposMovimiento = NOVEDAD_MENSUAL_TIPOS_MOVIMIENTO;

  readonly periodoFiltro = signal('');
  readonly loading = signal(false);
  readonly soporteLoading = signal(false);
  readonly contratosLoading = signal(false);
  readonly guardando = signal(false);
  readonly empleadosListado = signal<EmpleadoListado[]>([]);
  readonly empleadoOptions = signal<SearchSelectOption<number>[]>([]);
  readonly conceptos = signal<ConceptoListado[]>([]);
  readonly contratosPersona = signal<ContratoResumenPersona[]>([]);
  readonly filas = signal<NovedadGridRow[]>([]);
  readonly formAbierto = signal(false);
  readonly novedadEditando = signal<NovedadMensual | null>(null);
  readonly form = signal<NovedadForm>(formInicial(''));
  readonly observacionAccion = signal('');
  readonly mensaje = signal<{
    variant: MessageBoxVariant;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  readonly totalNovedades = computed(() => this.filas().length);
  readonly conceptoOptions = computed<SearchSelectOption<number>[]>(() =>
    this.conceptos().map((concepto) => ({
      value: concepto.idConcepto,
      label: `${concepto.nombre} (${concepto.codigo})`,
      description: concepto.tipo ?? undefined,
    })),
  );
  readonly conteosEstado = computed(() =>
    this.estados.map((estado) => ({
      estado,
      label: this.etiquetaEstado(estado),
      total: this.filas().filter((fila) => fila.estado === estado).length,
    })),
  );

  readonly columns: DataGridColumn<NovedadGridRow>[] = [
    {
      id: 'trabajadorEtiqueta',
      header: 'Trabajador',
      field: 'trabajadorEtiqueta',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
    },
    {
      id: 'conceptoEtiqueta',
      header: 'Concepto',
      field: 'conceptoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'categoriaEtiqueta',
      header: 'Categoria',
      field: 'categoriaEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'cantidadEtiqueta',
      header: 'Cantidad',
      field: 'cantidadEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'montoEtiqueta',
      header: 'Monto',
      field: 'montoEtiqueta',
      type: 'text',
      align: 'right',
      sortable: true,
      filterable: false,
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'origenEtiqueta',
      header: 'Origen',
      field: 'origenEtiqueta',
      type: 'text',
      sortable: true,
      visible: false,
      filterable: false,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
    },
  ];

  readonly filters: DataGridFilter<NovedadGridRow>[] = [
    {
      id: 'estado',
      label: 'Estado',
      field: 'estado',
      type: 'select',
      operator: 'equals',
      options: this.estados.map((estado) => ({ value: estado, label: this.etiquetaEstado(estado) })),
    },
    {
      id: 'categoria',
      label: 'Categoria',
      field: 'categoria',
      type: 'select',
      operator: 'equals',
      options: this.categorias.map((categoria) => ({ value: categoria, label: this.etiquetaCategoria(categoria) })),
    },
    {
      id: 'busqueda',
      label: 'Buscar',
      field: 'busqueda',
      type: 'text',
      operator: 'contains',
      placeholder: 'Trabajador, concepto, estado u origen',
    },
  ];

  readonly trackNovedad = (_index: number, row: NovedadGridRow): number => row.idNovedad;

  ngOnInit(): void {
    const periodo = this.periodoActivo.periodoYm();
    this.periodoFiltro.set(periodo);
    this.form.set(formInicial(periodo));
    void this.inicializarPantalla();
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
    const periodo = this.periodoFiltro().trim();
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
      const novedades = await this.novedadesService.listarNovedadesPeriodo(periodo);
      this.filas.set(novedades.map((novedad) => this.aGridRow(novedad)));
    } catch (err) {
      this.filas.set([]);
      this.mostrarError(err, 'No se pudieron cargar los movimientos del periodo.');
    } finally {
      this.loading.set(false);
    }
  }

  abrirNuevo(): void {
    this.novedadEditando.set(null);
    this.contratosPersona.set([]);
    this.form.set(formInicial(this.periodoFiltro().trim() || this.periodoActivo.periodoYm()));
    this.formAbierto.set(true);
  }

  editarNovedad(novedad: NovedadMensual): void {
    if (!this.puedeEditar(novedad)) {
      return;
    }
    this.novedadEditando.set(novedad);
    this.form.set({
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
    this.formAbierto.set(true);
    if (novedad.idPersona) {
      void this.cargarContratosPersona(novedad.idPersona);
    } else {
      this.contratosPersona.set([]);
    }
  }

  cerrarFormulario(): void {
    this.formAbierto.set(false);
    this.novedadEditando.set(null);
  }

  actualizarForm<K extends keyof NovedadForm>(campo: K, valor: NovedadForm[K]): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
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
    const input = this.inputDesdeForm();
    const resultado = validarNovedadMensualInput({ ...input, estado: this.novedadEditando()?.estado ?? 'borrador' });
    if (!resultado.valido) {
      this.mensaje.set({
        variant: 'warning',
        title: 'Datos incompletos',
        message: this.mensajeOperativo(resultado.errores[0]?.mensaje) ?? 'Revise los datos del movimiento del mes.',
      });
      return;
    }

    this.guardando.set(true);
    try {
      const editando = this.novedadEditando();
      if (editando) {
        await this.novedadesService.actualizarNovedad(editando.idNovedad, input);
        this.mensaje.set({
          variant: 'success',
          title: 'Movimiento actualizado',
          message: 'El movimiento del mes quedo actualizado.',
        });
      } else {
        await this.novedadesService.crearNovedad(input);
        this.mensaje.set({
          variant: 'success',
          title: 'Movimiento guardado',
          message: 'Movimiento guardado como borrador.',
        });
      }
      this.cerrarFormulario();
      await this.cargarNovedades();
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
      'Movimiento enviado a revision.',
      'No se pudo enviar el movimiento a revision.',
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
      periodo: form.periodo.trim(),
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

  private aGridRow(novedad: NovedadMensual): NovedadGridRow {
    const trabajadorEtiqueta = this.etiquetaTrabajador(novedad.idPersona);
    const conceptoEtiqueta = this.etiquetaConcepto(novedad.idConcepto);
    const categoriaEtiqueta = this.etiquetaCategoria(novedad.categoria);
    const estadoEtiqueta = this.etiquetaEstado(novedad.estado);
    const origenEtiqueta = this.etiquetaOrigen(novedad.origen);
    const cantidadEtiqueta = novedad.cantidad == null ? '-' : `${novedad.cantidad}${novedad.unidad ? ` ${novedad.unidad}` : ''}`;
    const montoEtiqueta = novedad.monto == null ? '-' : `${novedad.moneda} ${Number(novedad.monto).toLocaleString('es-CL')}`;
    const busqueda = [
      trabajadorEtiqueta,
      conceptoEtiqueta,
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
      estadoEtiqueta,
      origenEtiqueta,
      cantidadEtiqueta,
      montoEtiqueta,
      busqueda,
    };
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
