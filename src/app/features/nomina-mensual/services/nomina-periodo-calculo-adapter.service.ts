import { inject, Injectable } from '@angular/core';

import type { MotorCalculoPeriodoResultado } from '../models/proceso-mensual.model';
import { mapSnapshotCompletoToMotorCalculoPeriodo } from '../rules/proceso-mensual-snapshot.rules';
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

  async calcular(nominaPeriodoId: string): Promise<ResultadoCalculoNominaPeriodo> {
    const nomina = await this.nominas.obtenerNomina(nominaPeriodoId);
    if (!nomina) throw new Error('Nómina no encontrada.');
    if (nomina.trabajadorIds.length === 0) {
      throw new Error('La nómina no tiene trabajadores para calcular.');
    }

    const idEmpresa = Number(nomina.empresaId);
    const idEmpresaNumerico = Number.isFinite(idEmpresa) ? idEmpresa : null;

    const trabajadorIds = nomina.trabajadorIds.map(Number).filter(Number.isFinite);
    // F09: cálculo y snapshot keyed por la nómina, no por el mes global.
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
   */
  async obtenerResultadoPersistido(
    nominaPeriodoId: string,
  ): Promise<MotorCalculoPeriodoResultado | null> {
    const nomina = await this.nominas.obtenerNomina(nominaPeriodoId);
    if (!nomina?.evidenciaCalculo?.calculoVigente) return null;

    const idCalculoPeriodo = nomina.evidenciaCalculo.idCalculoPeriodo;
    // F09: la rehidratación sin id explícito se resuelve por nómina, nunca por
    // el snapshot global del mes (dos nóminas del mismo mes no se contaminan).
    const completo = idCalculoPeriodo
      ? await this.motor.obtenerSnapshotCompletoPorId(idCalculoPeriodo)
      : await this.motor.obtenerSnapshotCompletoActivoDeNomina(nominaPeriodoId);

    if (!completo) return null;
    return mapSnapshotCompletoToMotorCalculoPeriodo(completo);
  }
}
