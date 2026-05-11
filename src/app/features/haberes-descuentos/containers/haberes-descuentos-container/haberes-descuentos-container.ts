import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Edit, LoaderCircle, Plus, RefreshCw } from 'lucide-angular/src/icons';

import { EmpleadoListado } from '../../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../shared/components/ui/card.component';
import {
  DataGridCellDirective,
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import {
  MessageBoxComponent,
  MessageBoxVariant,
} from '../../../../shared/components/ui/message-box.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';
import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../../../../shared/components/ui/search-select.component';
import { PeriodoActivoService, primerDiaSqlDesdeYm } from '../../../../core/services/periodo-activo.service';
import { HaberesDescuentosService } from '../../services/haberes-descuentos.service';
import {
  ConceptoListado,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
  HaberDescuentoTipoValor,
  PERIODICIDADES_HD,
} from '../../models/haber-descuento-asignacion.model';
import { type EstadoVigenciaAsignacion } from '../../rules/haber-descuento-vigencia.rules';

type HdGridRow = HaberDescuentoAsignacionListado & {
  estadoVigencia: EstadoVigenciaAsignacion;
  estadoVigenciaEtiqueta: string;
  valorAsignacion: string;
  /** Texto agregado para filtro “Buscar” (nombre, código concepto, LRE). */
  busquedaAsignacion: string;
};

function etiquetaEstadoFicha(empleado: EmpleadoListado): string {
  switch (empleado.estadoFicha) {
    case 'VALIDO':
      return 'Válido';
    case 'INCOMPLETO':
      return 'En proceso';
    case 'BORRADOR':
      return 'Borrador';
    default:
      return empleado.estadoFicha;
  }
}

function etiquetaTipoConcepto(tipo: string | null): string {
  if (tipo === 'HABER') {
    return 'Haber';
  }
  if (tipo === 'DESCUENTO') {
    return 'Descuento';
  }
  if (tipo === 'APORTE_EMPLEADOR') {
    return 'Aporte empleador';
  }
  return tipo?.trim() ? tipo : '—';
}

function etiquetaNaturalezaFn(n: string | null): string {
  if (n === 'IMPONIBLE') {
    return 'Imponible';
  }
  if (n === 'NO_IMPONIBLE') {
    return 'No imponible';
  }
  return n?.trim() ? n : '—';
}

@Component({
  selector: 'app-haberes-descuentos-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    RecordBreadcrumbComponent,
    ButtonComponent,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    SearchSelectComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
  ],
  templateUrl: './haberes-descuentos-container.html',
  styleUrl: './haberes-descuentos-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HaberesDescuentosContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);
  readonly periodoActivo = inject(PeriodoActivoService);

  readonly periodicidadesHd = PERIODICIDADES_HD;
  readonly fechaReferenciaPeriodo = computed(() => new Date(`${this.periodoActivo.periodoYm()}-01T00:00:00`));

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones' },
    { label: 'Asignaciones recurrentes' },
  ];

  readonly loaderIcon = LoaderCircle;
  readonly plusIcon = Plus;
  readonly editIcon = Edit;
  readonly refreshIcon = RefreshCw;

  readonly empleadosLoading = signal(false);
  readonly gridLoading = signal(false);
  readonly contratosLoading = signal(false);

  readonly empleadosListado = signal<EmpleadoListado[]>([]);
  readonly empleadoOptions = signal<SearchSelectOption<number>[]>([]);
  readonly conceptos = signal<ConceptoListado[]>([]);
  readonly contratosPersona = signal<{ idContrato: number; etiqueta: string }[]>([]);

  readonly personaIdSeleccionada = signal<number | null>(null);

  readonly filas = signal<HdGridRow[]>([]);

  readonly dialogAbierto = signal(false);
  readonly dialogEditId = signal<number | null>(null);
  readonly formConceptoId = signal<number | null>(null);
  readonly formConceptoSnapshot = signal<{
    codigo: string;
    nombre: string;
    tipo: string | null;
    naturaleza: string | null;
    codigoLre: string | null;
  } | null>(null);
  readonly formTipoValor = signal<HaberDescuentoTipoValor>('FIJO');
  readonly formIdContrato = signal<number | null>(null);
  readonly formMonto = signal<number>(0);
  readonly formPorcentaje = signal<number>(0);
  readonly formPeriodicidad = signal<string>('MENSUAL');
  readonly formVigenciaInicio = signal<string>('');
  readonly formVigenciaFin = signal<string>('');
  readonly formObservacion = signal<string>('');
  readonly formEstado = signal(true);

  readonly modalMsg = signal<{
    variant: MessageBoxVariant;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  readonly confirmDesactivar = signal<{ idAsignacion: number; nombre: string } | null>(null);

  readonly empleadoActual = computed(() => {
    const id = this.personaIdSeleccionada();
    if (id == null) {
      return null;
    }
    return this.empleadosListado().find((e) => e.id === id) ?? null;
  });

  readonly resumenAsignaciones = computed(() => {
    const filas = this.filas();
    return {
      activas: filas.filter((fila) => fila.estadoVigencia === 'ACTIVA').length,
      futuras: filas.filter((fila) => fila.estadoVigencia === 'FUTURA').length,
      vencidasOCerradas: filas.filter((fila) => fila.estadoVigencia === 'VENCIDA' || fila.estadoVigencia === 'CERRADA').length,
      invalidas: filas.filter((fila) => fila.estadoVigencia === 'INVALIDA').length,
    };
  });

  readonly conceptoFormulario = computed(() => {
    const id = this.formConceptoId();
    if (id == null) {
      return null;
    }
    return this.conceptos().find((c) => c.idConcepto === id) ?? null;
  });

  readonly conceptoVistaModal = computed(() => {
    const c = this.conceptoFormulario();
    if (c) {
      return {
        codigo: c.codigo,
        codigoLre: c.codigoLre,
        tipo: c.tipo,
        naturaleza: c.naturaleza,
      };
    }
    const snap = this.formConceptoSnapshot();
    if (snap) {
      return {
        codigo: snap.codigo,
        codigoLre: snap.codigoLre,
        tipo: snap.tipo,
        naturaleza: snap.naturaleza,
      };
    }
    return {
      codigo: '',
      codigoLre: null as string | null,
      tipo: null as string | null,
      naturaleza: null as string | null,
    };
  });

  readonly tituloModal = computed(() =>
    this.dialogEditId() == null ? 'Nueva asignacion recurrente' : 'Editar asignacion recurrente',
  );

  readonly conceptoOpciones = computed<SearchSelectOption<number>[]>(() => {
    const base = this.conceptos().map((c) => ({
      value: c.idConcepto,
      label: `${c.nombre} (${c.codigo})`,
      description: c.tipo ?? undefined,
    }));
    const id = this.formConceptoId();
    const editando = this.dialogEditId() != null;
    const snap = this.formConceptoSnapshot();
    if (editando && id != null && snap && !base.some((o) => o.value === id)) {
      return [
        {
          value: id,
          label: `${snap.nombre} (${snap.codigo}) — ya no está disponible para nuevas asignaciones; elija otro concepto o cierre sin guardar.`,
          description: snap.tipo ?? undefined,
        },
        ...base,
      ];
    }
    return base;
  });

  readonly contratoOpcionesNativo = computed(() => this.contratosPersona());

  readonly tieneMultiplesContratos = computed(() => this.contratosPersona().length > 1);

  readonly columns: DataGridColumn<HdGridRow>[] = [
    {
      id: 'nombreConcepto',
      header: 'Concepto',
      field: 'nombreConcepto',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
    },
    {
      id: 'codigoLre',
      header: 'Código LRE',
      field: 'codigoLre',
      type: 'text',
      sortable: true,
      format: (v) => (v == null || v === '' ? '—' : String(v)),
      filterable: false,
    },
    {
      id: 'tipoConcepto',
      header: 'Tipo',
      field: 'tipoConcepto',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'naturalezaConcepto',
      header: 'Naturaleza',
      field: 'naturalezaConcepto',
      type: 'text',
      sortable: true,
      format: (_v, row) => etiquetaNaturalezaFn(row.naturalezaConcepto),
      visible: false,
      filterable: false,
    },
    {
      id: 'valorAsignacion',
      header: 'Valor',
      field: 'valorAsignacion',
      type: 'text',
      align: 'right',
      sortable: false,
      filterable: false,
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'text',
      align: 'right',
      sortable: true,
      format: (_v, row) =>
        row.tipoValor === 'PORCENTAJE' || row.monto == null
          ? '—'
          : `$ ${Number(row.monto).toLocaleString('es-CL')}`,
      visible: false,
      filterable: false,
    },
    {
      id: 'porcentaje',
      header: 'Porcentaje',
      field: 'porcentaje',
      type: 'text',
      align: 'right',
      sortable: true,
      format: (_v, row) =>
        row.tipoValor === 'FIJO' || row.porcentaje == null ? '—' : `${this.formatPercent(row.porcentaje)} %`,
      visible: false,
      filterable: false,
    },
    {
      id: 'periodicidad',
      header: 'Periodicidad',
      field: 'periodicidad',
      type: 'text',
      sortable: true,
      format: (v) => (v == null || v === '' ? '—' : String(v)),
      visible: false,
      filterable: false,
    },
    {
      id: 'vigenciaInicio',
      header: 'Vigencia inicio',
      field: 'vigenciaInicio',
      type: 'text',
      sortable: true,
      format: (v) => this.formatDate(v),
      filterable: false,
    },
    {
      id: 'vigenciaFin',
      header: 'Vigencia fin',
      field: 'vigenciaFin',
      type: 'text',
      sortable: true,
      format: (v) => this.formatDate(v),
      filterable: false,
    },
    {
      id: 'estadoVigenciaEtiqueta',
      header: 'Estado vigencia',
      field: 'estadoVigenciaEtiqueta',
      type: 'text',
      sortable: true,
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

  readonly trackHdRow = (_index: number, row: HdGridRow): number => row.idAsignacion;

  readonly filters: DataGridFilter<HdGridRow>[] = [
    {
      id: 'busquedaAsignacion',
      label: 'Buscar concepto',
      field: 'busquedaAsignacion',
      type: 'text',
      operator: 'contains',
      placeholder: 'Nombre, código o LRE',
    },
    {
      id: 'estadoVigencia',
      label: 'Estado de vigencia',
      field: 'estadoVigencia',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todas',
      initialValue: 'OPERATIVAS',
      options: [
        { label: 'Operativas', value: 'OPERATIVAS' },
        { label: 'Activas', value: 'ACTIVA' },
        { label: 'Futuras', value: 'FUTURA' },
        { label: 'Vencidas', value: 'VENCIDA' },
        { label: 'Cerradas', value: 'CERRADA' },
        { label: 'Invalidas', value: 'INVALIDA' },
      ],
      predicate: (row, value) => {
        if (typeof value !== 'string' || value === '') {
          return true;
        }
        if (value === 'OPERATIVAS') {
          return row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA';
        }
        return row.estadoVigencia === value;
      },
    },
  ];

  etiquetaTipo = etiquetaTipoConcepto;
  etiquetaNaturaleza = etiquetaNaturalezaFn;
  etiquetaFicha = etiquetaEstadoFicha;

  constructor() {
    effect(() => {
      const pid = this.personaIdSeleccionada();
      this.periodoActivo.periodoYm();
      if (pid == null) {
        this.filas.set([]);
        return;
      }
      this.dialogAbierto.set(false);
      void this.cargarAsignaciones(pid);
    });

    effect(() => {
      const pid = this.personaIdSeleccionada();
      if (pid == null) {
        this.contratosPersona.set([]);
        return;
      }
      void this.cargarContratos(pid);
    });
  }

  ngOnInit(): void {
    void this.cargarEmpleados();
    void this.cargarConceptos();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const raw = params.get('persona');
      const id = raw ? Number(raw) : NaN;
      if (Number.isInteger(id) && id > 0) {
        this.personaIdSeleccionada.set(id);
      } else {
        this.personaIdSeleccionada.set(null);
      }
    });
  }

  async refrescar(): Promise<void> {
    await this.cargarEmpleados();
    await this.cargarConceptos();
    const pid = this.personaIdSeleccionada();
    if (pid) {
      await this.cargarContratos(pid);
      await this.cargarAsignaciones(pid);
    }
  }

  private mapFilasAsignacion(rows: HaberDescuentoAsignacionListado[]): HdGridRow[] {
    return rows.map((r) => {
      const estadoVigencia = r.estadoVigencia ?? 'INVALIDA';
      return {
        ...r,
        estadoVigencia,
        estadoVigenciaEtiqueta: r.estadoVigenciaEtiqueta ?? 'Invalida',
        valorAsignacion: this.valorAsignacionLabel(r),
        busquedaAsignacion: [r.nombreConcepto, r.codigoConcepto, r.codigoLre ?? '']
          .join(' ')
          .toLowerCase(),
      };
    });
  }

  async cargarEmpleados(): Promise<void> {
    this.empleadosLoading.set(true);
    try {
      const rows = await this.empleadosService.listar();
      this.empleadosListado.set(rows);
      this.empleadoOptions.set(
        rows.map((e) => ({
          value: e.id,
          label: `${e.nombre} · ${e.rut}`,
        })),
      );
    } finally {
      this.empleadosLoading.set(false);
    }
  }

  async cargarContratos(idPersona: number): Promise<void> {
    this.contratosLoading.set(true);
    try {
      const rows = await this.haberesDescuentosService.listarContratosPersona(idPersona);
      this.contratosPersona.set(rows);
    } finally {
      this.contratosLoading.set(false);
    }
  }

  async cargarConceptos(): Promise<void> {
    this.conceptos.set(await this.haberesDescuentosService.listarConceptos(this.fechaReferenciaPeriodo()));
  }

  async cargarAsignaciones(idPersona: number): Promise<void> {
    this.filas.set([]);
    this.gridLoading.set(true);
    try {
      const rows = await this.haberesDescuentosService.listarPorPersona(idPersona, this.fechaReferenciaPeriodo());
      this.filas.set(this.mapFilasAsignacion(rows));
    } finally {
      this.gridLoading.set(false);
    }
  }

  onEmpleadoChange(id: number | null): void {
    this.personaIdSeleccionada.set(id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: id ? { persona: id } : {},
      replaceUrl: true,
    });
    if (!id) {
      this.filas.set([]);
    }
  }

  onTipoValorChange(raw: string): void {
    this.formTipoValor.set(raw === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
  }

  onConceptoAsignacionChange(id: number | null): void {
    this.formConceptoId.set(id);
    this.formConceptoSnapshot.set(null);
  }

  verFichaEmpleado(): void {
    const id = this.personaIdSeleccionada();
    if (id) {
      void this.router.navigate(['/empleados', id]);
    }
  }

  irAConceptosRemuneracion(): void {
    void this.router.navigate(['/remuneraciones', 'conceptos']);
  }

  abrirNuevo(): void {
    const pid = this.personaIdSeleccionada();
    if (!pid) {
      this.mostrarErrorValidacion('Selecciona un trabajador antes de agregar una asignación.');
      return;
    }
    this.dialogEditId.set(null);
    this.formConceptoId.set(null);
    this.formConceptoSnapshot.set(null);
    this.formTipoValor.set('FIJO');
    this.formMonto.set(0);
    this.formPorcentaje.set(0);
    this.formPeriodicidad.set('MENSUAL');
    this.formVigenciaInicio.set(primerDiaSqlDesdeYm(this.periodoActivo.periodoYm()));
    this.formVigenciaFin.set('');
    this.formObservacion.set('');
    this.formEstado.set(true);
    const contrs = this.contratosPersona();
    this.formIdContrato.set(contrs.length === 1 ? contrs[0].idContrato : null);
    this.dialogAbierto.set(true);
  }

  editar(row: HdGridRow): void {
    if (!this.puedeEditar(row)) {
      return;
    }
    this.dialogEditId.set(row.idAsignacion);
    this.formConceptoId.set(row.idConcepto);
    this.formConceptoSnapshot.set({
      codigo: row.codigoConcepto,
      nombre: row.nombreConcepto,
      tipo: row.tipoConcepto,
      naturaleza: row.naturalezaConcepto,
      codigoLre: row.codigoLre,
    });
    this.formTipoValor.set(row.tipoValor === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
    this.formIdContrato.set(row.idContrato ?? null);
    this.formMonto.set(row.monto ?? 0);
    this.formPorcentaje.set(row.porcentaje ?? 0);
    this.formPeriodicidad.set(row.periodicidad?.trim() ? row.periodicidad : 'MENSUAL');
    this.formVigenciaInicio.set(row.vigenciaInicio?.slice(0, 10) ?? '');
    this.formVigenciaFin.set(row.vigenciaFin?.slice(0, 10) ?? '');
    this.formObservacion.set(row.observacion ?? '');
    this.formEstado.set(row.estado);
    this.dialogAbierto.set(true);
  }

  cerrarDialogo(): void {
    this.dialogAbierto.set(false);
  }

  private armarPayloadAsignacion(pid: number): HaberDescuentoAsignacionPayload | null {
    const conceptoId = this.formConceptoId();
    if (!conceptoId) {
      return null;
    }
    const per = this.formPeriodicidad().trim();
    return {
      idPersona: pid,
      idConcepto: conceptoId,
      idContrato: this.formIdContrato(),
      tipoValor: this.formTipoValor(),
      monto: this.formTipoValor() === 'FIJO' ? this.formMonto() : null,
      porcentaje: this.formTipoValor() === 'PORCENTAJE' ? this.formPorcentaje() : null,
      tipohaber:
        this.conceptoFormulario()?.naturaleza ?? this.formConceptoSnapshot()?.naturaleza ?? null,
      periodicidad: per ? (per as HaberDescuentoAsignacionPayload['periodicidad']) : null,
      vigenciaInicio: this.formVigenciaInicio().trim() || null,
      vigenciaFin: this.formVigenciaFin().trim() || null,
      observacion: this.formObservacion().trim() || null,
      estado: this.formEstado(),
    };
  }

  async guardarDialogo(): Promise<void> {
    const pid = this.personaIdSeleccionada();
    if (!pid) {
      this.mostrarErrorValidacion('Selecciona un trabajador.');
      return;
    }
    const payload = this.armarPayloadAsignacion(pid);
    if (!payload) {
      this.mostrarErrorValidacion('Selecciona un concepto.');
      return;
    }

    const perRaw = this.formPeriodicidad().trim();
    if (!perRaw || !PERIODICIDADES_HD.includes(perRaw as (typeof PERIODICIDADES_HD)[number])) {
      this.mostrarErrorValidacion('Selecciona una periodicidad válida.');
      return;
    }

    if (payload.vigenciaFin && payload.vigenciaInicio && payload.vigenciaFin < payload.vigenciaInicio) {
      this.mostrarErrorValidacion('La vigencia fin debe ser mayor o igual a la vigencia inicio.');
      return;
    }

    if (payload.tipoValor === 'FIJO' && (payload.monto == null || payload.monto < 0)) {
      this.mostrarErrorValidacion('El monto debe ser mayor o igual a 0.');
      return;
    }
    if (payload.tipoValor === 'PORCENTAJE') {
      const p = payload.porcentaje ?? 0;
      if (p < 0 || p > 100) {
        this.mostrarErrorValidacion('El porcentaje debe estar entre 0 y 100.');
        return;
      }
    }

    const concepto = this.conceptoFormulario();
    const filaEdit =
      this.dialogEditId() != null
        ? this.filas().find((f) => f.idAsignacion === this.dialogEditId())
        : null;
    const nombreDetalle = concepto?.nombre ?? filaEdit?.nombreConcepto ?? '';
    try {
      const editId = this.dialogEditId();
      if (editId == null) {
        await this.haberesDescuentosService.crear(payload);
        this.modalMsg.set({
          variant: 'success',
          title: 'Asignacion recurrente creada',
          message: 'La asignacion recurrente fue registrada correctamente para el trabajador.',
          detail: nombreDetalle,
        });
      } else {
        await this.haberesDescuentosService.actualizar(editId, payload);
        this.modalMsg.set({
          variant: 'success',
          title: 'Asignacion recurrente actualizada',
          message: 'Los cambios fueron guardados correctamente.',
          detail: nombreDetalle,
        });
      }
      this.dialogAbierto.set(false);
      await this.cargarAsignaciones(pid);
    } catch (err) {
      const detalle =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : '';
      this.modalMsg.set({
        variant: 'error',
        title: 'No se pudo guardar',
        message: 'Ocurrió un problema al guardar la información.',
        detail: detalle,
      });
    }
  }

  pedirDesactivar(row: HdGridRow): void {
    if (!this.puedeCerrar(row)) {
      return;
    }
    this.confirmDesactivar.set({
      idAsignacion: row.idAsignacion,
      nombre: row.nombreConcepto,
    });
  }

  cerrarConfirmDesactivar(): void {
    this.confirmDesactivar.set(null);
  }

  async confirmarDesactivar(): Promise<void> {
    const ctx = this.confirmDesactivar();
    const pid = this.personaIdSeleccionada();
    if (!ctx || !pid) {
      return;
    }
    try {
      await this.haberesDescuentosService.cerrarAsignacion(ctx.idAsignacion);
      this.confirmDesactivar.set(null);
      await this.cargarAsignaciones(pid);
      this.modalMsg.set({
        variant: 'success',
        title: 'Asignacion cerrada',
        message: 'Asignacion cerrada correctamente.',
        detail: ctx.nombre,
      });
    } catch (err) {
      const detalle =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : '';
      this.modalMsg.set({
        variant: 'error',
        title: 'No se pudo guardar',
        message: 'Ocurrió un problema al guardar la información.',
        detail: detalle,
      });
      this.confirmDesactivar.set(null);
    }
  }

  cerrarModalMsg(): void {
    this.modalMsg.set(null);
  }

  private mostrarErrorValidacion(detail: string): void {
    this.modalMsg.set({
      variant: 'warning',
      title: 'Datos incompletos',
      message: detail,
    });
  }

  puedeEditar(row: HdGridRow): boolean {
    return row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA';
  }

  puedeCerrar(row: HdGridRow): boolean {
    return row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA';
  }

  tituloEditar(row: HdGridRow): string {
    return this.puedeEditar(row) ? 'Editar' : 'No editable en historial';
  }

  tituloCerrar(row: HdGridRow): string {
    return this.puedeCerrar(row) ? 'Cerrar' : 'No se puede cerrar este estado';
  }

  private valorAsignacionLabel(row: HaberDescuentoAsignacionListado): string {
    if (row.tipoValor === 'PORCENTAJE') {
      return row.porcentaje == null ? '—' : `${this.formatPercent(row.porcentaje)} %`;
    }
    return row.monto == null ? '—' : `$ ${Number(row.monto).toLocaleString('es-CL')}`;
  }

  private formatPercent(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatDate(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (!Number.isFinite(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .format(date)
      .replaceAll('/', '-');
  }
}


