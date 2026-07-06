import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { MessageBoxSection } from '../../../../shared/components/ui/feedback/message-box/message-box.types';
import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { etiquetaPeriodoDesdeYm } from '../../../../core/services/periodo-activo.service';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import type {
  PreviredBorradorExport,
  PreviredExportacionRegistro,
} from '../../models/previred-export.model';
import {
  COLUMNAS_PREVIRED_EXPORT,
  PERSISTENCIA_GRILLA_PREVIRED_EXPORT,
  etiquetaOpcionNominaPrevired,
  formatearFechaExportacionPrevired,
  formatearMontoPrevired,
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

@Component({
  selector: 'app-previred-export-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, MessageBoxComponent, DataGridComponent],
  templateUrl: './previred-export-container.html',
  styleUrl: './previred-export-container.css',
})
export class PreviredExportContainer {
  private readonly service = inject(PreviredExportService);

  readonly nominasExportables = signal<readonly NominaPeriodoResumen[]>([]);
  readonly nominaSeleccionadaId = signal<string | null>(null);
  readonly borrador = signal<PreviredBorradorExport | null>(null);
  readonly ultimaExportacion = signal<PreviredExportacionRegistro | null>(null);
  readonly cargandoNominas = signal(false);
  readonly cargandoBorrador = signal(false);
  readonly registrandoDescarga = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly feedbackDescarga = signal<string | null>(null);

  readonly columnas = COLUMNAS_PREVIRED_EXPORT;
  readonly persistenciaGrilla = PERSISTENCIA_GRILLA_PREVIRED_EXPORT;
  readonly etiquetaOpcionNominaPrevired = etiquetaOpcionNominaPrevired;
  readonly formatearMontoPrevired = formatearMontoPrevired;
  readonly etiquetaPeriodoDesdeYm = etiquetaPeriodoDesdeYm;
  readonly formatearFechaExportacionPrevired = formatearFechaExportacionPrevired;

  readonly puedeDescargarCsv = computed(() => puedeDescargarBorradorPrevired(this.borrador()));
  readonly puedeDescargarArchivo = computed(() => puedeDescargarArchivoOficialPrevired(this.borrador()));

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

  async cargarNominas(): Promise<void> {
    this.cargandoNominas.set(true);
    this.errorCarga.set(null);
    try {
      const nominas = await this.service.listarNominasExportables();
      this.nominasExportables.set(nominas);
      if (nominas.length > 0 && !this.nominaSeleccionadaId()) {
        this.nominaSeleccionadaId.set(nominas[0].id);
        await this.cargarBorrador(nominas[0].id);
      }
    } catch {
      this.errorCarga.set('No se pudieron cargar las nóminas con liquidaciones disponibles.');
    } finally {
      this.cargandoNominas.set(false);
    }
  }

  async onNominaChange(id: string): Promise<void> {
    this.nominaSeleccionadaId.set(id);
    this.feedbackDescarga.set(null);
    await this.cargarBorrador(id);
  }

  async recargarBorrador(): Promise<void> {
    const id = this.nominaSeleccionadaId();
    if (!id) return;
    this.feedbackDescarga.set(null);
    await this.cargarBorrador(id);
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

  private async cargarBorrador(nominaPeriodoId: string): Promise<void> {
    this.cargandoBorrador.set(true);
    this.errorCarga.set(null);
    this.borrador.set(null);
    this.ultimaExportacion.set(null);
    try {
      const borrador = await this.service.construirBorradorDesdeNomina(nominaPeriodoId);
      if (!borrador) {
        this.errorCarga.set(
          'No hay liquidación oficial disponible para la nómina seleccionada. Genere liquidaciones antes de exportar.',
        );
        return;
      }
      this.borrador.set(borrador);
      this.ultimaExportacion.set(
        await this.service.obtenerUltimaExportacion(borrador.idLiquidacionPeriodo),
      );
    } catch {
      this.errorCarga.set('No se pudo preparar el borrador de exportación.');
    } finally {
      this.cargandoBorrador.set(false);
    }
  }
}
