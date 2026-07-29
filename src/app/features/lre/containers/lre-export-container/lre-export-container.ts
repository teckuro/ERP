import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type {
  MessageBoxSection,
  MessageBoxVariantInput,
} from '../../../../shared/components/ui/feedback/message-box/message-box.types';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import type {
  LreBorradorExport,
  LreCanalExportacion,
  LreExportacionRegistro,
} from '../../models/lre-export.model';
import {
  COLUMNAS_LRE_EXPORT,
  PERSISTENCIA_GRILLA_LRE_EXPORT,
  formatearFechaExportacionLre,
} from '../../presenters/lre-export.presenter';
import { descargarCsvLre, puedeDescargarLre } from '../../rules/lre-export.rules';
import { descargarFormatoOficialLre } from '../../rules/lre-formato-oficial.rules';
import { LreExportService } from '../../services/lre-export.service';
import { SeleccionNominaExportableModalComponent } from '../../../remuneraciones-salidas/components/seleccion-nomina-exportable-modal/seleccion-nomina-exportable-modal.component';
import {
  PERSISTENCIA_SELECCION_NOMINA_LRE,
  construirContextoOrigenSalidaExterna,
  etiquetaNominaActivaSalidaExport,
  rutaLiquidacionesNomina,
} from '../../../remuneraciones-salidas/presenters/salida-externa-layout.presenter';
import { construirEmptySalidaExterna } from '../../../remuneraciones-salidas/rules/salida-externa-vacio.rules';

type LreAlertaInlineActionId = 'nomina' | 'advertencias' | 'conceptos' | 'none';
type LreAlertaInlineDismissId = 'feedback' | 'none';
type LreDescargaPendiente = 'csv' | 'formato_oficial';

interface LreAlertaInlineVm {
  variant: MessageBoxVariantInput;
  title: string;
  message: string;
  primaryLabel?: string;
  actionId: LreAlertaInlineActionId;
  dismissible?: boolean;
  dismissId?: LreAlertaInlineDismissId;
}

@Component({
  selector: 'app-lre-export-container',
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
  templateUrl: './lre-export-container.html',
  styleUrls: [
    './lre-export-container.css',
    '../../../remuneraciones-salidas/remuneraciones-salida-layout.css',
  ],
})
export class LreExportContainer {
  private readonly service = inject(LreExportService);
  private readonly router = inject(Router);

  readonly nominas = signal<readonly NominaPeriodoResumen[]>([]);
  readonly nominaId = signal<string | null>(null);
  readonly borrador = signal<LreBorradorExport | null>(null);
  readonly ultimaExportacion = signal<LreExportacionRegistro | null>(null);
  readonly cargandoNominas = signal(false);
  readonly cargandoBorrador = signal(false);
  readonly registrandoDescarga = signal(false);
  readonly feedbackDescarga = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly modalNominaAbierto = signal(false);
  readonly modalAdvertenciasAbierto = signal(false);
  readonly modalLineasAbierto = signal(false);
  readonly modalConfirmarDescargaAbierto = signal(false);
  readonly descargaPendiente = signal<LreDescargaPendiente | null>(null);

  readonly columnas = COLUMNAS_LRE_EXPORT;
  readonly persistenciaGrilla = PERSISTENCIA_GRILLA_LRE_EXPORT;
  readonly persistenciaSeleccionNomina = PERSISTENCIA_SELECCION_NOMINA_LRE;
  readonly formatearFechaExportacionLre = formatearFechaExportacionLre;

  readonly etiquetaNominaActiva = computed(() =>
    etiquetaNominaActivaSalidaExport(this.nominas(), this.nominaId()),
  );

  readonly nominasParaModal = computed(() => [...this.nominas()]);

  readonly nominaActiva = computed(() => {
    const id = this.nominaId();
    if (!id) return null;
    return this.nominas().find((n) => n.id === id) ?? null;
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

  readonly rutaLiquidaciones = computed(() => rutaLiquidacionesNomina(this.nominaId()));

  readonly puedeDescargar = computed(() => puedeDescargarLre(this.borrador()));

  readonly puedeDescargarDt = computed(() => {
    const b = this.borrador();
    return !!b && b.listoParaEnvio && puedeDescargarLre(b);
  });

  readonly cargaInicial = computed(
    () => this.cargandoNominas() || (this.cargandoBorrador() && !this.borrador()),
  );
  readonly cargaBorradorOverlay = computed(
    () => this.cargandoBorrador() && !!this.borrador(),
  );

  readonly emptyVm = computed(() => construirEmptySalidaExterna('lre'));

  readonly mostrarToolbar = computed(
    () => !this.cargaInicial() && !this.error() && this.nominas().length > 0,
  );

  readonly origenNotaOperativa = computed(() => {
    if (this.ultimaExportacion()) return null;
    return this.contextoOrigen()?.nota ?? null;
  });

  readonly alertaInline = computed((): LreAlertaInlineVm | null => {
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

    const borrador = this.borrador();
    if (!borrador || borrador.conceptosSinCodigoLre <= 0) return null;

    return {
      variant: 'warning',
      title: 'Pendiente de revisión',
      message: `${borrador.conceptosSinCodigoLre} concepto(s) sin código LRE no entran en el archivo. Complete el catálogo antes del envío a Mi DT.`,
      primaryLabel: 'Revisar conceptos',
      actionId: 'advertencias',
    };
  });

  readonly mensajeModalAdvertencias = computed(() => {
    const n = this.borrador()?.conceptosSinCodigoLre ?? 0;
    return `${n} concepto(s) de la liquidación no tienen código LRE. No se incluyen en la descarga hasta completar el catálogo.`;
  });

  readonly seccionesAdvertencia = computed((): MessageBoxSection[] => {
    const n = this.borrador()?.conceptosSinCodigoLre ?? 0;
    if (n <= 0) return [];
    return [
      {
        title: 'Acción recomendada',
        tone: 'attention',
        items: [
          'Abra Conceptos de remuneración y asigne el código LRE a cada concepto usado en la nómina.',
          'Regenere liquidaciones si el código no aparece en el borrador tras corregir el catálogo.',
        ],
      },
    ];
  });

  readonly mensajeConfirmarDescarga = computed(() => {
    if (this.descargaPendiente() === 'formato_oficial') {
      return 'Se descargará el CSV oficial (una fila por trabajador) para cargar en Mi DT. El envío al portal sigue siendo manual.';
    }
    return 'Se descargará el CSV de borrador para revisión interna.';
  });

  readonly seccionesConfirmarDescarga = computed((): MessageBoxSection[] => {
    const borrador = this.borrador();
    if (!borrador) return [];
    const items = [
      `${borrador.totalTrabajadores} trabajador(es) · ${borrador.lineas.length} línea(s)`,
    ];
    if (borrador.conceptosSinCodigoLre > 0) {
      items.push(`${borrador.conceptosSinCodigoLre} concepto(s) sin código quedan fuera del archivo`);
    }
    return [{ title: 'Resumen', tone: 'neutral', items }];
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    bindShellPageContext(
      destroyRef,
      () => {
        const borrador = this.borrador();
        return {
          breadcrumbs: [
            { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
            { label: 'Libro de remuneraciones' },
          ],
          statusChip: this.cargandoBorrador()
            ? { label: 'Cargando…', tone: 'neutral' }
            : borrador
              ? {
                  label: borrador.listoParaEnvio
                    ? 'Listo para envío'
                    : borrador.conceptosSinCodigoLre > 0
                      ? 'Pendiente de revisión'
                      : `${borrador.lineas.length} línea(s)`,
                  tone: borrador.listoParaEnvio
                    ? 'success'
                    : this.puedeDescargar()
                      ? 'warning'
                      : 'danger',
                }
              : this.nominas().length === 0
                ? { label: this.emptyVm().chipLabel, tone: 'neutral' }
                : { label: 'Sin nómina', tone: 'neutral' },
          primaryAction: this.puedeDescargarDt()
            ? {
                label: 'Descargar para envío DT',
                actionId: 'lre:descargar-oficial',
                disabled: this.cargandoBorrador() || this.registrandoDescarga(),
                loading: this.registrandoDescarga(),
              }
            : this.puedeDescargar()
              ? {
                  label: 'Descargar borrador',
                  actionId: 'lre:descargar-csv',
                  disabled: this.cargandoBorrador() || this.registrandoDescarga(),
                  loading: this.registrandoDescarga(),
                }
              : undefined,
        };
      },
      {
        onPrimaryAction: () => {
          if (this.puedeDescargarDt()) {
            this.solicitarDescargaOficial();
            return;
          }
          this.solicitarDescargaCsv();
        },
      },
    );

    void this.cargarNominas();
  }

  etiquetaCanal(canal: LreCanalExportacion): string {
    if (canal === 'formato_oficial_dt') return 'Oficial DT';
    if (canal === 'formato_dt_v1') return 'Formato DT';
    return 'CSV borrador';
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

  abrirModalLineas(): void {
    this.modalLineasAbierto.set(true);
  }

  cerrarModalLineas(): void {
    this.modalLineasAbierto.set(false);
  }

  cerrarModalConfirmarDescarga(): void {
    this.modalConfirmarDescargaAbierto.set(false);
    this.descargaPendiente.set(null);
  }

  onAlertaInlineAction(actionId: LreAlertaInlineActionId): void {
    if (actionId === 'nomina') {
      this.abrirModalNomina();
      return;
    }
    if (actionId === 'advertencias') {
      this.abrirModalAdvertencias();
      return;
    }
    if (actionId === 'conceptos') {
      this.irAConceptos();
    }
  }

  onAlertaInlineDismiss(dismissId?: LreAlertaInlineDismissId): void {
    if (dismissId === 'feedback') {
      this.feedbackDescarga.set(null);
    }
  }

  irAConceptos(): void {
    this.cerrarModalAdvertencias();
    void this.router.navigateByUrl('/remuneraciones/conceptos');
  }

  solicitarDescargaCsv(): void {
    if (!this.puedeDescargar()) return;
    this.descargaPendiente.set('csv');
    this.modalConfirmarDescargaAbierto.set(true);
  }

  solicitarDescargaOficial(): void {
    if (!this.puedeDescargarDt()) return;
    this.descargaPendiente.set('formato_oficial');
    this.modalConfirmarDescargaAbierto.set(true);
  }

  confirmarDescargaPendiente(): void {
    const pendiente = this.descargaPendiente();
    this.cerrarModalConfirmarDescarga();
    if (pendiente === 'formato_oficial') {
      void this.descargarFormatoOficial();
      return;
    }
    if (pendiente === 'csv') {
      void this.descargarCsv();
    }
  }

  onNominaSeleccionadaEnModal(nomina: NominaPeriodoResumen): void {
    this.modalNominaAbierto.set(false);
    if (nomina.id !== this.nominaId()) {
      void this.onNominaChange(nomina.id);
    }
  }

  async cargarNominas(): Promise<void> {
    this.cargandoNominas.set(true);
    this.error.set(null);
    try {
      const nominas = await this.service.listarNominasExportables();
      this.nominas.set(nominas);
      if (nominas.length > 0 && !this.nominaId()) {
        this.nominaId.set(nominas[0].id);
        await this.cargarBorrador(nominas[0].id);
      }
    } catch (err) {
      this.error.set(
        mensajeErrorSupabaseParaUsuario(err, 'cargar las nóminas exportables'),
      );
    } finally {
      this.cargandoNominas.set(false);
    }
  }

  async onNominaChange(id: string): Promise<void> {
    this.nominaId.set(id);
    await this.cargarBorrador(id);
  }

  reintentarCarga(): void {
    const id = this.nominaId();
    if (id && this.nominas().length > 0) {
      void this.cargarBorrador(id);
      return;
    }
    void this.cargarNominas();
  }

  async recargarBorrador(): Promise<void> {
    const id = this.nominaId();
    if (!id) return;
    await this.cargarBorrador(id, { preserveBorrador: true });
  }

  async descargarCsv(): Promise<void> {
    const borrador = this.borrador();
    if (!borrador || !this.puedeDescargar()) return;
    await this.ejecutarDescarga(borrador, 'csv_borrador', () => descargarCsvLre(borrador));
  }

  async descargarFormatoOficial(): Promise<void> {
    const borrador = this.borrador();
    if (!borrador || !this.puedeDescargarDt()) return;
    const rutEmpleador = await this.service.obtenerRutEmpleador(borrador.empresaNombre);
    await this.ejecutarDescarga(borrador, 'formato_oficial_dt', () =>
      descargarFormatoOficialLre(borrador, { rutEmpleador }),
    );
  }

  private async ejecutarDescarga(
    borrador: LreBorradorExport,
    canal: LreCanalExportacion,
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
        'El archivo se descargó, pero no se pudo registrar la exportación en el servidor. Revise la conexión o el despliegue de la fase.',
      );
      descargar();
    } finally {
      this.registrandoDescarga.set(false);
    }
  }

  private async cargarBorrador(
    id: string,
    opts?: { preserveBorrador?: boolean },
  ): Promise<void> {
    this.cargandoBorrador.set(true);
    this.error.set(null);
    this.feedbackDescarga.set(null);
    if (!opts?.preserveBorrador) {
      this.borrador.set(null);
      this.ultimaExportacion.set(null);
    }
    try {
      const borrador = await this.service.construirBorradorDesdeNomina(id);
      if (!borrador) {
        this.error.set(
          'No hay liquidación oficial disponible para la nómina seleccionada. Genere liquidaciones antes de exportar.',
        );
        return;
      }
      this.borrador.set(borrador);
      const exportacion = await this.service.obtenerUltimaExportacion(
        borrador.idLiquidacionPeriodo,
      );
      this.ultimaExportacion.set(exportacion.registro);
    } catch (err) {
      this.error.set(
        mensajeErrorSupabaseParaUsuario(err, 'preparar el borrador del libro de remuneraciones'),
      );
    } finally {
      this.cargandoBorrador.set(false);
    }
  }
}
