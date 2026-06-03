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

import type { TipoAlcanceNomina } from '../../../../models/nomina-mensual-v2.models';
import {
  calcularResultadoAlcance,
  construirChecklistAlcanceNomina,
  obtenerCentrosCostoDisponibles,
  obtenerOpcionesAlcanceNomina,
  obtenerTextoAyudaAlcance,
} from '../../../../presenters/nomina-alcance.presenter';
import {
  COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS,
  COLUMNAS_GRILLA_ALCANCE_MANUAL,
  crearFiltrosGrillaAlcanceManual,
  obtenerTrabajadoresConIncidencias,
} from '../../../../presenters/nomina-alcance-grid.presenter';
import {
  claseBadgeContrato,
  claseBadgeDatosBancarios,
  claseBadgeEstadoNomina,
  type FilaEmpleadoNomina,
} from '../../../../presenters/nomina-empleados-grid.presenter';
import { NominaEmpleadosCargaService } from '../../../../services/nomina-empleados-carga.service';
import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
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
  tonoBadgeMetrica,
} from '../../utils/nomina-mensual-v2-presentacion.util';

@Component({
  selector: 'app-nomina-mensual-v2-paso-alcance',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataGridComponent, DataGridCellDirective],
  templateUrl: './nomina-mensual-v2-paso-alcance.component.html',
  styleUrls: ['./nomina-mensual-v2-paso-alcance.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasoAlcanceComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly empleadosCargaService = inject(NominaEmpleadosCargaService);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private tokenCargaPeriodo = 0;

  @Output() avanceSolicitado = new EventEmitter<void>();
  @Output() volverParametros = new EventEmitter<void>();

  readonly opcionesAlcance = obtenerOpcionesAlcanceNomina();
  readonly filasPeriodo = signal<FilaEmpleadoNomina[]>([]);
  readonly alcanceCargando = signal(true);
  readonly alcanceError = signal('');
  readonly tipoAlcanceSeleccionado = signal<TipoAlcanceNomina | null>(null);
  readonly centrosCostoSeleccionados = signal<string[]>([]);
  readonly idsTrabajadoresManuales = signal<string[]>([]);

  readonly centrosDisponibles = computed(() => obtenerCentrosCostoDisponibles(this.filasPeriodo()));
  readonly resultadoAlcanceVista = computed(() =>
    calcularResultadoAlcance({
      tipo: this.tipoAlcanceSeleccionado(),
      filas: this.filasPeriodo(),
      centrosCostoSeleccionados: this.centrosCostoSeleccionados(),
      idsTrabajadoresManuales: this.idsTrabajadoresManuales(),
    }),
  );
  readonly checklistAlcance = computed(() => construirChecklistAlcanceNomina(this.resultadoAlcanceVista()));
  readonly metricasAlcance = computed(() => {
    const resultado = this.resultadoAlcanceVista();
    const resumen = resultado.resumen;
    const sinTipoElegido = resultado.estado === 'sinConfigurar';
    const metricas = [
      { id: 'workers', label: 'Encontrados', value: resumen.totalTrabajadores, tone: 'blue' as const, mostrar: true },
      {
        id: 'active',
        label: 'Incluidos',
        value: resumen.trabajadoresIncluidos,
        tone: 'green' as const,
        mostrar: !sinTipoElegido,
      },
      {
        id: 'pending',
        label: 'Excluidos',
        value: resumen.trabajadoresExcluidos,
        tone: 'gray' as const,
        mostrar: !sinTipoElegido,
      },
      {
        id: 'blocker',
        label: 'Bloqueados',
        value: resumen.trabajadoresBloqueados,
        tone: 'red' as const,
        mostrar: resumen.trabajadoresBloqueados > 0,
      },
    ];
    return metricas.filter((metrica) => metrica.mostrar);
  });
  readonly columnasGrillaAlcanceManual = COLUMNAS_GRILLA_ALCANCE_MANUAL;
  readonly filtrosGrillaAlcanceManual = computed(() => crearFiltrosGrillaAlcanceManual(this.filasPeriodo()));
  readonly clavePersistenciaGrillaAlcanceManual = computed(
    () => `nmv2-paso-alcance-manual:${this.periodoActivo.periodoYm()}`,
  );
  readonly totalTrabajadoresManual = computed(() => this.filasPeriodo().length);

  readonly columnasGrillaAlcanceIncidencias = COLUMNAS_GRILLA_ALCANCE_INCIDENCIAS;
  /** Trabajadores incluidos en el alcance actual que además tienen pendientes (bloqueo o advertencia). */
  readonly trabajadoresConIncidencias = computed(() =>
    obtenerTrabajadoresConIncidencias(
      this.filasPeriodo(),
      this.resultadoAlcanceVista().idsTrabajadoresIncluidos ?? [],
    ),
  );
  /** Mostrar el panel de incidencias solo cuando hay alcance completo (no manual) y hay incidencias. */
  readonly mostrarPanelIncidencias = computed(() => {
    const tipo = this.tipoAlcanceSeleccionado();
    if (tipo !== 'empresaCompleta' && tipo !== 'grupo') return false;
    return this.trabajadoresConIncidencias().length > 0;
  });
  readonly clavePersistenciaGrillaIncidencias = computed(
    () => `nmv2-paso-alcance-incidencias:${this.periodoActivo.periodoYm()}:${this.tipoAlcanceSeleccionado() ?? 'none'}`,
  );

  /**
   * Indica si el usuario eligió un tipo de alcance que requiere selección adicional
   * (centro de costo o trabajadores) pero todavía no incluyó ningún trabajador.
   */
  readonly alcanceVacioRequiereSeleccion = computed(() => {
    const resultado = this.resultadoAlcanceVista();
    const tipo = this.tipoAlcanceSeleccionado();
    if (!tipo || resultado.estado === 'sinConfigurar') return false;
    if (resultado.resumen.trabajadoresIncluidos > 0) return false;
    return tipo === 'grupo' || tipo === 'seleccionManual';
  });

  /**
   * Mensaje contextual a mostrar en el alert-banner inline cuando hay tipo elegido
   * pero la selección está vacía. Se apoya en la descripción que produce el presenter.
   */
  readonly mensajeAlcanceVacio = computed(() => {
    const resultado = this.resultadoAlcanceVista();
    return resultado.descripcion || 'Completa la selección para incluir trabajadores.';
  });

  readonly claseTono = claseTono;
  readonly tonoBadgeMetrica = tonoBadgeMetrica;
  readonly iconoMetrica = iconoMetrica;
  readonly claseChecklist = claseChecklist;
  readonly iconoChecklist = iconoChecklist;
  readonly claseBadgeEstadoNomina = claseBadgeEstadoNomina;
  readonly claseBadgeContrato = claseBadgeContrato;
  readonly claseBadgeDatosBancarios = claseBadgeDatosBancarios;

  readonly trackFilaSeleccionManual = (_index: number, fila: FilaEmpleadoNomina): string => fila.id;

  etiquetaSeveridadChecklistAlcance(status: string): string {
    switch (status) {
      case 'success':
        return 'Listo';
      case 'warning':
        return 'Revisar';
      case 'error':
        return 'Bloqueo';
      case 'pending':
      default:
        return 'Pendiente';
    }
  }

  claseSeveridadChecklistAlcance(status: string): string {
    switch (status) {
      case 'success':
        return 'nmv2-paso-alcance__checklist-severity--correcto';
      case 'warning':
        return 'nmv2-paso-alcance__checklist-severity--advertencia';
      case 'error':
        return 'nmv2-paso-alcance__checklist-severity--bloqueante';
      case 'pending':
      default:
        return 'nmv2-paso-alcance__checklist-severity--neutro';
    }
  }

  constructor() {
    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      void this.cargarTrabajadoresPeriodo(periodo);
    });
    effect(() => {
      const texto = obtenerTextoAyudaAlcance(this.resultadoAlcanceVista());
      const resultado = this.resultadoAlcanceVista();
      if (!texto) {
        this.orquestador.establecerAyudaAvance(null);
        return;
      }
      if (resultado.estado === 'bloqueado' || resultado.estado === 'sinConfigurar') {
        this.orquestador.establecerAyudaAvance(texto, 'bloqueo');
        return;
      }
      if (resultado.estado === 'conAdvertencias') {
        this.orquestador.establecerAyudaAvance(texto, 'revision');
        return;
      }
      this.orquestador.establecerAyudaAvance(texto, null);
    });
  }

  ngOnInit(): void {
    const limpiarAccionPrincipal = this.orquestador.registrarAccionPrincipal(() => this.ejecutarAccionPrincipal());
    this.destroyRef.onDestroy(() => {
      limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
    this.restaurarEstadoDesdeOrquestador();
  }

  seleccionarTipoAlcance(tipo: TipoAlcanceNomina, estado: string): void {
    if (estado === 'deshabilitado' || estado === 'preparado') {
      return;
    }
    this.tipoAlcanceSeleccionado.set(tipo);
    if (tipo !== 'grupo') {
      this.centrosCostoSeleccionados.set([]);
    }
    if (tipo !== 'seleccionManual') {
      this.idsTrabajadoresManuales.set([]);
    }
  }

  alternarCentroCosto(centro: string): void {
    this.tipoAlcanceSeleccionado.set('grupo');
    this.centrosCostoSeleccionados.update((actuales) => {
      const set = new Set(actuales);
      if (set.has(centro)) {
        set.delete(centro);
      } else {
        set.add(centro);
      }
      return [...set];
    });
  }

  centroCostoActivo(centro: string): boolean {
    return this.centrosCostoSeleccionados().includes(centro);
  }

  alternarTrabajadorManual(id: string): void {
    this.tipoAlcanceSeleccionado.set('seleccionManual');
    this.idsTrabajadoresManuales.update((actuales) => {
      const set = new Set(actuales);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return [...set];
    });
  }

  trabajadorManualSeleccionado(id: string): boolean {
    return this.idsTrabajadoresManuales().includes(id);
  }

  inicialesEmpleado(nombre: string): string {
    return inicialesNombre(nombre);
  }

  solicitarVolverParametros(): void {
    this.volverParametros.emit();
  }

  ejecutarAccionPrincipal(): void {
    const resultado = this.resultadoAlcanceVista();

    if (resultado.estado === 'sinConfigurar' || resultado.resumen.trabajadoresIncluidos === 0) {
      this.orquestador.modalAvanceAlcance.set({
        tipo: 'bloqueo',
        titulo: 'No puedes continuar',
        mensaje: 'Define un alcance con al menos un trabajador incluido antes de revisar empleados.',
      });
      return;
    }

    if (resultado.estado === 'bloqueado') {
      this.orquestador.modalAvanceAlcance.set({
        tipo: 'bloqueo',
        titulo: 'No puedes continuar',
        mensaje: 'Hay pendientes bloqueantes en el alcance seleccionado. Ajusta la selección antes de avanzar.',
      });
      return;
    }

    if (resultado.estado === 'conAdvertencias') {
      this.orquestador.modalAvanceAlcance.set({
        tipo: 'revision',
        titulo: 'Alcance con advertencias',
        mensaje:
          'Hay trabajadores con advertencias dentro del alcance. Puedes continuar, pero conviene revisarlos en el paso Empleados.',
      });
      return;
    }

    this.guardarResultadoYAvanzar();
  }

  confirmarAvanceConAdvertencia(): void {
    this.guardarResultadoYAvanzar();
  }

  private guardarResultadoYAvanzar(): void {
    const resultado = this.resultadoAlcanceVista();
    this.orquestador.resultadoAlcance.set(resultado);
    this.registrarTrazabilidadAlcance(resultado);
    this.orquestador.modalAvanceAlcance.set(null);
    this.avanceSolicitado.emit();
  }

  private registrarTrazabilidadAlcance(resultado: ReturnType<typeof calcularResultadoAlcance>): void {
    const ctx = this.orquestador.contextoTrazabilidad();
    this.orquestador.actualizarContextoTrazabilidad({
      periodo: ctx?.periodo ?? this.periodoActivo.periodoYm(),
      parametrosResumen: ctx?.parametrosResumen,
      alcance: {
        trabajadoresIncluidos: resultado.resumen.trabajadoresIncluidos,
        bloqueados: resultado.resumen.trabajadoresBloqueados,
        advertencias: resultado.resumen.trabajadoresConAdvertencias,
        tipoAlcance: resultado.descripcion,
      },
    });
  }
  private restaurarEstadoDesdeOrquestador(): void {
    const guardado = this.orquestador.resultadoAlcance();
    if (!guardado) {
      this.tipoAlcanceSeleccionado.set('empresaCompleta');
      return;
    }
    this.tipoAlcanceSeleccionado.set(guardado.tipo);
    this.centrosCostoSeleccionados.set(guardado.centrosCostoSeleccionados ?? []);
    this.idsTrabajadoresManuales.set(guardado.idsTrabajadoresManuales ?? []);
  }

  private async cargarTrabajadoresPeriodo(periodo = this.periodoActivo.periodoYm()): Promise<void> {
    const token = ++this.tokenCargaPeriodo;
    this.alcanceCargando.set(true);
    this.alcanceError.set('');
    try {
      const filas = await this.empleadosCargaService.cargarFilasEmpleadosNomina(undefined, periodo);
      if (token !== this.tokenCargaPeriodo) return;
      this.filasPeriodo.set(filas);
    } catch {
      if (token !== this.tokenCargaPeriodo) return;
      this.alcanceError.set('No fue posible cargar los trabajadores del período.');
    } finally {
      if (token !== this.tokenCargaPeriodo) return;
      this.alcanceCargando.set(false);
    }
  }
}
