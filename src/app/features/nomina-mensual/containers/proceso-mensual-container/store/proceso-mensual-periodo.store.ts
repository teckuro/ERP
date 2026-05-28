import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import { PeriodoActivoService } from '../../../../../core/services/periodo-activo.service';
import type { EntradaMensualPeriodo } from '../../../entradas/models/entrada-mensual-periodo.model';
import type {
  MotorCalculoPeriodoResultado,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../../../models/proceso-mensual.model';
import { ProcesoMensualService } from '../../../services/proceso-mensual.service';
import {
  detectarDriftConsultaParametros,
  detectarDriftParametros,
  esDiagnosticoSoloParametros,
  extraerConsultaParametrosPeriodo,
  mergeParametrosEnPrevalidacion,
  type ConsultaParametrosPeriodoVm,
  type DriftParametrosVm,
} from '../../../rules/proceso-mensual-parametros-refresh.rules';
import { buildPrevalidacionLecturaDesdeBorrador } from '../../../rules/proceso-mensual-borrador-snapshot.rules';
import type { AprobacionOperativaRegistroView } from '../models/proceso-mensual-container.vm';
import { formatoFechaHoraNomina, formatoMontoNomina } from '../utils/proceso-mensual-presentacion.formato';

function mensajeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

function errorConContexto(prefix: string, error: unknown, fallback: string): string {
  const detalle = mensajeError(error, fallback);
  return detalle.includes(prefix) ? detalle : `${prefix}: ${detalle}`;
}

@Injectable()
export class ProcesoMensualPeriodoStore {
  readonly periodoActivo = inject(PeriodoActivoService);
  readonly procesoMensual = inject(ProcesoMensualService);

  readonly periodoSeleccionado = computed(() => this.periodoActivo.periodoYm());
  readonly resultado = signal<ProcesoMensualPrevalidacion | null>(null);
  /** Consulta PG del tile Parámetros sin sustituir verificación del período. */
  readonly consultaParametrosPeriodo = signal<ConsultaParametrosPeriodoVm | null>(null);
  readonly preNomina = signal<ProcesoMensualPreNominaPeriodo | null>(null);
  readonly calculo = signal<MotorCalculoPeriodoResultado | null>(null);
  readonly snapshotActivo = signal<NominaCalculoPeriodoSnapshot | null>(null);
  readonly validando = signal(false);
  readonly consultandoParametros = signal(false);
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
  readonly historialSnapshotsPeriodo = signal<NominaCalculoPeriodoSnapshot[]>([]);
  readonly rehidratandoPeriodo = signal(false);
  readonly liquidacionesGeneradasCount = signal(0);
  /** Entradas del período recargadas desde BD cuando el snapshot no trae metadata. */
  readonly entradasMensualesPeriodoCache = signal<EntradaMensualPeriodo[]>([]);
  readonly gestionandoAccionPeriodo = signal(false);
  readonly errorAccionPeriodo = signal<string | null>(null);
  readonly exitoAccionPeriodo = signal<string | null>(null);

  /** Invalida respuestas de rehidratación anteriores (p. ej. doble effect o generar en curso). */
  private rehidratarSeq = 0;

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
      this.rehidratandoPeriodo() ||
      this.consultandoSnapshot() ||
      this.consultandoSnapshotCompleto() ||
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
      .then(async (r) => {
        this.resultado.set(r);
        this.consultaParametrosPeriodo.set(null);
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
        try {
          await this.procesoMensual.guardarDiagnosticoPeriodo(p, r);
        } catch {
          // La verificación en memoria sigue disponible aunque falle la persistencia.
        }
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

  async refrescarParametrosPeriodo(): Promise<DriftParametrosVm | null> {
    const p = this.periodoSeleccionado();
    let antes = this.resultado();
    const antesParam = this.consultaParametrosPeriodo();
    const snapshot = this.snapshotActivo();
    if (!antes && snapshot?.borradorPersist) {
      antes = buildPrevalidacionLecturaDesdeBorrador(p, snapshot.borradorPersist);
    }
    this.consultandoParametros.set(true);
    this.errorEjecucion.set(null);
    try {
      const consulta = await this.procesoMensual.consultarEstadoParametrosPeriodo(p);
      const slice = extraerConsultaParametrosPeriodo(consulta);
      if (!antes) {
        this.consultaParametrosPeriodo.set(slice);
        return detectarDriftConsultaParametros(antesParam, slice);
      }
      const aislarGeneracionNomina = !!(this.preNomina() || this.calculo() || this.snapshotActivo());
      const despues = mergeParametrosEnPrevalidacion(antes, consulta, { aislarGeneracionNomina });
      this.resultado.set(despues);
      this.consultaParametrosPeriodo.set(slice);
      const drift = detectarDriftParametros(antes, despues);
      try {
        await this.procesoMensual.guardarDiagnosticoPeriodo(p, despues);
      } catch {
        // La consulta en memoria sigue disponible aunque falle la persistencia.
      }
      return drift;
    } catch (e: unknown) {
      this.errorEjecucion.set(mensajeError(e, 'No se pudo consultar el estado de parámetros del período.'));
      return null;
    } finally {
      this.consultandoParametros.set(false);
    }
  }

  generarPreNomina(): void {
    const p = this.periodoSeleccionado();
    this.rehidratarSeq++;
    this.generandoPreNomina.set(true);
    this.errorEjecucion.set(null);
    void (async () => {
      try {
        const r = await this.procesoMensual.generarPreNominaPeriodo(p);
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
        if (r.estado !== 'NO_GENERABLE') {
          try {
            await this.persistirBaseNominaBorrador(p, r, true, this.resultado());
            try {
              await this.procesoMensual.cerrarDiagnosticoPeriodo(p, 'borrador_generado');
            } catch {
              // El borrador persistido no depende del cierre del diagnóstico.
            }
            await this.ejecutarCalculoPreliminarTrasGenerar(p);
            // Guardado automático: evita perder el resultado tras F5 (cache motor se pierde).
            const guardado = await this.procesoMensual.guardarSnapshotPreliminar(p, {
              prevalidacion: this.resultado(),
            });
            if (!guardado.ok || !guardado.snapshot) {
              const msg =
                guardado.issues.map((i) => i.mensaje).join(' ')
                || 'No se pudo guardar la versión revisable del período.';
              throw new Error(msg);
            }
            this.aplicarSnapshotActivo(guardado.snapshot);
            this.preNomina.set(null);
            this.identificadorResultadoGuardadoActual.set(guardado.snapshot.hashSnapshot ?? null);
            void this.cargarSnapshotCompletoActivo(p);
            this.exitoGuardadoResultado.set('Versión revisable guardada correctamente.');
          } catch (e: unknown) {
            this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
          }
        }
      } catch (e: unknown) {
        this.preNomina.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      } finally {
        this.generandoPreNomina.set(false);
      }
    })();
  }

  guardarBaseNominaRevisada(): void {
    const preNomina = this.preNomina();
    if (!preNomina) return;
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorGuardadoResultado.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.persistirBaseNominaBorrador(p, preNomina, true, this.resultado())
      .catch((e: unknown) => {
        this.errorGuardadoResultado.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.guardandoSnapshot.set(false);
      });
  }

  calcularPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.calculandoPreliminar.set(true);
    this.errorEjecucion.set(null);
    void this.ejecutarCalculoPreliminarTrasGenerar(p)
      .catch((e: unknown) => {
        this.calculo.set(null);
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        this.calculandoPreliminar.set(false);
      });
  }

  private async ejecutarCalculoPreliminarTrasGenerar(periodo: string): Promise<void> {
    const r = await this.procesoMensual.generarCalculoPeriodo(periodo);
    this.calculo.set(r);
    this.errorGuardadoResultado.set(null);
    this.errorAprobacionOperativa.set(null);
    this.exitoGuardadoResultado.set(null);
    this.identificadorResultadoGuardadoActual.set(null);
    this.snapshotCompleto.set(null);
    this.errorSnapshotCompleto.set(null);
  }

  ejecutarGuardarSnapshotPreliminar(): void {
    const p = this.periodoSeleccionado();
    this.guardandoSnapshot.set(true);
    this.errorEjecucion.set(null);
    this.errorGuardadoResultado.set(null);
    this.errorCierreOperativo.set(null);
    this.exitoGuardadoResultado.set(null);
    void this.procesoMensual
      .guardarSnapshotPreliminar(p, { prevalidacion: this.resultado() })
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
    const seq = ++this.rehidratarSeq;
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
      .then(({ snapshot, completo, liquidacionesGeneradas, prevalidacionDiagnostico }) => {
        if (seq !== this.rehidratarSeq || this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.liquidacionesGeneradasCount.set(liquidacionesGeneradas);
        if (snapshot) {
          if (prevalidacionDiagnostico) {
            this.aplicarPrevalidacionDiagnosticoRehidratado(prevalidacionDiagnostico);
          } else {
            this.resultado.set(null);
            this.consultaParametrosPeriodo.set(null);
          }
          this.preNomina.set(null);
          this.calculo.set(null);
          this.identificadorResultadoGuardadoActual.set(snapshot.hashSnapshot ?? null);
          this.aplicarSnapshotActivo(snapshot);
          this.snapshotCompleto.set(completo);
          const necesitaCompleto =
            snapshot.idCalculoPeriodo
            && (!completo || completo.trabajadores.length === 0);
          if (necesitaCompleto) {
            void this.cargarSnapshotCompletoActivo(periodo);
          }
          void this.complementarEntradasMensualesPeriodo(periodo, snapshot);
        } else {
          this.entradasMensualesPeriodoCache.set([]);
          this.vaciarSnapshotYCalculoVolatil();
          if (prevalidacionDiagnostico) {
            this.aplicarPrevalidacionDiagnosticoRehidratado(prevalidacionDiagnostico);
          } else {
            this.resultado.set(null);
            this.consultaParametrosPeriodo.set(null);
          }
        }
        void this.cargarHistorialSnapshotsPeriodo(periodo, seq);
      })
      .catch((e: unknown) => {
        if (seq !== this.rehidratarSeq || this.periodoSeleccionado() !== periodo) {
          return;
        }
        if (!this.snapshotActivo()) {
          this.limpiarSenalesVolatiles();
        }
        this.errorEjecucion.set(e instanceof Error ? e.message : String(e));
        void this.cargarHistorialSnapshotsPeriodo(periodo, seq);
      })
      .finally(() => {
        if (seq === this.rehidratarSeq && this.periodoSeleccionado() === periodo) {
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

  private aplicarPrevalidacionDiagnosticoRehidratado(prevalidacion: ProcesoMensualPrevalidacion): void {
    if (esDiagnosticoSoloParametros(prevalidacion)) {
      this.resultado.set(null);
      this.consultaParametrosPeriodo.set(extraerConsultaParametrosPeriodo(prevalidacion));
      return;
    }
    this.resultado.set(prevalidacion);
    this.consultaParametrosPeriodo.set(null);
  }

  private vaciarSnapshotYCalculoVolatil(): void {
    this.preNomina.set(null);
    this.calculo.set(null);
    this.snapshotActivo.set(null);
    this.snapshotCompleto.set(null);
    this.identificadorResultadoGuardadoActual.set(null);
    this.aprobacionOperativa.set(null);
    this.entradasMensualesPeriodoCache.set([]);
    this.errorGuardadoResultado.set(null);
    this.errorAprobacionOperativa.set(null);
    this.errorCierreOperativo.set(null);
    this.errorSnapshotCompleto.set(null);
    this.exitoGuardadoResultado.set(null);
  }

  private async complementarEntradasMensualesPeriodo(
    periodo: string,
    snapshot: NominaCalculoPeriodoSnapshot,
  ): Promise<void> {
    const desdeMetadata = snapshot.borradorPersist?.entradasMensuales ?? [];
    if (desdeMetadata.length > 0) {
      this.entradasMensualesPeriodoCache.set(desdeMetadata);
      return;
    }
    try {
      const entradas = await this.procesoMensual.listarEntradasMensualesPeriodo(periodo);
      if (this.periodoSeleccionado() !== periodo) {
        return;
      }
      this.entradasMensualesPeriodoCache.set(entradas ?? []);
    } catch {
      if (this.periodoSeleccionado() === periodo) {
        this.entradasMensualesPeriodoCache.set([]);
      }
    }
  }

  private limpiarSenalesVolatiles(): void {
    this.vaciarSnapshotYCalculoVolatil();
    this.resultado.set(null);
    this.consultaParametrosPeriodo.set(null);
    this.historialSnapshotsPeriodo.set([]);
    this.errorEjecucion.set(null);
    this.liquidacionesGeneradasCount.set(0);
  }

  private async persistirBaseNominaBorrador(
    periodo: string,
    preNomina: ProcesoMensualPreNominaPeriodo,
    permitirAdvertencias: boolean,
    prevalidacion?: ProcesoMensualPrevalidacion | null,
  ): Promise<void> {
    this.guardandoSnapshot.set(true);
    try {
      const r = await this.procesoMensual.guardarBaseNominaBorrador(
        periodo,
        preNomina,
        prevalidacion ?? undefined,
        { permitirAdvertencias },
      );
      if (!r.ok || !r.snapshot) {
        const msg = r.issues.map((i) => i.mensaje).join(' ') || 'No se pudo guardar la base generada.';
        throw new Error(msg);
      }
      this.aplicarSnapshotActivo(r.snapshot);
      this.identificadorResultadoGuardadoActual.set(r.snapshot.hashSnapshot ?? null);
      this.errorSnapshotCompleto.set(null);
      void this.cargarSnapshotCompletoActivo(periodo);
      this.exitoGuardadoResultado.set('Base generada guardada. Al volver al periodo podras continuar la revision.');
    } finally {
      this.guardandoSnapshot.set(false);
    }
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

  ejecutarAprobacionOperativa(advertenciasAprobacion: string[] = []): void {
    const snapshot = this.snapshotActivo();
    if (!snapshot?.idCalculoPeriodo) return;
    this.aprobandoResultado.set(true);
    this.errorAprobacionOperativa.set(null);
    void this.procesoMensual
      .aprobarResultadoPreliminarOperativamente({
        idCalculoPeriodo: snapshot.idCalculoPeriodo,
        periodo: this.periodoSeleccionado(),
        advertencias: advertenciasAprobacion ?? [],
      })
      .then((persistido) => {
        this.aplicarSnapshotActivo(persistido);
      })
      .catch((e: unknown) => {
        this.errorAprobacionOperativa.set(
          errorConContexto(
            'No se pudo registrar la aprobacion operativa',
            e,
            'Intenta nuevamente o revisa la conexion.',
          ),
        );
      })
      .finally(() => {
        this.aprobandoResultado.set(false);
      });
  }

  /** Confirma el período en un solo paso: registra revisión + cierre operativo. */
  ejecutarConfirmarNominaOperativa(advertenciasAprobacion: string[] = []): void {
    const snapshot = this.snapshotActivo();
    const idCalculoPeriodo = snapshot?.idCalculoPeriodo;
    if (!idCalculoPeriodo) return;
    const periodo = this.periodoSeleccionado();
    this.gestionandoAccionPeriodo.set(true);
    this.errorAccionPeriodo.set(null);
    this.exitoAccionPeriodo.set(null);
    this.errorAprobacionOperativa.set(null);
    this.errorCierreOperativo.set(null);
    void (async () => {
      try {
        const aprobado = await this.procesoMensual.aprobarResultadoPreliminarOperativamente({
          idCalculoPeriodo,
          periodo,
          advertencias: advertenciasAprobacion ?? [],
        });
        this.aplicarSnapshotActivo(aprobado);

        const cerrado = await this.procesoMensual.cerrarNominaOperativamente({
          idCalculoPeriodo,
          periodo,
        });
        this.aplicarSnapshotActivo(cerrado);
        const liq = await this.procesoMensual.contarLiquidacionesGeneradas(
          periodo,
          cerrado.idCalculoPeriodo ?? null,
        );
        this.liquidacionesGeneradasCount.set(liq);
        void this.cargarSnapshotCompletoActivo(periodo);
        this.exitoAccionPeriodo.set('La nómina quedó confirmada como base oficial del período.');
      } catch (e: unknown) {
        // Si falla el cierre tras aprobar, dejamos el snapshot aprobado y exponemos error de cierre.
        const msg = e instanceof Error ? e.message : String(e);
        if (this.snapshotActivo()?.aprobacionOperativa?.estado === 'aprobado_operativamente') {
          this.errorCierreOperativo.set(
            errorConContexto(
              'No se pudo cerrar operativamente la nomina',
              e,
              'La revisión quedó registrada. Reintenta la confirmación para cerrar.',
            ),
          );
        } else {
          this.errorAprobacionOperativa.set(
            errorConContexto(
              'No se pudo registrar la aprobacion operativa',
              e,
              msg || 'Intenta nuevamente o revisa la conexion.',
            ),
          );
        }
      } finally {
        this.gestionandoAccionPeriodo.set(false);
      }
    })();
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
      .catch((e: unknown) => {
        this.errorCierreOperativo.set(
          errorConContexto(
            'No se pudo cerrar operativamente la nomina',
            e,
            'No se realizaron cambios parciales.',
          ),
        );
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

  private cargarHistorialSnapshotsPeriodo(periodo: string, seq: number): Promise<void> {
    return this.procesoMensual
      .listarSnapshotsPeriodo(periodo)
      .then((items) => {
        if (seq !== this.rehidratarSeq || this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.historialSnapshotsPeriodo.set(items ?? []);
      })
      .catch(() => {
        if (seq !== this.rehidratarSeq || this.periodoSeleccionado() !== periodo) {
          return;
        }
        this.historialSnapshotsPeriodo.set([]);
      });
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
