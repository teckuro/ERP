import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  MessageBoxSection,
  MessageBoxVariantInput,
} from '../../../../shared/components/ui/feedback/message-box/message-box.types';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import type {
  PreviredArchivo105Resumen,
  PreviredBorradorExport,
  PreviredExportacionRegistro,
} from '../../models/previred-export.model';
import {
  COLUMNAS_PREVIRED_EXPORT,
  PERSISTENCIA_GRILLA_PREVIRED_EXPORT,
  formatearFechaExportacionPrevired,
} from '../../presenters/previred-export.presenter';
import {
  descargarArchivoOficialPrevired,
  puedeDescargarArchivoOficialPrevired,
} from '../../rules/previred-archivo-oficial.rules';
import {
  descargarCsvPrevired,
  puedeDescargarBorradorPrevired,
} from '../../rules/previred-export.rules';
import {
  PreviredExportService,
  descargarArchivo105Previred,
  puedeDescargarArchivo105Previred,
} from '../../services/previred-export.service';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import { SeleccionNominaExportableModalComponent } from '../../../remuneraciones-salidas/components/seleccion-nomina-exportable-modal/seleccion-nomina-exportable-modal.component';
import {
  PERSISTENCIA_SELECCION_NOMINA_PREVIRED,
  construirContextoOrigenSalidaExterna,
  etiquetaNominaActivaSalidaExport,
  rutaLiquidacionesNomina,
} from '../../../remuneraciones-salidas/presenters/salida-externa-layout.presenter';
import { construirEmptySalidaExterna } from '../../../remuneraciones-salidas/rules/salida-externa-vacio.rules';

type PreviredAlertaInlineActionId = 'nomina' | 'advertencias' | 'none';
type PreviredAlertaInlineDismissId = 'feedback' | 'none';
type PreviredDescargaPendiente = 'archivo_105' | 'csv' | 'archivo_rem';

interface PreviredAlertaInlineVm {
  variant: MessageBoxVariantInput;
  title: string;
  message: string;
  primaryLabel?: string;
  actionId: PreviredAlertaInlineActionId;
  dismissible?: boolean;
  dismissId?: PreviredAlertaInlineDismissId;
}

@Component({
  selector: 'app-previred-export-container',
  standalone: true,
  host: { class: 'sal-ext-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    DataGridComponent,
    SeleccionNominaExportableModalComponent,
  ],
  templateUrl: './previred-export-container.html',
  styleUrls: [
    './previred-export-container.css',
    '../../../remuneraciones-salidas/remuneraciones-salida-layout.css',
  ],
})
export class PreviredExportContainer {
  private readonly service = inject(PreviredExportService);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  readonly nominasExportables = signal<readonly NominaPeriodoResumen[]>([]);
  readonly nominaSeleccionadaId = signal<string | null>(null);
  readonly borrador = signal<PreviredBorradorExport | null>(null);
  readonly archivo105 = signal<PreviredArchivo105Resumen | null>(null);
  readonly ultimaExportacion = signal<PreviredExportacionRegistro | null>(null);
  readonly cargandoNominas = signal(false);
  readonly cargandoBorrador = signal(false);
  readonly registrandoDescarga = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly feedbackDescarga = signal<string | null>(null);
  readonly modalNominaAbierto = signal(false);
  readonly modalAdvertenciasAbierto = signal(false);
  readonly modalMovimientosAbierto = signal(false);
  readonly modalConfirmarDescargaAbierto = signal(false);
  readonly descargaPendiente = signal<PreviredDescargaPendiente | null>(null);
  readonly avisoFaseBd = signal<string | null>(null);
  readonly avisoNominaQuery = signal<string | null>(null);

  readonly columnas = COLUMNAS_PREVIRED_EXPORT;
  readonly persistenciaGrilla = PERSISTENCIA_GRILLA_PREVIRED_EXPORT;
  readonly persistenciaSeleccionNomina = PERSISTENCIA_SELECCION_NOMINA_PREVIRED;
  readonly formatearFechaExportacionPrevired = formatearFechaExportacionPrevired;

  readonly nominaPeriodoIdQuery = computed(() => {
    const params = this.queryParams() as Record<string, unknown>;
    const id = params['nominaPeriodoId'];
    return typeof id === 'string' && id.trim() ? id.trim() : null;
  });

  readonly etiquetaNominaActiva = computed(() =>
    etiquetaNominaActivaSalidaExport(this.nominasExportables(), this.nominaSeleccionadaId()),
  );

  readonly nominasParaModal = computed(() => [...this.nominasExportables()]);

  readonly nominaActiva = computed(() => {
    const id = this.nominaSeleccionadaId();
    if (!id) return null;
    return this.nominasExportables().find((n) => n.id === id) ?? null;
  });

  readonly contextoOrigen = computed(() => {
    const borrador = this.borrador();
    if (!borrador) return null;
    return construirContextoOrigenSalidaExterna({
      borrador: {
        periodo: borrador.periodo,
        empresaNombre: borrador.empresaNombre,
        versionLiquidacion: borrador.versionLiquidacion,
        totalTrabajadores: borrador.totalTrabajadores,
        lineasCount: borrador.lineas.length,
      },
      nomina: this.nominaActiva(),
    });
  });

  readonly rutaLiquidaciones = computed(() =>
    rutaLiquidacionesNomina(this.nominaSeleccionadaId()),
  );

  readonly puedeDescargarCsv = computed(() => puedeDescargarBorradorPrevired(this.borrador()));
  readonly puedeDescargarArchivo105 = computed(() =>
    puedeDescargarArchivo105Previred(this.archivo105()),
  );
  readonly puedeDescargarArchivoRem = computed(() =>
    puedeDescargarArchivoOficialPrevired(this.borrador()),
  );

  readonly cargaInicial = computed(
    () => this.cargandoNominas() || (this.cargandoBorrador() && !this.borrador()),
  );
  readonly cargaBorradorOverlay = computed(
    () => this.cargandoBorrador() && !!this.borrador(),
  );

  readonly emptyVm = computed(() => construirEmptySalidaExterna('previred'));

  readonly mostrarToolbar = computed(
    () => !this.cargaInicial() && !this.errorCarga() && this.nominasExportables().length > 0,
  );

  readonly advertenciasConsolidadas = computed(() => {
    const borrador = this.borrador();
    const archivo = this.archivo105();
    return [...(borrador?.advertencias ?? []), ...(archivo?.advertencias ?? [])];
  });

  readonly totalAdvertencias = computed(() => this.advertenciasConsolidadas().length);

  readonly tieneBloqueoExportacion = computed(() =>
    this.advertenciasConsolidadas().some((advertencia) => advertencia.nivel === 'bloqueo'),
  );

  readonly seccionesAdvertencia = computed((): MessageBoxSection[] => {
    const advertencias = this.advertenciasConsolidadas();
    if (!advertencias.length) return [];

    return advertencias.map((advertencia) => ({
      title: advertencia.nivel === 'bloqueo' ? 'Bloqueo' : 'Revisión',
      tone: advertencia.nivel === 'bloqueo' ? 'danger' : 'attention',
      items: [advertencia.mensaje],
    }));
  });

  readonly origenNotaOperativa = computed(() => {
    const origen = this.contextoOrigen();
    if (this.ultimaExportacion()) return null;
    return origen?.nota ?? null;
  });

  readonly alertaInline = computed((): PreviredAlertaInlineVm | null => {
    const query = this.avisoNominaQuery();
    if (query) {
      return {
        variant: 'info',
        title: 'Nómina no disponible',
        message: query,
        primaryLabel: 'Buscar nómina',
        actionId: 'nomina',
      };
    }

    const fase = this.avisoFaseBd();
    if (fase) {
      return {
        variant: 'warning',
        title: 'Exportación en borrador',
        message: fase,
        primaryLabel: 'Ver advertencias',
        actionId: 'advertencias',
      };
    }

    const feedback = this.feedbackDescarga();
    if (feedback) {
      return {
        variant: 'warning',
        title: 'Descarga con advertencia',
        message: feedback,
        dismissible: true,
        dismissId: 'feedback',
        actionId: 'none',
      };
    }

    const total = this.totalAdvertencias();
    if (total === 0) return null;

    if (this.tieneBloqueoExportacion()) {
      return {
        variant: 'blocked',
        title: 'Exportación bloqueada',
        message: `${total} punto(s) impiden descargar el archivo. Revise el detalle antes de continuar.`,
        primaryLabel: 'Ver advertencias',
        actionId: 'advertencias',
      };
    }

    return {
      variant: 'warning',
      title: 'Revisar antes de exportar',
      message: `${total} punto(s) requieren revisión administrativa. Puede descargar igual, pero conviene revisarlos.`,
      primaryLabel: 'Ver advertencias',
      actionId: 'advertencias',
    };
  });

  readonly mensajeModalAdvertencias = computed(() => {
    const total = this.totalAdvertencias();
    if (this.tieneBloqueoExportacion()) {
      return `${total} punto(s) bloquean la exportación hasta corregir o completar datos.`;
    }
    return `${total} punto(s) para revisar antes o después de descargar el archivo.`;
  });

  readonly mensajeConfirmarDescarga = computed(() => {
    const pendiente = this.descargaPendiente();
    if (pendiente === 'archivo_105') {
      return 'Se descargará el archivo oficial de 105 campos para subir al portal Previred.';
    }
    if (pendiente === 'archivo_rem') {
      return 'Se descargará el archivo interno REM del borrador.';
    }
    return 'Se descargará el CSV de borrador para revisión interna.';
  });

  readonly seccionesConfirmarDescarga = computed((): MessageBoxSection[] => {
    const borrador = this.borrador();
    const archivo = this.archivo105();
    if (!borrador) return [];

    const items = [
      `${borrador.totalTrabajadores} trabajador(es) · ${borrador.lineas.length} movimiento(s)`,
    ];
    if (this.descargaPendiente() === 'archivo_105' && archivo) {
      items.push(`${archivo.totalTrabajadores} registro(s) en formato 105 posiciones`);
    }
    if (this.totalAdvertencias() > 0) {
      items.push(`${this.totalAdvertencias()} advertencia(s) registradas en el borrador`);
    }

    return [{ title: 'Resumen', tone: 'neutral', items }];
  });

  readonly resumenBorrador = computed(() => {
    const borrador = this.borrador();
    if (!borrador) return null;
    return {
      lineas: borrador.lineas.length,
      trabajadores: borrador.totalTrabajadores,
      omitidas: borrador.lineasOmitidas,
      sinCodigo: borrador.conceptosSinCodigo,
      sinMapeo: borrador.conceptosSinMapeoCatalogo,
      listoParaEnvio: borrador.listoParaEnvio,
      version: borrador.versionLiquidacion,
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    bindShellPageContext(
      destroyRef,
      () => {
        const archivo105 = this.puedeDescargarArchivo105();
        const archivoRem = this.puedeDescargarArchivoRem();
        const csv = this.puedeDescargarCsv();
        return {
          breadcrumbs: [
            { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
            { label: 'Previred' },
          ],
          statusChip: this.cargandoBorrador()
            ? { label: 'Cargando…', tone: 'neutral' }
            : this.borrador()
              ? {
                  label: archivo105
                    ? 'Listo para Previred'
                    : this.borrador()!.listoParaEnvio
                      ? 'Listo para envío'
                      : `${this.borrador()!.lineas.length} línea(s)`,
                  tone: archivo105
                    ? 'success'
                    : this.borrador()!.listoParaEnvio
                      ? 'success'
                      : csv
                        ? 'warning'
                        : 'danger',
                }
              : this.nominasExportables().length === 0
                ? { label: this.emptyVm().chipLabel, tone: 'neutral' }
                : { label: 'Sin nómina', tone: 'neutral' },
          primaryAction: archivo105
            ? {
                label: 'Descargar archivo Previred (105 campos)',
                actionId: 'previred:descargar-archivo-105',
                disabled: this.cargandoBorrador() || this.registrandoDescarga(),
                loading: this.registrandoDescarga(),
              }
            : archivoRem
              ? {
                  label: 'Descargar archivo interno REM',
                  actionId: 'previred:descargar-archivo-rem',
                  disabled: this.cargandoBorrador() || this.registrandoDescarga(),
                  loading: this.registrandoDescarga(),
                }
              : csv
                ? {
                    label: 'Descargar CSV',
                    actionId: 'previred:descargar-csv',
                    disabled: this.cargandoBorrador() || this.registrandoDescarga(),
                    loading: this.registrandoDescarga(),
                  }
                : undefined,
        };
      },
      {
        onPrimaryAction: () => {
          if (this.puedeDescargarArchivo105()) {
            this.solicitarDescargaArchivo105();
            return;
          }
          if (this.puedeDescargarArchivoRem()) {
            this.solicitarDescargaArchivoRem();
            return;
          }
          this.solicitarDescargaCsv();
        },
      },
    );

    void this.cargarNominas();
  }

  abrirModalNomina(): void {
    this.modalNominaAbierto.set(true);
  }

  cerrarModalNomina(): void {
    this.modalNominaAbierto.set(false);
  }

  abrirModalAdvertencias(): void {
    this.modalAdvertenciasAbierto.set(true);
  }

  cerrarModalAdvertencias(): void {
    this.modalAdvertenciasAbierto.set(false);
  }

  abrirModalMovimientos(): void {
    this.modalMovimientosAbierto.set(true);
  }

  cerrarModalMovimientos(): void {
    this.modalMovimientosAbierto.set(false);
  }

  cerrarModalConfirmarDescarga(): void {
    this.modalConfirmarDescargaAbierto.set(false);
    this.descargaPendiente.set(null);
  }

  onAlertaInlineAction(actionId: PreviredAlertaInlineActionId): void {
    if (actionId === 'nomina') {
      this.abrirModalNomina();
      return;
    }
    if (actionId === 'advertencias') {
      this.abrirModalAdvertencias();
    }
  }

  onAlertaInlineDismiss(dismissId?: PreviredAlertaInlineDismissId): void {
    if (dismissId === 'feedback') {
      this.feedbackDescarga.set(null);
    }
  }

  solicitarDescargaCsv(): void {
    if (!this.puedeDescargarCsv()) return;
    if (this.debeConfirmarDescarga()) {
      this.descargaPendiente.set('csv');
      this.modalConfirmarDescargaAbierto.set(true);
      return;
    }
    void this.descargarBorradorCsv();
  }

  solicitarDescargaArchivo105(): void {
    if (!this.puedeDescargarArchivo105()) return;
    if (this.debeConfirmarDescarga()) {
      this.descargaPendiente.set('archivo_105');
      this.modalConfirmarDescargaAbierto.set(true);
      return;
    }
    void this.descargarArchivo105();
  }

  solicitarDescargaArchivoRem(): void {
    if (!this.puedeDescargarArchivoRem()) return;
    if (this.debeConfirmarDescarga()) {
      this.descargaPendiente.set('archivo_rem');
      this.modalConfirmarDescargaAbierto.set(true);
      return;
    }
    void this.descargarArchivoOficial();
  }

  confirmarDescargaPendiente(): void {
    const pendiente = this.descargaPendiente();
    this.cerrarModalConfirmarDescarga();
    if (pendiente === 'archivo_105') {
      void this.descargarArchivo105();
      return;
    }
    if (pendiente === 'archivo_rem') {
      void this.descargarArchivoOficial();
      return;
    }
    if (pendiente === 'csv') {
      void this.descargarBorradorCsv();
    }
  }

  private debeConfirmarDescarga(): boolean {
    return this.totalAdvertencias() > 0 && !this.tieneBloqueoExportacion();
  }

  onNominaSeleccionadaEnModal(nomina: NominaPeriodoResumen): void {
    this.modalNominaAbierto.set(false);
    if (nomina.id !== this.nominaSeleccionadaId()) {
      void this.onNominaChange(nomina.id);
    }
  }

  async cargarNominas(): Promise<void> {
    this.cargandoNominas.set(true);
    this.errorCarga.set(null);
    try {
      const nominas = await this.service.listarNominasExportables();
      this.nominasExportables.set(nominas);
      const queryId = this.nominaPeriodoIdQuery();
      if (queryId) {
        const nominaQuery = nominas.find((n) => n.id === queryId);
        if (nominaQuery) {
          this.avisoNominaQuery.set(null);
          this.nominaSeleccionadaId.set(queryId);
          await this.cargarBorrador(queryId);
        } else {
          this.avisoNominaQuery.set(
            'La nómina indicada no está disponible para exportación Previred. Seleccione otra desde el listado.',
          );
          this.modalNominaAbierto.set(true);
        }
        return;
      }
      if (nominas.length > 0 && !this.nominaSeleccionadaId()) {
        this.nominaSeleccionadaId.set(nominas[0].id);
        await this.cargarBorrador(nominas[0].id);
      }
    } catch (error) {
      this.errorCarga.set(
        mensajeErrorSupabaseParaUsuario(error, 'cargar las nóminas exportables'),
      );
    } finally {
      this.cargandoNominas.set(false);
    }
  }

  async onNominaChange(id: string): Promise<void> {
    this.nominaSeleccionadaId.set(id);
    this.feedbackDescarga.set(null);
    this.avisoNominaQuery.set(null);
    await this.cargarBorrador(id);
  }

  reintentarCarga(): void {
    const id = this.nominaSeleccionadaId();
    if (id && this.nominasExportables().length > 0) {
      void this.cargarBorrador(id);
      return;
    }
    void this.cargarNominas();
  }

  async recargarBorrador(): Promise<void> {
    const id = this.nominaSeleccionadaId();
    if (!id) return;
    this.feedbackDescarga.set(null);
    await this.cargarBorrador(id, { preserveBorrador: true });
  }

  async descargarBorradorCsv(): Promise<void> {
    const borrador = this.borrador();
    if (!borrador || !this.puedeDescargarCsv()) return;
    await this.ejecutarDescarga(borrador, 'csv_borrador', null, () => descargarCsvPrevired(borrador));
  }

  async descargarArchivo105(): Promise<void> {
    const borrador = this.borrador();
    const archivo = this.archivo105();
    if (!borrador || !archivo || !this.puedeDescargarArchivo105()) return;
    await this.ejecutarDescarga(borrador, 'archivo_oficial_105_posicion', archivo, () => {
      descargarArchivo105Previred(archivo);
    });
  }

  async descargarArchivoOficial(): Promise<void> {
    const borrador = this.borrador();
    if (!borrador || !this.puedeDescargarArchivoRem()) return;
    await this.ejecutarDescarga(borrador, 'archivo_oficial_rem_v1', null, () => {
      descargarArchivoOficialPrevired(borrador);
    });
  }

  private async ejecutarDescarga(
    borrador: PreviredBorradorExport,
    canal: 'csv_borrador' | 'archivo_oficial_rem_v1' | 'archivo_oficial_105_posicion',
    archivo105: PreviredArchivo105Resumen | null,
    descargar: () => void,
  ): Promise<void> {
    this.registrandoDescarga.set(true);
    this.feedbackDescarga.set(null);
    try {
      const registro = await this.service.registrarDescarga(borrador, canal, { archivo105 });
      this.ultimaExportacion.set(registro);
      descargar();
    } catch {
      this.feedbackDescarga.set(
        'El archivo se descargó, pero no se pudo registrar la exportación en el servidor. Revise la conexión o despliegue de la fase.',
      );
      descargar();
    } finally {
      this.registrandoDescarga.set(false);
    }
  }

  private async cargarBorrador(
    nominaPeriodoId: string,
    opts?: { preserveBorrador?: boolean },
  ): Promise<void> {
    this.cargandoBorrador.set(true);
    this.errorCarga.set(null);
    if (!opts?.preserveBorrador) {
      this.borrador.set(null);
      this.archivo105.set(null);
      this.ultimaExportacion.set(null);
    }
    try {
      const resultado = await this.service.construirBorradorDesdeNomina(nominaPeriodoId);
      if (!resultado) {
        this.avisoFaseBd.set(null);
        this.errorCarga.set(
          'No hay liquidación oficial disponible para la nómina seleccionada. Genere liquidaciones antes de exportar.',
        );
        return;
      }
      this.borrador.set(resultado.borrador);
      this.archivo105.set(resultado.archivo105);
      this.avisoFaseBd.set(
        resultado.fasePreviredDesplegada
          ? null
          : 'El registro formal de exportaciones aún no está disponible en este entorno. Puede revisar el borrador con mapeo provisional desde liquidación; las exportaciones no quedarán registradas hasta completar la fase.',
      );
      const exportacion = await this.service.obtenerUltimaExportacion(
        resultado.borrador.idLiquidacionPeriodo,
      );
      this.ultimaExportacion.set(exportacion.registro);
    } catch (error) {
      this.errorCarga.set(
        mensajeErrorSupabaseParaUsuario(error, 'preparar el borrador Previred'),
      );
    } finally {
      this.cargandoBorrador.set(false);
    }
  }
}
