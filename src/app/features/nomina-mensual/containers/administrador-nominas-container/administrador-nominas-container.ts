/**
 * Administrador de Nóminas — bandeja de N nóminas por período.
 *
 * Pantalla rectora de F2 (`NOM-REBUILD-NOMINA-MENSUAL-01`). En F3 (fusion)
 * pasa a consumir el servicio productivo `NominaPeriodoService` contra BD real.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { DataGridComponent } from '../../../../shared/components/ui/data-grid/data-grid.component';
import { DataGridCellDirective } from '../../../../shared/components/ui/data-grid/data-grid.directives';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { NominaPeriodoService } from '../../services/nomina-periodo.service';
import type {
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
})
export class AdministradorNominasContainer {
  private readonly router = inject(Router);
  private readonly servicio = inject(NominaPeriodoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly resumenes = signal<NominaPeriodoResumen[]>([]);
  readonly modalNuevaAbierto = signal(false);
  readonly resumenSeleccionado = signal<ResumenValidacionNomina | null>(null);
  readonly nominaSeleccionada = signal<NominaPeriodoResumen | null>(null);
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);

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
    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => this.abrirNuevaNomina(),
    });
    void this.cargarResumenes();
  }

  private computeShellContext(): ShellPageContext {
    return {
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/proceso-mensual' },
        { label: 'Administrador de nóminas' },
      ],
      pageTitle: 'Administrador de nóminas',
      pageSubtitle: this.subtitulo(),
      primaryAction: {
        label: 'Nueva nómina',
        disabled: this.cargando(),
        loading: false,
        actionId: 'admin-nominas-nueva',
      },
    };
  }

  readonly trackResumen = (_index: number, fila: NominaPeriodoResumen): string => fila.id;

  estadoNominaToBadge = estadoNominaToBadge;
  tipoNominaToLabel = tipoNominaToLabel;
  formatearActualizada = formatearActualizada;

  async cargarResumenes(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      const lista = await this.servicio.listarResumenes();
      this.resumenes.set(lista);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No fue posible cargar las nóminas.';
      this.errorCarga.set(mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  abrirNuevaNomina(): void {
    this.modalNuevaAbierto.set(true);
  }

  cerrarNuevaNomina(): void {
    this.modalNuevaAbierto.set(false);
  }

  onNominaCreada(resumen: NominaPeriodoResumen): void {
    this.resumenes.update((lista) => [resumen, ...lista]);
    this.modalNuevaAbierto.set(false);
  }

  async abrirResumen(fila: NominaPeriodoResumen): Promise<void> {
    this.nominaSeleccionada.set(fila);
    try {
      const resumen = await this.servicio.obtenerResumenValidacionNomina(fila.id);
      this.resumenSeleccionado.set(resumen);
    } catch {
      this.resumenSeleccionado.set({
        totalTrabajadores: fila.totalTrabajadores,
        listosParaCalculo: 0,
        conIncidenciasCriticas: fila.totalIncidenciasCriticas,
        conAdvertencias: fila.totalAdvertencias,
        conMovimientosEspeciales: 0,
        puedeCalcular: false,
        puedeCerrar: false,
        incidenciasCriticas: [],
        advertencias: [],
      });
    }
  }

  cerrarResumen(): void {
    this.resumenSeleccionado.set(null);
    this.nominaSeleccionada.set(null);
  }

  abrirGenerador(fila: NominaPeriodoResumen): void {
    void this.router.navigate(['/remuneraciones/nominas', fila.id, 'generador']);
  }
}
