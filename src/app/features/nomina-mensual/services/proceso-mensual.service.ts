import { inject, Injectable } from '@angular/core';

import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import { MovimientosVariablesService } from '../../movimientos-variables/services/movimientos-variables.service';
import { esPeriodoRemuneracionValido } from '../../movimientos-variables/rules/movimiento-variable-validacion.rules';
import type { ParametroGeneral, ParametrosGeneralesCatalogos } from '../../parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';

import type { ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';
import { revisarGruposParametrosMinimos } from '../rules/proceso-mensual-parametros-minimos.rules';
import {
  construirPrevalidacionMensual,
  contarRecurrentesParaPrevalidacionMensual,
  type ProcesoMensualHechosPrevalidacion,
} from '../rules/proceso-mensual-prevalidacion.rules';

@Injectable({ providedIn: 'root' })
export class ProcesoMensualService {
  private readonly parametrosGenerales = inject(ParametrosGeneralesService);
  private readonly empleados = inject(EmpleadosService);
  private readonly haberesDescuentos = inject(HaberesDescuentosService);
  private readonly movimientosVariables = inject(MovimientosVariablesService);

  /**
   * Orquesta lecturas y devuelve prevalidacion. No calcula remuneraciones ni liquidaciones.
   */
  async ejecutarPrevalidaciones(periodo: string): Promise<ProcesoMensualPrevalidacion> {
    const p = periodo.trim();
    if (!esPeriodoRemuneracionValido(p)) {
      return construirPrevalidacionMensual(this.hechosMinimos(p));
    }

    const settled = await Promise.allSettled([
      this.parametrosGenerales.obtenerUltimoHastaPeriodo(p),
      this.parametrosGenerales.obtenerPeriodoRemuneracion(p),
      this.empleados.listar(),
      this.haberesDescuentos.listarConceptosMantenimiento(),
      this.movimientosVariables.listarPorPeriodo(p),
      this.haberesDescuentos.listarAsignacionesParaPrevalidacionMensual(p),
      this.parametrosGenerales.listarCatalogos(p),
    ]);

    return construirPrevalidacionMensual(this.mapearHechosDesdeSettled(p, settled));
  }

  private hechosMinimos(periodo: string): ProcesoMensualHechosPrevalidacion {
    return {
      periodo,
      ultimoPg: null,
      lecturaUltimoPg: 'ok',
      periodoRem: null,
      lecturaPeriodoRem: 'ok',
      parametrosGrupos: [],
      empleadosActivosAptos: 0,
      empleadosActivosNoAptos: 0,
      lecturaEmpleados: 'ok',
      totalConceptosMantenimiento: 0,
      lecturaConceptos: 'ok',
      alertaConceptosMotorFuturo: false,
      recurrentesConteo: { lectura: 'ok', aplicables: 0, invalidas: 0, cerradas: 0, fueraDelMes: 0 },
      movimientos: [],
      lecturaMovimientos: 'ok',
    };
  }

  private mapearHechosDesdeSettled(
    periodo: string,
    settled: PromiseSettledResult<unknown>[],
  ): ProcesoMensualHechosPrevalidacion {
    const [rUlt, rPer, rEmp, rConc, rMov, rRec, rCat] = settled;

    let ultimoPg: ParametroGeneral | null = null;
    let lecturaUltimoPg: ProcesoMensualHechosPrevalidacion['lecturaUltimoPg'] = 'ok';
    let errorUltimoPg: string | undefined;
    if (rUlt.status === 'fulfilled') {
      ultimoPg = rUlt.value as ParametroGeneral | null;
    } else {
      lecturaUltimoPg = 'error';
      errorUltimoPg = rUlt.reason instanceof Error ? rUlt.reason.message : String(rUlt.reason);
    }

    let periodoRem: ProcesoMensualHechosPrevalidacion['periodoRem'] = null;
    let lecturaPeriodoRem: ProcesoMensualHechosPrevalidacion['lecturaPeriodoRem'] = 'ok';
    let errorPeriodoRem: string | undefined;
    if (rPer.status === 'fulfilled') {
      periodoRem = rPer.value as ProcesoMensualHechosPrevalidacion['periodoRem'];
    } else {
      lecturaPeriodoRem = 'error';
      errorPeriodoRem = rPer.reason instanceof Error ? rPer.reason.message : String(rPer.reason);
    }

    let empleadosActivosAptos = 0;
    let empleadosActivosNoAptos = 0;
    let lecturaEmpleados: ProcesoMensualHechosPrevalidacion['lecturaEmpleados'] = 'ok';
    let errorEmpleados: string | undefined;
    if (rEmp.status === 'fulfilled') {
      const listado = rEmp.value as Awaited<ReturnType<EmpleadosService['listar']>>;
      for (const e of listado) {
        if (e.estado === 'activo') {
          if (e.aptoParaRemuneraciones) {
            empleadosActivosAptos += 1;
          } else {
            empleadosActivosNoAptos += 1;
          }
        }
      }
    } else {
      lecturaEmpleados = 'error';
      errorEmpleados = rEmp.reason instanceof Error ? rEmp.reason.message : String(rEmp.reason);
    }

    let totalConceptosMantenimiento = 0;
    let lecturaConceptos: ProcesoMensualHechosPrevalidacion['lecturaConceptos'] = 'ok';
    let errorConceptos: string | undefined;
    let alertaConceptosMotorFuturo = false;
    if (rConc.status === 'fulfilled') {
      const rows = rConc.value as Awaited<ReturnType<HaberesDescuentosService['listarConceptosMantenimiento']>>;
      totalConceptosMantenimiento = rows.length;
      alertaConceptosMotorFuturo = rows.some(
        (c) => c.vigente && !c.esSistema && (!c.tipo?.trim() || !c.naturaleza?.trim()),
      );
    } else {
      lecturaConceptos = 'error';
      errorConceptos = rConc.reason instanceof Error ? rConc.reason.message : String(rConc.reason);
    }

    let movimientos: ProcesoMensualHechosPrevalidacion['movimientos'] = [];
    let lecturaMovimientos: ProcesoMensualHechosPrevalidacion['lecturaMovimientos'] = 'ok';
    let errorMovimientos: string | undefined;
    if (rMov.status === 'fulfilled') {
      movimientos = rMov.value as ProcesoMensualHechosPrevalidacion['movimientos'];
    } else {
      lecturaMovimientos = 'error';
      errorMovimientos = rMov.reason instanceof Error ? rMov.reason.message : String(rMov.reason);
    }

    let recurrentesConteo: ProcesoMensualHechosPrevalidacion['recurrentesConteo'];
    if (rRec.status === 'fulfilled') {
      const filas = rRec.value as HaberDescuentoAsignacionPrevalidacionMensualFila[];
      recurrentesConteo = { lectura: 'ok', ...contarRecurrentesParaPrevalidacionMensual(filas) };
    } else {
      recurrentesConteo = {
        lectura: 'error',
        error: rRec.reason instanceof Error ? rRec.reason.message : String(rRec.reason),
        aplicables: 0,
        invalidas: 0,
        cerradas: 0,
        fueraDelMes: 0,
      };
    }

    let catalogos: ParametrosGeneralesCatalogos | null = null;
    let lecturaCatalogos: 'ok' | 'error' | 'omitido' = 'omitido';
    let errorCatalogos: string | undefined;
    if (rCat.status === 'fulfilled') {
      catalogos = rCat.value as ParametrosGeneralesCatalogos;
      lecturaCatalogos = 'ok';
    } else {
      lecturaCatalogos = 'error';
      errorCatalogos = rCat.reason instanceof Error ? rCat.reason.message : String(rCat.reason);
    }

    const parametrosGrupos = revisarGruposParametrosMinimos({
      periodo,
      fila: ultimoPg,
      lecturaFila: lecturaUltimoPg,
      catalogos,
      lecturaCatalogos,
      errorCatalogos,
    });

    return {
      periodo,
      ultimoPg,
      lecturaUltimoPg,
      errorUltimoPg,
      periodoRem,
      lecturaPeriodoRem,
      errorPeriodoRem,
      parametrosGrupos,
      empleadosActivosAptos,
      empleadosActivosNoAptos,
      lecturaEmpleados,
      errorEmpleados,
      totalConceptosMantenimiento,
      lecturaConceptos,
      errorConceptos,
      alertaConceptosMotorFuturo,
      recurrentesConteo,
      movimientos,
      lecturaMovimientos,
      errorMovimientos,
    };
  }
}
