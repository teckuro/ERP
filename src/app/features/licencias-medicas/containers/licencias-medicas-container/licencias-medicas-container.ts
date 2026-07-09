import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  DataGridCellDirective,
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import { LicenciaMedicaRevisionDrawerComponent } from '../../components/licencia-medica-revision-drawer/licencia-medica-revision-drawer.component';
import { LicenciasMedicasNovedadesOrquestador } from '../../facade/licencias-medicas-novedades.orquestador';
import { LicenciasMedicasRepository } from '../../data-access/licencias-medicas.repository';
import type { LicenciaMedica, LicenciaMedicaIngresoCorreo } from '../../models/licencia-medica.model';
import {
  etiquetaEstadoLicenciaMedica,
  etiquetaOrigenLicenciaMedica,
  etiquetaTipoLicenciaMedica,
  licenciaMedicaPermiteEdicion,
} from '../../rules/licencia-medica-novedades.rules';
import { LicenciasMedicasService } from '../../services/licencias-medicas.service';

type LicenciaGridRow = LicenciaMedica & {
  busqueda: string;
  filtroEstado: string;
};

@Component({
  selector: 'app-licencias-medicas-container',
  standalone: true,
  imports: [
    CommonModule,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    LicenciaMedicaRevisionDrawerComponent,
  ],
  templateUrl: './licencias-medicas-container.html',
  styleUrl: './licencias-medicas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicenciasMedicasContainer implements OnInit {
  private readonly licenciasService = inject(LicenciasMedicasService);
  private readonly licenciasRepository = inject(LicenciasMedicasRepository);
  private readonly orquestador = inject(LicenciasMedicasNovedadesOrquestador);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(DataGridComponent)
  private grid?: DataGridComponent<LicenciaGridRow>;

  @ViewChild(LicenciaMedicaRevisionDrawerComponent)
  private drawer?: LicenciaMedicaRevisionDrawerComponent;

  readonly loading = signal(false);
  readonly guardando = signal(false);
  readonly filas = signal<LicenciaGridRow[]>([]);
  readonly empleados = signal<Awaited<ReturnType<EmpleadosService['listar']>>>([]);
  readonly licenciaSeleccionada = signal<LicenciaMedica | null>(null);
  readonly ingresoSeleccionado = signal<LicenciaMedicaIngresoCorreo | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly mensajeError = signal<string | null>(null);
  readonly alertaPendientesVisible = signal(false);
  private alertaPendientesMostrada = false;

  readonly pendientesCount = computed(
    () => this.filas().filter((f) => f.estado === 'pendiente_revision').length,
  );

  readonly mensajeAlertaPendientes = computed(() => {
    const total = this.pendientesCount();
    return `${total} licencia${total === 1 ? '' : 's'} recibida${total === 1 ? '' : 's'} por correo requiere${total === 1 ? '' : 'n'} revisión antes de impactar nómina.`;
  });

  readonly columns: DataGridColumn<LicenciaGridRow>[] = [
    {
      id: 'trabajador',
      header: 'Trabajador',
      sortable: true,
      format: (_v, row) => row.nombreTrabajador?.trim() || 'Sin asignar',
    },
    { id: 'folio', header: 'Folio', field: 'folio', sortable: true, format: (v) => String(v ?? '—') },
    {
      id: 'tipo',
      header: 'Tipo',
      field: 'tipo',
      sortable: true,
      format: (v) => etiquetaTipoLicenciaMedica(String(v ?? '')),
    },
    {
      id: 'vigencia',
      header: 'Vigencia',
      sortable: false,
      format: (_v, row) =>
        row.fechaInicio && row.fechaTermino ? `${row.fechaInicio} – ${row.fechaTermino}` : '—',
    },
    {
      id: 'dias',
      header: 'Días',
      field: 'dias',
      sortable: true,
      align: 'right',
      format: (v) => (v == null ? '—' : String(v)),
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      sortable: true,
      format: (v) => etiquetaEstadoLicenciaMedica(String(v ?? '')),
    },
    {
      id: 'origen',
      header: 'Origen',
      field: 'origen',
      sortable: true,
      format: (v) => etiquetaOrigenLicenciaMedica(String(v ?? '')),
    },
    {
      id: 'fechaCreacion',
      header: 'Recibida',
      field: 'fechaCreacion',
      sortable: true,
      format: (v) => (v ? new Date(String(v)).toLocaleString('es-CL') : '—'),
    },
  ];

  readonly filters: DataGridFilter<LicenciaGridRow>[] = [
    {
      id: 'estado',
      label: 'Estado',
      field: 'filtroEstado',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Pendiente de revisión', value: 'pendiente_revision' },
        { label: 'Registrada', value: 'registrada' },
        { label: 'Vinculada a nómina', value: 'vinculada_nomina' },
        { label: 'Rechazada', value: 'rechazada' },
      ],
    },
    {
      id: 'busqueda',
      label: 'Búsqueda',
      field: 'busqueda',
      type: 'text',
      operator: 'contains',
      placeholder: 'Folio, trabajador o RUT',
      emptyLabel: 'Cualquier texto',
    },
  ];

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => {
        if (this.pendientesCount() > 0) {
          this.revisarPendientesDesdeAlerta();
        }
      },
    });
  }

  private computeShellContext(): ShellPageContext {
    const pendientes = this.pendientesCount();
    return {
      breadcrumbs: [{ label: 'Licencias médicas' }],
      pageTitle: 'Licencias médicas',
      pageSubtitle:
        pendientes > 0
          ? `${pendientes} licencia(s) pendiente(s) de revisión.`
          : 'Revise folio, trabajador y vigencia antes de vincular movimientos del mes.',
      primaryAction:
        pendientes > 0
          ? {
              label: 'Revisar pendientes',
              actionId: 'revisar-pendientes',
              disabled: this.loading() || this.guardando(),
            }
          : undefined,
    };
  }

  ngOnInit(): void {
    void this.cargar();
  }

  trackRow = (_index: number, row: LicenciaGridRow): number => row.idLicencia;

  async cargar(opciones?: { silenciarAlertaPendientes?: boolean }): Promise<void> {
    this.loading.set(true);
    this.mensajeError.set(null);
    try {
      const [licencias, empleados] = await Promise.all([
        this.licenciasService.listar(),
        this.empleadosService.listar(),
      ]);
      this.empleados.set(empleados);
      this.filas.set(licencias.map((licencia) => this.toGridRow(licencia)));
      this.evaluarAlertaPendientes(opciones?.silenciarAlertaPendientes === true);
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'cargar licencias médicas'));
    } finally {
      this.loading.set(false);
    }
  }

  revisarPendientesDesdeAlerta(): void {
    this.cerrarAlertaPendientes();
    this.filtrarPendientes();
  }

  cerrarAlertaPendientes(): void {
    this.alertaPendientesVisible.set(false);
  }

  private evaluarAlertaPendientes(silenciar: boolean): void {
    if (silenciar || this.alertaPendientesMostrada || this.pendientesCount() === 0) {
      return;
    }
    this.alertaPendientesVisible.set(true);
    this.alertaPendientesMostrada = true;
  }

  filtrarPendientes(): void {
    const grid = this.grid;
    if (grid) {
      const values = {
        ...grid.filterValues,
        estado: 'pendiente_revision',
      };
      grid.filterValues = values;
      grid.draftFilterValues = { ...values };
      grid.showFilters = true;
      grid.currentPage = 1;
      grid.pageInput = '1';
    }

    const primera = this.filas().find((f) => f.estado === 'pendiente_revision');
    if (primera) {
      void this.abrirRevision(primera);
    }
  }

  async abrirRegistroManual(): Promise<void> {
    this.guardando.set(true);
    try {
      const creada = await this.licenciasService.guardar({
        origen: 'manual',
        estado: 'pendiente_revision',
      });
      await this.cargar();
      await this.abrirRevision(creada);
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'registrar la licencia'));
    } finally {
      this.guardando.set(false);
    }
  }

  async abrirRevision(row: LicenciaGridRow | LicenciaMedica): Promise<void> {
    const licencia = await this.licenciasService.obtener(row.idLicencia);
    if (!licencia) {
      this.mensajeError.set('No se encontró la licencia seleccionada.');
      return;
    }
    this.licenciaSeleccionada.set(licencia);
    if (licencia.idIngreso) {
      this.ingresoSeleccionado.set(await this.licenciasRepository.obtenerIngreso(licencia.idIngreso));
    } else {
      this.ingresoSeleccionado.set(null);
    }
  }

  cerrarRevision(): void {
    this.licenciaSeleccionada.set(null);
    this.ingresoSeleccionado.set(null);
  }

  async guardarBorradorDrawer(): Promise<void> {
    const licencia = this.licenciaSeleccionada();
    if (licencia && !licenciaMedicaPermiteEdicion(licencia.estado)) {
      this.mensajeError.set('Esta licencia está cerrada y no admite cambios.');
      return;
    }
    const payload = this.drawer?.payload();
    if (!payload) {
      return;
    }
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.orquestador.guardarBorrador(payload);
      this.mensajeExito.set('Borrador guardado.');
      this.cerrarRevision();
      await this.cargar();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'guardar el borrador'));
    } finally {
      this.guardando.set(false);
    }
  }

  async confirmarDrawer(): Promise<void> {
    const licencia = this.licenciaSeleccionada();
    if (licencia && !licenciaMedicaPermiteEdicion(licencia.estado)) {
      this.mensajeError.set('Esta licencia ya está cerrada y no puede vincularse nuevamente.');
      return;
    }
    const payload = this.drawer?.payload();
    if (!payload) {
      return;
    }
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      const resultado = await this.orquestador.confirmarYVincularNomina(payload);
      this.mensajeExito.set(
        `Licencia vinculada. Se crearon ${resultado.novedadesCreadas} movimiento(s) del mes.`,
      );
      this.cerrarRevision();
      await this.cargar();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'confirmar la licencia'));
    } finally {
      this.guardando.set(false);
    }
  }

  async rechazarDrawer(): Promise<void> {
    const licencia = this.licenciaSeleccionada();
    if (licencia && !licenciaMedicaPermiteEdicion(licencia.estado)) {
      this.mensajeError.set('Esta licencia está cerrada y no puede rechazarse nuevamente.');
      return;
    }
    const payload = this.drawer?.payload();
    if (!payload?.idLicencia) {
      return;
    }
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.licenciasService.rechazar(payload.idLicencia, payload.observacion);
      this.mensajeExito.set('Licencia rechazada.');
      this.cerrarRevision();
      await this.cargar();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'rechazar la licencia'));
    } finally {
      this.guardando.set(false);
    }
  }

  onRowOpen(row: LicenciaGridRow): void {
    void this.abrirRevision(row);
  }

  private toGridRow(licencia: LicenciaMedica): LicenciaGridRow {
    const busqueda = [licencia.folio, licencia.nombreTrabajador, licencia.rutTrabajador]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return {
      ...licencia,
      busqueda,
      filtroEstado: licencia.estado,
    };
  }
}
