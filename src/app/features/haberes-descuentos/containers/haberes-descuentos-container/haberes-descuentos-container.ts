import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Edit, LoaderCircle, Plus } from 'lucide-angular/src/icons';

import { EmpleadosService } from '../../../empleados/services/empleados.service';
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
import { HaberesDescuentosService } from '../../services/haberes-descuentos.service';
import {
  ConceptoListado,
  HaberDescuentoAsignacionListado,
  HaberDescuentoAsignacionPayload,
  HaberDescuentoTipoValor,
} from '../../models/haber-descuento-asignacion.model';

type HdGridRow = HaberDescuentoAsignacionListado & {
  estadoActivo: string;
};

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

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Haberes y descuentos' },
  ];

  readonly loaderIcon = LoaderCircle;
  readonly plusIcon = Plus;
  readonly editIcon = Edit;

  readonly empleadosLoading = signal(false);
  readonly conceptosLoading = signal(false);
  readonly gridLoading = signal(false);

  readonly empleadoOptions = signal<SearchSelectOption<number>[]>([]);
  readonly conceptos = signal<ConceptoListado[]>([]);

  readonly personaIdSeleccionada = signal<number | null>(null);
  readonly filas = signal<HdGridRow[]>([]);

  readonly dialogAbierto = signal(false);
  readonly dialogEditId = signal<number | null>(null);
  readonly formConceptoId = signal<number | null>(null);
  readonly formTipoValor = signal<HaberDescuentoTipoValor>('FIJO');
  readonly formMonto = signal<number>(0);
  readonly formPorcentaje = signal<number>(0);
  readonly formEstado = signal(true);

  readonly modalMsg = signal<{
    variant: MessageBoxVariant;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  readonly confirmDesactivar = signal<{ idAsignacion: number; nombre: string } | null>(null);

  readonly conceptoOpciones = computed<SearchSelectOption<number>[]>(() =>
    this.conceptos().map((c) => ({
      value: c.idConcepto,
      label: `${c.nombre} (${c.codigo})`,
      description: c.tipo ?? undefined,
    })),
  );

  readonly columns: DataGridColumn<HdGridRow>[] = [
    {
      id: 'nombreConcepto',
      header: 'Concepto',
      field: 'nombreConcepto',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
    },
    {
      id: 'codigoConcepto',
      header: 'Codigo',
      field: 'codigoConcepto',
      type: 'text',
      sortable: true,
      hideable: true,
    },
    {
      id: 'tipoConcepto',
      header: 'Tipo',
      field: 'tipoConcepto',
      type: 'text',
      sortable: true,
    },
    {
      id: 'tipoValor',
      header: 'Modalidad',
      field: 'tipoValor',
      type: 'text',
      sortable: false,
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'number',
      align: 'right',
      sortable: true,
      format: (v) => (v == null ? '-' : `$ ${Number(v).toLocaleString('es-CL')}`),
    },
    {
      id: 'porcentaje',
      header: '%',
      field: 'porcentaje',
      type: 'number',
      align: 'right',
      sortable: false,
      format: (v) => (v == null ? '-' : `${Number(v)} %`),
    },
    {
      id: 'imponible',
      header: 'Imponible',
      field: 'imponible',
      type: 'text',
      sortable: false,
      format: (v) => (v ? 'Si' : 'No'),
    },
    {
      id: 'tributable',
      header: 'Tributable',
      field: 'tributable',
      type: 'text',
      sortable: false,
      format: (v) => (v ? 'Si' : 'No'),
    },
    {
      id: 'estadoActivo',
      header: 'Estado',
      field: 'estadoActivo',
      type: 'text',
      sortable: false,
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
      id: 'tipoConcepto',
      label: 'Tipo concepto',
      field: 'tipoConcepto',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Haber', value: 'HABER' },
        { label: 'Descuento', value: 'DESCUENTO' },
      ],
    },
    {
      id: 'estadoActivo',
      label: 'Estado',
      field: 'estadoActivo',
      type: 'select',
      operator: 'equals',
      emptyLabel: 'Todos',
      options: [
        { label: 'Activo', value: 'Activo' },
        { label: 'Inactivo', value: 'Inactivo' },
      ],
    },
  ];

  ngOnInit(): void {
    this.cargarEmpleados();
    this.cargarConceptos();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const raw = params.get('persona');
      const id = raw ? Number(raw) : NaN;
      if (Number.isInteger(id) && id > 0) {
        this.personaIdSeleccionada.set(id);
        void this.cargarAsignaciones(id);
      }
    });
  }

  async cargarEmpleados(): Promise<void> {
    this.empleadosLoading.set(true);
    try {
      const rows = await this.empleadosService.listar();
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

  async cargarConceptos(): Promise<void> {
    this.conceptosLoading.set(true);
    try {
      this.conceptos.set(await this.haberesDescuentosService.listarConceptos());
    } finally {
      this.conceptosLoading.set(false);
    }
  }

  async cargarAsignaciones(idPersona: number): Promise<void> {
    this.gridLoading.set(true);
    try {
      const rows = await this.haberesDescuentosService.listarPorPersona(idPersona);
      this.filas.set(
        rows.map((r) => ({
          ...r,
          estadoActivo: r.estado ? 'Activo' : 'Inactivo',
        })),
      );
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
    if (id) {
      void this.cargarAsignaciones(id);
    } else {
      this.filas.set([]);
    }
  }

  onTipoValorChange(raw: string): void {
    this.formTipoValor.set(raw === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
  }

  abrirNuevo(): void {
    const pid = this.personaIdSeleccionada();
    if (!pid) {
      this.mostrarErrorValidacion('Selecciona un trabajador antes de agregar una asignacion.');
      return;
    }
    this.dialogEditId.set(null);
    this.formConceptoId.set(null);
    this.formTipoValor.set('FIJO');
    this.formMonto.set(0);
    this.formPorcentaje.set(0);
    this.formEstado.set(true);
    this.dialogAbierto.set(true);
  }

  editar(row: HdGridRow): void {
    this.dialogEditId.set(row.idAsignacion);
    this.formConceptoId.set(row.idConcepto);
    this.formTipoValor.set(row.tipoValor === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
    this.formMonto.set(row.monto ?? 0);
    this.formPorcentaje.set(row.porcentaje ?? 0);
    this.formEstado.set(row.estado);
    this.dialogAbierto.set(true);
  }

  cerrarDialogo(): void {
    this.dialogAbierto.set(false);
  }

  async guardarDialogo(): Promise<void> {
    const pid = this.personaIdSeleccionada();
    const conceptoId = this.formConceptoId();
    if (!pid || !conceptoId) {
      this.mostrarErrorValidacion('Selecciona trabajador y concepto.');
      return;
    }

    const concepto = this.conceptos().find((c) => c.idConcepto === conceptoId);
    const payload: HaberDescuentoAsignacionPayload = {
      idPersona: pid,
      idConcepto: conceptoId,
      tipoValor: this.formTipoValor(),
      monto: this.formTipoValor() === 'FIJO' ? this.formMonto() : null,
      porcentaje: this.formTipoValor() === 'PORCENTAJE' ? this.formPorcentaje() : null,
      tipohaber: concepto?.naturaleza ?? null,
      estado: this.formEstado(),
    };

    try {
      const editId = this.dialogEditId();
      if (editId == null) {
        await this.haberesDescuentosService.crear(payload);
        this.modalMsg.set({
          variant: 'success',
          title: 'Haber/descuento registrado',
          message: 'El concepto fue asignado correctamente al trabajador.',
          detail: concepto?.nombre ?? '',
        });
      } else {
        await this.haberesDescuentosService.actualizar(editId, payload);
        this.modalMsg.set({
          variant: 'success',
          title: 'Haber/descuento actualizado',
          message: 'Los cambios fueron guardados correctamente.',
          detail: concepto?.nombre ?? '',
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
        title: 'No se pudo guardar el haber/descuento',
        message: 'Ocurrió un problema al guardar la información.',
        detail: detalle,
      });
    }
  }

  pedirDesactivar(row: HdGridRow): void {
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
      await this.haberesDescuentosService.desactivar(ctx.idAsignacion);
      this.confirmDesactivar.set(null);
      await this.cargarAsignaciones(pid);
      this.modalMsg.set({
        variant: 'success',
        title: 'Concepto desactivado',
        message: 'El concepto dejará de aplicarse en las próximas liquidaciones.',
        detail: ctx.nombre,
      });
    } catch (err) {
      const detalle =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : '';
      this.modalMsg.set({
        variant: 'error',
        title: 'No se pudo guardar el haber/descuento',
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
}
