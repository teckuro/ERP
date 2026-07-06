import { Injectable, inject } from '@angular/core';

import { HaberesDescuentosService } from '../../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../../movimientos-variables/services/movimientos-variables.service';
import { NovedadesMensualesService } from '../../novedades/services/novedades-mensuales.service';
import type {
  EntradaMensualPeriodo,
  ResumenEntradasMensualesPeriodo,
} from '../models/entrada-mensual-periodo.model';
import {
  construirResumenEntradas,
  normalizarEntradaMovimientoLegacy,
  normalizarEntradaNovedadMensual,
  normalizarEntradaRecurrente,
  validarPeriodoEntradaMensual,
} from '../rules/entradas-mensuales-periodo.rules';

const MSG_PERIODO_INVALIDO = 'El periodo debe tener formato YYYY-MM.';
const MSG_PERSONA_INVALIDA = 'Debe indicar un trabajador valido.';

function assertPeriodo(periodo: string): void {
  if (!validarPeriodoEntradaMensual(periodo)) {
    throw new Error(MSG_PERIODO_INVALIDO);
  }
}

function assertPersona(idPersona: number): void {
  if (idPersona == null || idPersona <= 0) {
    throw new Error(MSG_PERSONA_INVALIDA);
  }
}

function errorFuente(nombre: string, error: unknown): Error {
  const detalle = error instanceof Error ? error.message : String(error);
  return new Error(`No se pudieron listar entradas mensuales desde ${nombre}: ${detalle}`);
}

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

@Injectable({ providedIn: 'root' })
export class EntradasMensualesPeriodoService {
  private readonly novedadesMensualesService = inject(NovedadesMensualesService);
  private readonly movimientosVariablesService = inject(MovimientosVariablesService);
  private readonly haberesDescuentosService = inject(HaberesDescuentosService);

  async listarEntradasPeriodo(periodo: string): Promise<EntradaMensualPeriodo[]> {
    assertPeriodo(periodo);
    const periodoNormalizado = periodo.trim();
    const [recurrentes, novedades, legacy] = await Promise.all([
      this.listarRecurrentesPeriodo(periodoNormalizado),
      this.listarNovedadesCanonicas(periodoNormalizado),
      this.listarLegacyMovimientos(periodoNormalizado),
    ]);
    return [...recurrentes, ...novedades, ...legacy];
  }

  async listarEntradasPorPersona(periodo: string, idPersona: number): Promise<EntradaMensualPeriodo[]> {
    assertPeriodo(periodo);
    assertPersona(idPersona);
    const entradas = await this.listarEntradasPeriodo(periodo.trim());
    return entradas.filter((entrada) => entrada.idPersona === idPersona);
  }

  async listarNovedadesCanonicas(periodo: string): Promise<EntradaMensualPeriodo[]> {
    assertPeriodo(periodo);
    try {
      const novedades = await this.novedadesMensualesService.listarNovedadesPeriodo(periodo.trim());
      return asArray(novedades).map((novedad) => normalizarEntradaNovedadMensual(novedad));
    } catch (error) {
      throw errorFuente('Movimientos del mes', error);
    }
  }

  async listarLegacyMovimientos(periodo: string): Promise<EntradaMensualPeriodo[]> {
    assertPeriodo(periodo);
    try {
      const movimientos = await this.movimientosVariablesService.listarPorPeriodo(periodo.trim());
      return asArray(movimientos).map((movimiento) => normalizarEntradaMovimientoLegacy(movimiento));
    } catch (error) {
      throw errorFuente('Movimientos del mes legacy', error);
    }
  }

  async listarRecurrentesPeriodo(periodo: string): Promise<EntradaMensualPeriodo[]> {
    assertPeriodo(periodo);
    try {
      const recurrentes = await this.haberesDescuentosService.listarAsignacionesParaPrevalidacionMensual(periodo.trim());
      return asArray(recurrentes)
        .map((fila) => normalizarEntradaRecurrente(fila, periodo.trim()))
        .filter((entrada): entrada is EntradaMensualPeriodo => entrada != null);
    } catch (error) {
      throw errorFuente('Asignaciones recurrentes', error);
    }
  }

  async construirResumenEntradasPeriodo(periodo: string): Promise<ResumenEntradasMensualesPeriodo> {
    const entradas = await this.listarEntradasPeriodo(periodo);
    return construirResumenEntradas(entradas);
  }
}
