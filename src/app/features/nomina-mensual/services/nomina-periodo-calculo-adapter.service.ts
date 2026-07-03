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
  NominaPeriodo,
} from '../models/nomina-periodo.models';
import {
  mapSnapshotCompletoToMotorCalculoPeriodo,
  mapTrabajadorSnapshotToLiquidacion,
} from '../rules/proceso-mensual-snapshot.rules';
import { NominaCalculoSnapshotRepository } from '../data-access/nomina-calculo-snapshot.repository';
import { NominaConsolidacionRepository } from '../data-access/nomina-consolidacion.repository';
import { NominaPeriodoService } from './nomina-periodo.service';
import { NominaPlantillaCicloService } from './nomina-plantilla-ciclo.service';
import { ProcesoMensualService } from './proceso-mensual.service';
import { calcularTotalesRectificacionVista } from '../rules/proceso-mensual-motor-rectificacion.rules';
import { validarAlcanceMotorPiloto } from '../rules/nomina-motor-01-acotado.rules';

export interface ResultadoCalculoNominaPeriodo {
  resultado: MotorCalculoPeriodoResultado;
  idCalculoPeriodo?: number;
}

@Injectable({ providedIn: 'root' })
export class NominaPeriodoCalculoAdapterService {
  private readonly nominas = inject(NominaPeriodoService);
  private readonly motor = inject(ProcesoMensualService);
  private readonly plantillas = inject(NominaPlantillaCicloService);
  private readonly snapshotRepo = inject(NominaCalculoSnapshotRepository);
  private readonly consolidacion = inject(NominaConsolidacionRepository);

  async calcular(nominaPeriodoId: string): Promise<ResultadoCalculoNominaPeriodo> {
    const nomina = await this.nominas.obtenerNomina(nominaPeriodoId);
    if (!nomina) throw new Error('Nómina no encontrada.');
    if (nomina.trabajadorIds.length === 0) {
      throw new Error('La nómina no tiene trabajadores para calcular.');
    }

    const idEmpresa = Number(nomina.empresaId);
    const idEmpresaNumerico = Number.isFinite(idEmpresa) ? idEmpresa : null;

    const trabajadorIds = nomina.trabajadorIds.map(Number).filter(Number.isFinite);
    const alcance = validarAlcanceMotorPiloto(trabajadorIds);
    if (!alcance.ok) throw new Error(alcance.mensaje);

    const opcionesMotor = { nominaPeriodoId };

    let resultado: MotorCalculoPeriodoResultado;
    if (nomina.naturaleza === 'anticipo') {
      const regla = await this.resolverReglaAnticipo(nomina.plantillaCicloId);
      resultado = await this.motor.generarCalculoAnticipoPeriodo(
        nomina.periodo,
        trabajadorIds,
        regla,
        opcionesMotor,
      );
    } else if (nomina.naturaleza === 'rectificacion') {
      resultado = await this.calcularRectificacion(nomina, trabajadorIds, opcionesMotor);
    } else {
      resultado = await this.motor.generarCalculoPeriodo(nomina.periodo, trabajadorIds, opcionesMotor);
    }

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

    if (nomina.naturaleza === 'anticipo' || nomina.naturaleza === 'pago_extraordinario') {
      try {
        await this.consolidacion.registrarConsolidacionCalculo(nominaPeriodoId);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.includes('No existe nómina mensual')) {
          throw error;
        }
      }
    }

    return {
      resultado,
      idCalculoPeriodo: guardado.snapshot.idCalculoPeriodo ?? undefined,
    };
  }

  private async resolverReglaAnticipo(plantillaCicloId?: string) {
    if (!plantillaCicloId) {
      throw new Error('La nómina de anticipo no tiene plantilla asociada.');
    }
    const plantilla = await this.plantillas.obtenerPorId(plantillaCicloId);
    if (!plantilla?.reglaAnticipo) {
      throw new Error('La plantilla no define regla de anticipo.');
    }
    return plantilla.reglaAnticipo;
  }

  private async calcularRectificacion(
    nomina: NominaPeriodo,
    trabajadorIds: number[],
    opcionesMotor: { nominaPeriodoId: string },
  ): Promise<MotorCalculoPeriodoResultado> {
    if (!nomina.nominaOrigenId) {
      throw new Error('La rectificación no tiene nómina origen vinculada.');
    }
    const origen = await this.nominas.obtenerNomina(nomina.nominaOrigenId);
    if (!origen) {
      throw new Error('No se encontró la nómina original cerrada.');
    }
    if (origen.estado !== 'cerrada') {
      throw new Error('La nómina original debe permanecer cerrada para calcular la rectificación.');
    }
    const resumenOrigen = await this.nominas.obtenerResumenCalculo(origen.id);
    if (!resumenOrigen?.idCalculoPeriodo) {
      throw new Error('La nómina original no tiene cálculo vigente para comparar.');
    }
    const snapshotOrigen = await this.motor.obtenerSnapshotCompletoPorId(resumenOrigen.idCalculoPeriodo);
    if (!snapshotOrigen) {
      throw new Error('No fue posible cargar el cálculo original.');
    }
    return this.motor.generarCalculoRectificacionPeriodo({
      periodo: nomina.periodo,
      trabajadorIds,
      snapshotOrigen,
      nominaOrigenId: origen.id,
      versionCalculoOrigen: origen.evidenciaCalculo?.versionCalculo ?? 0,
      opciones: opcionesMotor,
    });
  }

  async obtenerTotalesRectificacion(nominaPeriodoId: string) {
    const nomina = await this.nominas.obtenerNomina(nominaPeriodoId);
    if (!nomina?.nominaOrigenId || nomina.naturaleza !== 'rectificacion') return null;

    const origen = await this.nominas.obtenerNomina(nomina.nominaOrigenId);
    if (!origen) return null;

    const resumenOrigen = await this.nominas.obtenerResumenCalculo(origen.id);
    const resumenDiff = await this.nominas.obtenerResumenCalculo(nominaPeriodoId);

    const original = {
      haberes: resumenOrigen?.totalHaberes ?? origen.totalHaberes ?? 0,
      descuentos: resumenOrigen?.totalDescuentos ?? origen.totalDescuentos ?? 0,
      liquido: resumenOrigen?.totalLiquido ?? origen.totalLiquido ?? 0,
    };
    const diferencia = {
      haberes: resumenDiff?.totalHaberes ?? nomina.totalHaberes ?? 0,
      descuentos: resumenDiff?.totalDescuentos ?? nomina.totalDescuentos ?? 0,
      liquido: resumenDiff?.totalLiquido ?? nomina.totalLiquido ?? 0,
    };

    return calcularTotalesRectificacionVista({ totalesOrigen: original, totalesDiferencia: diferencia });
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
