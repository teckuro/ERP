import { Injectable, inject } from '@angular/core';

import { etiquetaPeriodoDesdeYm, PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import type { PayrollStepId } from '../models/nomina-mensual-v2.models';
import type {
  EstadoBaseParametrosPeriodoView,
  OrigenBaseParametrosAlAvanzar,
} from '../models/nomina-parametros-base.models';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import type { ContextoTrazabilidadPasoNomina } from '../models/nomina-trazabilidad.models';
import { resolverOrigenBaseDesdeSnapshot } from '../mappers/nomina-parametros-base.mapper';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { NominaPeriodoRepository } from '../../nomina-mensual/data-access/nomina-periodo.repository';
import {
  ORDEN_PASOS_NOMINA,
  indiceMaximoPasoAccesibleEfectivo,
} from '../containers/nomina-mensual-v2-container/facade/nomina-mensual-v2-navegacion';
import { buildNominaParametrosContext } from '../rules/nomina-parametros-rango.rules';
import { NominaParametrosBaseService } from './nomina-parametros-base.service';
import { NominaParametrosResumenService } from './nomina-parametros-resumen.service';

export type EstadoSesionNominaV2 = {
  pasoInicial: PayrollStepId;
  parametrosPreparados: boolean;
  estadoBase: EstadoBaseParametrosPeriodoView;
  origenBase: OrigenBaseParametrosAlAvanzar | null;
  idCalculoPeriodoBase: number | null;
  contextoTrazabilidad: ContextoTrazabilidadPasoNomina | null;
  /**
   * Paso al que el container debe rehidratar si la nómina ya tiene
   * `ultimo_paso_visitado` accesible según su estado. `null` cuando no hay
   * nómina cargada, la nómina es nueva o el paso visitado no es alcanzable
   * en el estado actual (p. ej. la nómina se reabrió antes del cierre).
   */
  pasoVisitadoSugerido: PayrollStepId | null;
};

@Injectable({ providedIn: 'root' })
export class NominaMensualV2SesionService {
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly parametrosBaseService = inject(NominaParametrosBaseService);
  private readonly parametrosResumenService = inject(NominaParametrosResumenService);
  private readonly snapshotRepository = inject(NominaCalculoSnapshotRepository);
  private readonly nominaPeriodoRepository = inject(NominaPeriodoRepository);

  async resolverEstadoSesion(
    periodo = this.periodoActivo.periodoYm(),
    nominaPeriodoId?: string | null,
  ): Promise<EstadoSesionNominaV2> {
    const context = nominaPeriodoId
      ? await this.resolverContextoNomina(nominaPeriodoId)
      : null;

    const [estadoBase, resumen] = await Promise.all([
      context
        ? this.parametrosBaseService.obtenerEstadoBaseNomina(context)
        : this.parametrosBaseService.obtenerEstadoBasePeriodo(periodo),
      context
        ? this.parametrosResumenService.obtenerResumenParaNomina(context)
        : this.parametrosResumenService.obtenerResumen(periodo),
    ]);

    const parametrosPreparados = estadoBase.idCalculoPeriodoBase != null;
    let origenBase: OrigenBaseParametrosAlAvanzar | null = null;

    if (parametrosPreparados) {
      const snapshot = await this.snapshotRepository.obtenerSnapshotParametrosBase(
        resumen.periodo,
        context?.idEmpresa ?? null,
        context?.nominaPeriodoId ?? null,
      );
      origenBase = snapshot ? resolverOrigenBaseDesdeSnapshot(snapshot) : 'existenteSinDiferencias';
    }

    const pasoVisitadoSugerido = nominaPeriodoId
      ? await this.resolverPasoVisitadoSugerido(nominaPeriodoId)
      : null;

    return {
      pasoInicial: parametrosPreparados ? 'dotacion' : 'parameters',
      parametrosPreparados,
      estadoBase,
      origenBase,
      idCalculoPeriodoBase: estadoBase.idCalculoPeriodoBase,
      contextoTrazabilidad: this.buildContextoTrazabilidad(resumen, estadoBase, origenBase),
      pasoVisitadoSugerido,
    };
  }

  private async resolverContextoNomina(nominaPeriodoId: string) {
    try {
      const cabecera = await this.nominaPeriodoRepository.obtenerCabecera(nominaPeriodoId);
      if (!cabecera) return null;
      return buildNominaParametrosContext(cabecera);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      console.warn('[NominaMensualV2SesionService] No se pudo resolver contexto de parámetros:', mensaje);
      return null;
    }
  }

  /**
   * Devuelve el `PayrollStepId` al que rehidratar el container, validando que
   * el paso sea accesible según el estado actual de la nómina Y el contenido
   * persistido (`maximoPasoCompletado`). Usa
   * `indiceMaximoPasoAccesibleEfectivo` para combinar ambos techos: si el
   * paso visitado quedó por encima del máximo accesible efectivo, caemos al
   * máximo accesible (no al pasoInicial, para que el usuario vuelva lo más
   * cerca posible de donde estaba).
   *
   * Si la nómina está `anulada`, no se sugiere paso (el container caerá al
   * `pasoInicial`).
   */
  private async resolverPasoVisitadoSugerido(
    nominaPeriodoId: string,
  ): Promise<PayrollStepId | null> {
    try {
      const cabecera = await this.nominaPeriodoRepository.obtenerCabecera(nominaPeriodoId);
      if (!cabecera) return null;
      const visitado = cabecera.ultimoPasoVisitado ?? null;
      if (!visitado) return null;
      if (cabecera.estado === 'anulada') return null;

      const indiceVisitado = ORDEN_PASOS_NOMINA.indexOf(visitado);
      if (indiceVisitado < 0) return null;

      const indiceMaxCompletado = cabecera.maximoPasoCompletado
        ? ORDEN_PASOS_NOMINA.indexOf(cabecera.maximoPasoCompletado)
        : -1;

      const indiceMaximoAccesibleEfectivo = indiceMaximoPasoAccesibleEfectivo(
        cabecera.estado,
        indiceMaxCompletado,
      );

      if (indiceVisitado <= indiceMaximoAccesibleEfectivo) {
        return visitado;
      }
      if (indiceMaximoAccesibleEfectivo < 0) return null;
      return ORDEN_PASOS_NOMINA[indiceMaximoAccesibleEfectivo] ?? null;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      console.warn('[NominaMensualV2SesionService] No se pudo resolver paso visitado:', mensaje);
      return null;
    }
  }

  private buildContextoTrazabilidad(
    resumen: NominaParametrosResumen,
    estadoBase: EstadoBaseParametrosPeriodoView,
    origenBase: OrigenBaseParametrosAlAvanzar | null,
  ): ContextoTrazabilidadPasoNomina {
    return {
      periodo: resumen.periodo,
      nominaPeriodoId: resumen.nominaPeriodoId ?? null,
      parametrosResumen: {
        seccionesListas: resumen.seccionesListas,
        seccionesTotal: resumen.seccionesTotales,
        controlesVerificados: resumen.controlesVerificados,
        bloqueos: resumen.bloqueos,
        advertencias: resumen.requiereRevision,
      },
      parametrosBase: origenBase && estadoBase.idCalculoPeriodoBase
        ? {
            origen: origenBase,
            idCalculoPeriodoBase: estadoBase.idCalculoPeriodoBase,
            fechaBaseGuardada: estadoBase.fechaBaseGuardada,
          }
        : undefined,
    };
  }

  etiquetaPeriodo(periodo: string): string {
    return etiquetaPeriodoDesdeYm(periodo);
  }
}
