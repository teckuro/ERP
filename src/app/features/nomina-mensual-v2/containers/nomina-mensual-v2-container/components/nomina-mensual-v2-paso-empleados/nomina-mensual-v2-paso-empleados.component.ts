import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { employeeRows } from '../../../../data/nomina-mensual-v2.mock';
import {
  COLUMNAS_GRILLA_EMPLEADOS_NOMINA,
  claseBadgeContrato,
  claseBadgeDatosBancarios,
  claseBadgeEstadoNomina,
  crearFiltrosGrillaEmpleadosNomina,
  mapearFilasEmpleadosNomina,
  type FilaEmpleadoNomina,
} from '../../../../presenters/nomina-empleados-grid.presenter';
import {
  construirChecklistEmpleadosNomina,
  construirMetricasEmpleadosNomina,
  filtrarEmpleadosConPendientes,
  obtenerResultadoValidacionEmpleados,
  type ItemChecklistEmpleadoNomina,
  type TipoPendienteEmpleado,
} from '../../../../presenters/nomina-empleados-validacion.presenter';
import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../../../shared/components/ui/data-grid';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import {
  claseChecklist,
  claseTono,
  iconoChecklist,
  iconoMetrica,
  inicialesNombre,
} from '../../utils/nomina-mensual-v2-presentacion.util';

@Component({
  selector: 'app-nomina-mensual-v2-paso-empleados',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataGridComponent, DataGridCellDirective],
  templateUrl: './nomina-mensual-v2-paso-empleados.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasoEmpleadosComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);

  @Output() avanceSolicitado = new EventEmitter<void>();
  @Output() volverParametros = new EventEmitter<void>();

  readonly columnasGrillaEmpleados = COLUMNAS_GRILLA_EMPLEADOS_NOMINA;
  readonly filasEmpleadosNomina = signal<FilaEmpleadoNomina[]>(mapearFilasEmpleadosNomina(employeeRows));
  readonly filtrosAvanzadosEmpleadosVisibles = signal(false);
  readonly filtroPendienteEmpleados = signal<TipoPendienteEmpleado | null>(null);
  readonly empleadosCargando = signal(false);
  readonly empleadosError = signal('');
  readonly empleadoAccionMenuAbierto = signal<string | null>(null);

  readonly metricasEmpleados = computed(() => construirMetricasEmpleadosNomina(this.filasEmpleadosNomina()));
  readonly checklistEmpleados = computed(() => construirChecklistEmpleadosNomina(this.filasEmpleadosNomina()));
  readonly filtrosGrillaEmpleados = computed(() =>
    crearFiltrosGrillaEmpleadosNomina(this.filasEmpleadosNomina(), this.filtrosAvanzadosEmpleadosVisibles()),
  );
  readonly filasEmpleadosVista = computed(() => {
    const tipoPendiente = this.filtroPendienteEmpleados();
    if (!tipoPendiente) {
      return this.filasEmpleadosNomina();
    }
    return filtrarEmpleadosConPendientes(this.filasEmpleadosNomina(), tipoPendiente);
  });

  readonly claseTono = claseTono;
  readonly iconoMetrica = iconoMetrica;
  readonly claseChecklist = claseChecklist;
  readonly iconoChecklist = iconoChecklist;
  readonly claseBadgeEstadoNomina = claseBadgeEstadoNomina;
  readonly claseBadgeDatosBancarios = claseBadgeDatosBancarios;
  readonly claseBadgeContrato = claseBadgeContrato;

  constructor() {
    effect(() => {
      const resultado = obtenerResultadoValidacionEmpleados(this.filasEmpleadosNomina());
      if (resultado.estado === 'bloqueado') {
        this.orquestador.establecerAyudaAvance('Debes corregir los pendientes obligatorios antes de continuar.', 'bloqueo');
        return;
      }
      if (resultado.estado === 'advertencia') {
        this.orquestador.establecerAyudaAvance('Hay observaciones en empleados. Revísalas antes de validar.', 'revision');
        return;
      }
      this.orquestador.establecerAyudaAvance(null);
    });
  }

  ngOnInit(): void {
    this.orquestador.registrarAccionPrincipal(() => this.ejecutarAccionPrincipal());
    this.destroyRef.onDestroy(() => {
      this.orquestador.limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
  }

  trackFilaEmpleadoNomina = (_index: number, fila: FilaEmpleadoNomina): string => fila.id;

  inicialesEmpleado(nombre: string): string {
    return inicialesNombre(nombre);
  }

  async recargarGrillaEmpleados(): Promise<void> {
    this.empleadosCargando.set(true);
    this.empleadosError.set('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 320));
      this.filasEmpleadosNomina.set(mapearFilasEmpleadosNomina(employeeRows));
    } catch {
      this.empleadosError.set('No fue posible cargar el listado de empleados.');
    } finally {
      this.empleadosCargando.set(false);
    }
  }

  toggleMenuAccionEmpleado(filaId: string, event: Event): void {
    event.stopPropagation();
    this.empleadoAccionMenuAbierto.update((actual) => (actual === filaId ? null : filaId));
  }

  revisarEmpleadoNomina(_fila: FilaEmpleadoNomina): void {
    this.empleadoAccionMenuAbierto.set(null);
  }

  alternarFiltrosAvanzadosEmpleados(): void {
    this.filtrosAvanzadosEmpleadosVisibles.update((actual) => !actual);
  }

  seleccionarChecklistEmpleado(item: ItemChecklistEmpleadoNomina): void {
    if (!item.tipoPendiente || item.status === 'success') {
      this.filtroPendienteEmpleados.set(null);
      return;
    }
    const actual = this.filtroPendienteEmpleados();
    this.filtroPendienteEmpleados.set(actual === item.tipoPendiente ? null : item.tipoPendiente);
  }

  limpiarFiltroPendienteEmpleados(): void {
    this.filtroPendienteEmpleados.set(null);
  }

  solicitarVolverParametros(): void {
    this.volverParametros.emit();
  }

  ejecutarAccionPrincipal(): void {
    const resultado = obtenerResultadoValidacionEmpleados(this.filasEmpleadosNomina());
    if (resultado.estado === 'bloqueado') {
      this.orquestador.modalAvanceEmpleados.set({ tipo: 'bloqueo' });
      return;
    }
    if (resultado.estado === 'advertencia') {
      this.orquestador.modalAvanceEmpleados.set({ tipo: 'advertencia' });
      return;
    }
    this.continuarDesdeEmpleados();
  }

  confirmarAvanceConAdvertencia(): void {
    this.continuarDesdeEmpleados();
  }

  irAPendientesEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    queueMicrotask(() => {
      document.getElementById('empleados-checklist-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  private continuarDesdeEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    this.filtroPendienteEmpleados.set(null);
    this.avanceSolicitado.emit();
  }
}
