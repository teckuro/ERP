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
import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import type {
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
import { PreviredExportService } from '../../services/previred-export.service';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import { SeleccionNominaExportableModalComponent } from '../../../remuneraciones-salidas/components/seleccion-nomina-exportable-modal/seleccion-nomina-exportable-modal.component';
import {
  PERSISTENCIA_SELECCION_NOMINA_PREVIRED,
  construirContextoOrigenSalidaExterna,
  etiquetaNominaActivaSalidaExport,
  rutaLiquidacionesNomina,
} from '../../../remuneraciones-salidas/presenters/salida-externa-layout.presenter';
import { construirEmptySalidaExterna } from '../../../remuneraciones-salidas/rules/salida-externa-vacio.rules';

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
  readonly ultimaExportacion = signal<PreviredExportacionRegistro | null>(null);
  readonly cargandoNominas = signal(false);
  readonly cargandoBorrador = signal(false);
  readonly registrandoDescarga = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly feedbackDescarga = signal<string | null>(null);
  readonly modalNominaAbierto = signal(false);
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
  readonly puedeDescargarArchivo = computed(() => puedeDescargarArchivoOficialPrevired(this.borrador()));

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

  readonly seccionesAdvertencia = computed((): MessageBoxSection[] => {
    const borrador = this.borrador();
    if (!borrador?.advertencias.length) return [];

    return borrador.advertencias.map((advertencia) => ({
      title: advertencia.nivel === 'bloqueo' ? 'No se puede exportar' : 'Revisar antes de exportar',
      tone: advertencia.nivel === 'bloqueo' ? 'danger' : 'attention',
      items: [advertencia.mensaje],
    }));
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
        const archivo = this.puedeDescargarArchivo();
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
                  label: this.borrador()!.listoParaEnvio
                    ? 'Listo para envío'
                    : `${this.borrador()!.lineas.length} línea(s)`,
                  tone: this.borrador()!.listoParaEnvio
                    ? 'success'
                    : csv
                      ? 'warning'
                      : 'danger',
                }
              : this.nominasExportables().length === 0
                ? { label: this.emptyVm().chipLabel, tone: 'neutral' }
                : { label: 'Sin nómina', tone: 'neutral' },
          primaryAction: archivo
            ? {
                label: 'Descargar archivo Previred',
                actionId: 'previred:descargar-archivo',
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
          if (this.puedeDescargarArchivo()) {
            void this.descargarArchivoOficial();
            return;
          }
          void this.descargarBorradorCsv();
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
    await this.ejecutarDescarga(borrador, 'csv_borrador', () => descargarCsvPrevired(borrador));
  }

  async descargarArchivoOficial(): Promise<void> {
    const borrador = this.borrador();
    if (!borrador || !this.puedeDescargarArchivo()) return;
    await this.ejecutarDescarga(borrador, 'archivo_oficial_rem_v1', () => {
      descargarArchivoOficialPrevired(borrador);
    });
  }

  private async ejecutarDescarga(
    borrador: PreviredBorradorExport,
    canal: 'csv_borrador' | 'archivo_oficial_rem_v1',
    descargar: () => void,
  ): Promise<void> {
    this.registrandoDescarga.set(true);
    this.feedbackDescarga.set(null);
    try {
      const registro = await this.service.registrarDescarga(borrador, canal);
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
      this.avisoFaseBd.set(
        resultado.fasePreviredDesplegada
          ? null
          : 'La fase Previred aún no está desplegada en el servidor (catálogo y auditoría). Ejecute las migraciones Supabase PREVIRED-01b. Mientras tanto, el borrador usa mapeo provisional desde códigos LRE y no registrará exportaciones.',
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
