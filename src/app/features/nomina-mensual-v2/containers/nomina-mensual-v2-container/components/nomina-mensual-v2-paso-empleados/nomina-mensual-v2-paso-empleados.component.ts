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
  obtenerEtiquetaFiltroChecklistEmpleados,
  obtenerPrimerTipoPendienteBloqueante,
  obtenerResultadoValidacionEmpleados,
  obtenerResumenEmpleadosNomina,
  obtenerTextoSuperiorEmpleados,
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
  claseSeveridadChecklist,
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
  readonly etiquetaFiltroChecklistActivo = computed(() => {
    const tipo = this.filtroPendienteEmpleados();
    return tipo ? obtenerEtiquetaFiltroChecklistEmpleados(tipo) : null;
  });
  readonly leyendaFiltradoGrilla = computed(() => {
    const total = this.filasEmpleadosNomina().length;
    const visibles = this.filasEmpleadosVista().length;
    if (!this.filtroPendienteEmpleados() || visibles === total) {
      return null;
    }
    return `Mostrando ${visibles} de ${total} trabajadores.`;
  });

  readonly claseTono = claseTono;
  readonly iconoMetrica = iconoMetrica;
  readonly claseChecklist = claseChecklist;
  readonly claseSeveridadChecklist = claseSeveridadChecklist;
  readonly iconoChecklist = iconoChecklist;
  readonly claseBadgeEstadoNomina = claseBadgeEstadoNomina;
  readonly claseBadgeDatosBancarios = claseBadgeDatosBancarios;
  readonly claseBadgeContrato = claseBadgeContrato;

  constructor() {
    effect(() => {
      const texto = obtenerTextoSuperiorEmpleados(this.filasEmpleadosNomina());
      const resultado = obtenerResultadoValidacionEmpleados(this.filasEmpleadosNomina());
      if (!texto) {
        this.orquestador.establecerAyudaAvance(null);
        return;
      }
      if (resultado.estado === 'bloqueado') {
        this.orquestador.establecerAyudaAvance(texto, 'bloqueo');
        return;
      }
      if (resultado.estado === 'advertencia') {
        this.orquestador.establecerAyudaAvance(texto, 'revision');
        return;
      }
      this.orquestador.establecerAyudaAvance(texto, null);
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
      this.empleadosError.set('No fue posible cargar la base de empleados.');
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
    if (!item.tipoPendiente || !item.esAccionable) {
      return;
    }
    const actual = this.filtroPendienteEmpleados();
    this.filtroPendienteEmpleados.set(actual === item.tipoPendiente ? null : item.tipoPendiente);
    queueMicrotask(() => {
      document.getElementById('nmv2-empleados-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
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
      this.orquestador.modalAvanceEmpleados.set({ tipo: 'bloqueo', resultado });
      return;
    }
    if (resultado.estado === 'advertencia') {
      this.orquestador.modalAvanceEmpleados.set({ tipo: 'advertencia', resultado });
      return;
    }
    this.continuarDesdeEmpleados();
  }

  confirmarAvanceConAdvertencia(): void {
    this.continuarDesdeEmpleados();
  }

  irAPendientesEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    const filas = this.filasEmpleadosNomina();
    const resumen = obtenerResumenEmpleadosNomina(filas);
    const tipoPendiente =
      obtenerPrimerTipoPendienteBloqueante(filas) ??
      (resumen.conDocumentacionIncompleta > 0 ? ('documentacion' as const) : null) ??
      (resumen.conObservaciones > 0 ? ('observaciones' as const) : null);

    if (tipoPendiente) {
      this.filtroPendienteEmpleados.set(tipoPendiente);
    }

    queueMicrotask(() => {
      document.getElementById('nmv2-empleados-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  private continuarDesdeEmpleados(): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    this.filtroPendienteEmpleados.set(null);
    this.avanceSolicitado.emit();
  }
}
