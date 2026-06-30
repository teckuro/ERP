/**
 * Modal "Agregar trabajadores" — F07 paginación servidor.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X as XIcon } from 'lucide-angular/src/icons';

import {
  DataGridCellDirective,
  DataGridComponent,
  type DataGridBulkActionEvent,
  type DataGridBulkActionOption,
  type DataGridServerQuery,
} from '../../../../../../shared/components/ui/data-grid';
import type {
  FiltroTrabajadoresElegiblesNomina,
  ResumenTrabajadoresElegiblesNomina,
} from '../../../../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../../../../nomina-mensual/services/nomina-periodo.service';
import {
  COLUMNAS_INCLUIR_TRABAJADORES,
  FILTROS_INCLUIR_TRABAJADORES,
  PERSISTENCIA_PICKER_TRABAJADORES,
  filtroTrabajadoresElegiblesDesdeGrid,
  type FilaTrabajadorElegible,
} from '../../../../presenters/nomina-incluir-trabajadores.presenter';

const RESUMEN_VACIO: ResumenTrabajadoresElegiblesNomina = {
  totalActivos: 0,
  elegibles: 0,
  yaEnNomina: 0,
};

@Component({
  selector: 'app-nomina-mensual-v2-modal-incluir-trabajadores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataGridComponent,
    DataGridCellDirective,
    LucideAngularModule,
  ],
  templateUrl: './nomina-mensual-v2-modal-incluir-trabajadores.component.html',
  styleUrl: './nomina-mensual-v2-modal-incluir-trabajadores.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NominaMensualV2ModalIncluirTrabajadoresComponent {
  readonly closeIcon = XIcon;

  private readonly servicio = inject(NominaPeriodoService);

  readonly nominaPeriodoId = input<string | null>(null);

  readonly incluir = output<string[]>();
  readonly cerrar = output<void>();

  readonly columnas = COLUMNAS_INCLUIR_TRABAJADORES;
  readonly persistenceKey = PERSISTENCIA_PICKER_TRABAJADORES;
  readonly accionesMasivas: DataGridBulkActionOption[] = [
    {
      id: 'incluir-en-nomina',
      label: 'Incluir seleccionados',
      tone: 'success',
      confirmLabel: 'Incluir en la nómina',
      confirmTitle: 'Incluir trabajadores',
      confirmMessage:
        'Los trabajadores seleccionados se agregarán al segmento principal de la nómina del período.',
    },
  ];

  readonly cargando = signal(true);
  readonly errorMensaje = signal<string | null>(null);
  readonly filas = signal<FilaTrabajadorElegible[]>([]);
  readonly totalFiltrado = signal(0);
  readonly resumen = signal<ResumenTrabajadoresElegiblesNomina>(RESUMEN_VACIO);
  readonly filtro = signal<FiltroTrabajadoresElegiblesNomina>({});
  readonly pagina = signal(1);
  readonly pageSize = signal(50);
  readonly aplicando = signal(false);

  readonly totalElegibles = computed(() => this.resumen().elegibles);
  readonly totalYaEnNomina = computed(() => this.resumen().yaEnNomina);
  readonly filtros = computed(() => FILTROS_INCLUIR_TRABAJADORES([]));

  constructor() {
    effect(() => {
      const id = this.nominaPeriodoId();
      if (!id) return;
      this.pagina.set(1);
      this.filtro.set({});
      void this.cargar(true);
    });
  }

  async cargar(refrescarResumen = false): Promise<void> {
    const id = this.nominaPeriodoId();
    if (!id) {
      this.filas.set([]);
      this.totalFiltrado.set(0);
      this.resumen.set(RESUMEN_VACIO);
      return;
    }
    this.cargando.set(true);
    this.errorMensaje.set(null);
    try {
      const paginacion = {
        page: this.pagina(),
        pageSize: this.pageSize(),
        total: 0,
      };
      const [listado, resumenActual] = await Promise.all([
        this.servicio.listarTrabajadoresElegiblesNomina(id, this.filtro(), paginacion),
        refrescarResumen
          ? this.servicio.obtenerResumenTrabajadoresElegibles(id)
          : Promise.resolve(this.resumen()),
      ]);
      this.filas.set(listado.filas);
      this.totalFiltrado.set(listado.total);
      if (refrescarResumen) {
        this.resumen.set(resumenActual);
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.errorMensaje.set(`No fue posible cargar los trabajadores: ${mensaje}`);
      this.filas.set([]);
      this.totalFiltrado.set(0);
      if (refrescarResumen) {
        this.resumen.set(RESUMEN_VACIO);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async manejarConsultaServidor(consulta: DataGridServerQuery): Promise<void> {
    this.pagina.set(consulta.page);
    this.pageSize.set(consulta.pageSize);
    this.filtro.set(filtroTrabajadoresElegiblesDesdeGrid(consulta.filterValues));
    await this.cargar(false);
  }

  trackFila = (_index: number, fila: FilaTrabajadorElegible) => fila.id;

  manejarAccionMasiva(evento: DataGridBulkActionEvent<FilaTrabajadorElegible>): void {
    if (evento.action !== 'incluir-en-nomina') return;
    const ids = evento.rows
      .filter((fila) => !fila.yaEnNomina)
      .map((fila) => fila.id);
    if (ids.length === 0) return;
    this.aplicando.set(true);
    this.incluir.emit(ids);
  }

  cerrarPicker(): void {
    if (this.aplicando()) return;
    this.cerrar.emit();
  }
}
