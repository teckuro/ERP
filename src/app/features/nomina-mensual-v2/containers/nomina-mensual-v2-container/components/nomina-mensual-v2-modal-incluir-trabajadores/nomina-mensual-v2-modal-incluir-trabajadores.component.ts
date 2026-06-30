/**
 * Modal "Agregar trabajadores" para el paso Dotación.
 *
 * Lista los trabajadores activos y aptos para remuneraciones de la empresa y
 * permite incluir uno o varios en la nómina del período. Reusa `app-data-grid`
 * para mantener la consistencia con el Administrador.
 *
 * Contrato:
 *  - `nominaPeriodoId`: identificador del período (input).
 *  - `idsYaEnNomina`: ids de trabajadores ya incluidos (input). Se ocultan o
 *    marcan como "ya en nómina" para evitar duplicidad.
 *  - `incluir`: emite cuando el RRHH confirma incluir los trabajadores
 *    seleccionados.
 *  - `cerrar`: emite cuando el RRHH cancela / cierra el modal.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
} from '../../../../../../shared/components/ui/data-grid';
import { EmpleadosService } from '../../../../../empleados/services/empleados.service';
import type { EmpleadoListado } from '../../../../../empleados/models/empleado-listado.model';
import {
  COLUMNAS_INCLUIR_TRABAJADORES,
  FILTROS_INCLUIR_TRABAJADORES,
  PERSISTENCIA_PICKER_TRABAJADORES,
  type FilaTrabajadorElegible,
} from '../../../../presenters/nomina-incluir-trabajadores.presenter';

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

  private readonly empleadosService = inject(EmpleadosService);

  readonly nominaPeriodoId = input<string | null>(null);
  readonly idsYaEnNomina = input<readonly string[]>([]);

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
  readonly empleados = signal<EmpleadoListado[]>([]);
  readonly aplicando = signal(false);

  readonly idsYaEnNominaSet = computed(() => new Set(this.idsYaEnNomina().map(String)));

  /**
   * Fila enriquecida para `app-data-grid`. Convertimos cada `EmpleadoListado`
   * en una estructura plana, marcamos los que ya están en la nómina y
   * proyectamos un `nombreCargo` ordenable.
   */
  readonly filas = computed<FilaTrabajadorElegible[]>(() => {
    const yaEnNomina = this.idsYaEnNominaSet();
    return this.empleados()
      .filter((empleado) => empleado.estado === 'activo' && empleado.aptoParaRemuneraciones)
      .map((empleado) => ({
        id: String(empleado.id),
        nombre: empleado.nombre,
        rut: empleado.rut,
        cargo: empleado.cargo || '—',
        departamento: empleado.departamento || '—',
        yaEnNomina: yaEnNomina.has(String(empleado.id)),
      }))
      .sort((a, b) => {
        if (a.yaEnNomina !== b.yaEnNomina) return a.yaEnNomina ? 1 : -1;
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      });
  });

  readonly totalElegibles = computed(
    () => this.filas().filter((fila) => !fila.yaEnNomina).length,
  );
  readonly totalYaEnNomina = computed(
    () => this.filas().filter((fila) => fila.yaEnNomina).length,
  );

  readonly filtros = computed(() => FILTROS_INCLUIR_TRABAJADORES(this.filas()));

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    try {
      const lista = await this.empleadosService.listar();
      this.empleados.set(lista);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.errorMensaje.set(`No fue posible cargar los trabajadores: ${mensaje}`);
      this.empleados.set([]);
    } finally {
      this.cargando.set(false);
    }
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
