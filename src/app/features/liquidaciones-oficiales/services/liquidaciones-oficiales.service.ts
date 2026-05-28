import { inject, Injectable } from '@angular/core';

import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import type { NominaCalculoPeriodoSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import { LiquidacionesOficialesRepository } from '../data-access/liquidaciones-oficiales.repository';
import type {
  LiquidacionesEstadoPeriodo,
  LiquidacionTrabajador,
} from '../models/liquidacion-oficial.model';
import {
  clasificarAdvertenciasLiquidacion,
  determinarEstadoLiquidaciones,
  obtenerMotivoNoPuedeGenerar,
} from '../rules/liquidaciones-oficiales.rules';

@Injectable({ providedIn: 'root' })
export class LiquidacionesOficialesService {
  private readonly liquidaciones = inject(LiquidacionesOficialesRepository);
  private readonly snapshots = inject(NominaCalculoSnapshotRepository);

  async consultarEstadoPeriodo(periodo: string): Promise<LiquidacionesEstadoPeriodo> {
    const p = periodo.trim();
    const [snapshot, liquidacion] = await Promise.all([
      this.snapshots.obtenerSnapshotActivo(p),
      this.liquidaciones.obtenerLiquidacionPeriodo(p),
    ]);
    const trabajadores = liquidacion
      ? await this.liquidaciones.obtenerLiquidacionesTrabajadores(liquidacion.idLiquidacionPeriodo)
      : [];
    const snapshotUi = mapSnapshot(snapshot);
    const advertencias = clasificarAdvertenciasLiquidacion({
      totalAdvertenciasSnapshot: snapshot?.totalAdvertencias ?? 0,
      trabajadoresSinConceptos: 0,
      conceptosSinCodigoLre: 0,
    });

    return {
      estado: determinarEstadoLiquidaciones({ snapshot: snapshotUi, liquidacion, advertencias }),
      periodo: p,
      snapshot: snapshotUi,
      liquidacion,
      trabajadores,
      motivoNoPuedeGenerar: obtenerMotivoNoPuedeGenerar(snapshotUi, liquidacion),
      advertencias,
    };
  }

  async generarLiquidaciones(periodo: string): Promise<LiquidacionesEstadoPeriodo> {
    const estado = await this.consultarEstadoPeriodo(periodo);
    if (!estado.snapshot?.idCalculoPeriodo) {
      throw new Error('No se pudo consultar una nómina mensual confirmada para este período.');
    }
    if (estado.motivoNoPuedeGenerar) {
      throw new Error(estado.motivoNoPuedeGenerar);
    }

    await this.liquidaciones.generarLiquidacionesOficiales({
      idCalculoPeriodo: estado.snapshot.idCalculoPeriodo,
      periodo: estado.periodo,
      metadata: buildMetadataGeneracion(estado),
    });
    return this.consultarEstadoPeriodo(estado.periodo);
  }

  obtenerDetalleTrabajador(idLiquidacionTrabajador: number) {
    return this.liquidaciones.obtenerDetalleTrabajador(idLiquidacionTrabajador);
  }
}

function mapSnapshot(snapshot: NominaCalculoPeriodoSnapshot | null): LiquidacionesEstadoPeriodo['snapshot'] {
  if (!snapshot?.idCalculoPeriodo) return null;
  return {
    idCalculoPeriodo: snapshot.idCalculoPeriodo,
    totalTrabajadores: snapshot.totalTrabajadores,
    totalHaberes: snapshot.totalHaberes,
    totalDescuentos: snapshot.totalDescuentos,
    totalLiquido: snapshot.totalLiquido,
    totalAdvertencias: snapshot.totalAdvertencias,
    versionMotor: snapshot.versionMotor,
    hashSnapshot: snapshot.hashSnapshot,
    aprobadoOperativamente: snapshot.aprobacionOperativa?.estado === 'aprobado_operativamente',
    cerradoOperativamente: snapshot.cierreOperativo?.estado === 'cerrado_operativamente',
  };
}

function buildMetadataGeneracion(estado: LiquidacionesEstadoPeriodo): Record<string, unknown> {
  return {
    periodo: estado.periodo,
    idCalculoPeriodo: estado.snapshot?.idCalculoPeriodo ?? null,
    totalTrabajadoresSnapshot: estado.snapshot?.totalTrabajadores ?? 0,
    versionMotor: estado.snapshot?.versionMotor ?? null,
    hashSnapshot: estado.snapshot?.hashSnapshot ?? null,
    notaAlcance: 'Generacion interna desde nómina mensual confirmada. Sin recalculo ni salidas legales.',
  };
}
