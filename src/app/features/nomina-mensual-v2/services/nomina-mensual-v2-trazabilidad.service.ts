import { inject, Injectable } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { buildEventosTrazabilidadMock } from '../data/nomina-trazabilidad.mock';
import {
  buildAuditoriaPorPaso,
  mapSnapshotsToEventosTrazabilidad,
  mergeEventosTrazabilidad,
} from '../mappers/nomina-trazabilidad.mapper';
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

@Injectable({ providedIn: 'root' })
export class NominaMensualV2TrazabilidadService {
  private readonly snapshotRepo = inject(NominaCalculoSnapshotRepository);
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly auth = inject(AuthService);

  async cargarEventosServidor(periodo = this.periodoActivo.periodoYm()): Promise<EventoTrazabilidadNomina[]> {
    try {
      const [historial, activo] = await Promise.all([
        this.snapshotRepo.listarSnapshotsPeriodo(periodo),
        this.snapshotRepo.obtenerSnapshotActivo(periodo),
      ]);
      return mapSnapshotsToEventosTrazabilidad(historial, activo);
    } catch (error) {
      console.error('[Nómina V2] No fue posible cargar trazabilidad del servidor', error);
      return [];
    }
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
    const eventos = mergeEventosTrazabilidad(servidor, input.eventosLocales, mock);
    const auditoriaPorPaso = buildAuditoriaPorPaso(eventos);
    this.enriquecerAuditoriaConContexto(auditoriaPorPaso, input.contexto, input.eventosLocales);
    return { eventos, auditoriaPorPaso };
  }

  crearEventoLocal(params: {
    periodo?: string;
    paso: PayrollStepId;
    tipoEvento: TipoEventoTrazabilidadNomina;
    descripcion: string;
    integridad?: IntegridadPublicaNomina;
    metadataPublica?: Record<string, unknown>;
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
    const user = this.auth.currentUser();
    if (!user) return { id: null, nombre: 'Usuario actual' };
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const nombre =
      (typeof meta?.['nombre'] === 'string' && meta['nombre'])
      || (typeof meta?.['full_name'] === 'string' && meta['full_name'])
      || user.email?.split('@')[0]
      || 'Usuario actual';
    return { id: user.id ?? null, nombre };
  }

  private enriquecerAuditoriaConContexto(
    auditoria: Partial<Record<PayrollStepId, ResumenAuditoriaPasoNomina>>,
    contexto: ContextoTrazabilidadPasoNomina | undefined,
    locales: readonly EventoTrazabilidadNomina[],
  ): void {
    if (!contexto) return;

    const ultimoParametros = locales.find(
      (e) => e.paso === 'parameters' && e.origen === 'local',
    );
    if (ultimoParametros && auditoria.parameters) {
      auditoria.parameters = {
        ...auditoria.parameters,
        accionPrincipal: ultimoParametros.descripcion,
        usuarioNombre: ultimoParametros.usuarioNombre,
        fechaAccion: ultimoParametros.fechaEvento,
        integridad: ultimoParametros.integridad,
      };
    }

    const ultimoAlcance = locales.find((e) => e.paso === 'scope' && e.origen === 'local');
    if (ultimoAlcance && auditoria.scope) {
      auditoria.scope = {
        ...auditoria.scope,
        estado: 'validado',
        accionPrincipal: ultimoAlcance.descripcion,
        usuarioNombre: ultimoAlcance.usuarioNombre,
        fechaAccion: ultimoAlcance.fechaEvento,
        integridad: ultimoAlcance.integridad,
      };
    }

    const ultimoEmpleados = locales.find((e) => e.paso === 'employees' && e.origen === 'local');
    if (ultimoEmpleados && auditoria.employees) {
      auditoria.employees = {
        ...auditoria.employees,
        estado: 'validado',
        accionPrincipal: ultimoEmpleados.descripcion,
        usuarioNombre: ultimoEmpleados.usuarioNombre,
        fechaAccion: ultimoEmpleados.fechaEvento,
        integridad: ultimoEmpleados.integridad,
      };
    }

    void contexto;
  }
}
