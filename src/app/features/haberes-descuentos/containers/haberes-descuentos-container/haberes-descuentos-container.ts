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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Edit, LoaderCircle, Plus, RefreshCw } from 'lucide-angular/src/icons';

import { EmpleadoListado } from '../../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../shared/components/ui/primitives/card.component';
import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import {
  MessageBoxComponent,
  MessageBoxVariant,
} from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  MessageBoxAction,
  MessageBoxSection,
} from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../../../../shared/components/ui/forms/search-select.component';
import { PeriodoActivoService, primerDiaSqlDesdeYm } from '../../../../core/services/periodo-activo.service';
import { HaberesDescuentosService } from '../../services/haberes-descuentos.service';
import {
  ConceptoListado,
  HaberDescuentoAsignacionPayload,
  HaberDescuentoTipoValor,
  PERIODICIDADES_HD,
} from '../../models/haber-descuento-asignacion.model';
import type { FilaGridHaberDescuento } from '../../models/haber-descuento-asignacion-listado.vm';
import { HaberDescuentoAsignacionEditorDialogComponent } from '../../components/haber-descuento-asignacion-editor-dialog/haber-descuento-asignacion-editor-dialog.component';
import {
  aFilasGridHaberDescuento,
  crearColumnasGridHaberDescuento,
  crearFiltrosGridHaberDescuento,
  debeMostrarCuotasRecurrente,
  etiquetaEstadoFichaEmpleado,
  etiquetaTipoConceptoHd,
} from '../../utils/haber-descuento-asignacion-listado.presenter';

@Component({
  selector: 'app-haberes-descuentos-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    ButtonComponent,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    SearchSelectComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    HaberDescuentoAsignacionEditorDialogComponent,
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

  private accionRegistrarPendiente = false;

  readonly periodicidadesHd = PERIODICIDADES_HD;
  readonly fechaReferenciaPeriodo = computed(() => new Date(`${this.periodoActivo.periodoYm()}-01T00:00:00`));

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

  readonly filas = signal<FilaGridHaberDescuento[]>([]);

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

  seccionesCerrarRecurrente(nombre: string): MessageBoxSection[] {
    return [
      {
        title: 'Principal',
        text: nombre,
        tone: 'attention',
      },
      {
        title: 'Acción',
        text: 'Cerrar solo si el movimiento no debe seguir aplicándose en períodos futuros.',
        tone: 'info',
      },
    ];
  }

  accionesCerrarRecurrente(): MessageBoxAction[] {
    return [
      { label: 'Cancelar', value: 'secondary', role: 'secondary', align: 'left' },
      { label: 'Cerrar', value: 'primary', role: 'danger', align: 'right' },
    ];
  }

  readonly empleadoActual = computed(() => {
    const id = this.personaIdSeleccionada();
    if (id == null) {
      return null;
    }
    return this.empleadosListado().find((e) => e.id === id) ?? null;
  });

  readonly trabajadorResumenModal = computed(() => {
    const emp = this.empleadoActual();
    if (!emp) {
      return null;
    }
    return { nombre: emp.nombre, rut: emp.rut };
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
    this.dialogEditId() == null ? 'Registrar recurrente' : 'Editar movimiento recurrente',
  );

  readonly mostrarCuotasRecurrente = computed(() => debeMostrarCuotasRecurrente(this.conceptoFormulario()));

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

  readonly tieneMultiplesContratos = computed(() => this.contratosPersona().length > 1);

  readonly columns = crearColumnasGridHaberDescuento();
  readonly filters = crearFiltrosGridHaberDescuento();

  readonly trackHdRow = (_index: number, row: FilaGridHaberDescuento): number => row.idAsignacion;

  etiquetaTipo = etiquetaTipoConceptoHd;
  etiquetaFicha = etiquetaEstadoFichaEmpleado;

  constructor() {
    bindShellPageContext(
      this.destroyRef,
      () => ({
        breadcrumbs: [
          { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
          { label: 'Recurrentes' },
        ],
        primaryAction: {
          label: 'Registrar recurrente',
          disabled: this.personaIdSeleccionada() == null,
          actionId: 'registrar-recurrente',
        },
      }),
      { onPrimaryAction: () => this.abrirNuevo() },
    );

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
      const personaValida = Number.isInteger(id) && id > 0;
      if (personaValida) {
        this.personaIdSeleccionada.set(id);
      } else {
        this.personaIdSeleccionada.set(null);
      }

      const accion = params.get('accion');
      if (accion === 'registrar') {
        this.accionRegistrarPendiente = personaValida;
        if (personaValida) {
          setTimeout(() => this.consumirAccionRegistrar(), 0);
        }
      } else {
        this.accionRegistrarPendiente = false;
      }
    });
  }

  private consumirAccionRegistrar(): void {
    if (!this.accionRegistrarPendiente || this.personaIdSeleccionada() == null) {
      return;
    }
    this.accionRegistrarPendiente = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { accion: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (!this.dialogAbierto()) {
      this.abrirNuevo();
    }
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
      this.filas.set(aFilasGridHaberDescuento(rows));
    } finally {
      this.gridLoading.set(false);
    }
  }

  onEmpleadoChange(id: number | null): void {
    this.personaIdSeleccionada.set(id);
    this.accionRegistrarPendiente = false;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: id ? { persona: id, accion: null } : { persona: null, accion: null },
      queryParamsHandling: 'merge',
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

  editar(row: FilaGridHaberDescuento): void {
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

  pedirDesactivar(row: FilaGridHaberDescuento): void {
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

  puedeEditar(row: FilaGridHaberDescuento): boolean {
    return row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA';
  }

  puedeCerrar(row: FilaGridHaberDescuento): boolean {
    return row.estadoVigencia === 'ACTIVA' || row.estadoVigencia === 'FUTURA';
  }

  tituloEditar(row: FilaGridHaberDescuento): string {
    return this.puedeEditar(row) ? 'Editar' : 'No editable en historial';
  }

  tituloCerrar(row: FilaGridHaberDescuento): string {
    return this.puedeCerrar(row) ? 'Cerrar' : 'No se puede cerrar este estado';
  }
}
