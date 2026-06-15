/**
 * Servicio productivo de Nómina mensual (rebuild Admin + Generador).
 *
 * Creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (F3b, 2026-06-04).
 *
 * Implementa el contrato declarado en F1 (mock adapter) contra BD real vía
 * `NominaPeriodoRepository`. Reglas de oro que conserva del mock:
 *   - Idempotencia de `aplicarRecurrentesANomina` (clave nómina+persona+recurrente+tipo).
 *   - Respeto de movimientos omitidos: no se reaplican.
 *   - Toda acción masiva pasa por `previsualizarAccionMasiva` antes de ejecutar.
 *
 * Diferencias con el mock:
 *   - Todos los métodos son async.
 *   - `crearNominaPeriodo` persiste y dispara el evento de auditoría vía trigger.
 *   - `cerrarNomina` / `reabrirNomina` cambian estado en BD y dispara auditoría.
 *   - Dotación se construye uniendo `segmento_nomina.trabajador_ids` + `persona`.
 *
 * Documento rector: `docs/codex/modulos/nomina-mensual/arquitectura-administrador-generador.md`.
 */

import { computed, inject, Injectable, signal } from '@angular/core';

import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import { injectSupabase } from '../../../core/services/supabase.service';
import { NominaPeriodoRepository } from '../data-access/nomina-periodo.repository';
import type { Database } from '../../../core/models/database.types';

type NominaPeriodoUpdate = Database['public']['Tables']['nomina_periodo']['Update'];
import type {
  DetalleTrabajadorNomina,
  EstadoNomina,
  EventoAuditoriaNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
  IncidenciaNomina,
  NominaPeriodo,
  NominaPeriodoResumen,
  PaginacionGrilla,
  ResumenValidacionNomina,
  SegmentoNomina,
  SegmentoNominaNuevo,
  TipoNomina,
} from '../models/nomina-periodo.models';
import { derivarIdentidadNominaMensual } from '../models/nomina-periodo.models';
import type {
  ConfirmarCreacionRequest,
  ConfirmarCreacionResultado,
  NominaCreatePreview,
  NominaCreatePreviewRequest,
} from '../models/nomina-creacion-preview.models';
import type {
  AccionMasivaTrabajadores,
  CriterioAplicacionRecurrente,
  EstadoItemMovimiento,
  EstadoMovimientoConfiguradoEnNomina,
  FilaMovimientoConfigurado,
  FilaTrabajadorMovimientos,
  ItemMovimientoTrabajador,
  MovimientoNomina,
  MovimientoNominaNuevo,
  MovimientoRecurrente,
  PreviewAccionMasivaTrabajadores,
} from '../models/movimiento-nomina.models';
import type {
  PayrollStepId,
  ResultadoAlcanceNomina,
} from '../../nomina-mensual-v2/models/nomina-mensual-v2.models';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import {
  estadoNominaBloqueaEdicion,
  exigirTransicionNomina,
} from '../rules/nomina-periodo-state.rules';

export interface CrearNominaPayload {
  periodo: string;
  tipo: TipoNomina;
  empresaId?: string;
  empresaNombre?: string;
}

export interface CerrarNominaPayload {
  motivo?: string;
}

export interface ReabrirNominaPayload {
  motivo: string;
}

interface PersonaResumenRow {
  id_persona: number;
  rut: string;
  dv: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
}

@Injectable({ providedIn: 'root' })
export class NominaPeriodoService {
  private readonly repo = inject(NominaPeriodoRepository);
  private readonly empresaActiva = inject(EmpresaActivaService);
  private readonly supabase = injectSupabase();
  private readonly empleados = inject(EmpleadosService);

  private readonly resumenesState = signal<NominaPeriodoResumen[]>([]);
  private readonly cargandoState = signal(false);

  /**
   * Cache de dedupe para `registrarPasoVisitado`. Solo se llama al RPC si el
   * paso cambió respecto a la última vez que escribimos en esta sesión.
   * Evita escrituras innecesarias cuando el `effect` se re-evalúa sin que
   * `currentStep()` haya cambiado.
   */
  private readonly ultimoPasoRegistrado = new Map<string, PayrollStepId>();

  /**
   * Cache de dedupe para `registrarPasoCompletado`. Es monótono creciente:
   * solo llamamos al RPC si el paso supera al último registrado en esta
   * sesión (el RPC server-side también es monótono, esto solo evita la
   * ida-vuelta innecesaria).
   */
  private readonly ultimoPasoCompletadoRegistrado = new Map<string, PayrollStepId>();

  private readonly ORDEN_PASOS_PAYROLL: readonly PayrollStepId[] = [
    'parameters',
    'dotacion',
    'movements',
    'calculation',
    'validation',
    'closure',
  ];

  readonly resumenes = computed(() => this.resumenesState());
  readonly cargando = computed(() => this.cargandoState());

  // -------------------------------------------------------------------------
  // Listado / lectura
  // -------------------------------------------------------------------------

  /** Lista resúmenes para el Administrador filtrados por empresa activa. */
  async listarResumenes(): Promise<NominaPeriodoResumen[]> {
    this.cargandoState.set(true);
    try {
      const idEmpresa = await this.resolverEmpresaActiva();
      if (idEmpresa == null) {
        this.resumenesState.set([]);
        return [];
      }
      const resumenes = await this.repo.listarResumenes(idEmpresa);
      this.resumenesState.set(resumenes);
      return resumenes;
    } finally {
      this.cargandoState.set(false);
    }
  }

  /** Obtiene una nómina completa por id (cabecera + segmentos + movimientos + incidencias). */
  async obtenerNomina(nominaPeriodoId: string): Promise<NominaPeriodo | null> {
    return this.repo.obtenerNominaCompleta(nominaPeriodoId);
  }

  // -------------------------------------------------------------------------
  // CRUD cabecera
  // -------------------------------------------------------------------------

  /**
   * Previsualiza la creación de una nómina mensual antes de confirmar (F04).
   * Devuelve incluidos/excluidos/conflictos y un `fingerprint` determinista
   * que F05 valida antes de persistir. No escribe.
   */
  async previsualizarCreacion(
    request: NominaCreatePreviewRequest,
  ): Promise<NominaCreatePreview> {
    return this.repo.previsualizarCreacion(request);
  }

  /**
   * Confirma la creación atómica de cabecera + dotación + auditoría (F05).
   * La BD valida el `fingerprint` emitido por F04 y aplica idempotencia
   * (si ya existe una nómina no anulada para empresa+período, la retorna
   * sin crear duplicado).
   */
  async confirmarCreacion(
    request: ConfirmarCreacionRequest,
  ): Promise<ConfirmarCreacionResultado> {
    return this.repo.confirmarCreacion(request);
  }

  /**
   * Crea una nómina mensual desde la UI clásica del modal (compatibilidad).
   * Tras F05, este método delega en `confirmar_creacion_nomina` mediante un
   * preview implícito: previsualiza, valida que no haya conflictos y
   * confirma con el `fingerprint` vigente. Toda la dotación y la auditoría
   * se persisten server-side en una sola transacción.
   */
  async crearNominaPeriodo(payload: CrearNominaPayload): Promise<NominaPeriodoResumen> {
    if (payload.tipo !== 'mensual') {
      throw new Error('Solo se admiten nóminas mensuales en este flujo.');
    }

    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) {
      throw new Error('No hay empresa activa para crear la nómina.');
    }

    try {
      const preview = await this.repo.previsualizarCreacion({
        periodo: payload.periodo,
        tipo: payload.tipo,
      });
      const resultado = await this.repo.confirmarCreacion({
        periodo: payload.periodo,
        tipo: payload.tipo,
        fingerprint: preview.fingerprint,
      });
      const cabecera = await this.repo.obtenerCabecera(resultado.idNominaPeriodo);
      if (cabecera) return cabecera;
      throw new Error('crearNominaPeriodo: BD no retornó la cabecera creada.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (/duplicate|unique|duplic/i.test(mensaje)) {
        throw new Error('Ya existe una nómina mensual legal para esa empresa y período.');
      }
      throw error;
    }
  }

  async guardarParametrosNomina(
    nominaPeriodoId: string,
    cambios: { fechaPago?: string | null; estado?: EstadoNomina },
  ): Promise<void> {
    const update: NominaPeriodoUpdate = {};
    if (cambios.fechaPago !== undefined) update.fecha_pago = cambios.fechaPago;
    if (cambios.estado !== undefined) update.estado = cambios.estado;
    if (Object.keys(update).length === 0) return;

    const { error } = await this.supabase
      .from('nomina_periodo')
      .update(update)
      .eq('id', nominaPeriodoId);
    if (error) {
      throw new Error(`guardarParametrosNomina: ${error.message}`);
    }
  }

  async cerrarNomina(nominaPeriodoId: string, payload: CerrarNominaPayload = {}): Promise<void> {
    const nomina = await this.exigirNomina(nominaPeriodoId);
    const validacion = await this.obtenerResumenValidacionNomina(nominaPeriodoId);
    if (
      (nomina.estado !== 'aprobada' && nomina.estado !== 'liquidada')
      || !validacion.puedeCerrar
    ) {
      throw new Error(
        'La nómina debe estar aprobada o liquidada, con cálculo vigente y sin bloqueos.',
      );
    }
    await this.transicionar(nomina, 'cerrada', payload.motivo);
  }

  /**
   * Registra el último paso del Generador visitado para una nómina. Metadata
   * UX exclusivamente:
   *
   * - Dedupe en memoria: si el paso ya coincide con el último registrado en
   *   esta sesión, no se invoca al RPC (evita ruido en BD y red).
   * - Tolerante a errores: si el RPC falla (por ejemplo, la migración aún no
   *   se aplicó, RLS o red), se traga el error y se loguea con `console.warn`
   *   en vez de propagarlo. La UI no debe romperse por no poder persistir
   *   este dato.
   */
  async registrarPasoVisitado(nominaPeriodoId: string, paso: PayrollStepId): Promise<void> {
    if (!nominaPeriodoId || !paso) return;

    const previo = this.ultimoPasoRegistrado.get(nominaPeriodoId);
    if (previo === paso) return;

    this.ultimoPasoRegistrado.set(nominaPeriodoId, paso);
    try {
      await this.repo.actualizarUltimoPasoVisitado(nominaPeriodoId, paso);
    } catch (error) {
      this.ultimoPasoRegistrado.delete(nominaPeriodoId);
      const mensaje = error instanceof Error ? error.message : String(error);
      console.warn('[NominaPeriodoService] No se pudo persistir el paso visitado:', mensaje);
    }
  }

  /**
   * Registra el máximo paso del Generador completado por el usuario (criterio
   * UI: "poblado correctamente"). Es monótono creciente:
   *
   * - Dedupe en memoria: solo llama al RPC si el paso es estrictamente mayor
   *   que el último registrado en esta sesión. El RPC server-side también
   *   ignora regresiones (no-op idempotente), pero el cliente evita el
   *   round-trip.
   * - Tolerante a errores: si el RPC falla, se traga el error con
   *   `console.warn`. La UI no debe romperse por no poder persistir avance.
   */
  async registrarPasoCompletado(nominaPeriodoId: string, paso: PayrollStepId): Promise<void> {
    if (!nominaPeriodoId || !paso) return;

    const indiceNuevo = this.ORDEN_PASOS_PAYROLL.indexOf(paso);
    if (indiceNuevo < 0) return;

    const previo = this.ultimoPasoCompletadoRegistrado.get(nominaPeriodoId);
    if (previo) {
      const indicePrevio = this.ORDEN_PASOS_PAYROLL.indexOf(previo);
      if (indiceNuevo <= indicePrevio) return;
    }

    this.ultimoPasoCompletadoRegistrado.set(nominaPeriodoId, paso);
    try {
      await this.repo.actualizarMaximoPasoCompletado(nominaPeriodoId, paso);
    } catch (error) {
      // Si la RPC falla, retroceder al previo o limpiar para reintentar.
      if (previo) {
        this.ultimoPasoCompletadoRegistrado.set(nominaPeriodoId, previo);
      } else {
        this.ultimoPasoCompletadoRegistrado.delete(nominaPeriodoId);
      }
      const mensaje = error instanceof Error ? error.message : String(error);
      console.warn('[NominaPeriodoService] No se pudo persistir el paso completado:', mensaje);
    }
  }

  async reabrirNomina(nominaPeriodoId: string, payload: ReabrirNominaPayload): Promise<void> {
    const nomina = await this.exigirNomina(nominaPeriodoId);
    await this.transicionar(nomina, 'reabierta', payload.motivo);
    await this.repo.invalidarCalculo(nominaPeriodoId);
  }

  /**
   * @deprecated Usar `eliminarNomina`. Conserva la guarda histórica de
   * `estado='borrador'` solo a nivel del repositorio. Se mantiene para no
   * romper consumidores externos hasta migración total.
   */
  async eliminarBorrador(nominaPeriodoId: string): Promise<void> {
    await this.repo.eliminarBorrador(nominaPeriodoId);
  }

  /**
   * Elimina físicamente una nómina y, en cascada, todos sus datos (segmentos,
   * movimientos, incidencias, eventos de auditoría).
   *
   * **No se puede deshacer**: la guarda de qué estados son eliminables vive en
   * `puedeEliminar()` (reglas) — los estados productivos (`calculada`,
   * `validada`, `aprobada`, `cerrada`, `reabierta`) NO deberían llegar aquí
   * porque el botón de UI no aparece. Si alguien fuerza la llamada con un
   * estado bloqueado, BD aceptará el DELETE igual: la única protección extra
   * sería un trigger SQL o un check en RLS — fuera del scope de este cambio.
   *
   * Esta operación libera el slot `UNIQUE (empresa, periodo, tipo)` para que
   * el usuario pueda rehacer la nómina del período sin colisionar con un
   * registro zombie anulado.
   */
  async eliminarNomina(nominaPeriodoId: string): Promise<void> {
    await this.repo.eliminarNomina(nominaPeriodoId);
  }

  async confirmarDotacion(nominaPeriodoId: string): Promise<void> {
    let nomina = await this.exigirNominaEditable(nominaPeriodoId);
    if (nomina.trabajadorIds.length === 0) {
      throw new Error('La dotación debe incluir al menos un trabajador.');
    }
    if (nomina.estado === 'borrador') {
      await this.transicionar(nomina, 'dotacion_generada');
      nomina = await this.exigirNomina(nominaPeriodoId);
    }
    if (nomina.estado === 'dotacion_generada') {
      await this.transicionar(nomina, 'en_revision');
    } else if (nomina.estado !== 'en_revision' && nomina.estado !== 'reabierta') {
      await this.invalidarCalculoPorCambio(nominaPeriodoId, 'Dotación modificada.');
    }
    await this.repo.registrarEventoAuditoria({
      nominaPeriodoId,
      accion: 'dotacion_confirmada',
      motivo: `${nomina.trabajadorIds.length} trabajadores confirmados.`,
    });
  }

  async validarYAprobarNomina(nominaPeriodoId: string): Promise<void> {
    let nomina = await this.exigirNomina(nominaPeriodoId);
    const resumen = await this.obtenerResumenValidacionNomina(nominaPeriodoId);
    if (!resumen.puedeValidar) {
      throw new Error('La nómina requiere un cálculo vigente y no debe tener bloqueos.');
    }
    if (nomina.estado === 'calculada') {
      await this.transicionar(nomina, 'validada');
      nomina = await this.exigirNomina(nominaPeriodoId);
    }
    if (nomina.estado === 'validada') {
      await this.transicionar(nomina, 'aprobada');
    }
  }

  // -------------------------------------------------------------------------
  // Segmentos
  // -------------------------------------------------------------------------

  async listarSegmentos(nominaPeriodoId: string): Promise<SegmentoNomina[]> {
    return this.repo.listarSegmentos(nominaPeriodoId);
  }

  async actualizarSegmento(segmento: SegmentoNomina): Promise<SegmentoNomina> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) {
      throw new Error('No hay empresa activa para actualizar segmento.');
    }
    await this.exigirNominaEditable(segmento.nominaPeriodoId);
    const guardado = await this.repo.upsertSegmento(segmento, idEmpresa);
    await this.invalidarCalculoPorCambio(segmento.nominaPeriodoId, 'Segmento modificado.');
    return guardado;
  }

  async eliminarSegmento(segmentoId: string): Promise<void> {
    const segmento = await this.repo.obtenerSegmento(segmentoId);
    if (!segmento) throw new Error('Segmento no encontrado.');
    await this.exigirNominaEditable(segmento.nominaPeriodoId);
    await this.repo.eliminarSegmento(segmentoId);
    await this.invalidarCalculoPorCambio(segmento.nominaPeriodoId, 'Segmento eliminado.');
  }

  /**
   * Agrega trabajadores al segmento principal (el primero por ordinal) de la
   * nómina. Si no existe ningún segmento, crea uno llamado "Dotación principal".
   *
   * - Idempotente: si un id ya está en algún segmento de la nómina, se ignora.
   * - Actualiza el total de trabajadores de la cabecera.
   * - Invalida el cálculo si la dotación cambió.
   *
   * Devuelve los ids efectivamente agregados (los que no estaban).
   */
  async agregarTrabajadoresANomina(
    nominaPeriodoId: string,
    trabajadorIds: string[],
  ): Promise<{ agregados: string[]; yaEstaban: string[] }> {
    if (!nominaPeriodoId || trabajadorIds.length === 0) {
      return { agregados: [], yaEstaban: [] };
    }
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) {
      throw new Error('No hay empresa activa para incluir trabajadores.');
    }
    const nomina = await this.exigirNominaEditable(nominaPeriodoId);

    const idsExistentes = new Set(
      nomina.segmentos.flatMap((segmento) => segmento.trabajadorIds),
    );
    const idsUnicos = Array.from(new Set(trabajadorIds.map(String)));
    const agregados: string[] = [];
    const yaEstaban: string[] = [];
    for (const id of idsUnicos) {
      if (idsExistentes.has(id)) {
        yaEstaban.push(id);
      } else {
        agregados.push(id);
      }
    }
    if (agregados.length === 0) {
      return { agregados, yaEstaban };
    }

    const segmentosOrdenados = [...nomina.segmentos].sort(
      (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
    );
    const principal = segmentosOrdenados[0];

    if (principal) {
      const trabajadorIdsActualizados = Array.from(
        new Set([...principal.trabajadorIds, ...agregados]),
      );
      await this.repo.upsertSegmento(
        {
          ...principal,
          trabajadorIds: trabajadorIdsActualizados,
          totalTrabajadores: trabajadorIdsActualizados.length,
        },
        idEmpresa,
      );
    } else {
      const segmentoNuevo: SegmentoNominaNuevo = {
        nominaPeriodoId,
        nombre: 'Dotación principal',
        tipo: 'planta',
        estado: 'borrador',
        trabajadorIds: agregados,
        totalTrabajadores: agregados.length,
        totalIncidenciasCriticas: 0,
        totalAdvertencias: 0,
        ordinal: (nomina.segmentos.at(-1)?.ordinal ?? 0) + 1,
      };
      await this.repo.upsertSegmento(segmentoNuevo, idEmpresa);
    }

    const totalTrabajadores = new Set([
      ...idsExistentes,
      ...agregados,
    ]).size;
    await this.repo.actualizarTotales(nominaPeriodoId, { totalTrabajadores });

    if (nomina.estado === 'borrador') {
      await this.repo.transicionarEstado(nominaPeriodoId, {
        estadoEsperado: 'borrador',
        estadoDestino: 'dotacion_generada',
        versionEstadoEsperada: nomina.versionEstado,
      });
    } else {
      await this.invalidarCalculoPorCambio(
        nominaPeriodoId,
        `Dotación ampliada en ${agregados.length} trabajadores.`,
      );
    }

    return { agregados, yaEstaban };
  }

  // -------------------------------------------------------------------------
  // Movimientos recurrentes
  // -------------------------------------------------------------------------

  async listarRecurrentes(): Promise<MovimientoRecurrente[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return [];
    return this.repo.listarRecurrentes(idEmpresa);
  }

  // -------------------------------------------------------------------------
  // Movimientos de la nómina
  // -------------------------------------------------------------------------

  async listarMovimientos(nominaPeriodoId: string): Promise<MovimientoNomina[]> {
    return this.repo.listarMovimientos(nominaPeriodoId);
  }

  async omitirMovimiento(movimientoId: string): Promise<void> {
    const movimiento = await this.buscarMovimiento(movimientoId);
    await this.exigirNominaEditable(movimiento.nominaPeriodoId);
    await this.repo.actualizarEstadoMovimiento(movimientoId, 'omitido');
    await this.invalidarCalculoPorCambio(movimiento.nominaPeriodoId, 'Movimiento omitido.');
  }

  async aplicarMovimiento(movimientoId: string): Promise<void> {
    const movimiento = await this.buscarMovimiento(movimientoId);
    await this.exigirNominaEditable(movimiento.nominaPeriodoId);
    await this.repo.actualizarEstadoMovimiento(movimientoId, 'aplicado');
    await this.invalidarCalculoPorCambio(movimiento.nominaPeriodoId, 'Movimiento reaplicado.');
  }

  async agregarMovimientoManual(
    mov: Omit<MovimientoNominaNuevo, 'origen'>,
  ): Promise<MovimientoNomina[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) {
      throw new Error('No hay empresa activa para agregar movimiento.');
    }
    await this.exigirNominaEditable(mov.nominaPeriodoId);
    const insertados = await this.repo.insertarMovimientos(
      [{ ...mov, origen: 'manual' }],
      idEmpresa,
    );
    await this.invalidarCalculoPorCambio(mov.nominaPeriodoId, 'Movimiento manual agregado.');
    return insertados;
  }

  /**
   * Hard-delete de un movimiento manual aplicado u omitido. Solo admite items
   * con `origen='manual'`; los recurrentes no se eliminan físicamente (se
   * omiten o se desactiva el recurrente en la ficha).
   */
  async eliminarMovimientoManual(movimientoId: string): Promise<void> {
    const movimiento = await this.buscarMovimiento(movimientoId);
    if (movimiento.origen !== 'manual') {
      throw new Error('Solo los movimientos manuales se pueden eliminar.');
    }
    await this.exigirNominaEditable(movimiento.nominaPeriodoId);
    await this.repo.eliminarMovimiento(movimientoId);
    await this.invalidarCalculoPorCambio(
      movimiento.nominaPeriodoId,
      'Movimiento manual eliminado.',
    );
  }

  /**
   * Aplica recurrentes activos a una nómina.
   *
   * Reglas de oro:
   * 1. **Idempotencia**: si ya existe un `MovimientoNomina` con misma clave
   *    `(nominaPeriodoId, trabajadorId, recurrenteId, tipo)`, no se duplica.
   * 2. **Respeto de omitidos**: si existe con `estado='omitido'`, NO se reaplica.
   */
  async aplicarRecurrentesANomina(nominaPeriodoId: string): Promise<MovimientoNomina[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return [];

    const [nomina, recurrentes, movimientosExistentes] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarRecurrentesActivos(idEmpresa),
      this.repo.listarMovimientos(nominaPeriodoId),
    ]);
    if (!nomina) return [];
    if (estadoNominaBloqueaEdicion(nomina.estado)) {
      throw new Error(`La nómina ${nomina.estado} no admite cambios.`);
    }

    const nuevosInsertar: MovimientoNominaNuevo[] = [];

    for (const recurrente of recurrentes) {
      const trabajadores = this.resolverTrabajadoresParaRecurrente(nomina, recurrente);

      for (const trabajadorId of trabajadores) {
        const yaExiste = movimientosExistentes.find(
          (m) =>
            m.trabajadorId === trabajadorId &&
            m.recurrenteId === recurrente.id &&
            m.tipo === recurrente.tipo,
        );
        if (yaExiste) continue;

        const segmentoDelTrabajador = nomina.segmentos.find((s) =>
          s.trabajadorIds.includes(trabajadorId),
        );

        nuevosInsertar.push({
          nominaPeriodoId,
          trabajadorId,
          segmentoId: segmentoDelTrabajador?.id,
          tipo: recurrente.tipo,
          categoria: recurrente.categoria,
          monto: recurrente.monto,
          cantidad: recurrente.cantidad,
          unidad: recurrente.unidad,
          origen: 'recurrente',
          recurrenteId: recurrente.id,
          estado: 'aplicado',
          glosa: recurrente.glosa,
        });
      }
    }

    if (nuevosInsertar.length === 0) {
      return movimientosExistentes.filter(
        (m) => m.origen === 'recurrente' && m.estado === 'aplicado',
      );
    }

    const insertados = await this.repo.insertarMovimientos(nuevosInsertar, idEmpresa);
    await this.invalidarCalculoPorCambio(nominaPeriodoId, 'Recurrentes aplicados.');
    return [
      ...movimientosExistentes.filter(
        (m) => m.origen === 'recurrente' && m.estado === 'aplicado',
      ),
      ...insertados,
    ];
  }

  /**
   * Devuelve la vista derivada "Movimientos configurados" para la nómina.
   *
   * Cruza:
   *  - Recurrentes activos de la empresa.
   *  - Dotación de la nómina (intersección por scope del recurrente).
   *  - Movimientos ya existentes en este período (para calcular el estado).
   *
   * Solo lectura — NO inserta nada. Es lo que el usuario ve ANTES de pulsar
   * "Cargar movimientos configurados".
   *
   * Idempotencia preservada: si el recurrente ya se cargó (cualquier estado),
   * la fila aparece con `estadoEnNomina` apropiado y mantiene la referencia
   * al `movimiento_nomina` original. Esto evita "doble carga" desde la UI.
   */
  async listarMovimientosConfigurados(
    nominaPeriodoId: string,
  ): Promise<FilaMovimientoConfigurado[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return [];

    const [nomina, recurrentes, movimientosExistentes, dotacion] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarRecurrentesActivos(idEmpresa),
      this.repo.listarMovimientos(nominaPeriodoId),
      this.repo.listarDotacionPaginada(
        nominaPeriodoId,
        {},
        { page: 1, pageSize: 1000, total: 0 },
      ),
    ]);
    if (!nomina) return [];

    const identidades = new Map<string, FilaTrabajadorNominaResumen>();
    for (const fila of dotacion.filas) {
      identidades.set(fila.trabajadorId, fila);
    }

    const filas: FilaMovimientoConfigurado[] = [];
    for (const recurrente of recurrentes) {
      const trabajadores = this.resolverTrabajadoresParaRecurrente(nomina, recurrente);

      for (const trabajadorId of trabajadores) {
        const movimientoExistente = movimientosExistentes.find(
          (m) =>
            m.trabajadorId === trabajadorId &&
            m.recurrenteId === recurrente.id &&
            m.tipo === recurrente.tipo,
        );

        const estado: EstadoMovimientoConfiguradoEnNomina =
          movimientoExistente == null
            ? 'pendiente'
            : movimientoExistente.estado === 'omitido'
              ? 'omitido-este-mes'
              : 'ya-cargado';

        const identidad = identidades.get(trabajadorId);
        filas.push({
          filaId: `${trabajadorId}::${recurrente.id}::${recurrente.tipo}`,
          trabajadorId,
          trabajadorNombre: identidad?.nombre ?? 'Trabajador sin identificar',
          rut: identidad?.rut ?? '',
          cargo: identidad?.cargo,
          centroCosto: identidad?.centroCosto,
          recurrenteId: recurrente.id,
          concepto: recurrente.tipo,
          categoria: recurrente.categoria,
          monto: recurrente.monto,
          cantidad: recurrente.cantidad,
          unidad: recurrente.unidad,
          frecuencia: recurrente.frecuencia,
          vigenciaDesde: recurrente.activoDesde,
          vigenciaHasta: recurrente.activoHasta,
          glosa: recurrente.glosa,
          estadoEnNomina: estado,
          movimientoNominaId: movimientoExistente?.id,
        });
      }
    }

    return filas;
  }

  /**
   * Vista unificada del paso Movimientos: una fila por trabajador (toda la
   * dotación) con un sub-detalle de items (configurados + manuales) listo para
   * renderizar en `app-data-grid` con `expandableRows`.
   *
   * Alineada con el principio rector "trabajo por excepción": el usuario ve
   * el resumen del trabajador y solo expande cuando necesita detalle.
   *
   * Agregaciones (estables, ver specs):
   *  - `totalHaberes` / `totalDescuentos`: suma de `monto` de items con
   *    `estado='aplicado'`. Refleja lo que entra al cálculo; los pendientes
   *    NO contribuyen.
   *  - `cuentaAusencias` / `cuentaInformativos`: count de items en esa
   *    categoría con `estado != 'omitido'`.
   *  - Contadores por estado: totalizan todos los items del trabajador.
   *  - Trabajadores de la dotación sin items aparecen con todo en cero para
   *    permitir alta de manuales sin filtros previos.
   *
   * Orden de items dentro de cada trabajador: pendientes → aplicados →
   * omitidos. Dentro de cada grupo, configurados antes que manuales.
   */
  async listarMovimientosPorTrabajador(
    nominaPeriodoId: string,
  ): Promise<FilaTrabajadorMovimientos[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return [];

    const [nomina, recurrentes, movimientosExistentes, dotacion] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarRecurrentesActivos(idEmpresa),
      this.repo.listarMovimientos(nominaPeriodoId),
      this.repo.listarDotacionPaginada(
        nominaPeriodoId,
        {},
        { page: 1, pageSize: 1000, total: 0 },
      ),
    ]);
    if (!nomina) return [];

    const identidades = new Map<string, FilaTrabajadorNominaResumen>();
    for (const fila of dotacion.filas) {
      identidades.set(fila.trabajadorId, fila);
    }

    // 1) Pre-cargar items por trabajador a partir de recurrentes (configurados).
    const itemsPorTrabajador = new Map<string, ItemMovimientoTrabajador[]>();
    for (const trabajadorId of nomina.trabajadorIds) {
      itemsPorTrabajador.set(trabajadorId, []);
    }

    for (const recurrente of recurrentes) {
      const trabajadores = this.resolverTrabajadoresParaRecurrente(nomina, recurrente);
      for (const trabajadorId of trabajadores) {
        const movimientoExistente = movimientosExistentes.find(
          (m) =>
            m.trabajadorId === trabajadorId &&
            m.recurrenteId === recurrente.id &&
            m.tipo === recurrente.tipo,
        );

        const estado: EstadoItemMovimiento =
          movimientoExistente == null
            ? 'pendiente'
            : movimientoExistente.estado === 'omitido'
              ? 'omitido'
              : 'aplicado';

        const itemId =
          movimientoExistente == null
            ? `cfg::${trabajadorId}::${recurrente.id}::${recurrente.tipo}`
            : `mov::${movimientoExistente.id}`;

        const item: ItemMovimientoTrabajador = {
          itemId,
          origen: 'configurado',
          estado,
          concepto: recurrente.tipo,
          categoria: recurrente.categoria,
          monto: recurrente.monto,
          cantidad: recurrente.cantidad,
          unidad: recurrente.unidad,
          frecuencia: recurrente.frecuencia,
          vigenciaDesde: recurrente.activoDesde,
          vigenciaHasta: recurrente.activoHasta,
          glosa: recurrente.glosa,
          recurrenteId: recurrente.id,
          movimientoNominaId: movimientoExistente?.id,
        };

        const bucket = itemsPorTrabajador.get(trabajadorId) ?? [];
        bucket.push(item);
        itemsPorTrabajador.set(trabajadorId, bucket);
      }
    }

    // 2) Añadir items manuales (no tienen recurrenteId).
    for (const movimiento of movimientosExistentes) {
      if (movimiento.origen !== 'manual') continue;
      const estado: EstadoItemMovimiento =
        movimiento.estado === 'omitido' ? 'omitido' : 'aplicado';

      const item: ItemMovimientoTrabajador = {
        itemId: `mov::${movimiento.id}`,
        origen: 'manual',
        estado,
        concepto: movimiento.tipo,
        categoria: movimiento.categoria,
        monto: movimiento.monto,
        cantidad: movimiento.cantidad,
        unidad: movimiento.unidad,
        glosa: movimiento.glosa,
        movimientoNominaId: movimiento.id,
      };

      const bucket = itemsPorTrabajador.get(movimiento.trabajadorId) ?? [];
      bucket.push(item);
      itemsPorTrabajador.set(movimiento.trabajadorId, bucket);
    }

    // 3) Construir filas por trabajador con agregaciones.
    const filas: FilaTrabajadorMovimientos[] = [];
    for (const trabajadorId of nomina.trabajadorIds) {
      const items = itemsPorTrabajador.get(trabajadorId) ?? [];
      const identidad = identidades.get(trabajadorId);
      filas.push(
        this.armarFilaTrabajadorMovimientos(trabajadorId, identidad, items),
      );
    }

    return filas;
  }

  private armarFilaTrabajadorMovimientos(
    trabajadorId: string,
    identidad: FilaTrabajadorNominaResumen | undefined,
    items: ItemMovimientoTrabajador[],
  ): FilaTrabajadorMovimientos {
    let totalHaberes = 0;
    let totalDescuentos = 0;
    let cuentaAusencias = 0;
    let cuentaInformativos = 0;
    let cuentaPendientes = 0;
    let cuentaAplicados = 0;
    let cuentaOmitidos = 0;
    let cuentaManualesAplicados = 0;

    for (const item of items) {
      if (item.estado === 'pendiente') cuentaPendientes += 1;
      else if (item.estado === 'aplicado') cuentaAplicados += 1;
      else if (item.estado === 'omitido') cuentaOmitidos += 1;

      if (item.origen === 'manual' && item.estado === 'aplicado') {
        cuentaManualesAplicados += 1;
      }

      if (item.estado === 'aplicado' && typeof item.monto === 'number') {
        if (item.categoria === 'haber') totalHaberes += item.monto;
        else if (item.categoria === 'descuento') totalDescuentos += item.monto;
      }

      if (item.estado !== 'omitido') {
        if (item.categoria === 'ausencia') cuentaAusencias += 1;
        else if (item.categoria === 'informativo') cuentaInformativos += 1;
      }
    }

    const ordenEstado = (estado: EstadoItemMovimiento): number =>
      estado === 'pendiente' ? 0 : estado === 'aplicado' ? 1 : 2;
    const ordenOrigen = (origen: ItemMovimientoTrabajador['origen']): number =>
      origen === 'configurado' ? 0 : 1;

    const ordenados = [...items].sort((a, b) => {
      const dEstado = ordenEstado(a.estado) - ordenEstado(b.estado);
      if (dEstado !== 0) return dEstado;
      return ordenOrigen(a.origen) - ordenOrigen(b.origen);
    });

    return {
      trabajadorId,
      nombre: identidad?.nombre ?? 'Trabajador sin identificar',
      rut: identidad?.rut ?? '',
      cargo: identidad?.cargo,
      centroCosto: identidad?.centroCosto,
      totalHaberes,
      totalDescuentos,
      cuentaAusencias,
      cuentaInformativos,
      cuentaPendientes,
      cuentaAplicados,
      cuentaOmitidos,
      cuentaManualesAplicados,
      items: ordenados,
    };
  }

  /**
   * Aplica TODOS los recurrentes pendientes de UN trabajador específico a la
   * nómina. Idempotente: respeta omitidos y no duplica. Es `aplicarRecurrentes
   * ANomina` acotado a un solo `trabajadorId`. Útil para la acción masiva
   * "Cargar N pendientes" de la fila del trabajador.
   */
  async aplicarRecurrentesDeTrabajador(
    nominaPeriodoId: string,
    trabajadorId: string,
  ): Promise<MovimientoNomina[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return [];

    const [nomina, recurrentes, movimientosExistentes] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarRecurrentesActivos(idEmpresa),
      this.repo.listarMovimientos(nominaPeriodoId),
    ]);
    if (!nomina) return [];
    if (estadoNominaBloqueaEdicion(nomina.estado)) {
      throw new Error(`La nómina ${nomina.estado} no admite cambios.`);
    }

    const nuevosInsertar: MovimientoNominaNuevo[] = [];
    for (const recurrente of recurrentes) {
      const trabajadores = this.resolverTrabajadoresParaRecurrente(nomina, recurrente);
      if (!trabajadores.includes(trabajadorId)) continue;

      const yaExiste = movimientosExistentes.find(
        (m) =>
          m.trabajadorId === trabajadorId &&
          m.recurrenteId === recurrente.id &&
          m.tipo === recurrente.tipo,
      );
      if (yaExiste) continue;

      const segmentoDelTrabajador = nomina.segmentos.find((s) =>
        s.trabajadorIds.includes(trabajadorId),
      );

      nuevosInsertar.push({
        nominaPeriodoId,
        trabajadorId,
        segmentoId: segmentoDelTrabajador?.id,
        tipo: recurrente.tipo,
        categoria: recurrente.categoria,
        monto: recurrente.monto,
        cantidad: recurrente.cantidad,
        unidad: recurrente.unidad,
        origen: 'recurrente',
        recurrenteId: recurrente.id,
        estado: 'aplicado',
        glosa: recurrente.glosa,
      });
    }

    if (nuevosInsertar.length === 0) return [];

    const insertados = await this.repo.insertarMovimientos(nuevosInsertar, idEmpresa);
    await this.invalidarCalculoPorCambio(
      nominaPeriodoId,
      `Recurrentes aplicados al trabajador ${trabajadorId}.`,
    );
    return insertados;
  }

  /**
   * Aplica UN recurrente individual (pendiente) a un trabajador. Útil para la
   * acción por fila del item pendiente. Idempotente: si ya existe el
   * `movimiento_nomina` con esa clave, no duplica.
   */
  async aplicarRecurrenteIndividual(
    nominaPeriodoId: string,
    trabajadorId: string,
    recurrenteId: string,
  ): Promise<MovimientoNomina | null> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return null;

    const [nomina, recurrentes, movimientosExistentes] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarRecurrentesActivos(idEmpresa),
      this.repo.listarMovimientos(nominaPeriodoId),
    ]);
    if (!nomina) return null;
    if (estadoNominaBloqueaEdicion(nomina.estado)) {
      throw new Error(`La nómina ${nomina.estado} no admite cambios.`);
    }

    const recurrente = recurrentes.find((r) => r.id === recurrenteId);
    if (!recurrente) {
      throw new Error('Recurrente no encontrado o ya no está activo.');
    }

    const trabajadores = this.resolverTrabajadoresParaRecurrente(nomina, recurrente);
    if (!trabajadores.includes(trabajadorId)) {
      throw new Error('El recurrente no aplica a este trabajador.');
    }

    const yaExiste = movimientosExistentes.find(
      (m) =>
        m.trabajadorId === trabajadorId &&
        m.recurrenteId === recurrente.id &&
        m.tipo === recurrente.tipo,
    );
    if (yaExiste) return yaExiste;

    const segmentoDelTrabajador = nomina.segmentos.find((s) =>
      s.trabajadorIds.includes(trabajadorId),
    );

    const [insertado] = await this.repo.insertarMovimientos(
      [
        {
          nominaPeriodoId,
          trabajadorId,
          segmentoId: segmentoDelTrabajador?.id,
          tipo: recurrente.tipo,
          categoria: recurrente.categoria,
          monto: recurrente.monto,
          cantidad: recurrente.cantidad,
          unidad: recurrente.unidad,
          origen: 'recurrente',
          recurrenteId: recurrente.id,
          estado: 'aplicado',
          glosa: recurrente.glosa,
        },
      ],
      idEmpresa,
    );

    await this.invalidarCalculoPorCambio(
      nominaPeriodoId,
      `Recurrente ${recurrente.tipo} aplicado a ${trabajadorId}.`,
    );

    return insertado ?? null;
  }

  // -------------------------------------------------------------------------
  // Validación pre-cálculo / pre-cierre
  // -------------------------------------------------------------------------

  async obtenerResumenValidacionNomina(
    nominaPeriodoId: string,
  ): Promise<ResumenValidacionNomina> {
    const [nomina, movimientos] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarMovimientos(nominaPeriodoId),
    ]);

    if (!nomina) {
      return {
        totalTrabajadores: 0,
        listosParaCalculo: 0,
        conIncidenciasCriticas: 0,
        conAdvertencias: 0,
        conMovimientosEspeciales: 0,
        puedeCalcular: false,
        puedeCerrar: false,
        incidenciasCriticas: [],
        advertencias: [],
      };
    }

    const incidenciasCriticas = nomina.incidencias.filter((i) => i.severidad === 'critica');
    const advertencias = nomina.incidencias.filter((i) => i.severidad === 'advertencia');

    const trabajadoresCriticos = new Set(
      incidenciasCriticas
        .map((i) => i.trabajadorId)
        .filter((id): id is string => !!id),
    );
    const trabajadoresAdvertencia = new Set(
      advertencias.map((i) => i.trabajadorId).filter((id): id is string => !!id),
    );
    const trabajadoresConMovimientos = new Set(
      movimientos
        .filter((m) => m.origen === 'manual' || m.estado === 'omitido')
        .map((m) => m.trabajadorId),
    );

    const hayBloqueante = nomina.incidencias.some((i) => i.bloqueante);
    const calculoVigente = nomina.evidenciaCalculo?.calculoVigente ?? false;
    const totalTrabajadores = nomina.trabajadorIds.length;

    return {
      totalTrabajadores,
      listosParaCalculo: totalTrabajadores - trabajadoresCriticos.size,
      conIncidenciasCriticas: trabajadoresCriticos.size,
      conAdvertencias: trabajadoresAdvertencia.size,
      conMovimientosEspeciales: trabajadoresConMovimientos.size,
      puedeCalcular: !hayBloqueante,
      puedeValidar: !hayBloqueante && calculoVigente && nomina.estado === 'calculada',
      puedeCerrar: !hayBloqueante
        && calculoVigente
        && (nomina.estado === 'validada' || nomina.estado === 'aprobada'),
      calculoVigente,
      incidenciasCriticas,
      advertencias,
    };
  }

  /**
   * Detecta trabajadores asignados a >1 segmento activo del mismo período.
   * Regla bloqueante. NO persiste — solo retorna las incidencias.
   */
  async validarDuplicidadTrabajadorSegmento(
    nominaPeriodoId: string,
  ): Promise<IncidenciaNomina[]> {
    const segmentos = await this.repo.listarSegmentos(nominaPeriodoId);

    const segmentosPorTrabajador = new Map<string, string[]>();
    for (const segmento of segmentos) {
      if (segmento.estado === 'bloqueada') continue;
      for (const trabajadorId of segmento.trabajadorIds) {
        const existentes = segmentosPorTrabajador.get(trabajadorId) ?? [];
        existentes.push(segmento.id);
        segmentosPorTrabajador.set(trabajadorId, existentes);
      }
    }

    const incidencias: IncidenciaNomina[] = [];
    for (const [trabajadorId, segmentoIds] of segmentosPorTrabajador) {
      if (segmentoIds.length > 1) {
        incidencias.push({
          id: `inc-dup-${trabajadorId}`,
          nominaPeriodoId,
          severidad: 'critica',
          tipo: 'trabajador-duplicado-en-segmentos',
          mensaje: `Trabajador está en ${segmentoIds.length} segmentos: ${segmentoIds.join(', ')}`,
          trabajadorId,
          bloqueante: true,
        });
      }
    }
    return incidencias;
  }

  /** Consolida segmentos en `ResultadoAlcanceNomina` para el motor V1. */
  async consolidarSegmentosParaCalculo(
    nominaPeriodoId: string,
  ): Promise<ResultadoAlcanceNomina> {
    const nomina = await this.repo.obtenerNominaCompleta(nominaPeriodoId);
    if (!nomina) {
      return {
        tipo: 'empresaCompleta',
        estado: 'sinConfigurar',
        descripcion: 'Nómina no encontrada',
        idsTrabajadoresIncluidos: [],
        resumen: {
          totalTrabajadores: 0,
          trabajadoresIncluidos: 0,
          trabajadoresExcluidos: 0,
          trabajadoresBloqueados: 0,
          trabajadoresConAdvertencias: 0,
        },
      };
    }
    const idsConsolidados = Array.from(
      new Set(nomina.segmentos.flatMap((s) => s.trabajadorIds)),
    );
    const totalCriticas = nomina.incidencias.filter((i) => i.severidad === 'critica').length;
    const totalAdvertencias = nomina.incidencias.filter(
      (i) => i.severidad === 'advertencia',
    ).length;
    const estado: ResultadoAlcanceNomina['estado'] = totalCriticas > 0 ? 'bloqueado' : 'listo';

    return {
      tipo: 'empresaCompleta',
      estado,
      descripcion: `Consolidado de ${nomina.segmentos.length} segmentos`,
      idsTrabajadoresIncluidos: idsConsolidados,
      resumen: {
        totalTrabajadores: idsConsolidados.length,
        trabajadoresIncluidos: idsConsolidados.length - totalCriticas,
        trabajadoresExcluidos: 0,
        trabajadoresBloqueados: totalCriticas,
        trabajadoresConAdvertencias: totalAdvertencias,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Dotación (lista de trabajadores resumida con paginación cliente)
  // -------------------------------------------------------------------------

  async filtrarDotacion(
    nominaPeriodoId: string,
    filtro: FiltroRapidoDotacion,
    paginacion: PaginacionGrilla,
  ): Promise<{ filas: FilaTrabajadorNominaResumen[]; total: number }> {
    return this.repo.listarDotacionPaginada(nominaPeriodoId, filtro, paginacion);
  }

  private async filtrarDotacionLegacy(
    nominaPeriodoId: string,
    filtro: FiltroRapidoDotacion,
    paginacion: PaginacionGrilla,
  ): Promise<{ filas: FilaTrabajadorNominaResumen[]; total: number }> {
    const [segmentos, movimientos, incidencias] = await Promise.all([
      this.repo.listarSegmentos(nominaPeriodoId),
      this.repo.listarMovimientos(nominaPeriodoId),
      this.repo.listarIncidencias(nominaPeriodoId),
    ]);

    const idsUnicos = Array.from(new Set(segmentos.flatMap((s) => s.trabajadorIds)));
    if (idsUnicos.length === 0) {
      return { filas: [], total: 0 };
    }

    const personas = await this.cargarPersonasResumidas(idsUnicos);

    const filas: FilaTrabajadorNominaResumen[] = idsUnicos.map((trabajadorId) => {
      const persona = personas.get(trabajadorId);
      const segmentoDelTrabajador = segmentos.find((s) => s.trabajadorIds.includes(trabajadorId));
      const incsCriticas = incidencias.filter(
        (i) => i.trabajadorId === trabajadorId && i.severidad === 'critica',
      ).length;
      const incsAdv = incidencias.filter(
        (i) => i.trabajadorId === trabajadorId && i.severidad === 'advertencia',
      ).length;
      const totalMovs = movimientos.filter((m) => m.trabajadorId === trabajadorId).length;

      const tieneBloqueante = incidencias.some(
        (i) => i.trabajadorId === trabajadorId && i.bloqueante,
      );

      const estado: FilaTrabajadorNominaResumen['estado'] = tieneBloqueante
        ? 'bloqueado'
        : incsCriticas > 0
          ? 'critico'
          : incsAdv > 0
            ? 'advertencia'
            : 'listo';

      return {
        trabajadorId,
        nombre: persona ? this.armarNombreCompleto(persona) : `Trabajador ${trabajadorId}`,
        rut: persona ? `${persona.rut}-${persona.dv}` : '',
        segmentoId: segmentoDelTrabajador?.id,
        estado,
        totalIncidenciasCriticas: incsCriticas,
        totalAdvertencias: incsAdv,
        totalMovimientos: totalMovs,
        tieneDatosBancarios: true,
        tieneDatosPrevisionales: true,
      };
    });

    const filtradas = filas.filter((fila) => this.coincideFiltro(fila, filtro));
    const total = filtradas.length;
    const inicio = Math.max(0, (paginacion.page - 1) * paginacion.pageSize);
    const fin = inicio + paginacion.pageSize;
    return { filas: filtradas.slice(inicio, fin), total };
  }

  async obtenerDetalleTrabajador(
    nominaPeriodoId: string,
    trabajadorId: string,
  ): Promise<DetalleTrabajadorNomina | null> {
    const [movimientos, incidencias] = await Promise.all([
      this.repo.listarMovimientos(nominaPeriodoId),
      this.repo.listarIncidencias(nominaPeriodoId),
    ]);

    return {
      trabajadorId,
      movimientos: movimientos.filter((m) => m.trabajadorId === trabajadorId),
      incidencias: incidencias.filter((i) => i.trabajadorId === trabajadorId),
    };
  }

  // -------------------------------------------------------------------------
  // Acciones masivas
  // -------------------------------------------------------------------------

  async previsualizarAccionMasiva(
    nominaPeriodoId: string,
    trabajadorIds: string[],
    accion: AccionMasivaTrabajadores,
  ): Promise<PreviewAccionMasivaTrabajadores> {
    const [incidencias, dotacion] = await Promise.all([
      this.repo.listarIncidencias(nominaPeriodoId),
      this.filtrarDotacion(
        nominaPeriodoId,
        {},
        { page: 1, pageSize: 10000, total: 0 },
      ),
    ]);

    const idsSet = new Set(trabajadorIds);
    const filasAfectadas = dotacion.filas.filter((f) => idsSet.has(f.trabajadorId));
    const totalCriticas = filasAfectadas.reduce((acc, f) => acc + f.totalIncidenciasCriticas, 0);
    const totalAdvertencias = filasAfectadas.reduce((acc, f) => acc + f.totalAdvertencias, 0);

    const incidenciasBloqueantes = incidencias.filter(
      (i) => i.bloqueante && i.trabajadorId && idsSet.has(i.trabajadorId),
    );

    let montoTotalEstimado: number | undefined;
    if (accion.tipo === 'agregar-movimiento') {
      const monto = accion.movimiento.monto;
      if (typeof monto === 'number') {
        montoTotalEstimado = monto * filasAfectadas.length;
      }
    }

    const mensajes: string[] = [];
    mensajes.push(`Se aplicará a ${filasAfectadas.length} trabajadores.`);
    if (montoTotalEstimado !== undefined) {
      mensajes.push(`Monto total estimado: $${montoTotalEstimado.toLocaleString('es-CL')}.`);
    }
    if (totalCriticas > 0) {
      mensajes.push(`${totalCriticas} trabajadores tienen incidencias críticas.`);
    }
    if (totalAdvertencias > 0) {
      mensajes.push(`${totalAdvertencias} trabajadores tienen advertencias.`);
    }

    return {
      accion,
      totalTrabajadoresAfectados: filasAfectadas.length,
      montoTotalEstimado,
      totalIncidenciasCriticas: totalCriticas,
      totalAdvertencias,
      mensajes,
      puedeAplicar: incidenciasBloqueantes.length === 0,
    };
  }

  async aplicarAccionMasiva(
    nominaPeriodoId: string,
    trabajadorIds: string[],
    accion: AccionMasivaTrabajadores,
  ): Promise<PreviewAccionMasivaTrabajadores> {
    const preview = await this.previsualizarAccionMasiva(nominaPeriodoId, trabajadorIds, accion);
    if (!preview.puedeAplicar) {
      throw new Error('La acción masiva tiene incidencias bloqueantes.');
    }
    const nomina = await this.exigirNominaEditable(nominaPeriodoId);
    const ids = new Set(trabajadorIds);
    const idEmpresa = Number(nomina.empresaId);

    if (accion.tipo === 'excluir-nomina' || accion.tipo === 'mover-segmento') {
      const segmentos = nomina.segmentos.map((segmento) => ({
        ...segmento,
        trabajadorIds: segmento.trabajadorIds.filter((id) => !ids.has(id)),
      }));
      if (accion.tipo === 'mover-segmento') {
        const destino = segmentos.find((segmento) => segmento.id === accion.segmentoDestinoId);
        if (!destino) throw new Error('Segmento de destino no encontrado.');
        destino.trabajadorIds = Array.from(new Set([...destino.trabajadorIds, ...trabajadorIds]));
      }
      for (const segmento of segmentos) {
        segmento.totalTrabajadores = segmento.trabajadorIds.length;
        await this.repo.upsertSegmento(segmento, idEmpresa);
      }
      const totalTrabajadores = new Set(segmentos.flatMap((segmento) => segmento.trabajadorIds)).size;
      await this.repo.actualizarTotales(nominaPeriodoId, { totalTrabajadores });
    } else if (accion.tipo === 'agregar-movimiento') {
      const movimientos: MovimientoNominaNuevo[] = trabajadorIds.map((trabajadorId) => ({
        nominaPeriodoId,
        trabajadorId,
        tipo: accion.movimiento.tipo ?? 'movimiento-masivo',
        categoria: accion.movimiento.categoria ?? 'haber',
        monto: accion.movimiento.monto,
        cantidad: accion.movimiento.cantidad,
        unidad: accion.movimiento.unidad,
        origen: 'manual',
        estado: 'aplicado',
        glosa: accion.movimiento.glosa,
      }));
      await this.repo.insertarMovimientos(movimientos, idEmpresa);
    }

    await this.invalidarCalculoPorCambio(
      nominaPeriodoId,
      `Acción masiva ${accion.tipo} sobre ${trabajadorIds.length} trabajadores.`,
    );
    return preview;
  }

  /** Aplica un recurrente solo a los trabajadores que matchean un criterio único. */
  async aplicarRecurrentePorCriterio(
    criterio: CriterioAplicacionRecurrente,
    nominaPeriodoId: string,
    recurrenteId?: string,
  ): Promise<MovimientoNomina[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) return [];

    const [nomina, recurrentes, movimientosExistentes] = await Promise.all([
      this.repo.obtenerNominaCompleta(nominaPeriodoId),
      this.repo.listarRecurrentesActivos(idEmpresa),
      this.repo.listarMovimientos(nominaPeriodoId),
    ]);
    if (!nomina) return [];

    const recurrente = recurrenteId
      ? recurrentes.find((r) => r.id === recurrenteId)
      : recurrentes[0];
    if (!recurrente) return [];

    const trabajadoresMatch = this.aplicarCriterio(nomina, criterio);
    const nuevosInsertar: MovimientoNominaNuevo[] = [];
    const yaExistentes: MovimientoNomina[] = [];

    for (const trabajadorId of trabajadoresMatch) {
      const existe = movimientosExistentes.find(
        (m) =>
          m.trabajadorId === trabajadorId &&
          m.recurrenteId === recurrente.id &&
          m.tipo === recurrente.tipo,
      );
      if (existe) {
        if (existe.estado === 'aplicado') yaExistentes.push(existe);
        continue;
      }
      const segmentoDelTrabajador = nomina.segmentos.find((s) =>
        s.trabajadorIds.includes(trabajadorId),
      );
      nuevosInsertar.push({
        nominaPeriodoId,
        trabajadorId,
        segmentoId: segmentoDelTrabajador?.id,
        tipo: recurrente.tipo,
        categoria: recurrente.categoria,
        monto: recurrente.monto,
        cantidad: recurrente.cantidad,
        unidad: recurrente.unidad,
        origen: 'recurrente',
        recurrenteId: recurrente.id,
        estado: 'aplicado',
        glosa: recurrente.glosa,
      });
    }

    if (nuevosInsertar.length === 0) return yaExistentes;

    const insertados = await this.repo.insertarMovimientos(nuevosInsertar, idEmpresa);
    return [...yaExistentes, ...insertados];
  }

  // -------------------------------------------------------------------------
  // Auditoría
  // -------------------------------------------------------------------------

  async listarEventosAuditoria(nominaPeriodoId: string): Promise<EventoAuditoriaNomina[]> {
    return this.repo.listarEventosAuditoria(nominaPeriodoId);
  }

  async registrarEventoAuditoria(
    evento: Omit<EventoAuditoriaNomina, 'id' | 'createdAt'>,
  ): Promise<EventoAuditoriaNomina> {
    return this.repo.registrarEventoAuditoria(evento);
  }

  // -------------------------------------------------------------------------
  // Helpers privados
  // -------------------------------------------------------------------------

  private async resolverEmpresaActiva(): Promise<number | null> {
    const snap = this.empresaActiva.empresa();
    if (snap) return snap.idEmpresa;
    const cargada = await this.empresaActiva.asegurarCargada();
    return cargada?.idEmpresa ?? null;
  }

  private async cargarPersonasResumidas(
    trabajadorIds: string[],
  ): Promise<Map<string, PersonaResumenRow>> {
    if (trabajadorIds.length === 0) return new Map();
    const ids = trabajadorIds.map(Number);
    const { data, error } = await this.supabase
      .from('persona')
      .select('id_persona, rut, dv, nombres, apellido_paterno, apellido_materno')
      .in('id_persona', ids);

    if (error || !data) return new Map();
    const map = new Map<string, PersonaResumenRow>();
    for (const p of data) {
      map.set(String(p.id_persona), p as PersonaResumenRow);
    }
    return map;
  }

  private armarNombreCompleto(p: PersonaResumenRow): string {
    return [p.nombres, p.apellido_paterno, p.apellido_materno ?? ''].filter(Boolean).join(' ').trim();
  }

  private resolverTrabajadoresParaRecurrente(
    nomina: NominaPeriodo,
    recurrente: MovimientoRecurrente,
  ): string[] {
    if (recurrente.trabajadorId) {
      return nomina.trabajadorIds.filter((t) => t === recurrente.trabajadorId);
    }
    if (recurrente.segmentoId) {
      const segmento = nomina.segmentos.find((s) => s.id === recurrente.segmentoId);
      return segmento ? [...segmento.trabajadorIds] : [];
    }
    return [...nomina.trabajadorIds];
  }

  private aplicarCriterio(
    nomina: NominaPeriodo,
    criterio: CriterioAplicacionRecurrente,
  ): string[] {
    switch (criterio.tipo) {
      case 'trabajador':
        return nomina.trabajadorIds.filter((t) => t === criterio.trabajadorId);
      case 'segmento': {
        const segmento = nomina.segmentos.find((s) => s.id === criterio.segmentoId);
        return segmento ? [...segmento.trabajadorIds] : [];
      }
      case 'centro-costo':
      case 'cargo':
      case 'tipo-contrato':
      case 'grupo':
        return [];
      default: {
        const _exhaustive: never = criterio;
        return _exhaustive;
      }
    }
  }

  private coincideFiltro(
    fila: FilaTrabajadorNominaResumen,
    filtro: FiltroRapidoDotacion,
  ): boolean {
    if (filtro.estado && fila.estado !== filtro.estado) return false;
    if (filtro.segmentoId && fila.segmentoId !== filtro.segmentoId) return false;
    if (
      filtro.conIncidencias === true &&
      fila.totalIncidenciasCriticas + fila.totalAdvertencias === 0
    ) {
      return false;
    }
    if (
      filtro.conIncidencias === false &&
      fila.totalIncidenciasCriticas + fila.totalAdvertencias > 0
    ) {
      return false;
    }
    if (filtro.conMovimientos === true && fila.totalMovimientos === 0) return false;
    if (filtro.conMovimientos === false && fila.totalMovimientos > 0) return false;
    if (filtro.busqueda) {
      const q = filtro.busqueda.toLowerCase();
      const haystack = `${fila.nombre} ${fila.rut} ${fila.cargo ?? ''} ${fila.centroCosto ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  private async exigirNomina(nominaPeriodoId: string): Promise<NominaPeriodo> {
    const nomina = await this.repo.obtenerNominaCompleta(nominaPeriodoId);
    if (!nomina) throw new Error('Nómina no encontrada.');
    return nomina;
  }

  private async exigirNominaEditable(nominaPeriodoId: string): Promise<NominaPeriodo> {
    const nomina = await this.exigirNomina(nominaPeriodoId);
    if (estadoNominaBloqueaEdicion(nomina.estado)) {
      throw new Error(`La nómina ${nomina.estado} no admite cambios.`);
    }
    return nomina;
  }

  private async transicionar(
    nomina: NominaPeriodo,
    destino: EstadoNomina,
    motivo?: string,
    calculo?: {
      idCalculoPeriodo?: number;
      totalTrabajadores: number;
      totalHaberes: number;
      totalDescuentos: number;
      totalLiquido: number;
    },
  ): Promise<void> {
    exigirTransicionNomina(nomina.estado, destino);
    await this.repo.transicionarEstado(nomina.id, {
      estadoEsperado: nomina.estado,
      estadoDestino: destino,
      versionEstadoEsperada: nomina.versionEstado,
      motivo,
      ...calculo,
    });
  }

  async registrarCalculo(
    nominaPeriodoId: string,
    calculo: {
      idCalculoPeriodo?: number;
      totalTrabajadores: number;
      totalHaberes: number;
      totalDescuentos: number;
      totalLiquido: number;
    },
  ): Promise<void> {
    let nomina = await this.exigirNomina(nominaPeriodoId);

    // Recálculo idempotente: si la nómina ya estaba calculada o validada,
    // primero la devolvemos a "en_revision" y luego transitamos a "calculada"
    // para reflejar el nuevo snapshot. Sin esta pre-transición, recalcular
    // sobre una nómina ya `calculada` (incluido el caso post-reapertura)
    // disparaba "Transición no permitida: calculada → calculada".
    if (nomina.estado === 'calculada' || nomina.estado === 'validada') {
      await this.transicionar(nomina, 'en_revision', 'Recálculo solicitado.');
      nomina = await this.exigirNomina(nominaPeriodoId);
    }

    if (nomina.estado !== 'en_revision' && nomina.estado !== 'reabierta') {
      throw new Error('La nómina debe estar en revisión antes de calcular.');
    }
    await this.transicionar(nomina, 'calculada', undefined, calculo);
  }

  private async invalidarCalculoPorCambio(nominaPeriodoId: string, motivo: string): Promise<void> {
    const nomina = await this.exigirNomina(nominaPeriodoId);
    if (!nomina.evidenciaCalculo?.calculoVigente) return;
    if (
      nomina.estado === 'calculada'
      || nomina.estado === 'validada'
      || nomina.estado === 'aprobada'
      || nomina.estado === 'liquidada'
      || nomina.estado === 'reabierta'
    ) {
      await this.transicionar(nomina, 'en_revision', motivo);
    }
    await this.repo.invalidarCalculo(nominaPeriodoId);
    await this.repo.registrarEventoAuditoria({
      nominaPeriodoId,
      accion: 'calculo_invalidado',
      motivo,
    });
  }

  private async buscarMovimiento(movimientoId: string): Promise<MovimientoNomina> {
    const movimiento = await this.repo.obtenerMovimiento(movimientoId);
    if (movimiento) return movimiento;
    throw new Error('Movimiento no encontrado.');
  }
}
