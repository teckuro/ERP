import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import type {
  MotorCalculoPeriodoResultado,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../../services/proceso-mensual.service';
import type { AprobacionOperativaRegistroView } from '../models/proceso-mensual-container.vm';
import { formatoFechaHoraNomina, formatoMontoNomina } from '../utils/proceso-mensual-presentacion.formato';

@Injectable()
export class ProcesoMensualPeriodoStore {
  readonly periodoActivo = inject(PeriodoActivoService);
  readonly procesoMensual = inject(ProcesoMensualService);

  readonly periodoSeleccionado = computed(() => this.periodoActivo.periodoYm());
  readonly resultado = signal<ProcesoMensualPrevalidacion | null>(null);
  readonly preNomina = signal<ProcesoMensualPreNominaPeriodo | null>(null);
  readonly calculo = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly snapshotActivo = signal<NominaCalculoPeriodoSnapshot | null>(null);
  readonly validando = signal(false);
  readonly generandoPreNomina = signal(false);
  readonly calculandoPreliminar = signal(false);
  readonly guardandoSnapshot = signal(false);
  readonly consultandoSnapshot = signal(false);
  readonly consultandoSnapshotCompleto = signal(false);
  readonly errorEjecucion = signal<string | null>(null);
  readonly errorGuardadoResultado = signal<string | null>(null);
  readonly errorAprobacionOperativa = signal<string | null>(null);
  readonly errorCierreOperativo = signal<string | null>(null);
  readonly errorSnapshotCompleto = signal<string | null>(null);
  readonly exitoGuardadoResultado = signal<string | null>(null);
  readonly identificadorResultadoGuardadoActual = signal<string | null>(null);
  readonly aprobacionOperativa = signal<AprobacionOperativaRegistroView | null>(null);
  readonly aprobandoResultado = signal(false);
  readonly cerrandoNomina = signal(false);
  readonly snapshotCompleto = signal<NominaSnapshotCompletoView | null>(null);
  readonly rehidratandoPeriodo = signal(false);
  readonly liquidacionesGeneradasCount = signal(0);
  readonly gestionandoAccionPeriodo = signal(false);
  readonly errorAccionPeriodo = signal<string | null>(null);
  readonly exitoAccionPeriodo = signal<string | null>(null);

  constructor() {
    effect(() => {
      const periodo = this.periodoSeleccionado();
      untracked(() => {
        this.rehidratarPeriodoActivo(periodo);
      });
    });
  }

  accionPeriodoEnCurso(): boolean {
    return (
      this.validando() ||
      this.generandoPreNomina() ||
      this.calculandoPreliminar() ||
      this.guardandoSnapshot() ||
      this.aprobandoResultado() ||
      this.cerrandoNomina()
      || this.gestionandoAccionPeriodo()
    );
  }

  nominaEstaCerradaOperativamente(): boolean {
    return this.snapshotActivo()?.cierreOperativo?.estado === 'cerrado_operativamente';
  }

  validarPeriodo(): void {
    const p = this.periodoSeleccionado();
    this.validando.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .ejecutarPrevalidaciones(p)
      .then((r) => {
        this.resultado.set(r);
        this.preNomina.set(null);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.aprobacionOperativa.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
        return this.cargarSnapshotActivo(p);
      })
      .catch((e: unknown) => {
        this.resultado.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.validando.set(false);
      });
  }

  generarPreNomina(): void {
    const p = this.periodoSeleccionado();
    this.generandoPreNomina.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarPreNominaPeriodo(p)
      .then((r) => {
        this.preNomina.set(r);
        this.calculo.set(null);
        this.snapshotActivo.set(null);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.aprobacionOperativa.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
      })
      .catch((e: unknown) => {
        this.preNomina.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.generandoPreNomina.set(false);
      });
  }

  calcularPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.calculandoPreliminar.set(true);
    this.errorEjecucion.set(null);
    void this.procesoMensual
      .generarCalculoPeriodo(p)
      .then((r) => {
        this.calculo.set(r);
        this.errorGuardadoResultado.set(null);
        this.errorAprobacionOperativa.set(null);
        this.exitoGuardadoResultado.set(null);
        this.identificadorResultadoGuardadoActual.set(null);
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(null);
      })
      .catch((e: unknown) => {
        this.calculo.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.calculandoPreliminar.set(false);
      });
  }

  ejecutarGuardarSnapshotPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorCierreOperativo.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .guardarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo guardar la version revisable.';
          throw new Error(msg);
        }
        this.aplicarSnapshotActivo(r.snapshot);
        this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
        this.errorAprobacionOperativa.set(null);
        this.errorCierreOperativo.set(null);
        void this.cargarSnapshotCompletoActivo(p);
        this.exitoGuardadoResultado.set(
          'Version revisable guardada correctamente. Revisa y confirma la nomina cuando corresponda.',
        );
      })
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  rehidratarPeriodoActivo(periodo: string): void {
    this.rehidratandoPeriodo.set(true);
    this.consultandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorAprobacionOperativa.set(null);
    this.errorCierreOperativo.set(null);
    this.errorSnapshotCompleto.set(null);
    this.exitoGuardadoResultado.set(null);

    void this.procesoMensual
      .rehidratarPeriodo(periodo)
      .then(({ snapshot, completo, liquidacionesGeneradas }) => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.liquidacionesGeneradasCount.set(liquidacionesGeneradas);
        if (snapshot) {
          this.resultado.set(null);
          this.preNomina.set(null);
          this.calculo.set(null);
          this.identificadorResultadoGuardadoActual.set(snapshot.hashSnapshot ?? null);
          this.aplicarSnapshotActivo(snapshot);
          this.snapshotCompleto.set(completo);
        } else {
          this.limpiarSenalesVolatiles();
        }
      })
      .catch((e: unknown) => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.limpiarSenalesVolatiles();
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (this.periodoSeleccionado() === periodo) {
          this.consultandoSnapshot.set(false);
          this.rehidratandoPeriodo.set(false);
        }
      });
  }

  verSnapshotActivo(): void {
    this.rehidratarPeriodoActivo(this.periodoSeleccionado());
  }

  consultarDetalleResultadoGuardado(): void {
    void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
  }

  asegurarSnapshotCompletoCargado(): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo) {
      return;
    }
    const completo = this.snapshotCompleto();
    if (
      completo?.cabecera.idCalculoPeriodo === snapshot.idCalculoPeriodo &&
      !this.errorSnapshotCompleto() &&
      !this.consultandoSnapshotCompleto()
    ) {
      return;
    }
    void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
  }

  resetearEstadoPeriodo(): void {
    this.limpiarSenalesVolatiles();
  }

  private limpiarSenalesVolatiles(): void {
    this.resultado.set(null);
    this.preNomina.set(null);
    this.calculo.set(null);
    this.snapshotActivo.set(null);
    this.snapshotCompleto.set(null);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorAprobacionOperativa.set(null);
    this.errorCierreOperativo.set(null);
    this.errorSnapshotCompleto.set(null);
    this.exitoGuardadoResultado.set(null);
    this.identificadorResultadoGuardadoActual.set(null);
    this.aprobacionOperativa.set(null);
    this.liquidacionesGeneradasCount.set(0);
  }

  recalcularYReemplazarSnapshot(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .reemplazarSnapshotPreliminar(p)
      .then((r) => {
        if (!r.ok || !r.snapshot) {
          const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo reemplazar la version revisable.';
          throw new Error(msg);
        }
        this.aplicarSnapshotActivo(r.snapshot);
        this.calculo.set(this.procesoMensual.obtenerResultadoCalculoPeriodo(p));
        this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
        this.errorAprobacionOperativa.set(null);
        void this.cargarSnapshotCompletoActivo(p);
        this.exitoGuardadoResultado.set(
          'Version revisable guardada correctamente. Revisa y confirma la nomina cuando corresponda.',
        );
      })
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  ejecutarAprobacionOperativa(advertenciasAprobacion: string[]): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo) return;
    this.aprobandoResultado.set(true);
    this.errorAprobacionOperativa.set(null);
    void this.procesoMensual
      .aprobarResultadoPreliminarOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo,
        periodo: this.periodoSeleccionado(),
        advertencias: advertenciasAprobacion,
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
      })
      .catch(() => {
        this.errorAprobacionOperativa.set(
          'No se pudo registrar la aprobacion operativa. Intenta nuevamente o revisa la conexion.',
        );
      })
      .finally(() => {
        this.aprobandoResultado.set(false);
      });
  }

  ejecutarAbrirNomina(input: { observacion?: string; forzar?: boolean } = {}): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo) return;
    const periodo = this.periodoSeleccionado();
    this.gestionandoAccionPeriodo.set(true);
    this.errorAccionPeriodo.set(null);
    this.exitoAccionPeriodo.set(null);
    void this.procesoMensual
      .reabrirNominaOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo,
        periodo,
        observacion: input.observacion,
        forzar: input.forzar,
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
        void this.cargarSnapshotCompletoActivo(periodo);
        this.exitoAccionPeriodo.set('La nómina volvió a revisión. Puede corregir datos antes de confirmarla nuevamente.');
      })
      .catch((e: unknown) => {
        this.errorAccionPeriodo.set(
          e instanceof Error ? e.message : 'No se pudo abrir la nómina del período.',
        );
      })
      .finally(() => {
        this.gestionandoAccionPeriodo.set(false);
      });
  }

  ejecutarDescartarNomina(motivo: string): void {
    const periodo = this.periodoSeleccionado();
    this.gestionandoAccionPeriodo.set(true);
    this.errorAccionPeriodo.set(null);
    this.exitoAccionPeriodo.set(null);
    void this.procesoMensual
      .anularSnapshotActivo(periodo, motivo)
      .then(() => {
        this.rehidratarPeriodoActivo(periodo);
        this.exitoAccionPeriodo.set('Se descartó la versión generada del período.');
      })
      .catch((e: unknown) => {
        this.errorAccionPeriodo.set(
          e instanceof Error ? e.message : 'No se pudo descartar la nómina generada.',
        );
      })
      .finally(() => {
        this.gestionandoAccionPeriodo.set(false);
      });
  }

  ejecutarCierreNominaOperativa(): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo) return;
    this.cerrandoNomina.set(true);
    this.errorCierreOperativo.set(null);
    void this.procesoMensual
      .cerrarNominaOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo,
        periodo: this.periodoSeleccionado(),
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
        void this.cargarSnapshotCompletoActivo(this.periodoSeleccionado());
      })
      .catch(() => {
        this.errorCierreOperativo.set('No se pudo cerrar operativamente la nomina. No se realizaron cambios parciales.');
      })
      .finally(() => {
        this.cerrandoNomina.set(false);
      });
  }

  private cargarSnapshotActivo(periodo: string): Promise<void> {
    return this.procesoMensual.obtenerSnapshotActivo(periodo).then((snapshot) => {
      this.aplicarSnapshotActivo(snapshot);
      return this.cargarSnapshotCompletoActivo(periodo);
    });
  }

  private cargarSnapshotCompletoActivo(periodo: string): Promise<void> {
    this.consultandoSnapshotCompleto.set(true);
    this.errorSnapshotCompleto.set(null);
    return this.procesoMensual
      .obtenerSnapshotCompletoActivo(periodo)
      .then((snapshot) => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.snapshotCompleto.set(snapshot);
      })
      .catch(() => {
        if (this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.snapshotCompleto.set(null);
        this.errorSnapshotCompleto.set(
          'No se pudo cargar el detalle del resultado guardado. Intenta nuevamente o revisa la conexion.',
        );
      })
      .finally(() => {
        this.consultandoSnapshotCompleto.set(false);
      });
  }

  private aplicarSnapshotActivo(snapshot: NominaCalculoPeriodoSnapshot | null): void {
    this.snapshotActivo.set(snapshot);
    this.aprobacionOperativa.set(snapshot ? this.aprobacionDesdeSnapshot(snapshot) : null);
  }

  private aprobacionDesdeSnapshot(snapshot: NominaCalculoPeriodoSnapshot): AprobacionOperativaRegistroView | null {
    const aprobacion = snapshot.aprobacionOperativa;
    if (!aprobacion) return null;
    return {
      fechaAprobacionLabel: formatoFechaHoraNomina(aprobacion.fecha),
      usuarioLabel: aprobacion.usuarioLabel || 'Usuario no disponible en esta sesion',
      versionCalculoLabel: snapshot.versionMotor || 'Version no disponible',
      identificadorTecnicoLabel: snapshot.hashSnapshot || 'Referencia interna no disponible',
      identificadorResultado: snapshot.hashSnapshot ?? null,
      idCalculoPeriodo: snapshot.idCalculoPeriodo ?? null,
      trabajadoresCalculados: snapshot.totalTrabajadores,
      totalHaberesLabel: formatoMontoNomina(snapshot.totalHaberes),
      totalDescuentosLabel: formatoMontoNomina(snapshot.totalDescuentos),
      totalLiquidoLabel: formatoMontoNomina(snapshot.totalLiquido),
      advertencias: aprobacion.advertencias,
    };
  }
}
