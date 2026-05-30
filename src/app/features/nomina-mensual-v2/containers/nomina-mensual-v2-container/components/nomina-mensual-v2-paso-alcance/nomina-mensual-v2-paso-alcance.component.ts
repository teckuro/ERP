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
import type { FilaEmpleadoNomina } from '../../../../presenters/nomina-empleados-grid.presenter';
import { NominaEmpleadosCargaService } from '../../../../services/nomina-empleados-carga.service';
import { NominaMensualV2TrazabilidadService } from '../../../../services/nomina-mensual-v2-trazabilidad.service';
import { PeriodoActivoService } from '../../../../../../core/services/periodo-activo.service';
import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadPasoComponent } from '../nomina-mensual-v2-trazabilidad-paso/nomina-mensual-v2-trazabilidad-paso.component';
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
  imports: [CommonModule, LucideAngularModule, NominaMensualV2TrazabilidadPasoComponent],
  templateUrl: './nomina-mensual-v2-paso-alcance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NominaMensualV2PasoAlcanceComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly orquestador = inject(NominaMensualV2OrquestadorPort);
  private readonly empleadosCargaService = inject(NominaEmpleadosCargaService);
  private readonly trazabilidadService = inject(NominaMensualV2TrazabilidadService);
  private readonly periodoActivo = inject(PeriodoActivoService);

  @Output() avanceSolicitado = new EventEmitter<void>();
  @Output() volverParametros = new EventEmitter<void>();

  readonly opcionesAlcance = obtenerOpcionesAlcanceNomina();
  readonly filasPeriodo = signal<FilaEmpleadoNomina[]>([]);
  readonly alcanceCargando = signal(true);
  readonly alcanceError = signal('');
  readonly tipoAlcanceSeleccionado = signal<TipoAlcanceNomina | null>(null);
  readonly centrosCostoSeleccionados = signal<string[]>([]);
  readonly idsTrabajadoresManuales = signal<string[]>([]);
  readonly busquedaManual = signal('');

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
    const resumen = this.resultadoAlcanceVista().resumen;
    return [
      { id: 'workers', label: 'Encontrados', value: resumen.totalTrabajadores, tone: 'blue' as const },
      { id: 'active', label: 'Incluidos', value: resumen.trabajadoresIncluidos, tone: 'green' as const },
      { id: 'pending', label: 'Excluidos', value: resumen.trabajadoresExcluidos, tone: 'gray' as const },
      { id: 'blocker', label: 'Bloqueados', value: resumen.trabajadoresBloqueados, tone: 'red' as const },
    ];
  });
  readonly filasSeleccionManual = computed(() => {
    const termino = this.busquedaManual().trim().toLowerCase();
    const filas = this.filasPeriodo();
    if (!termino) return filas;
    return filas.filter((fila) => {
      const texto = `${fila.nombreCompleto} ${fila.rut} ${fila.cargo}`.toLowerCase();
      return texto.includes(termino);
    });
  });

  readonly claseTono = claseTono;
  readonly tonoBadgeMetrica = tonoBadgeMetrica;
  readonly iconoMetrica = iconoMetrica;
  readonly claseChecklist = claseChecklist;
  readonly iconoChecklist = iconoChecklist;

  constructor() {
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
    this.orquestador.registrarAccionPrincipal(() => this.ejecutarAccionPrincipal());
    this.destroyRef.onDestroy(() => {
      this.orquestador.limpiarAccionPrincipal();
      this.orquestador.establecerAyudaAvance(null);
    });
    this.restaurarEstadoDesdeOrquestador();
    void this.cargarTrabajadoresPeriodo();
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

    this.orquestador.registrarEventoTrazabilidad(
      this.trazabilidadService.crearEventoLocal({
        paso: 'scope',
        tipoEvento: 'ALCANCE_DEFINIDO',
        descripcion: `Alcance definido · ${resultado.resumen.trabajadoresIncluidos} trabajadores incluidos`,
        integridad: { estadoIntegridad: 'pendiente' },
      }),
    );
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

  private async cargarTrabajadoresPeriodo(): Promise<void> {
    this.alcanceCargando.set(true);
    this.alcanceError.set('');
    try {
      this.filasPeriodo.set(await this.empleadosCargaService.cargarFilasEmpleadosNomina());
    } catch {
      this.alcanceError.set('No fue posible cargar los trabajadores del período.');
    } finally {
      this.alcanceCargando.set(false);
    }
  }
}
