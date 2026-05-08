import { inject, Injectable } from '@angular/core';

import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import type {
  MovimientoVariableEstado,
  MovimientoVariableListadoFila,
  MovimientoVariableOrigen,
} from '../../movimientos-variables/models/movimiento-variable.model';
import type { ParametroGeneral, ParametrosGeneralesCatalogos } from '../../parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';

import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { EntradasMensualesPeriodoService } from '../entradas/services/entradas-mensuales-periodo.service';
import { validarPeriodoEntradaMensual } from '../entradas/rules/entradas-mensuales-periodo.rules';
import type {
  GuardarSnapshotPreliminarResult,
  MotorCalculoPeriodoResultado,
  MotorCalculoInput,
  NominaCalculoPeriodoSnapshot,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';
import { trabajadorSnapshotDesdeFicha } from '../models/proceso-mensual.model';
import { NominaCalculoSnapshotRepository } from '../data-access/nomina-calculo-snapshot.repository';
import { generarCalculoPreliminarPeriodo } from '../rules/proceso-mensual-motor.rules';
import {
  buildGuardarSnapshotRechazado,
  mapResultadoMotorToSnapshotPayload,
  validarResultadoSnapshotPreliminar,
} from '../rules/proceso-mensual-snapshot.rules';
import { revisarGruposParametrosMinimos } from '../rules/proceso-mensual-parametros-minimos.rules';
import { construirPreNominaPeriodo } from '../rules/proceso-mensual-prenomina.rules';
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
  private readonly entradasMensuales = inject(EntradasMensualesPeriodoService);
  private readonly snapshots = inject(NominaCalculoSnapshotRepository);
  private readonly calculosPorPeriodo = new Map<string, MotorCalculoPeriodoResultado>();

  /**
   * Orquesta lecturas y devuelve prevalidacion. No calcula remuneraciones ni liquidaciones.
   */
  async ejecutarPrevalidaciones(periodo: string): Promise<ProcesoMensualPrevalidacion> {
    const p = periodo.trim();
    if (!validarPeriodoEntradaMensual(p)) {
      return construirPrevalidacionMensual(this.hechosMinimos(p));
    }

    const settled = await Promise.allSettled([
      this.parametrosGenerales.obtenerUltimoHastaPeriodo(p),
      this.parametrosGenerales.obtenerPeriodoRemuneracion(p),
      this.empleados.listar(),
      this.haberesDescuentos.listarConceptosMantenimiento(),
      this.entradasMensuales.listarEntradasPeriodo(p),
      this.haberesDescuentos.listarAsignacionesParaPrevalidacionMensual(p),
      this.parametrosGenerales.listarCatalogos(p),
    ]);

    return construirPrevalidacionMensual(this.mapearHechosDesdeSettled(p, settled));
  }

  async generarPreNominaPeriodo(periodo: string): Promise<ProcesoMensualPreNominaPeriodo> {
    const prevalidacion = await this.ejecutarPrevalidaciones(periodo);
    return construirPreNominaPeriodo(prevalidacion, new Date().toISOString());
  }

  async generarCalculoPeriodo(periodo: string): Promise<MotorCalculoPeriodoResultado> {
    const p = periodo.trim();
    const input = await this.construirInputMotorPeriodo(p);
    const resultado = generarCalculoPreliminarPeriodo(input, new Date().toISOString());
    this.calculosPorPeriodo.set(p, resultado);
    return resultado;
  }

  obtenerResultadoCalculoPeriodo(periodo: string): MotorCalculoPeriodoResultado | null {
    return this.calculosPorPeriodo.get(periodo.trim()) ?? null;
  }

  async guardarSnapshotPreliminar(periodo: string): Promise<GuardarSnapshotPreliminarResult> {
    const p = periodo.trim();
    const resultado = this.obtenerResultadoCalculoPeriodo(p);
    const issues = validarResultadoSnapshotPreliminar(resultado);
    if (issues.length > 0 || !resultado) {
      return buildGuardarSnapshotRechazado(issues);
    }

    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado,
      fechaGeneracion: new Date().toISOString(),
      origen: 'preliminar',
    });
    const guardado = await this.snapshots.guardarSnapshotPreliminar(snapshot);
    return {
      ok: true,
      snapshot: guardado.snapshot,
      reemplazoSnapshotAnterior: guardado.reemplazoSnapshotAnterior,
      hashSnapshot: guardado.snapshot.hashSnapshot,
      issues: [],
    };
  }

  async reemplazarSnapshotPreliminar(periodo: string): Promise<GuardarSnapshotPreliminarResult> {
    const resultado = await this.generarCalculoPeriodo(periodo);
    const issues = validarResultadoSnapshotPreliminar(resultado);
    if (issues.length > 0) {
      return buildGuardarSnapshotRechazado(issues);
    }
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado,
      fechaGeneracion: new Date().toISOString(),
      origen: 'recalculo',
    });
    const guardado = await this.snapshots.guardarSnapshotPreliminar(snapshot);
    return {
      ok: true,
      snapshot: guardado.snapshot,
      reemplazoSnapshotAnterior: guardado.reemplazoSnapshotAnterior,
      hashSnapshot: guardado.snapshot.hashSnapshot,
      issues: [],
    };
  }

  obtenerSnapshotActivo(periodo: string): Promise<NominaCalculoPeriodoSnapshot | null> {
    return this.snapshots.obtenerSnapshotActivo(periodo.trim());
  }

  listarSnapshotsPeriodo(periodo: string): Promise<NominaCalculoPeriodoSnapshot[]> {
    return this.snapshots.listarSnapshotsPeriodo(periodo.trim());
  }

  anularSnapshotActivo(periodo: string, motivo?: string): Promise<void> {
    return this.snapshots.anularSnapshotActivo(periodo.trim(), motivo);
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
      entradasMensuales: [],
      lecturaEntradasMensuales: 'ok',
      movimientos: [],
      lecturaMovimientos: 'ok',
    };
  }

  private mapearHechosDesdeSettled(
    periodo: string,
    settled: PromiseSettledResult<unknown>[],
  ): ProcesoMensualHechosPrevalidacion {
    const [rUlt, rPer, rEmp, rConc, rEntradas, rRec, rCat] = settled;

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

    let entradasMensuales: ProcesoMensualHechosPrevalidacion['entradasMensuales'] = [];
    let lecturaEntradasMensuales: ProcesoMensualHechosPrevalidacion['lecturaEntradasMensuales'] = 'ok';
    let errorEntradasMensuales: string | undefined;
    if (rEntradas.status === 'fulfilled') {
      entradasMensuales = rEntradas.value as ProcesoMensualHechosPrevalidacion['entradasMensuales'];
    } else {
      lecturaEntradasMensuales = 'error';
      errorEntradasMensuales = rEntradas.reason instanceof Error ? rEntradas.reason.message : String(rEntradas.reason);
    }

    const movimientos: ProcesoMensualHechosPrevalidacion['movimientos'] =
      lecturaEntradasMensuales === 'ok' ? this.mapearMovimientosLegacyDesdeEntradas(entradasMensuales) : [];
    let lecturaMovimientos: ProcesoMensualHechosPrevalidacion['lecturaMovimientos'] = 'ok';
    let errorMovimientos: string | undefined;
    if (lecturaEntradasMensuales === 'error') {
      lecturaMovimientos = 'error';
      errorMovimientos = errorEntradasMensuales;
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
      entradasMensuales,
      lecturaEntradasMensuales,
      errorEntradasMensuales,
      movimientos,
      lecturaMovimientos,
      errorMovimientos,
    };
  }

  private mapearMovimientosLegacyDesdeEntradas(entradas: readonly EntradaMensualPeriodo[]): MovimientoVariableListadoFila[] {
    return entradas
      .filter((entrada) => entrada.origen === 'legacy_movimiento_variable')
      .map((entrada) => ({
        idMovimiento: Number(entrada.origenId ?? 0),
        idPersona: entrada.idPersona,
        idConcepto: entrada.idConcepto,
        periodo: entrada.periodo,
        monto: entrada.monto ?? 0,
        estado: this.estadoLegacyDesdeEntrada(entrada),
        origen: this.origenLegacyDesdeEntrada(entrada),
        observacion: entrada.observacion ?? null,
      }));
  }

  private estadoLegacyDesdeEntrada(entrada: EntradaMensualPeriodo): MovimientoVariableEstado {
    const estadoLegacy = entrada.metadata['estadoLegacy'];
    if (typeof estadoLegacy === 'string') {
      return estadoLegacy as MovimientoVariableEstado;
    }
    switch (entrada.estado) {
      case 'borrador':
        return 'BORRADOR';
      case 'aprobada':
      case 'legacy_validado':
        return 'VALIDADO';
      case 'observada':
        return 'OBSERVADO';
      case 'anulada':
        return 'ANULADO';
      case 'legacy_bloqueado':
        return 'BLOQUEADO';
      case 'incorporada_a_pre_nomina':
        return 'INCLUIDO_EN_PROCESO';
      default:
        return 'BORRADOR';
    }
  }

  private origenLegacyDesdeEntrada(entrada: EntradaMensualPeriodo): MovimientoVariableOrigen {
    const origenLegacy = entrada.metadata['origenLegacy'];
    return typeof origenLegacy === 'string' ? (origenLegacy as MovimientoVariableOrigen) : 'MANUAL';
  }

  private async construirInputMotorPeriodo(periodo: string): Promise<MotorCalculoInput> {
    const [prevalidacion, parametrosPeriodo, catalogos, empleadosListado, recurrentes] = await Promise.all([
      this.ejecutarPrevalidaciones(periodo),
      this.parametrosGenerales.obtenerUltimoHastaPeriodo(periodo),
      this.parametrosGenerales.listarCatalogos(periodo),
      this.empleados.listar(),
      this.haberesDescuentos.listarAsignacionesParaPrevalidacionMensual(periodo),
    ]);
    const preNomina = construirPreNominaPeriodo(prevalidacion, new Date().toISOString());
    const aptos = empleadosListado.filter((e) => e.estado === 'activo' && e.aptoParaRemuneraciones);
    const fichas = await Promise.all(aptos.map((e) => this.empleados.obtenerPorId(e.id)));
    const trabajadores = fichas.filter((f): f is NonNullable<typeof f> => f != null).map(trabajadorSnapshotDesdeFicha);

    return {
      periodo,
      preNomina,
      prevalidacion,
      parametrosPeriodo,
      catalogos,
      trabajadores,
      recurrentes,
      empresaLey16744: null,
    };
  }
}
