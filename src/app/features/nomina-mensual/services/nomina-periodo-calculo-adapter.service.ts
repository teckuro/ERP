import { inject, Injectable } from '@angular/core';

import type {
  MotorCalculoPeriodoResultado,
  NominaCalculoTrabajadorSnapshot,
} from '../models/proceso-mensual.model';
import type {
  FiltroCalculoPorTrabajador,
  FilaCalculoTrabajadorListado,
  PaginacionGrilla,
  ResumenCalculoNomina,
} from '../models/nomina-periodo.models';
import {
  mapSnapshotCompletoToMotorCalculoPeriodo,
  mapTrabajadorSnapshotToLiquidacion,
} from '../rules/proceso-mensual-snapshot.rules';
import { NominaCalculoSnapshotRepository } from '../data-access/nomina-calculo-snapshot.repository';
import { NominaPeriodoService } from './nomina-periodo.service';
import { ProcesoMensualService } from './proceso-mensual.service';

export interface ResultadoCalculoNominaPeriodo {
  resultado: MotorCalculoPeriodoResultado;
  idCalculoPeriodo?: number;
}

@Injectable({ providedIn: 'root' })
export class NominaPeriodoCalculoAdapterService {
  private readonly nominas = inject(NominaPeriodoService);
  private readonly motor = inject(ProcesoMensualService);
  private readonly snapshotRepo = inject(NominaCalculoSnapshotRepository);

  async calcular(nominaPeriodoId: string): Promise<ResultadoCalculoNominaPeriodo> {
    const nomina = await this.nominas.obtenerNomina(nominaPeriodoId);
    if (!nomina) throw new Error('Nómina no encontrada.');
    if (nomina.trabajadorIds.length === 0) {
      throw new Error('La nómina no tiene trabajadores para calcular.');
    }

    const idEmpresa = Number(nomina.empresaId);
    const idEmpresaNumerico = Number.isFinite(idEmpresa) ? idEmpresa : null;

    const trabajadorIds = nomina.trabajadorIds.map(Number).filter(Number.isFinite);
    const resultado = await this.motor.generarCalculoPeriodo(nomina.periodo, trabajadorIds, {
      nominaPeriodoId,
    });
    const guardado = await this.motor.guardarSnapshotPreliminar(nomina.periodo, {
      idEmpresa: idEmpresaNumerico,
      nominaPeriodoId,
    });
    if (!guardado.ok || !guardado.snapshot) {
      const detalle = guardado.issues.map((issue) => issue.mensaje).join(' ');
      throw new Error(detalle || 'No fue posible guardar el cálculo preliminar.');
    }

    await this.nominas.registrarCalculo(nominaPeriodoId, {
      idCalculoPeriodo: guardado.snapshot.idCalculoPeriodo ?? undefined,
      totalTrabajadores: resultado.resumen.totalTrabajadoresCalculados,
      totalHaberes: resultado.resumen.totalHaberes,
      totalDescuentos: resultado.resumen.totalDescuentos,
      totalLiquido: resultado.resumen.totalLiquidoPreliminar,
    });

    return {
      resultado,
      idCalculoPeriodo: guardado.snapshot.idCalculoPeriodo ?? undefined,
    };
  }

  /**
   * Rehidrata el resultado del motor desde el snapshot persistido en BD cuando
   * la nómina ya tiene un cálculo vigente. No recalcula ni escribe.
   *
   * @deprecated Preferir paginación server-side (`listarFilasCalculoPaginado`) en UI.
   */
  async obtenerResultadoPersistido(
    nominaPeriodoId: string,
  ): Promise<MotorCalculoPeriodoResultado | null> {
    const resumen = await this.nominas.obtenerResumenCalculo(nominaPeriodoId);
    if (!resumen?.idCalculoPeriodo) return null;
    const completo = await this.motor.obtenerSnapshotCompletoPorId(resumen.idCalculoPeriodo);
    if (!completo) return null;
    return mapSnapshotCompletoToMotorCalculoPeriodo(completo);
  }

  /** BKL-09: stats globales del paso Cálculo sin cargar filas. */
  obtenerResumenCalculo(nominaPeriodoId: string): Promise<ResumenCalculoNomina | null> {
    return this.nominas.obtenerResumenCalculo(nominaPeriodoId);
  }

  /** BKL-09: página de filas resumidas desde snapshot persistido. */
  listarFilasCalculoPaginado(
    nominaPeriodoId: string,
    filtro: FiltroCalculoPorTrabajador,
    paginacion: PaginacionGrilla,
  ): Promise<{ filas: FilaCalculoTrabajadorListado[]; total: number }> {
    return this.nominas.listarCalculoTrabajadoresPaginado(nominaPeriodoId, filtro, paginacion);
  }

  /** BKL-09: detalle expandible/preview de un trabajador (conceptos + issues). */
  async obtenerDetalleTrabajadorCalculo(
    idCalculoTrabajador: number,
    periodo: string,
  ): Promise<{ trabajador: NominaCalculoTrabajadorSnapshot; liquidacion: ReturnType<typeof mapTrabajadorSnapshotToLiquidacion> } | null> {
    const trabajador = await this.snapshotRepo.obtenerTrabajadorCalculoDetalle(idCalculoTrabajador);
    if (!trabajador) return null;
    return {
      trabajador,
      liquidacion: mapTrabajadorSnapshotToLiquidacion(trabajador, periodo),
    };
  }
}
