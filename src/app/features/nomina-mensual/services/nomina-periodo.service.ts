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
  TipoNomina,
} from '../models/nomina-periodo.models';
import type {
  AccionMasivaTrabajadores,
  CriterioAplicacionRecurrente,
  MovimientoNomina,
  MovimientoRecurrente,
  PreviewAccionMasivaTrabajadores,
} from '../models/movimiento-nomina.models';
import type { ResultadoAlcanceNomina } from '../../nomina-mensual-v2/models/nomina-mensual-v2.models';

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

  private readonly resumenesState = signal<NominaPeriodoResumen[]>([]);
  private readonly cargandoState = signal(false);

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

  async crearNominaPeriodo(payload: CrearNominaPayload): Promise<NominaPeriodoResumen> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) {
      throw new Error('No hay empresa activa para crear la nómina.');
    }
    const empresaSnap = this.empresaActiva.empresa();
    const empresaNombre = payload.empresaNombre
      ?? empresaSnap?.nombre
      ?? empresaSnap?.razonSocial
      ?? '';

    return this.repo.crear({
      empresaId: payload.empresaId ?? String(idEmpresa),
      empresaNombre,
      periodo: payload.periodo,
      tipo: payload.tipo,
    });
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
    await this.repo.actualizarEstado(nominaPeriodoId, 'cerrada');
    if (payload.motivo) {
      await this.repo.registrarEventoAuditoria({
        nominaPeriodoId,
        accion: 'cerrada',
        motivo: payload.motivo,
      });
    }
  }

  async reabrirNomina(nominaPeriodoId: string, payload: ReabrirNominaPayload): Promise<void> {
    await this.repo.actualizarEstado(nominaPeriodoId, 'reabierta');
    await this.repo.registrarEventoAuditoria({
      nominaPeriodoId,
      accion: 'reabierta',
      motivo: payload.motivo,
    });
  }

  async eliminarBorrador(nominaPeriodoId: string): Promise<void> {
    await this.repo.eliminarBorrador(nominaPeriodoId);
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
    return this.repo.upsertSegmento(segmento, idEmpresa);
  }

  async eliminarSegmento(segmentoId: string): Promise<void> {
    await this.repo.eliminarSegmento(segmentoId);
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
    await this.repo.actualizarEstadoMovimiento(movimientoId, 'omitido');
  }

  async aplicarMovimiento(movimientoId: string): Promise<void> {
    await this.repo.actualizarEstadoMovimiento(movimientoId, 'aplicado');
  }

  async agregarMovimientoManual(
    mov: Omit<MovimientoNomina, 'createdAt' | 'updatedAt' | 'origen'>,
  ): Promise<MovimientoNomina[]> {
    const idEmpresa = await this.resolverEmpresaActiva();
    if (idEmpresa == null) {
      throw new Error('No hay empresa activa para agregar movimiento.');
    }
    return this.repo.insertarMovimientos([{ ...mov, origen: 'manual' }], idEmpresa);
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

    const nuevosInsertar: Array<Omit<MovimientoNomina, 'createdAt' | 'updatedAt'>> = [];

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
          id: '',
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
    return [
      ...movimientosExistentes.filter(
        (m) => m.origen === 'recurrente' && m.estado === 'aplicado',
      ),
      ...insertados,
    ];
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
    const totalTrabajadores = nomina.trabajadorIds.length;

    return {
      totalTrabajadores,
      listosParaCalculo: totalTrabajadores - trabajadoresCriticos.size,
      conIncidenciasCriticas: trabajadoresCriticos.size,
      conAdvertencias: trabajadoresAdvertencia.size,
      conMovimientosEspeciales: trabajadoresConMovimientos.size,
      puedeCalcular: !hayBloqueante,
      puedeCerrar: !hayBloqueante,
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
    const nuevosInsertar: Array<Omit<MovimientoNomina, 'createdAt' | 'updatedAt'>> = [];
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
        id: '',
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
}
