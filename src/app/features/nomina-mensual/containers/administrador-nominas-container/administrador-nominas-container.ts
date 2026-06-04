/**
 * Administrador de Nóminas — bandeja de N nóminas por período.
 *
 * Pantalla rectora de F2 (`NOM-REBUILD-NOMINA-MENSUAL-01`).
 *
 * Consume `NominaPeriodoMockAdapterService.listarResumenes()` (sólo resúmenes,
 * sin detalle). Navega al Generador (`/remuneraciones/nomina-mensual-v2`) con
 * queryParams puente hasta que F3 active la ruta definitiva
 * `/remuneraciones/nominas/:id/generador`.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { DataGridCellDirective } from '../../../../shared/components/ui/data-grid/data-grid.directives';
import { NominaPeriodoMockAdapterService } from '../../services/nomina-periodo-mock-adapter.service';
import type {
  NominaPeriodo,
  NominaPeriodoResumen,
  ResumenValidacionNomina,
} from '../../models/nomina-periodo.models';
import {
  COLUMNAS_ADMIN_NOMINAS,
  PERSISTENCIA_GRILLA_ADMIN,
  crearFiltrosAdminNominas,
} from '../../presenters/admin-nominas.presenter';
import {
  calcularKpisAdminNominas,
  estadoNominaToBadge,
  tipoNominaToLabel,
  formatearActualizada,
} from './utils/admin-nominas-presentacion.util';
import { AdminNominasModalNuevaNominaComponent } from './components/admin-nominas-modal-nueva-nomina/admin-nominas-modal-nueva-nomina.component';
import { AdminNominasModalResumenNominaComponent } from './components/admin-nominas-modal-resumen-nomina/admin-nominas-modal-resumen-nomina.component';

@Component({
  selector: 'app-administrador-nominas-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataGridComponent,
    DataGridCellDirective,
    AdminNominasModalNuevaNominaComponent,
    AdminNominasModalResumenNominaComponent,
  ],
  templateUrl: './administrador-nominas-container.html',
  styleUrl: './administrador-nominas-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdministradorNominasContainer {
  private readonly router = inject(Router);
  private readonly adapter = inject(NominaPeriodoMockAdapterService);

  readonly resumenes = signal<NominaPeriodoResumen[]>([]);
  readonly modalNuevaAbierto = signal(false);
  readonly resumenSeleccionado = signal<ResumenValidacionNomina | null>(null);
  readonly nominaSeleccionada = signal<NominaPeriodoResumen | null>(null);

  readonly columnas = COLUMNAS_ADMIN_NOMINAS;
  readonly persistenceKey = PERSISTENCIA_GRILLA_ADMIN;

  readonly filtros = computed(() => crearFiltrosAdminNominas(this.resumenes()));
  readonly kpis = computed(() => calcularKpisAdminNominas(this.resumenes()));

  readonly subtitulo = computed(() => {
    const total = this.resumenes().length;
    const abiertas = this.kpis().abiertas;
    if (total === 0) {
      return 'Sin nóminas cargadas todavía.';
    }
    return `${total} ${total === 1 ? 'nómina' : 'nóminas'} en seguimiento · ${abiertas} ${abiertas === 1 ? 'abierta' : 'abiertas'}.`;
  });

  constructor() {
    this.resumenes.set(this.adapter.listarResumenes());
  }

  readonly trackResumen = (_index: number, fila: NominaPeriodoResumen): string => fila.id;

  estadoNominaToBadge = estadoNominaToBadge;
  tipoNominaToLabel = tipoNominaToLabel;
  formatearActualizada = formatearActualizada;

  abrirNuevaNomina(): void {
    this.modalNuevaAbierto.set(true);
  }

  cerrarNuevaNomina(): void {
    this.modalNuevaAbierto.set(false);
  }

  onNominaCreada(nomina: NominaPeriodo): void {
    const resumen: NominaPeriodoResumen = {
      id: nomina.id,
      periodo: nomina.periodo,
      empresaId: nomina.empresaId,
      empresaNombre: nomina.empresaNombre,
      tipo: nomina.tipo,
      estado: nomina.estado,
      totalTrabajadores: nomina.trabajadorIds.length,
      totalSegmentos: nomina.segmentos.length,
      totalHaberes: nomina.totalHaberes,
      totalDescuentos: nomina.totalDescuentos,
      totalLiquido: nomina.totalLiquido,
      totalIncidenciasCriticas: nomina.incidencias.filter((i) => i.severidad === 'critica').length,
      totalAdvertencias: nomina.incidencias.filter((i) => i.severidad === 'advertencia').length,
      createdAt: nomina.createdAt,
      updatedAt: nomina.updatedAt,
    };
    this.resumenes.update((lista) => [resumen, ...lista]);
    this.modalNuevaAbierto.set(false);
  }

  abrirResumen(fila: NominaPeriodoResumen): void {
    const resumen = this.adapter.obtenerResumenValidacionNomina(fila.id);
    this.nominaSeleccionada.set(fila);
    this.resumenSeleccionado.set(resumen);
  }

  cerrarResumen(): void {
    this.resumenSeleccionado.set(null);
    this.nominaSeleccionada.set(null);
  }

  abrirGenerador(fila: NominaPeriodoResumen): void {
    void this.router.navigate(['/remuneraciones/nomina-mensual-v2'], {
      queryParams: {
        periodo: fila.periodo,
        nominaPeriodoId: fila.id,
      },
    });
  }
}
