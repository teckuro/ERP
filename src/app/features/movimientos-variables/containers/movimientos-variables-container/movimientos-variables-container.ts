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
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, RefreshCw } from 'lucide-angular/src/icons';

import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../shared/components/ui/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import {
  DataGridCellDirective,
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid.component';
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
import { EmpleadoListado } from '../../../empleados/models/empleado-listado.model';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import { ConceptoListado } from '../../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import type {
  MovimientoVariableEstado,
  MovimientoVariableListadoFila,
} from '../../models/movimiento-variable.model';
import { puedeAnularMovimientoVariable, esPeriodoRemuneracionValido } from '../../rules/movimiento-variable-validacion.rules';
import { MovimientosVariablesService } from '../../services/movimientos-variables.service';

type MovVarGridRow = MovimientoVariableListadoFila & {
  trabajadorEtiqueta: string;
  conceptoEtiqueta: string;
  tipoConceptoEtiqueta: string;
  busqueda: string;
};

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

function etiquetaEstadoMv(estado: MovimientoVariableEstado): string {
  switch (estado) {
    case 'BORRADOR':
      return 'Borrador';
    case 'VALIDADO':
      return 'Validado';
    case 'OBSERVADO':
      return 'Observado';
    case 'ANULADO':
      return 'Anulado';
    case 'BLOQUEADO':
      return 'Bloqueado';
    case 'INCLUIDO_EN_PROCESO':
      return 'Incluido en proceso';
    default:
      return estado;
  }
}

function etiquetaOrigen(origen: string): string {
  if (origen === 'MANUAL') {
    return 'Manual';
  }
  if (origen === 'IMPORTADO') {
    return 'Importado';
  }
  if (origen === 'SISTEMA') {
    return 'Sistema';
  }
  return origen;
}

@Component({
  selector: 'app-movimientos-variables-container',
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
    RouterLink,
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
    { label: 'Movimientos variables' },
  ];

  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;

  readonly catalogosLoading = signal(false);
  readonly gridLoading = signal(false);
  readonly guardarNuevoLoading = signal(false);

  readonly empleadosListado = signal<EmpleadoListado[]>([]);
  readonly empleadoOptions = signal<SearchSelectOption<number>[]>([]);
  readonly conceptos = signal<ConceptoListado[]>([]);

  /** Periodo del listado (YYYY-MM). Inicial desde periodo activo global. */
  readonly periodoFiltro = signal<string>('');

  readonly filas = signal<MovVarGridRow[]>([]);

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

  readonly confirmAnular = signal<MovVarGridRow | null>(null);
  readonly motivoAnulacion = signal<string>('');

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

  readonly columns: DataGridColumn<MovVarGridRow>[] = [
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
      id: 'tipoConceptoEtiqueta',
      header: 'Tipo',
      field: 'tipoConceptoEtiqueta',
      type: 'text',
      sortable: true,
      visible: false,
      filterable: false,
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'number',
      align: 'right',
      sortable: true,
      format: (_v, row) => this.formatMonto(row.monto),
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
      id: 'origen',
      header: 'Origen',
      field: 'origen',
      type: 'text',
      sortable: true,
      format: (v) => etiquetaOrigen(String(v ?? '')),
      visible: false,
      filterable: false,
    },
    {
      id: 'observacion',
      header: 'Observación',
      field: 'observacion',
      type: 'text',
      sortable: false,
      format: (v) => {
        const s = v == null ? '' : String(v);
        if (s.length <= 48) {
          return s || '—';
        }
        return `${s.slice(0, 45)}…`;
      },
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

  readonly filters: DataGridFilter<MovVarGridRow>[] = [
    {
      id: 'busquedaMv',
      label: 'Buscar',
      field: 'busqueda',
      type: 'text',
      operator: 'contains',
      placeholder: 'Trabajador, concepto, estado…',
    },
  ];

  readonly trackMvRow = (_index: number, row: MovVarGridRow): number => row.idMovimiento;

  ngOnInit(): void {
    this.periodoFiltro.set(this.periodoActivo.periodoYm());
    void this.inicializar();
  }

  etiquetaEstado = etiquetaEstadoMv;
  puedeAnular = (estado: MovimientoVariableEstado): boolean => puedeAnularMovimientoVariable(estado).valido;

  async inicializar(): Promise<void> {
    await this.cargarCatalogos();
    await this.buscar();
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
    const p = this.periodoFiltro().trim();
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
      this.filas.set(listado.map((fila) => this.aGridRow(fila)));
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
    const periodo = this.periodoFiltro().trim();

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
        message: 'El movimiento variable se registró correctamente.',
      });
      await this.buscar();
    } catch (err) {
      this.mostrarError(err, 'No se pudo crear el movimiento.');
    } finally {
      this.guardarNuevoLoading.set(false);
    }
  }

  pedirAnular(row: MovVarGridRow): void {
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

  formatMonto(m: number): string {
    return `$ ${Number(m).toLocaleString('es-CL')}`;
  }

  private mostrarError(err: unknown, fallback: string): void {
    const message = err instanceof Error && err.message.trim() ? err.message : fallback;
    this.modalMsg.set({
      variant: 'error',
      title: 'Error',
      message,
    });
  }

  private aGridRow(fila: MovimientoVariableListadoFila): MovVarGridRow {
    const emp = this.empleadosListado().find((e) => e.id === fila.idPersona);
    const trabajadorEtiqueta = emp ? `${emp.nombre} · ${emp.rut}` : `Persona ${fila.idPersona}`;
    const concepto = this.conceptos().find((c) => c.idConcepto === fila.idConcepto);
    const conceptoEtiqueta = concepto
      ? `${concepto.nombre} (${concepto.codigo})`
      : `Concepto ${fila.idConcepto}`;
    const tipoConceptoEtiqueta = etiquetaTipoConcepto(concepto?.tipo ?? null);
    const busqueda = [trabajadorEtiqueta, conceptoEtiqueta, fila.estado, fila.origen ?? '']
      .join(' ')
      .toLowerCase();
    return {
      ...fila,
      trabajadorEtiqueta,
      conceptoEtiqueta,
      tipoConceptoEtiqueta,
      busqueda,
    };
  }
}
