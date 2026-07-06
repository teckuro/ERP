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

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { etiquetaPeriodoDesdeYm } from '../../../../core/services/periodo-activo.service';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import { COLUMNAS_LRE_EXPORT } from '../../presenters/lre-export.presenter';
import { descargarCsvLre, puedeDescargarLre } from '../../rules/lre-export.rules';
import { LreExportService } from '../../services/lre-export.service';

@Component({
  selector: 'app-lre-export-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './lre-export-container.html',
  styleUrl: './lre-export-container.css',
})
export class LreExportContainer {
  private readonly service = inject(LreExportService);

  readonly nominas = signal<readonly NominaPeriodoResumen[]>([]);
  readonly nominaId = signal<string | null>(null);
  readonly borrador = signal<Awaited<ReturnType<LreExportService['construirBorradorDesdeNomina']>>>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly columnas = COLUMNAS_LRE_EXPORT;
  readonly etiquetaPeriodoDesdeYm = etiquetaPeriodoDesdeYm;

  readonly puedeDescargar = computed(() => puedeDescargarLre(this.borrador()));

  constructor() {
    bindShellPageContext(inject(DestroyRef), () => ({
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
        { label: 'Libro de remuneraciones' },
      ],
      statusChip: this.borrador()
        ? {
            label: this.borrador()!.listoParaEnvio ? 'Listo para envío' : `${this.borrador()!.lineas.length} línea(s)`,
            tone: this.borrador()!.listoParaEnvio ? 'success' : 'warning',
          }
        : { label: 'Sin nómina', tone: 'neutral' },
      primaryAction: this.puedeDescargar()
        ? { label: 'Descargar CSV LRE', actionId: 'lre:descargar-csv' }
        : undefined,
    }), { onPrimaryAction: () => this.descargar() });

    void this.init();
  }

  async init(): Promise<void> {
    this.cargando.set(true);
    try {
      const n = await this.service.listarNominasExportables();
      this.nominas.set(n);
      if (n[0]) {
        this.nominaId.set(n[0].id);
        await this.cargar(n[0].id);
      }
    } catch {
      this.error.set('No se pudieron cargar las nóminas.');
    } finally {
      this.cargando.set(false);
    }
  }

  async onNominaChange(id: string): Promise<void> {
    this.nominaId.set(id);
    await this.cargar(id);
  }

  descargar(): void {
    const b = this.borrador();
    if (b && this.puedeDescargar()) descargarCsvLre(b);
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.borrador.set(await this.service.construirBorradorDesdeNomina(id));
    } catch {
      this.error.set('No se pudo preparar el borrador LRE.');
    } finally {
      this.cargando.set(false);
    }
  }
}
