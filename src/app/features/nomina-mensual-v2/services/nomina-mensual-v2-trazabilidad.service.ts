import { inject, Injectable } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { resolverUsuarioResponsableActual } from '../../../core/auth/auth-user-label';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import type { LiquidacionPeriodo } from '../../liquidaciones-oficiales/models/liquidacion-oficial.model';
import { buildEventosTrazabilidadMock } from '../data/nomina-trazabilidad.mock';
import {
  buildAuditoriaPorPaso,
  mapSnapshotsToEventosTrazabilidad,
  mergeEventosTrazabilidad,
} from '../mappers/nomina-trazabilidad.mapper';
import { esSnapshotParametrosBase } from '../mappers/nomina-parametros-base.mapper';
import type { NominaCalculoPeriodoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import type { PayrollStepId } from '../models/nomina-mensual-v2.models';
import type {
  ContextoTrazabilidadPasoNomina,
  EventoTrazabilidadNomina,
  IntegridadPublicaNomina,
  ResumenAuditoriaPasoNomina,
  TipoEventoTrazabilidadNomina,
} from '../models/nomina-trazabilidad.models';
import { pasosInvalidadosPorEvento } from '../rules/nomina-trazabilidad-invalidacion.rules';

export interface RecomputarTrazabilidadInput {
  eventosLocales: readonly EventoTrazabilidadNomina[];
  contexto?: ContextoTrazabilidadPasoNomina;
  incluirMockSiVacio?: boolean;
}

export interface RecomputarTrazabilidadResult {
  eventos: EventoTrazabilidadNomina[];
  auditoriaPorPaso: Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>;
}

const EVENTOS_PERSISTIDOS_POR_PASO: Partial<Record<PayrollStepId, readonly TipoEventoTrazabilidadNomina[]>> = {
  parameters: ['PARAMETROS_CONGELADOS', 'PARAMETROS_VALIDADOS', 'SNAPSHOT_INVALIDADO'],
  calculation: ['CALCULO_EJECUTADO', 'SNAPSHOT_INVALIDADO'],
  validation: ['PRENOMINA_VALIDADA', 'SNAPSHOT_INVALIDADO'],
  closure: ['PRENOMINA_APROBADA', 'RECALCULO_SOLICITADO', 'LIQUIDACIONES_GENERADAS'],
};

@Injectable({ providedIn: 'root' })
export class NominaMensualV2TrazabilidadService {
  private readonly snapshotRepo = inject(NominaCalculoSnapshotRepository);
  private readonly liquidacionesRepo = inject(LiquidacionesOficialesRepository);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly auth = inject(AuthService);

  async cargarEventosServidor(periodo = this.periodoActivo.periodoYm()): Promise<EventoTrazabilidadNomina[]> {
    try {
      const [historial, activo] = await Promise.all([
        this.snapshotRepo.listarSnapshotsPeriodo(periodo),
        this.snapshotRepo.obtenerSnapshotActivo(periodo),
      ]);
      const historialConParametros = await Promise.all(
        historial.map((snapshot) => this.enriquecerSnapshotParametrosBase(snapshot)),
      );
      const activoConParametros = activo ? await this.enriquecerSnapshotParametrosBase(activo) : null;
      const eventosSnapshots = mapSnapshotsToEventosTrazabilidad(historialConParametros, activoConParametros);
      const liquidacion = await this.liquidacionesRepo.obtenerLiquidacionPeriodo(
        periodo,
        activoConParametros?.idCalculoPeriodo ?? null,
      );
      return liquidacion
        ? mergeEventosTrazabilidad(eventosSnapshots, [this.mapEventoLiquidacion(liquidacion)])
        : eventosSnapshots;
    } catch (error) {
      console.error('[Nómina V2] No fue posible cargar trazabilidad del servidor', error);
      return [];
    }
  }

  private async enriquecerSnapshotParametrosBase(
    snapshot: NominaCalculoPeriodoSnapshot,
  ): Promise<NominaCalculoPeriodoSnapshot> {
    if (!esSnapshotParametrosBase(snapshot) || !snapshot.idCalculoPeriodo) return snapshot;
    if ((snapshot.parametros?.length ?? 0) > 0) return snapshot;
    const parametros = await this.snapshotRepo.listarParametrosSnapshot(snapshot.idCalculoPeriodo);
    return { ...snapshot, parametros };
  }

  async recomputar(
    input: RecomputarTrazabilidadInput,
    periodo = this.periodoActivo.periodoYm(),
  ): Promise<RecomputarTrazabilidadResult> {
    const servidor = await this.cargarEventosServidor(periodo);
    const usarMock =
      input.incluirMockSiVacio !== false
      && servidor.length === 0
      && input.eventosLocales.length === 0;
    const mock = usarMock ? buildEventosTrazabilidadMock(periodo) : [];
    const eventosLocales = this.filtrarEventosLocalesCubiertosPorServidor(servidor, input.eventosLocales);
    const eventos = mergeEventosTrazabilidad(servidor, eventosLocales, mock);
    const auditoriaPorPaso = buildAuditoriaPorPaso(eventos);
    this.enriquecerAuditoriaConContexto(auditoriaPorPaso, input.contexto, eventosLocales);
    return { eventos, auditoriaPorPaso };
  }

  crearEventoLocal(params: {
    periodo?: string;
    paso: PayrollStepId;
    tipoEvento: TipoEventoTrazabilidadNomina;
    descripcion: string;
    integridad?: IntegridadPublicaNomina;
    metadataPublica?: Record<string, unknown>;
    idSnapshotRelacionado?: string;
  }): EventoTrazabilidadNomina {
    const periodo = params.periodo ?? this.periodoActivo.periodoYm();
    const usuario = this.resolverUsuarioActual();
    return {
      idEvento: `local-${params.paso}-${params.tipoEvento}-${Date.now()}`,
      periodo,
      paso: params.paso,
      tipoEvento: params.tipoEvento,
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      fechaEvento: new Date().toISOString(),
      descripcion: params.descripcion,
      idSnapshotRelacionado: params.idSnapshotRelacionado,
      integridad: params.integridad ?? { estadoIntegridad: 'pendiente' },
      metadataPublica: params.metadataPublica,
      origen: 'local',
    };
  }

  crearEventoInvalidacion(
    pasoOrigen: PayrollStepId,
    motivo: string,
    periodo = this.periodoActivo.periodoYm(),
  ): EventoTrazabilidadNomina {
    const afectados = pasosInvalidadosPorEvento(pasoOrigen, 'SNAPSHOT_INVALIDADO');
    return this.crearEventoLocal({
      periodo,
      paso: pasoOrigen,
      tipoEvento: 'SNAPSHOT_INVALIDADO',
      descripcion: motivo,
      integridad: { estadoIntegridad: 'invalidado' },
      metadataPublica: { pasosAfectados: afectados },
    });
  }

  resolverUsuarioActual(): { id: string | null; nombre: string } {
    return resolverUsuarioResponsableActual(this.auth.currentUser());
  }

  private mapEventoLiquidacion(liquidacion: LiquidacionPeriodo): EventoTrazabilidadNomina {
    const usuarioMetadata = this.parseUsuarioResponsableMetadata(liquidacion.metadata);
    return {
      idEvento: `srv-liq-${liquidacion.idLiquidacionPeriodo}`,
      periodo: liquidacion.periodo,
      paso: 'closure',
      tipoEvento: 'LIQUIDACIONES_GENERADAS',
      usuarioId: liquidacion.usuarioGeneracionId ?? usuarioMetadata.id,
      usuarioNombre:
        liquidacion.usuarioGeneracionLabel
        || usuarioMetadata.nombre
        || 'Usuario no disponible en esta sesion',
      fechaEvento: liquidacion.fechaGeneracion,
      descripcion: 'Liquidaciones generadas desde nomina confirmada',
      idSnapshotRelacionado: String(liquidacion.idCalculoPeriodo),
      integridad: { estadoIntegridad: 'registrado' },
      metadataPublica: {
        idLiquidacionPeriodo: liquidacion.idLiquidacionPeriodo,
        totalTrabajadores: liquidacion.totalTrabajadores,
        totalLiquido: liquidacion.totalLiquido,
      },
      origen: 'servidor',
    };
  }

  private parseUsuarioResponsableMetadata(metadata: Record<string, unknown>): { id: string | null; nombre: string | null } {
    const nested = metadata['usuarioResponsable'];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      return { id: null, nombre: null };
    }
    const record = nested as Record<string, unknown>;
    return {
      id: typeof record['id'] === 'string' ? record['id'] : null,
      nombre: typeof record['nombre'] === 'string' && record['nombre'].trim() ? record['nombre'] : null,
    };
  }

  private filtrarEventosLocalesCubiertosPorServidor(
    servidor: readonly EventoTrazabilidadNomina[],
    locales: readonly EventoTrazabilidadNomina[],
  ): EventoTrazabilidadNomina[] {
    const eventosPersistidosServidor = new Set(
      servidor
        .filter((evento) => evento.origen === 'servidor')
        .map((evento) => `${evento.paso}:${evento.tipoEvento}`),
    );

    return locales.filter((evento) => {
      const tiposPersistidos = EVENTOS_PERSISTIDOS_POR_PASO[evento.paso];
      if (!tiposPersistidos?.includes(evento.tipoEvento)) return true;
      return !tiposPersistidos.some((tipo) => eventosPersistidosServidor.has(`${evento.paso}:${tipo}`));
    });
  }

  private enriquecerAuditoriaConContexto(
    auditoria: Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>,
    contexto: ContextoTrazabilidadPasoNomina | undefined,
    locales: readonly EventoTrazabilidadNomina[],
  ): void {
    if (!contexto) return;

    const ultimoDotacion = locales.find((e) => e.paso === 'dotacion' && e.origen === 'local');
    if (ultimoDotacion && auditoria.dotacion) {
      auditoria.dotacion = {
        ...auditoria.dotacion,
        estado: 'validado',
        accionPrincipal: ultimoDotacion.descripcion,
        usuarioNombre: ultimoDotacion.usuarioNombre,
        fechaAccion: ultimoDotacion.fechaEvento,
        integridad: ultimoDotacion.integridad,
      };
    }

    void contexto;
  }
}
