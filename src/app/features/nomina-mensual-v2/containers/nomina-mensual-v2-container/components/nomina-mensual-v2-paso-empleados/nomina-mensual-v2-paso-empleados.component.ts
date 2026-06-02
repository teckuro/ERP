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
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  COLUMNAS_GRILLA_EMPLEADOS_NOMINA,
  claseBadgeContrato,
  claseBadgeDatosBancarios,
  claseBadgeEstadoNomina,
  crearFiltrosGrillaEmpleadosNomina,
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
  obtenerSeveridadFiltroChecklist,
  obtenerSeccionesResumenPendientesEmpleados,
  obtenerTextoSuperiorEmpleados,
  type ItemChecklistEmpleadoNomina,
  type SeveridadChecklistEmpleados,
  type TipoPendienteEmpleado,
} from '../../../../presenters/nomina-empleados-validacion.presenter';
import { NominaEmpleadosCargaService } from '../../../../services/nomina-empleados-carga.service';
import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import {
  DataGridCellDirective,
  DataGridComponent,
} from '../../../../../../shared/components/ui/data-grid';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadPasoComponent } from '../nomina-mensual-v2-trazabilidad-paso/nomina-mensual-v2-trazabilidad-paso.component';
import {
  claseChecklist,
  claseChipFiltroChecklist,
  claseSeveridadChecklist,
  claseTono,
  iconoChecklist,
  iconoMetrica,
  inicialesNombre,
  tonoBadgeMetrica,
} from '../../utils/nomina-mensual-v2-presentacion.util';

@Component({
  selector: 'app-nomina-mensual-v2-paso-empleados',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataGridComponent, DataGridCellDirective, NominaMensualV2TrazabilidadPasoComponent],
  templateUrl: './nomina-mensual-v2-paso-empleados.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasoEmpleadosComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly empleadosCargaService = inject(NominaEmpleadosCargaService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private tokenCargaPeriodo = 0;

  @ViewChild(DataGridComponent) private grillaEmpleados?: DataGridComponent<FilaEmpleadoNomina>;

  @Output() avanceSolicitado = new EventEmitter<void>();
  @Output() volverParametros = new EventEmitter<void>();

  readonly columnasGrillaEmpleados = COLUMNAS_GRILLA_EMPLEADOS_NOMINA;
  readonly filasEmpleadosNomina = signal<FilaEmpleadoNomina[]>([]);
  readonly sinAlcanceValido = computed(() => !this.orquestador.alcanceValidado());
  readonly filtrosAvanzadosEmpleadosVisibles = signal(false);
  readonly filtroPendienteEmpleados = signal<TipoPendienteEmpleado | null>(null);
  readonly empleadosCargando = signal(true);
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
  readonly severidadFiltroChecklistActivo = computed((): SeveridadChecklistEmpleados | null => {
    const tipo = this.filtroPendienteEmpleados();
    if (!tipo) return null;
    return obtenerSeveridadFiltroChecklist(tipo, this.checklistEmpleados());
  });
  readonly leyendaFiltradoGrilla = computed(() => {
    const total = this.filasEmpleadosNomina().length;
    const visibles = this.filasEmpleadosVista().length;
    if (visibles !== total) {
      return `Mostrando ${visibles} de ${total} trabajadores.`;
    }
    return `Mostrando ${total} trabajadores.`;
  });
  readonly clavePersistenciaGrillaEmpleados = computed(() => {
    const filtro = this.filtroPendienteEmpleados();
    const cantidad = this.filasEmpleadosVista().length;
    const base = 'nomina-mensual-v2.empleados.grid';
    if (!filtro) {
      return `${base}.${cantidad}`;
    }
    return `${base}.filtro-${filtro}.${cantidad}`;
  });

  readonly claseTono = claseTono;
  readonly tonoBadgeMetrica = tonoBadgeMetrica;
  readonly iconoMetrica = iconoMetrica;
  readonly claseChecklist = claseChecklist;
  readonly claseChipFiltroChecklist = claseChipFiltroChecklist;
  readonly claseSeveridadChecklist = claseSeveridadChecklist;
  readonly iconoChecklist = iconoChecklist;
  readonly claseBadgeEstadoNomina = claseBadgeEstadoNomina;
  readonly claseBadgeDatosBancarios = claseBadgeDatosBancarios;
  readonly claseBadgeContrato = claseBadgeContrato;

  constructor() {
    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      void this.recargarGrillaEmpleados(periodo);
    });
    effect(() => {
      if (this.sinAlcanceValido()) {
        this.orquestador.establecerAyudaAvance(
          'Define el alcance en el paso anterior antes de revisar empleados.',
          'bloqueo',
        );
        return;
      }
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
    effect(() => {
      this.filtroPendienteEmpleados();
      this.filasEmpleadosVista().length;
      queueMicrotask(() => this.grillaEmpleados?.goToPage(1));
    });
  }

  ngOnInit(): void {
    const limpiarAccionPrincipal = this.orquestador.registrarAccionPrincipal(() => this.ejecutarAccionPrincipal());
    this.destroyRef.onDestroy(() => {
      limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
  }

  claseItemChecklistEmpleado(item: ItemChecklistEmpleadoNomina): string {
    return `${claseChecklist(item.status)} empleados-checklist-item--${item.severidad}`;
  }

  trackFilaEmpleadoNomina = (_index: number, fila: FilaEmpleadoNomina): string => fila.id;

  inicialesEmpleado(nombre: string): string {
    return inicialesNombre(nombre);
  }

  async recargarGrillaEmpleados(periodo = this.periodoActivo.periodoYm()): Promise<void> {
    const token = ++this.tokenCargaPeriodo;
    this.empleadosCargando.set(true);
    this.empleadosError.set('');
    try {
      const filas = await this.empleadosCargaService.cargarFilasEmpleadosNomina(undefined, periodo);
      if (token !== this.tokenCargaPeriodo) return;
      this.filasEmpleadosNomina.set(this.filtrarFilasPorAlcance(filas));
    } catch {
      if (token !== this.tokenCargaPeriodo) return;
      this.empleadosError.set('No fue posible cargar la base de empleados.');
    } finally {
      if (token !== this.tokenCargaPeriodo) return;
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

  abrirModalResumenPendientes(origen: 'checklist' | 'validacion' = 'checklist'): void {
    const filas = this.filasEmpleadosNomina();
    const items = construirChecklistEmpleadosNomina(filas);
    const resultado = obtenerResultadoValidacionEmpleados(filas);

    this.orquestador.modalAvanceEmpleados.set({
      resultado,
      secciones: obtenerSeccionesResumenPendientesEmpleados(items),
      origen,
    });
  }

  aplicarFiltroChecklistEmpleados(tipoPendiente: TipoPendienteEmpleado): void {
    this.orquestador.modalAvanceEmpleados.set(null);
    this.filtroPendienteEmpleados.set(tipoPendiente);
    queueMicrotask(() => {
      document.getElementById('nmv2-empleados-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  solicitarVolverParametros(): void {
    this.volverParametros.emit();
  }

  ejecutarAccionPrincipal(): void {
    if (this.sinAlcanceValido()) {
      this.volverParametros.emit();
      return;
    }
    const resultado = obtenerResultadoValidacionEmpleados(this.filasEmpleadosNomina());
    if (resultado.estado === 'correcto') {
      this.continuarDesdeEmpleados();
      return;
    }
    this.abrirModalResumenPendientes('validacion');
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
    this.registrarTrazabilidadEmpleados();
    this.avanceSolicitado.emit();
  }

  private registrarTrazabilidadEmpleados(): void {
    const filas = this.filasEmpleadosNomina();
    const resumen = obtenerResumenEmpleadosNomina(filas);
    const validacion = obtenerResultadoValidacionEmpleados(filas);
    const ctx = this.orquestador.contextoTrazabilidad();
    this.orquestador.actualizarContextoTrazabilidad({
      periodo: ctx?.periodo ?? this.periodoActivo.periodoYm(),
      parametrosResumen: ctx?.parametrosResumen,
      alcance: ctx?.alcance,
      empleados: {
        revisados: resumen.totalActivos,
        bloqueos: validacion.mensajesBloqueo.length,
        advertencias: validacion.mensajesAdvertencia.length,
      },
    });
  }
  private filtrarFilasPorAlcance(filas: FilaEmpleadoNomina[]): FilaEmpleadoNomina[] {
    const alcance = this.orquestador.resultadoAlcance();
    if (!alcance?.idsTrabajadoresIncluidos.length) {
      return [];
    }
    const ids = new Set(alcance.idsTrabajadoresIncluidos);
    return filas.filter((fila) => ids.has(fila.id));
  }
}
