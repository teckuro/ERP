import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, RefreshCw } from 'lucide-angular/src/icons';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent, MessageBoxVariant } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/layout/record-breadcrumb.component';
import { SearchSelectOption } from '../../../../shared/components/ui/forms/search-select.component';
import { EmpleadoListado } from '../../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import { ConceptoListado } from '../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientoVariableAltaDialogComponent } from '../../components/movimiento-variable-alta-dialog/movimiento-variable-alta-dialog.component';
import { MovimientoVariableAnularDialogComponent } from '../../components/movimiento-variable-anular-dialog/movimiento-variable-anular-dialog.component';
import type { FilaGridMovimientoVariable } from '../../models/movimiento-variable-listado.vm';
import type { MovimientoVariableEstado } from '../../models/movimiento-variable.model';
import {
  puedeAnularMovimientoVariable,
  esPeriodoRemuneracionValido,
} from '../../rules/movimiento-variable-validacion.rules';
import { MovimientosVariablesService } from '../../services/movimientos-variables.service';
import {
  aFilaGridMovimientoVariable,
  crearColumnasGridMovimientoVariable,
  crearFiltrosGridMovimientoVariable,
  etiquetaEstadoMovimientoVariable,
} from '../../utils/movimiento-variable-listado.presenter';

@Component({
  selector: 'app-movimientos-variables-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RecordBreadcrumbComponent,
    ButtonComponent,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    MovimientoVariableAltaDialogComponent,
    MovimientoVariableAnularDialogComponent,
  ],
  templateUrl: './movimientos-variables-container.html',
  styleUrl: './movimientos-variables-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimientosVariablesContainer implements OnInit {
  private readonly movimientosVariablesService = inject(MovimientosVariablesService);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);
  readonly periodoActivo = inject(PeriodoActivoService);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Remuneraciones', link: '/remuneraciones' },
    { label: 'Movimientos del mes' },
  ];

  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;

  readonly catalogosLoading = signal(false);
  readonly gridLoading = signal(false);
  readonly guardarNuevoLoading = signal(false);

  readonly empleadosListado = signal<EmpleadoListado[]>([]);
  readonly empleadoOptions = signal<SearchSelectOption<number>[]>([]);
  readonly conceptos = signal<ConceptoListado[]>([]);

  readonly periodoActual = computed(() => this.periodoActivo.periodoYm());

  readonly filas = signal<FilaGridMovimientoVariable[]>([]);

  readonly dialogNuevoAbierto = signal(false);
  readonly formPersonaId = signal<number | null>(null);
  readonly formConceptoId = signal<number | null>(null);
  readonly formMonto = signal<number | null>(null);
  readonly formEstadoAlta = signal<'BORRADOR' | 'VALIDADO'>('BORRADOR');
  readonly formObservacion = signal<string>('');

  readonly modalMsg = signal<{
    variant: MessageBoxVariant;
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  readonly confirmAnular = signal<FilaGridMovimientoVariable | null>(null);
  readonly motivoAnulacion = signal<string>('');
  private pantallaInicializada = false;

  readonly conceptoOpciones = computed<SearchSelectOption<number>[]>(() =>
    this.conceptos().map((c) => ({
      value: c.idConcepto,
      label: `${c.nombre} (${c.codigo})`,
      description: c.tipo ?? undefined,
    })),
  );

  readonly conceptoFormulario = computed(() => {
    const id = this.formConceptoId();
    if (id == null) {
      return null;
    }
    return this.conceptos().find((c) => c.idConcepto === id) ?? null;
  });

  readonly columns = crearColumnasGridMovimientoVariable();
  readonly filters = crearFiltrosGridMovimientoVariable();

  readonly trackMvRow = (_index: number, row: FilaGridMovimientoVariable): number => row.idMovimiento;

  constructor() {
    effect(() => {
      this.periodoActual();
      if (!this.pantallaInicializada) {
        return;
      }
      untracked(() => {
        this.cerrarNuevo();
        this.confirmAnular.set(null);
        this.modalMsg.set(null);
        void this.buscar();
      });
    });
  }

  ngOnInit(): void {
    void this.inicializar();
  }

  etiquetaEstado = etiquetaEstadoMovimientoVariable;
  puedeAnular = (estado: MovimientoVariableEstado): boolean => puedeAnularMovimientoVariable(estado).valido;

  async inicializar(): Promise<void> {
    await this.cargarCatalogos();
    await this.buscar();
    this.pantallaInicializada = true;
  }

  async refrescar(): Promise<void> {
    await this.cargarCatalogos();
    await this.buscar();
  }

  async cargarCatalogos(): Promise<void> {
    this.catalogosLoading.set(true);
    try {
      const [empleados, conceptosRows] = await Promise.all([
        this.empleadosService.listar(),
        this.haberesDescuentosService.listarConceptos(),
      ]);
      this.empleadosListado.set(empleados);
      this.empleadoOptions.set(
        empleados.map((e) => ({
          value: e.id,
          label: `${e.nombre} · ${e.rut}`,
        })),
      );
      this.conceptos.set(conceptosRows);
    } finally {
      this.catalogosLoading.set(false);
    }
  }

  async buscar(): Promise<void> {
    const p = this.periodoActual().trim();
    if (!esPeriodoRemuneracionValido(p)) {
      this.modalMsg.set({
        variant: 'error',
        title: 'Período no válido',
        message: 'Use el formato YYYY-MM (por ejemplo 2026-05).',
      });
      this.filas.set([]);
      return;
    }

    this.gridLoading.set(true);
    try {
      const listado = await this.movimientosVariablesService.listarPorPeriodo(p);
      this.filas.set(
        listado.map((fila) =>
          aFilaGridMovimientoVariable(fila, this.empleadosListado(), this.conceptos()),
        ),
      );
    } catch (err) {
      this.mostrarError(err, 'No se pudo cargar el listado.');
      this.filas.set([]);
    } finally {
      this.gridLoading.set(false);
    }
  }

  abrirNuevo(): void {
    this.formPersonaId.set(null);
    this.formConceptoId.set(null);
    this.formMonto.set(null);
    this.formEstadoAlta.set('BORRADOR');
    this.formObservacion.set('');
    this.dialogNuevoAbierto.set(true);
  }

  cerrarNuevo(): void {
    this.dialogNuevoAbierto.set(false);
  }

  async guardarNuevo(): Promise<void> {
    const idPersona = this.formPersonaId();
    const idConcepto = this.formConceptoId();
    const monto = this.formMonto();
    const periodo = this.periodoActual().trim();

    if (idPersona == null || idPersona <= 0) {
      this.modalMsg.set({
        variant: 'warning',
        title: 'Datos incompletos',
        message: 'Seleccione un trabajador.',
      });
      return;
    }
    if (idConcepto == null || idConcepto <= 0) {
      this.modalMsg.set({
        variant: 'warning',
        title: 'Datos incompletos',
        message: 'Seleccione un concepto.',
      });
      return;
    }
    if (monto == null || !Number.isFinite(monto) || monto <= 0) {
      this.modalMsg.set({
        variant: 'warning',
        title: 'Monto no válido',
        message: 'Indique un monto numérico mayor que cero.',
      });
      return;
    }
    if (!esPeriodoRemuneracionValido(periodo)) {
      this.modalMsg.set({
        variant: 'error',
        title: 'Período no válido',
        message: 'Corrija el período antes de guardar.',
      });
      return;
    }

    const concepto = this.conceptoFormulario();
    const snapshot = concepto ? { tipo: concepto.tipo } : null;

    this.guardarNuevoLoading.set(true);
    try {
      await this.movimientosVariablesService.crear({
        idPersona,
        idConcepto,
        periodo,
        monto,
        estado: this.formEstadoAlta(),
        origen: 'MANUAL',
        observacion: this.formObservacion().trim() || null,
        concepto: snapshot,
      });
      this.dialogNuevoAbierto.set(false);
      this.modalMsg.set({
        variant: 'success',
        title: 'Movimiento creado',
        message: 'El movimiento del mes se registro correctamente.',
      });
      await this.buscar();
    } catch (err) {
      this.mostrarError(err, 'No se pudo crear el movimiento.');
    } finally {
      this.guardarNuevoLoading.set(false);
    }
  }

  pedirAnular(row: FilaGridMovimientoVariable): void {
    if (!this.puedeAnular(row.estado)) {
      return;
    }
    this.motivoAnulacion.set('');
    this.confirmAnular.set(row);
  }

  cerrarConfirmAnular(): void {
    this.confirmAnular.set(null);
  }

  async confirmarAnular(): Promise<void> {
    const row = this.confirmAnular();
    if (!row) {
      return;
    }
    this.confirmAnular.set(null);
    try {
      await this.movimientosVariablesService.anular(row.idMovimiento, {
        idMovimiento: row.idMovimiento,
        motivo: this.motivoAnulacion().trim() || null,
      });
      this.modalMsg.set({
        variant: 'success',
        title: 'Movimiento anulado',
        message: 'El movimiento quedó en estado anulado.',
      });
      await this.buscar();
    } catch (err) {
      this.mostrarError(err, 'No se pudo anular el movimiento.');
    }
  }

  cerrarModalMsg(): void {
    this.modalMsg.set(null);
  }

  private mostrarError(err: unknown, fallback: string): void {
    const message = err instanceof Error && err.message.trim() ? err.message : fallback;
    this.modalMsg.set({
      variant: 'error',
      title: 'Error',
      message,
    });
  }
}
