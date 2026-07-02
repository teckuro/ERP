/**
 * Adapter mock de F1 — solo fixtures de test (F19).
 *
 * NO importar desde servicios productivos, repositorios ni UI runtime.
 */

import { Injectable } from '@angular/core';

import type { ResultadoAlcanceNomina } from '../../nomina-mensual-v2/models/nomina-mensual-v2.models';
import {
  construirNominaMockPrincipal,
  DETALLES_TRABAJADORES_MOCK,
  DOTACION_MOCK,
  MOVIMIENTOS_RECURRENTES_MOCK,
  NOMINAS_PERIODO_MOCK,
} from './fixtures/nomina-periodo.fixture';
import type {
  DetalleTrabajadorNomina,
  FilaTrabajadorNominaResumen,
  FiltroRapidoDotacion,
  IncidenciaNomina,
  NominaPeriodo,
  NominaPeriodoResumen,
  PaginacionGrilla,
  ResumenValidacionNomina,
} from '../models/nomina-periodo.models';
import type {
  AccionMasivaTrabajadores,
  CriterioAplicacionRecurrente,
  MovimientoNomina,
  MovimientoRecurrente,
  PreviewAccionMasivaTrabajadores,
} from '../models/movimiento-nomina.models';

@Injectable()
export class NominaPeriodoMockAdapterService {
  private readonly nominas = new Map<string, NominaPeriodo>();
  private readonly resumenes: NominaPeriodoResumen[] = [...NOMINAS_PERIODO_MOCK];
  private readonly recurrentes: MovimientoRecurrente[] = [...MOVIMIENTOS_RECURRENTES_MOCK];
  private readonly dotacionPorNomina = new Map<string, FilaTrabajadorNominaResumen[]>();

  constructor() {
    const principal = construirNominaMockPrincipal();
    this.nominas.set(principal.id, principal);
    this.dotacionPorNomina.set(principal.id, [...DOTACION_MOCK]);
  }

  /**
   * Lista de resúmenes para el Administrador.
   *
   * Carga SOLO `NominaPeriodoResumen[]` (sin detalle). Diseñado para escalar a
   * cientos de nóminas listadas en la bandeja.
   */
  listarResumenes(): NominaPeriodoResumen[] {
    return [...this.resumenes];
  }

  /**
   * Obtiene una nómina completa por id. En productivo retornará desde BD.
   * En F1 retorna el mock principal o `undefined`.
   */
  obtenerNomina(nominaPeriodoId: string): NominaPeriodo | undefined {
    return this.nominas.get(nominaPeriodoId);
  }

  /**
   * Consolida todos los segmentos de la nómina en un único
   * `ResultadoAlcanceNomina` compatible con el orquestador V2 actual.
   *
   * Es el puente entre el modelo nuevo (`SegmentoNomina[]`) y el motor
   * productivo de cálculo (que consume `ResultadoAlcanceNomina`). En F6 será
   * reemplazado por `nomina-periodo-calculo-adapter.service.ts`.
   */
  consolidarSegmentosParaCalculo(nominaPeriodoId: string): ResultadoAlcanceNomina {
    const nomina = this.nominas.get(nominaPeriodoId);
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
    const totalAdvertencias = nomina.incidencias.filter((i) => i.severidad === 'advertencia').length;
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

  /**
   * Aplica recurrentes activos a una nómina.
   *
   * Reglas de oro:
   * 1. **Idempotencia**: si ya existe un `MovimientoNomina` con misma clave
   *    `nominaPeriodoId + trabajadorId + recurrenteId + tipo`, no se duplica.
   * 2. **Respeto de omitidos**: si existe con `estado='omitido'`, NO se reaplica.
   *    Preserva la decisión manual del usuario.
   *
   * @returns lista de movimientos resultantes (los recién aplicados + los ya
   * existentes que matchean recurrentes activos). Los omitidos NO se incluyen.
   */
  aplicarRecurrentesANomina(nominaPeriodoId: string): MovimientoNomina[] {
    const nomina = this.nominas.get(nominaPeriodoId);
    if (!nomina) {
      return [];
    }

    const recurrentesActivos = this.recurrentes.filter((r) => r.estado === 'activo');
    const ahora = new Date().toISOString();

    for (const recurrente of recurrentesActivos) {
      const trabajadoresMatch = this.resolverTrabajadoresParaRecurrente(nomina, recurrente);

      for (const trabajadorId of trabajadoresMatch) {
        const yaExiste = nomina.movimientos.find(
          (m) =>
            m.nominaPeriodoId === nominaPeriodoId &&
            m.trabajadorId === trabajadorId &&
            m.recurrenteId === recurrente.id &&
            m.tipo === recurrente.tipo,
        );
        if (yaExiste) {
          continue;
        }

        const segmentoDelTrabajador = nomina.segmentos.find((s) =>
          s.trabajadorIds.includes(trabajadorId),
        );

        nomina.movimientos.push({
          id: `mov-rec-${recurrente.id}-${trabajadorId}`,
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
          createdAt: ahora,
          updatedAt: ahora,
        });
      }
    }

    return nomina.movimientos.filter(
      (m) => m.origen === 'recurrente' && m.estado === 'aplicado',
    );
  }

  /**
   * Aplica un recurrente puntual solo a los trabajadores que matchean un
   * criterio único. Útil para acciones masivas y para previsualizar el efecto.
   *
   * Respeta idempotencia y omitidos igual que `aplicarRecurrentesANomina`.
   */
  aplicarRecurrentePorCriterio(
    criterio: CriterioAplicacionRecurrente,
    nominaPeriodoId: string,
    recurrenteId?: string,
  ): MovimientoNomina[] {
    const nomina = this.nominas.get(nominaPeriodoId);
    if (!nomina) {
      return [];
    }

    const recurrente = recurrenteId
      ? this.recurrentes.find((r) => r.id === recurrenteId)
      : this.recurrentes[0];
    if (!recurrente) {
      return [];
    }

    const trabajadoresMatch = this.aplicarCriterio(nomina, criterio);
    const ahora = new Date().toISOString();
    const resultado: MovimientoNomina[] = [];

    for (const trabajadorId of trabajadoresMatch) {
      const yaExiste = nomina.movimientos.find(
        (m) =>
          m.nominaPeriodoId === nominaPeriodoId &&
          m.trabajadorId === trabajadorId &&
          m.recurrenteId === recurrente.id &&
          m.tipo === recurrente.tipo,
      );
      if (yaExiste) {
        if (yaExiste.estado === 'aplicado') {
          resultado.push(yaExiste);
        }
        continue;
      }

      const segmentoDelTrabajador = nomina.segmentos.find((s) =>
        s.trabajadorIds.includes(trabajadorId),
      );

      const nuevo: MovimientoNomina = {
        id: `mov-criterio-${recurrente.id}-${trabajadorId}`,
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
        createdAt: ahora,
        updatedAt: ahora,
      };
      nomina.movimientos.push(nuevo);
      resultado.push(nuevo);
    }

    return resultado;
  }

  /**
   * Detecta trabajadores asignados a >1 segmento activo del mismo período.
   * Regla bloqueante (la nómina no puede calcularse con duplicidades).
   */
  validarDuplicidadTrabajadorSegmento(nominaPeriodoId: string): IncidenciaNomina[] {
    const nomina = this.nominas.get(nominaPeriodoId);
    if (!nomina) {
      return [];
    }

    const segmentosPorTrabajador = new Map<string, string[]>();
    for (const segmento of nomina.segmentos) {
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
          estadoDecision: 'pendiente',
        });
      }
    }
    return incidencias;
  }

  /**
   * Resumen pre-cálculo y pre-cierre.
   *
   * `puedeCalcular === false` y `puedeCerrar === false` si hay al menos una
   * incidencia con `bloqueante: true`. Las advertencias no bloquean pero
   * quedan visibles en `advertencias`.
   */
  obtenerResumenValidacionNomina(nominaPeriodoId: string): ResumenValidacionNomina {
    const nomina = this.nominas.get(nominaPeriodoId);
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

    const incidencias = nomina.incidencias;
    const incidenciasCriticas = incidencias.filter((i) => i.severidad === 'critica');
    const advertencias = incidencias.filter((i) => i.severidad === 'advertencia');
    const trabajadoresCriticos = new Set(
      incidenciasCriticas.map((i) => i.trabajadorId).filter((id): id is string => !!id),
    );
    const trabajadoresAdvertencia = new Set(
      advertencias.map((i) => i.trabajadorId).filter((id): id is string => !!id),
    );
    const trabajadoresConMovimientos = new Set(
      nomina.movimientos
        .filter((m) => m.origen === 'manual' || m.estado === 'omitido')
        .map((m) => m.trabajadorId),
    );

    const hayBloqueante = incidencias.some((i) => i.bloqueante);
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
   * Filtra la dotación con paginación y filtros rápidos. No retorna detalle
   * por trabajador — solo `FilaTrabajadorNominaResumen[]`. El detalle se carga
   * bajo demanda con `obtenerDetalleTrabajador`.
   */
  filtrarDotacion(
    nominaPeriodoId: string,
    filtro: FiltroRapidoDotacion,
    paginacion: PaginacionGrilla,
  ): { filas: FilaTrabajadorNominaResumen[]; total: number } {
    const todas = this.dotacionPorNomina.get(nominaPeriodoId) ?? [];
    const filtradas = todas.filter((fila) => this.coincideFiltro(fila, filtro));

    const total = filtradas.length;
    const inicio = Math.max(0, (paginacion.page - 1) * paginacion.pageSize);
    const fin = inicio + paginacion.pageSize;
    const filas = filtradas.slice(inicio, fin);

    return { filas, total };
  }

  /** Detalle bajo demanda: solo se llama al abrir una fila / modal / drawer. */
  obtenerDetalleTrabajador(
    _nominaPeriodoId: string,
    trabajadorId: string,
  ): DetalleTrabajadorNomina | undefined {
    return DETALLES_TRABAJADORES_MOCK[trabajadorId];
  }

  /**
   * Previsualiza una acción masiva antes de aplicarla.
   *
   * NO modifica la nómina: solo retorna totales, monto estimado, incidencias
   * presentes en el subconjunto y `puedeAplicar` (false si hay críticas
   * bloqueantes entre los afectados).
   *
   * Regla operativa NO opcional: toda acción masiva DEBE pasar por aquí antes.
   */
  previsualizarAccionMasiva(
    nominaPeriodoId: string,
    trabajadorIds: string[],
    accion: AccionMasivaTrabajadores,
  ): PreviewAccionMasivaTrabajadores {
    const nomina = this.nominas.get(nominaPeriodoId);
    const dotacion = this.dotacionPorNomina.get(nominaPeriodoId) ?? [];
    const idsSet = new Set(trabajadorIds);

    const filasAfectadas = dotacion.filter((f) => idsSet.has(f.trabajadorId));
    const totalCriticas = filasAfectadas.reduce((acc, f) => acc + f.totalIncidenciasCriticas, 0);
    const totalAdvertencias = filasAfectadas.reduce((acc, f) => acc + f.totalAdvertencias, 0);

    const incidenciasBloqueantes = (nomina?.incidencias ?? []).filter(
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

  // -------------------------------------------------------------------------
  // Helpers privados.
  // -------------------------------------------------------------------------

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
    if (recurrente.centroCostoId) {
      const dotacion = this.dotacionPorNomina.get(nomina.id) ?? [];
      return dotacion
        .filter((f) => f.centroCosto === recurrente.centroCostoId)
        .map((f) => f.trabajadorId);
    }
    if (recurrente.cargoId) {
      const dotacion = this.dotacionPorNomina.get(nomina.id) ?? [];
      return dotacion
        .filter((f) => f.cargo === recurrente.cargoId)
        .map((f) => f.trabajadorId);
    }
    if (recurrente.tipoContratoId || recurrente.grupoId) {
      return [];
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
      case 'centro-costo': {
        const dotacion = this.dotacionPorNomina.get(nomina.id) ?? [];
        return dotacion
          .filter((f) => f.centroCosto === criterio.centroCostoId)
          .map((f) => f.trabajadorId);
      }
      case 'cargo': {
        const dotacion = this.dotacionPorNomina.get(nomina.id) ?? [];
        return dotacion
          .filter((f) => f.cargo === criterio.cargoId)
          .map((f) => f.trabajadorId);
      }
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
    if (filtro.conIncidencias === true && fila.totalIncidenciasCriticas + fila.totalAdvertencias === 0) {
      return false;
    }
    if (filtro.conIncidencias === false && fila.totalIncidenciasCriticas + fila.totalAdvertencias > 0) {
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
