import { esPeriodoRemuneracionValido } from '../../../shared/dominio/periodo';
import { inject, Injectable } from '@angular/core';

import { resolverUsuarioResponsableActual } from '../../../core/auth/auth-user-label';
import { injectSupabase } from '../../../core/services/supabase.service';
import type { HaberDescuentoAsignacionPrevalidacionMensualFila } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import { EmpleadosService } from '../../empleados/services/empleados.service';
import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import { HaberesDescuentosService } from '../../haberes-descuentos/services/haberes-descuentos.service';
import type {
  MovimientoVariableEstado,
  MovimientoVariableListadoFila,
  MovimientoVariableOrigen,
} from '../../movimientos-variables/models/movimiento-variable.model';
import type {
  ParametroGeneral,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
} from '../../parametros-generales/models/parametro-general.model';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';
import {
  evaluarCompletitudParametrosMensual,
  resolverEstadoVisualParametros,
  type ParametrosCompletitudResultado,
  type ParametrosEstadoVisual,
} from '../../parametros-generales/rules/parametros-completitud.rules';

import type { MovimientoNomina } from '../models/movimiento-nomina.models';
import { aplicarMovimientosNominaAlMotor } from '../rules/nomina-movimientos-motor.rules';
import type { EntradaMensualPeriodo } from '../entradas/models/entrada-mensual-periodo.model';
import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { limpiarAlCambiarUsuario } from '../../../core/auth/limpiar-al-cambiar-usuario';
import type { EmpleadoFichaDetalle } from '../../empleados/models/empleado-listado.model';
import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import {
  EmpresasRepository,
  type EmpresaLey16744Datos,
} from '../../empresas/data-access/empresas.repository';
import { EntradasMensualesPeriodoService } from '../entradas/services/entradas-mensuales-periodo.service';
import {
  entradaBloqueaProceso,
  entradaRequiereRevision,
  puedeEntrarAPreNomina,
} from '../entradas/rules/entradas-mensuales-periodo.rules';
import type {
  BaseNominaParametrosEstado,
  BaseNominaTrabajadorEstado,
  BaseNominaTrazabilidad,
  EntradaMensualMotor,
  GuardarSnapshotPreliminarResult,
  MotorCalculoPeriodoResultado,
  MotorCalculoInput,
  NominaCalculoPeriodoSnapshot,
  NominaSnapshotCompletoView,
  AprobarResultadoPreliminarOperativamenteParams,
  CerrarNominaOperativamenteParams,
  ReabrirNominaOperativamenteParams,
  ProcesoMensualPreNominaPeriodo,
  ProcesoMensualPrevalidacion,
} from '../models/proceso-mensual.model';
import { trabajadorSnapshotDesdeFicha } from '../models/proceso-mensual.model';
import { NominaCalculoSnapshotRepository } from '../data-access/nomina-calculo-snapshot.repository';
import { NominaPeriodoDiagnosticoRepository } from '../data-access/nomina-periodo-diagnostico.repository';
import {
  resolveEmpresaMutualSnapshot,
} from '../rules/proceso-mensual-empresa-ley16744.rules';
import { generarCalculoPreliminarPeriodo } from '../rules/proceso-mensual-motor.rules';
import { generarCalculoAnticipoPeriodo } from '../rules/proceso-mensual-motor-anticipo.rules';
import { generarCalculoRectificacionPeriodo } from '../rules/proceso-mensual-motor-rectificacion.rules';
import type { ReglaAnticipo } from '../models/nomina-plantilla-ciclo.models';
import {
  buildGuardarSnapshotRechazado,
  mapResultadoMotorToSnapshotPayload,
  validarResultadoSnapshotPreliminar,
} from '../rules/proceso-mensual-snapshot.rules';
import { aislarConsultaSoloParametros } from '../rules/proceso-mensual-parametros-refresh.rules';
import { revisarGruposParametrosMinimos } from '../rules/proceso-mensual-parametros-minimos.rules';
import { construirPreNominaPeriodo } from '../rules/proceso-mensual-prenomina.rules';
import {
  aplicarClasificacionConceptos,
  construirEntradasMensualesMotor,
} from '../rules/proceso-mensual-motor-entradas.rules';
import {
  construirPrevalidacionMensual,
  contarRecurrentesParaPrevalidacionMensual,
  type ProcesoMensualHechosPrevalidacion,
} from '../rules/proceso-mensual-prevalidacion.rules';
import {
  buildTrabajadoresPendientesRevision,
  evaluarAptitudOperativaNominaTrabajador,
} from '../rules/proceso-mensual-trabajadores-prevalidacion.rules';
import {
  buildBorradorSnapshotFromPreNomina,
  buildBorradorPersistFromPrevalidacion,
  buildPrevalidacionLecturaDesdeBorrador,
  mergeBorradorPersistContexts,
  resolvePrevalidacionDiagnosticoRehidratacion,
} from '../rules/proceso-mensual-borrador-snapshot.rules';

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

@Injectable({ providedIn: 'root' })
export class ProcesoMensualService {
  private readonly supabase = injectSupabase();
  private readonly parametrosGenerales = inject(ParametrosGeneralesService);
  private readonly empleados = inject(EmpleadosService);
  private readonly haberesDescuentos = inject(HaberesDescuentosService);
  private readonly entradasMensuales = inject(EntradasMensualesPeriodoService);
  private readonly snapshots = inject(NominaCalculoSnapshotRepository);
  private readonly diagnosticoPeriodo = inject(NominaPeriodoDiagnosticoRepository);
  private readonly liquidaciones = inject(LiquidacionesOficialesRepository);
  private readonly empresas = inject(EmpresasRepository);
  private readonly empresaActiva = inject(EmpresaActivaService);
  private readonly calculosPorPeriodo = new Map<string, MotorCalculoPeriodoResultado>();
  /** Insumos congelables del ultimo calculo por periodo (parametros y entradas) para auditoria/hashes. */
  private readonly insumosCalculoPorPeriodo = new Map<string, {
    parametrosPeriodo: ParametroGeneral | null;
    entradasMensuales: EntradaMensualMotor[];
  }>();

  constructor() {
    // Cálculos en memoria por periodo: pertenecen a la empresa de la sesión.
    limpiarAlCambiarUsuario(() => {
      this.calculosPorPeriodo.clear();
      this.insumosCalculoPorPeriodo.clear();
    });
  }

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
      this.parametrosGenerales.obtenerClienteConfig(p),
      this.empleados.listar(),
      this.haberesDescuentos.listarConceptosMantenimiento(),
      this.entradasMensuales.listarEntradasPeriodo(p),
      this.haberesDescuentos.listarAsignacionesParaPrevalidacionMensual(p),
      this.parametrosGenerales.listarCatalogos(p),
    ]);

    return construirPrevalidacionMensual(this.mapearHechosDesdeSettled(p, settled));
  }

  /**
   * Consulta en vivo solo parámetros del período (sin trabajadores, movimientos ni recurrentes).
   */
  async consultarEstadoParametrosPeriodo(periodo: string): Promise<ProcesoMensualPrevalidacion> {
    const p = periodo.trim();
    if (!esPeriodoRemuneracionValido(p)) {
      return construirPrevalidacionMensual(this.hechosMinimos(p));
    }

    const settled = await Promise.allSettled([
      this.parametrosGenerales.obtenerUltimoHastaPeriodo(p),
      this.parametrosGenerales.obtenerPeriodoRemuneracion(p),
      this.parametrosGenerales.obtenerClienteConfig(p),
      this.parametrosGenerales.listarCatalogos(p),
    ]);

    return aislarConsultaSoloParametros(
      construirPrevalidacionMensual({
        ...this.hechosMinimos(p),
        ...this.mapearHechosParametrosCompletosDesdeSettled(p, settled),
      }),
    );
  }

  async generarPreNominaPeriodo(periodo: string): Promise<ProcesoMensualPreNominaPeriodo> {
    const prevalidacion = await this.ejecutarPrevalidaciones(periodo);
    const preNomina = construirPreNominaPeriodo(prevalidacion, new Date().toISOString());
    const empleados = await this.empleados.listar();
    return {
      ...preNomina,
      trazabilidad: this.construirTrazabilidadBaseNomina(prevalidacion, preNomina, empleados),
    };
  }

  async guardarBaseNominaBorrador(
    periodo: string,
    preNomina: ProcesoMensualPreNominaPeriodo,
    prevalidacion?: ProcesoMensualPrevalidacion,
    opciones: { permitirAdvertencias?: boolean } = {},
  ): Promise<GuardarSnapshotPreliminarResult> {
    const usuario = await this.resolverUsuarioActual();
    const bloqueos = [
      ...(prevalidacion?.bloqueos ?? []).map((mensaje) => ({
        codigo: mensaje.codigo,
        severidad: 'BLOQUEO' as const,
        mensaje: mensaje.texto,
        origen: mensaje.area,
      })),
      ...preNomina.codigosBloqueo.map((codigo) => ({
        codigo,
        severidad: 'BLOQUEO' as const,
        mensaje: codigo,
        origen: 'pre_nomina',
      })),
    ];
    const advertencias = [
      ...(prevalidacion?.advertencias ?? []).map((mensaje) => ({
        codigo: mensaje.codigo,
        severidad: 'ADVERTENCIA' as const,
        mensaje: mensaje.texto,
        origen: mensaje.area,
      })),
      ...preNomina.codigosAdvertencia.map((codigo) => ({
        codigo,
        severidad: 'ADVERTENCIA' as const,
        mensaje: codigo,
        origen: 'pre_nomina',
      })),
    ];
    const issues = [...bloqueos, ...advertencias];
    const issuesBloqueantes = opciones.permitirAdvertencias ? bloqueos : issues;
    if (issuesBloqueantes.length > 0 || preNomina.estado === 'NO_GENERABLE') {
      return buildGuardarSnapshotRechazado(issues.map((issue) => ({
        codigo: issue.codigo,
        severidad: issue.severidad,
        mensaje: issue.mensaje,
        origen: issue.origen,
      })));
    }

    const { snapshot, borradorPersist } = buildBorradorSnapshotFromPreNomina({
      periodo: periodo.trim(),
      preNomina,
      prevalidacion: prevalidacion ?? null,
      fechaGeneracion: new Date().toISOString(),
      totalAdvertencias: opciones.permitirAdvertencias ? advertencias.length : 0,
    });
    snapshot.usuarioGenerador = usuario.id;
    const guardado = await this.snapshots.guardarBaseNominaBorrador(snapshot, borradorPersist);
    return {
      ok: true,
      snapshot: guardado.snapshot,
      reemplazoSnapshotAnterior: guardado.reemplazoSnapshotAnterior,
      hashSnapshot: guardado.snapshot.hashSnapshot,
      issues: [],
    };
  }

  async generarCalculoPeriodo(
    periodo: string,
    trabajadorIds?: readonly number[],
    opciones: {
      nominaPeriodoId?: string | null;
      movimientosNomina?: readonly MovimientoNomina[];
    } = {},
  ): Promise<MotorCalculoPeriodoResultado> {
    const p = periodo.trim();
    // F09: con nómina el resultado en memoria se aísla por nominaPeriodoId
    // (dos nóminas del mismo mes no comparten cache de cálculo).
    const claveCache = opciones.nominaPeriodoId ?? p;
    // movimientosNomina: manuales del paso Movimientos y recurrentes omitidos
    // (antes no llegaban al armado del input y no afectaban el cálculo).
    const input = await this.construirInputMotorPeriodo(p, trabajadorIds, {
      nominaPeriodoId: opciones.nominaPeriodoId,
      movimientosNomina: opciones.movimientosNomina,
    });
    const resultado = generarCalculoPreliminarPeriodo(input, new Date().toISOString());
    this.calculosPorPeriodo.set(claveCache, resultado);
    this.insumosCalculoPorPeriodo.set(claveCache, {
      parametrosPeriodo: input.parametrosPeriodo,
      entradasMensuales: input.entradasMensuales,
    });
    return resultado;
  }

  /** F10: motor de anticipo con regla de plantilla (no aplica descuentos legales). */
  async generarCalculoAnticipoPeriodo(
    periodo: string,
    trabajadorIds: readonly number[],
    reglaAnticipo: ReglaAnticipo,
    opciones: { nominaPeriodoId?: string | null } = {},
  ): Promise<MotorCalculoPeriodoResultado> {
    const p = periodo.trim();
    const claveCache = opciones.nominaPeriodoId ?? p;
    const input = await this.construirInputMotorPeriodo(p, trabajadorIds, {
      nominaPeriodoId: opciones.nominaPeriodoId,
    });
    const resultado = generarCalculoAnticipoPeriodo({
      periodo: p,
      reglaAnticipo,
      trabajadores: input.trabajadores,
      generadoEn: new Date().toISOString(),
    });
    this.calculosPorPeriodo.set(claveCache, resultado);
    this.insumosCalculoPorPeriodo.set(claveCache, {
      parametrosPeriodo: input.parametrosPeriodo,
      entradasMensuales: input.entradasMensuales,
    });
    return resultado;
  }

  /** F17: motor diferencial contra snapshot de nómina origen cerrada. */
  async generarCalculoRectificacionPeriodo(args: {
    periodo: string;
    trabajadorIds: readonly number[];
    snapshotOrigen: NominaSnapshotCompletoView;
    nominaOrigenId: string;
    versionCalculoOrigen: number;
    opciones?: { nominaPeriodoId?: string | null };
  }): Promise<MotorCalculoPeriodoResultado> {
    const p = args.periodo.trim();
    const claveCache = args.opciones?.nominaPeriodoId ?? p;
    const rectificado = await this.generarCalculoPeriodo(p, args.trabajadorIds, args.opciones ?? {});
    const resultado = generarCalculoRectificacionPeriodo({
      periodo: p,
      snapshotOrigen: args.snapshotOrigen,
      resultadoRectificado: rectificado,
      nominaOrigenId: args.nominaOrigenId,
      versionCalculoOrigen: args.versionCalculoOrigen,
      generadoEn: new Date().toISOString(),
    });
    this.calculosPorPeriodo.set(claveCache, resultado);
    return resultado;
  }

  obtenerResultadoCalculoPeriodo(periodo: string): MotorCalculoPeriodoResultado | null {
    return this.calculosPorPeriodo.get(periodo.trim()) ?? null;
  }

  async guardarSnapshotPreliminar(
    periodo: string,
    opciones: {
      prevalidacion?: ProcesoMensualPrevalidacion | null;
      idEmpresa?: number | null;
      nominaPeriodoId?: string | null;
    } = {},
  ): Promise<GuardarSnapshotPreliminarResult> {
    const p = periodo.trim();
    const claveCache = opciones.nominaPeriodoId ?? p;
    const resultado = this.calculosPorPeriodo.get(claveCache) ?? null;
    const issues = validarResultadoSnapshotPreliminar(resultado);
    if (issues.length > 0 || !resultado) {
      return buildGuardarSnapshotRechazado(issues);
    }

    const usuario = await this.resolverUsuarioActual();
    const insumos = this.insumosCalculoPorPeriodo.get(claveCache) ?? null;
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado,
      fechaGeneracion: new Date().toISOString(),
      origen: 'preliminar',
      usuarioGenerador: usuario.id,
      idEmpresa: opciones.idEmpresa ?? null,
      parametrosPeriodo: insumos?.parametrosPeriodo ?? null,
      entradasMensuales: insumos?.entradasMensuales ?? [],
    });
    snapshot.nominaPeriodoId = opciones.nominaPeriodoId ?? null;
    const activo = opciones.nominaPeriodoId
      ? await this.snapshots.obtenerSnapshotActivoDeNomina(opciones.nominaPeriodoId)
      : await this.snapshots.obtenerSnapshotActivo(p, opciones.idEmpresa ?? null);
    const persistNuevo = opciones.prevalidacion
      ? buildBorradorPersistFromPrevalidacion(opciones.prevalidacion)
      : null;
    const borradorPersist = mergeBorradorPersistContexts(activo?.borradorPersist, persistNuevo);
    const guardado = await this.snapshots.guardarSnapshotPreliminar(snapshot, borradorPersist);
    return {
      ok: true,
      snapshot: guardado.snapshot,
      reemplazoSnapshotAnterior: guardado.reemplazoSnapshotAnterior,
      hashSnapshot: guardado.snapshot.hashSnapshot,
      issues: [],
    };
  }

  /** F09: detalle completo del snapshot activo de UNA nómina. */
  obtenerSnapshotCompletoActivoDeNomina(
    nominaPeriodoId: string,
  ): Promise<NominaSnapshotCompletoView | null> {
    return this.snapshots.obtenerSnapshotCompletoActivoDeNomina(nominaPeriodoId);
  }

  async reemplazarSnapshotPreliminar(periodo: string): Promise<GuardarSnapshotPreliminarResult> {
    const resultado = await this.generarCalculoPeriodo(periodo);
    const issues = validarResultadoSnapshotPreliminar(resultado);
    if (issues.length > 0) {
      return buildGuardarSnapshotRechazado(issues);
    }
    const usuario = await this.resolverUsuarioActual();
    const insumos = this.insumosCalculoPorPeriodo.get(periodo.trim()) ?? null;
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado,
      fechaGeneracion: new Date().toISOString(),
      origen: 'recalculo',
      usuarioGenerador: usuario.id,
      parametrosPeriodo: insumos?.parametrosPeriodo ?? null,
      entradasMensuales: insumos?.entradasMensuales ?? [],
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

  async rehidratarPeriodo(periodo: string): Promise<{
    snapshot: NominaCalculoPeriodoSnapshot | null;
    completo: NominaSnapshotCompletoView | null;
    liquidacionesGeneradas: number;
    prevalidacionDiagnostico: ProcesoMensualPrevalidacion | null;
  }> {
    const p = periodo.trim();
    const snapshot = await this.obtenerSnapshotActivo(p);
    const liquidacionesGeneradas = await this.contarLiquidacionesGeneradas(
      p,
      snapshot?.idCalculoPeriodo ?? null,
    );
    if (!snapshot) {
      let prevalidacionDiagnostico: ProcesoMensualPrevalidacion | null = null;
      try {
        prevalidacionDiagnostico = await this.diagnosticoPeriodo.obtenerActivo(p);
      } catch {
        prevalidacionDiagnostico = null;
      }
      return { snapshot: null, completo: null, liquidacionesGeneradas, prevalidacionDiagnostico };
    }
    const completo = await this.obtenerSnapshotCompletoActivo(p);
    let diagnosticoBd: ProcesoMensualPrevalidacion | null = null;
    if (!snapshot.borradorPersist && snapshot.estado === 'borrador') {
      try {
        diagnosticoBd = await this.diagnosticoPeriodo.obtenerActivo(p);
      } catch {
        diagnosticoBd = null;
      }
    }
    const prevalidacionDiagnostico = resolvePrevalidacionDiagnosticoRehidratacion(
      p,
      snapshot,
      diagnosticoBd,
    );
    return { snapshot, completo, liquidacionesGeneradas, prevalidacionDiagnostico };
  }

  async guardarDiagnosticoPeriodo(
    periodo: string,
    prevalidacion: ProcesoMensualPrevalidacion,
  ): Promise<void> {
    const fingerprint = this.fingerprintPrevalidacion(prevalidacion);
    await this.diagnosticoPeriodo.guardar(periodo, prevalidacion, fingerprint);
  }

  async cerrarDiagnosticoPeriodo(periodo: string, motivo: string): Promise<void> {
    await this.diagnosticoPeriodo.cerrar(periodo, motivo);
  }

  private fingerprintPrevalidacion(prevalidacion: ProcesoMensualPrevalidacion): string {
    const resumen = prevalidacion.resumen;
    return [
      prevalidacion.periodo,
      prevalidacion.estado,
      resumen.trabajadoresActivosAptos,
      resumen.trabajadoresActivosNoAptos,
      resumen.parametrosOperativos ? '1' : '0',
      asArray(prevalidacion.bloqueos).length,
      asArray(prevalidacion.advertencias).length,
    ].join('|');
  }

  listarEntradasMensualesPeriodo(periodo: string) {
    return this.entradasMensuales.listarEntradasPeriodo(periodo.trim());
  }

  async contarLiquidacionesGeneradas(
    periodo: string,
    idCalculoPeriodo: number | null = null,
  ): Promise<number> {
    const liquidacion = await this.liquidaciones.obtenerLiquidacionPeriodo(
      periodo.trim(),
      idCalculoPeriodo,
    );
    return liquidacion ? 1 : 0;
  }

  obtenerSnapshotCompletoActivo(periodo: string): Promise<NominaSnapshotCompletoView | null> {
    return this.snapshots.obtenerSnapshotCompletoActivo(periodo.trim());
  }

  obtenerSnapshotCompletoPorId(idCalculoPeriodo: number): Promise<NominaSnapshotCompletoView | null> {
    return this.snapshots.obtenerSnapshotCompletoPorId(idCalculoPeriodo);
  }

  listarSnapshotsPeriodo(periodo: string): Promise<NominaCalculoPeriodoSnapshot[]> {
    return this.snapshots.listarSnapshotsPeriodo(periodo.trim());
  }

  anularSnapshotActivo(periodo: string, motivo?: string): Promise<void> {
    return this.snapshots.anularSnapshotActivo(periodo.trim(), motivo);
  }

  async reabrirNominaOperativamente(
    params: ReabrirNominaOperativamenteParams,
  ): Promise<NominaCalculoPeriodoSnapshot> {
    const snapshot = await this.snapshots.obtenerSnapshotActivo(params.periodo.trim());
    if (!snapshot?.idCalculoPeriodo || snapshot.idCalculoPeriodo !== params.idCalculoPeriodo) {
      throw new Error('No existe una nómina guardada vigente para abrir.');
    }
    if (snapshot.cierreOperativo?.estado !== 'cerrado_operativamente') {
      throw new Error('La nómina no está confirmada operativamente.');
    }

    return this.snapshots.reabrirNominaOperativa({
      ...params,
      periodo: params.periodo.trim(),
      metadata: {
        accion: 'reapertura_operativa',
        forzado: params.forzar ?? false,
        ...(params.metadata ?? {}),
      },
    });
  }

  aprobarResultadoPreliminarOperativamente(
    params: AprobarResultadoPreliminarOperativamenteParams,
  ): Promise<NominaCalculoPeriodoSnapshot> {
    return this.snapshots.aprobarResultadoPreliminarOperativamente({
      ...params,
      periodo: params.periodo.trim(),
    });
  }

  async cerrarNominaOperativamente(
    params: CerrarNominaOperativamenteParams,
  ): Promise<NominaCalculoPeriodoSnapshot> {
    const snapshot = await this.snapshots.obtenerSnapshotActivo(params.periodo.trim());
    if (!snapshot?.idCalculoPeriodo || snapshot.idCalculoPeriodo !== params.idCalculoPeriodo) {
      throw new Error('No existe un resultado preliminar guardado vigente para cerrar.');
    }
    if (snapshot.aprobacionOperativa?.estado !== 'aprobado_operativamente') {
      throw new Error('El resultado debe estar aprobado operativamente antes de cerrar.');
    }
    if (snapshot.cierreOperativo?.estado === 'cerrado_operativamente') {
      throw new Error('La nómina ya está cerrada operativamente.');
    }

    return this.snapshots.cerrarNominaOperativa({
      ...params,
      periodo: params.periodo.trim(),
      metadata: buildCierreOperativoMetadata(snapshot),
    });
  }

  private hechosMinimos(periodo: string): ProcesoMensualHechosPrevalidacion {
    return {
      periodo,
      ultimoPg: null,
      lecturaUltimoPg: 'ok',
      periodoRem: null,
      lecturaPeriodoRem: 'ok',
      parametrosEstadoVisual: 'sin_base',
      parametrosEstadoDetalle: 'Parámetros del período pendientes: falta la fila oficial del período.',
      parametrosOperativos: false,
      parametrosGrupos: [],
      empleadosActivosAptos: 0,
      empleadosActivosNoAptos: 0,
      trabajadoresPendientesRevision: [],
      lecturaEmpleados: 'ok',
      totalConceptosMantenimiento: 0,
      lecturaConceptos: 'ok',
      alertaConceptosMotorFuturo: false,
      recurrentesConteo: { lectura: 'ok', aplicables: 0, invalidas: 0, cerradas: 0, fueraDelMes: 0 },
      entradasMensuales: [],
      lecturaEntradasMensuales: 'ok',
      movimientos: [],
      lecturaMovimientos: 'ok',
      conceptosCatalogo: [],
      monedaContratoPorPersona: {},
    };
  }

  private mapearHechosDesdeSettled(
    periodo: string,
    settled: PromiseSettledResult<unknown>[],
  ): ProcesoMensualHechosPrevalidacion {
    const [rUlt, rPer, rCfg, rEmp, rConc, rEntradas, rRec, rCat] = settled;
    const paramHechos = this.mapearHechosParametrosCompletosDesdeSettled(periodo, [rUlt, rPer, rCfg, rCat]);

    let empleadosActivosAptos = 0;
    let empleadosActivosNoAptos = 0;
    let trabajadoresPendientesRevision: ProcesoMensualHechosPrevalidacion['trabajadoresPendientesRevision'] = [];
    let lecturaEmpleados: ProcesoMensualHechosPrevalidacion['lecturaEmpleados'] = 'ok';
    let errorEmpleados: string | undefined;
    let listadoEmpleados: Awaited<ReturnType<EmpleadosService['listar']>> = [];
    if (rEmp.status === 'fulfilled') {
      listadoEmpleados = rEmp.value as Awaited<ReturnType<EmpleadosService['listar']>>;
    } else {
      lecturaEmpleados = 'error';
      errorEmpleados = rEmp.reason instanceof Error ? rEmp.reason.message : String(rEmp.reason);
    }

    let totalConceptosMantenimiento = 0;
    let lecturaConceptos: ProcesoMensualHechosPrevalidacion['lecturaConceptos'] = 'ok';
    let errorConceptos: string | undefined;
    let alertaConceptosMotorFuturo = false;
    let conceptosCatalogo: ProcesoMensualHechosPrevalidacion['conceptosCatalogo'] = [];
    if (rConc.status === 'fulfilled') {
      const rows = asArray(rConc.value as Awaited<ReturnType<HaberesDescuentosService['listarConceptosMantenimiento']>>);
      conceptosCatalogo = rows;
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
      entradasMensuales = asArray(rEntradas.value as ProcesoMensualHechosPrevalidacion['entradasMensuales']);
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

    let monedaContratoPorPersona: ProcesoMensualHechosPrevalidacion['monedaContratoPorPersona'] = {};
    if (lecturaEmpleados === 'ok') {
      monedaContratoPorPersona = Object.fromEntries(
        listadoEmpleados.map((empleado) => [String(empleado.id), empleado.monedaContrato ?? null]),
      );
      trabajadoresPendientesRevision = buildTrabajadoresPendientesRevision(listadoEmpleados, entradasMensuales);
      const entradasPorPersona = new Map<number, EntradaMensualPeriodo[]>();
      for (const entrada of entradasMensuales) {
        const personaEntradas = entradasPorPersona.get(entrada.idPersona) ?? [];
        personaEntradas.push(entrada);
        entradasPorPersona.set(entrada.idPersona, personaEntradas);
      }
      for (const e of listadoEmpleados) {
        if (e.estado === 'activo') {
          const aptitud = evaluarAptitudOperativaNominaTrabajador(e, entradasPorPersona.get(e.id) ?? []);
          if (aptitud.listoParaNomina) {
            empleadosActivosAptos += 1;
          } else {
            empleadosActivosNoAptos += 1;
          }
        }
      }
    }

    let recurrentesConteo: ProcesoMensualHechosPrevalidacion['recurrentesConteo'];
    if (rRec.status === 'fulfilled') {
      const filas = asArray(rRec.value as HaberDescuentoAsignacionPrevalidacionMensualFila[]);
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

    return {
      periodo,
      ...paramHechos,
      empleadosActivosAptos,
      empleadosActivosNoAptos,
      trabajadoresPendientesRevision,
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
      conceptosCatalogo,
      monedaContratoPorPersona,
    };
  }

  private mapearHechosParametrosCompletosDesdeSettled(
    periodo: string,
    settled: [
      PromiseSettledResult<unknown>,
      PromiseSettledResult<unknown>,
      PromiseSettledResult<unknown>,
      PromiseSettledResult<unknown>,
    ],
  ): Pick<
    ProcesoMensualHechosPrevalidacion,
    | 'ultimoPg'
    | 'lecturaUltimoPg'
    | 'errorUltimoPg'
    | 'periodoRem'
    | 'lecturaPeriodoRem'
    | 'errorPeriodoRem'
    | 'parametrosEstadoVisual'
    | 'parametrosEstadoDetalle'
    | 'parametrosOperativos'
    | 'parametrosGrupos'
  > {
    const [rUlt, rPer, rCfg, rCat] = settled;

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

    let clienteConfig: ParametrosGeneralesClienteConfig | null = null;
    let lecturaClienteConfig: 'ok' | 'error' = 'ok';
    let errorClienteConfig: string | undefined;
    if (rCfg.status === 'fulfilled') {
      clienteConfig = rCfg.value as ParametrosGeneralesClienteConfig | null;
    } else {
      lecturaClienteConfig = 'error';
      errorClienteConfig = rCfg.reason instanceof Error ? rCfg.reason.message : String(rCfg.reason);
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
    const estadoParametros = this.resolverEstadoParametrosPeriodo({
      periodo,
      ultimoPg,
      periodoRem,
      clienteConfig,
      catalogos,
      lecturaUltimoPg,
      lecturaPeriodoRem,
      lecturaClienteConfig,
      lecturaCatalogos,
      errorUltimoPg,
      errorPeriodoRem,
      errorClienteConfig,
      errorCatalogos,
    });

    return {
      ultimoPg,
      lecturaUltimoPg,
      errorUltimoPg,
      periodoRem,
      lecturaPeriodoRem,
      errorPeriodoRem,
      parametrosEstadoVisual: estadoParametros.visual,
      parametrosEstadoDetalle: estadoParametros.detalle,
      parametrosOperativos: estadoParametros.operativo,
      parametrosGrupos,
    };
  }

  private resolverEstadoParametrosPeriodo(input: {
    periodo: string;
    ultimoPg: ParametroGeneral | null;
    periodoRem: ProcesoMensualHechosPrevalidacion['periodoRem'];
    clienteConfig: ParametrosGeneralesClienteConfig | null;
    catalogos: ParametrosGeneralesCatalogos | null;
    lecturaUltimoPg: ProcesoMensualHechosPrevalidacion['lecturaUltimoPg'];
    lecturaPeriodoRem: ProcesoMensualHechosPrevalidacion['lecturaPeriodoRem'];
    lecturaClienteConfig: 'ok' | 'error';
    lecturaCatalogos: 'ok' | 'error' | 'omitido';
    errorUltimoPg?: string;
    errorPeriodoRem?: string;
    errorClienteConfig?: string;
    errorCatalogos?: string;
  }): {
    visual: ParametrosEstadoVisual;
    operativo: boolean;
    detalle: string;
    completitud: ParametrosCompletitudResultado;
  } {
    const oficialExacto = input.ultimoPg?.periodo === input.periodo ? input.ultimoPg : null;
    const referenciaAnterior = Boolean(input.ultimoPg && input.ultimoPg.periodo !== input.periodo);
    const errorTecnico =
      input.lecturaUltimoPg === 'error' ||
      input.lecturaPeriodoRem === 'error' ||
      input.lecturaClienteConfig === 'error' ||
      input.lecturaCatalogos === 'error';
    const completitud = evaluarCompletitudParametrosMensual({
      periodo: input.periodo,
      periodoRemuneracion: input.periodoRem,
      oficial: oficialExacto,
      clienteConfig: input.clienteConfig,
      catalogos: input.catalogos ?? this.catalogosParametrosVacios(),
      errorTecnico,
    });
    const visual = resolverEstadoVisualParametros({
      estadoCalculado: completitud.estadoCalculado,
      oficialActual: oficialExacto !== null,
      clienteConfig: input.clienteConfig !== null,
      referenciaAnterior,
      diferencias: completitud.reconciliacionPendiente,
      errorTecnico,
    });
    const operativo = visual === 'cargado' || visual === 'corregido' || visual === 'cerrado';
    return {
      visual,
      operativo,
      detalle: this.detalleEstadoParametrosPeriodo({
        periodo: input.periodo,
        visual,
        completitud,
        ultimoPg: input.ultimoPg,
        errorUltimoPg: input.errorUltimoPg,
        errorPeriodoRem: input.errorPeriodoRem,
        errorClienteConfig: input.errorClienteConfig,
        errorCatalogos: input.errorCatalogos,
      }),
      completitud,
    };
  }

  private detalleEstadoParametrosPeriodo(input: {
    periodo: string;
    visual: ParametrosEstadoVisual;
    completitud: ParametrosCompletitudResultado;
    ultimoPg: ParametroGeneral | null;
    errorUltimoPg?: string;
    errorPeriodoRem?: string;
    errorClienteConfig?: string;
    errorCatalogos?: string;
  }): string {
    if (input.visual === 'cargado' || input.visual === 'corregido' || input.visual === 'cerrado') {
      return 'Parámetros del período operativos.';
    }
    if (input.visual === 'error') {
      return input.errorUltimoPg ?? input.errorPeriodoRem ?? input.errorClienteConfig ?? input.errorCatalogos ??
        'Parámetros del período pendientes por un error técnico de lectura.';
    }
    if (input.visual === 'referencia_anterior') {
      return `Parámetros del período pendientes: existe referencia ${input.ultimoPg?.periodo ?? 'anterior'}, pero falta la fila oficial ${input.periodo}.`;
    }
    if (input.visual === 'sin_base') {
      return 'Parámetros del período pendientes: falta la fila oficial del período.';
    }
    if (input.visual === 'oficial_sin_config') {
      return 'Parámetros del período pendientes: falta completar la configuración de la empresa.';
    }
    if (input.visual === 'configuracion_parcial') {
      return 'Parámetros del período pendientes: hay configuración de la empresa sin fila oficial del período.';
    }
    if (input.visual === 'pendiente_reconciliacion') {
      return 'Parámetros del período pendientes: hay diferencias entre valores oficiales y configuración de la empresa por reconciliar.';
    }
    const pendientesTexto = [
      ...input.completitud.errores,
      ...input.completitud.pendientes,
      ...input.completitud.advertencias,
    ]
      .map((texto) => texto.trim())
      .filter((texto) => texto.length > 0);
    return pendientesTexto.length
      ? `Parámetros del período pendientes: ${pendientesTexto.join(' ')}`
      : 'Parámetros del período pendientes.';
  }

  private catalogosParametrosVacios(): ParametrosGeneralesCatalogos {
    return {
      afp: [],
      isapres: [],
      saludInstituciones: [],
      tramosCarga: [],
      tramosImpuesto: [],
      tablaImpuestoUnico: [],
      reformaPensiones: [],
      trabajosPesados: [],
      reformaPrevisional: [],
      ley16744Parametros: [],
      organismosLey16744: [],
      ccafEntidades: [],
      apvInstituciones: [],
      apvFormasPago: [],
      afcParametros: [],
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

  private construirTrazabilidadBaseNomina(
    prevalidacion: ProcesoMensualPrevalidacion,
    preNomina: ProcesoMensualPreNominaPeriodo,
    empleados: readonly EmpleadoListado[],
  ): BaseNominaTrazabilidad {
    const activos = asArray(empleados).filter((e) => e.estado === 'activo');
    const entradas = asArray(prevalidacion.entradasMensuales);
    const entradasPorPersona = new Map<number, EntradaMensualPeriodo[]>();
    for (const entrada of entradas) {
      const personaEntradas = entradasPorPersona.get(entrada.idPersona) ?? [];
      personaEntradas.push(entrada);
      entradasPorPersona.set(entrada.idPersona, personaEntradas);
    }

    const trabajadores = activos.map((empleado) => {
      const personaEntradas = entradasPorPersona.get(empleado.id) ?? [];
      const aptas = personaEntradas.filter(puedeEntrarAPreNomina);
      const asignacionesRecurrentes = aptas.filter((entrada) => entrada.origen === 'recurrente').length;
      const movimientosDelMes = aptas.filter((entrada) => entrada.origen !== 'recurrente').length;
      const tieneBloqueos = personaEntradas.some(entradaBloqueaProceso);
      const tieneObservaciones =
        personaEntradas.some((entrada) => entradaRequiereRevision(entrada) || asArray(entrada.warnings).length > 0) ||
        empleado.idContrato == null;
      const aptitud = evaluarAptitudOperativaNominaTrabajador(empleado, personaEntradas);
      const estado = this.estadoTrabajadorBaseNomina(aptitud.bloqueadoParaNomina, tieneBloqueos, tieneObservaciones);

      return {
        idPersona: empleado.id,
        trabajadorLabel: empleado.nombre?.trim() || 'Trabajador sin ficha visible',
        rutLabel: empleado.rut?.trim() || 'RUT no disponible',
        contratoLabel: empleado.idContrato == null ? 'Contrato no disponible' : 'Contrato vigente',
        estado,
        aptoFicha: aptitud.aptoFicha,
        listoParaNomina: aptitud.listoParaNomina,
        bloqueadoParaNomina: aptitud.bloqueadoParaNomina,
        motivoBloqueoNomina: aptitud.motivo || undefined,
        asignacionesRecurrentes,
        movimientosDelMes,
        observacion: this.observacionTrabajadorBaseNomina(empleado, estado, personaEntradas, aptitud.motivo),
      };
    });

    const parametrosEstado = this.estadoParametrosBaseNomina(prevalidacion);
    return {
      trabajadores,
      trabajadoresConsiderados: trabajadores.filter((t) => t.estado !== 'excluido').length,
      listosParaCalculo: trabajadores.filter((t) => t.estado === 'listo').length,
      conObservaciones: trabajadores.filter((t) => t.estado === 'con_observaciones').length,
      bloqueados: trabajadores.filter((t) => t.estado === 'bloqueado').length,
      excluidos: trabajadores.filter((t) => t.estado === 'excluido').length,
      asignacionesRecurrentesIncluidas:
        preNomina.recurrentesIncluidos || entradas.filter((entrada) => entrada.origen === 'recurrente' && puedeEntrarAPreNomina(entrada)).length,
      movimientosDelMesIncluidos: entradas.filter((entrada) => entrada.origen !== 'recurrente' && puedeEntrarAPreNomina(entrada)).length,
      parametrosEstado,
      observacionParametros: this.observacionParametrosBaseNomina(prevalidacion, parametrosEstado),
    };
  }

  private estadoTrabajadorBaseNomina(
    bloqueadoParaNomina: boolean,
    tieneBloqueos: boolean,
    tieneObservaciones: boolean,
  ): BaseNominaTrabajadorEstado {
    if (bloqueadoParaNomina) return 'bloqueado';
    if (tieneBloqueos) return 'bloqueado';
    if (tieneObservaciones) return 'con_observaciones';
    return 'listo';
  }

  private observacionTrabajadorBaseNomina(
    empleado: EmpleadoListado,
    estado: BaseNominaTrabajadorEstado,
    entradas: readonly EntradaMensualPeriodo[],
    motivoBloqueoNomina?: string,
  ): string {
    if (estado === 'bloqueado' && motivoBloqueoNomina?.trim()) return motivoBloqueoNomina;
    if (estado === 'excluido') return 'Ficha no apta para remuneraciones.';
    const bloqueantes = entradas.filter(entradaBloqueaProceso).length;
    if (bloqueantes > 0) return `${bloqueantes} entrada(s) bloqueante(s).`;
    const porRevisar = entradas.filter((entrada) => entradaRequiereRevision(entrada) || asArray(entrada.warnings).length > 0).length;
    if (porRevisar > 0) return `${porRevisar} entrada(s) requieren revisión.`;
    if (empleado.idContrato == null) return 'Contrato no disponible.';
    return 'Sin observaciones';
  }

  private estadoParametrosBaseNomina(prevalidacion: ProcesoMensualPrevalidacion): BaseNominaParametrosEstado {
    if (!prevalidacion.resumen.parametrosOperativos) return 'por_revisar';
    if (prevalidacion.bloqueos.some((m) => m.area === 'PARAMETROS')) return 'por_revisar';
    if (prevalidacion.advertencias.some((m) => m.area === 'PARAMETROS')) return 'con_observaciones';
    if (prevalidacion.estado === 'SIN_EVALUAR') return 'sin_evaluar';
    return 'listos';
  }

  private observacionParametrosBaseNomina(
    prevalidacion: ProcesoMensualPrevalidacion,
    estado: BaseNominaParametrosEstado,
  ): string {
    const mensaje = [...prevalidacion.bloqueos, ...prevalidacion.advertencias].find((m) => m.area === 'PARAMETROS');
    if (mensaje) return mensaje.texto;
    switch (estado) {
      case 'listos':
        return 'Parámetros del período disponibles para preparar la base.';
      case 'con_observaciones':
        return 'Parámetros disponibles con observaciones del período.';
      case 'por_revisar':
        return 'Parámetros del período requieren revisión antes del cálculo.';
      default:
        return 'Parámetros del período sin evaluar.';
    }
  }

  private async construirInputMotorPeriodo(
    periodo: string,
    trabajadorIds?: readonly number[],
    opciones: {
      nominaPeriodoId?: string | null;
      movimientosNomina?: readonly MovimientoNomina[];
    } = {},
  ): Promise<MotorCalculoInput> {
    const [prevalidacion, parametrosPeriodo, catalogos, empleadosListado, recurrentes, conceptos] = await Promise.all([
      this.ejecutarPrevalidaciones(periodo),
      this.parametrosGenerales.obtenerUltimoHastaPeriodo(periodo),
      this.parametrosGenerales.listarCatalogos(periodo),
      this.empleados.listar(),
      this.haberesDescuentos.listarAsignacionesParaPrevalidacionMensual(periodo),
      // Clasificación imponible/tributable por concepto para novedades y movimientos.
      this.haberesDescuentos.listarConceptosMantenimiento().catch(() => []),
    ]);
    const empresaRow = await this.cargarEmpresaLey16744();
    const preNomina = construirPreNominaPeriodo(prevalidacion, new Date().toISOString());
    const entradasPorPersona = new Map<number, EntradaMensualPeriodo[]>();
    for (const entrada of asArray(prevalidacion.entradasMensuales)) {
      const personaEntradas = entradasPorPersona.get(entrada.idPersona) ?? [];
      personaEntradas.push(entrada);
      entradasPorPersona.set(entrada.idPersona, personaEntradas);
    }
    const alcance = trabajadorIds ? new Set(trabajadorIds) : null;
    const aptos = empleadosListado.filter(
      (e) => evaluarAptitudOperativaNominaTrabajador(e, entradasPorPersona.get(e.id) ?? []).listoParaNomina,
    ).filter((e) => !alcance || alcance.has(e.id));
    const fichas = await this.cargarFichasCalculo(
      aptos.map((e) => e.id),
      opciones.nominaPeriodoId ?? null,
    );
    const trabajadores = fichas.filter((f): f is NonNullable<typeof f> => f != null).map(trabajadorSnapshotDesdeFicha);

    let recurrentesFiltrados = alcance
      ? recurrentes.filter((fila) => alcance.has(fila.asignacion.idPersona))
      : recurrentes;

    let entradasPeriodo = asArray(prevalidacion.entradasMensuales).filter(
      (entrada) => !alcance || alcance.has(entrada.idPersona),
    );

    if (opciones.movimientosNomina?.length) {
      const movimientosAlcance = opciones.movimientosNomina.filter((movimiento) => {
        const idPersona = Number(movimiento.trabajadorId);
        return Number.isFinite(idPersona) && (!alcance || alcance.has(idPersona));
      });
      const fusion = aplicarMovimientosNominaAlMotor({
        periodo,
        entradasCanonicas: entradasPeriodo,
        recurrentes: recurrentesFiltrados,
        movimientos: movimientosAlcance,
      });
      entradasPeriodo = fusion.entradasFusionadas;
      recurrentesFiltrados = fusion.recurrentesFiltrados;
    }

    return {
      periodo,
      preNomina,
      prevalidacion,
      parametrosPeriodo,
      catalogos,
      trabajadores,
      recurrentes: recurrentesFiltrados,
      entradasMensuales: construirEntradasMensualesMotor(
        aplicarClasificacionConceptos(entradasPeriodo, asArray(conceptos)),
      ),
      empresaLey16744: resolveEmpresaMutualSnapshot(empresaRow, periodo),
    };
  }

  /**
   * NOM-INSUMOS-01: con nómina, congela los insumos de ficha de su dotación en una
   * sola llamada y los usa (queda registro de con qué datos se calculó). Los
   * trabajadores que no vengan congelados, o si congelar falla (p. ej. perfil sin
   * escritura), se leen en vivo como antes. Respeta el orden de `idsPersona`.
   */
  private async cargarFichasCalculo(
    idsPersona: readonly number[],
    nominaPeriodoId: string | null,
  ): Promise<(EmpleadoFichaDetalle | null)[]> {
    let congeladas = new Map<number, EmpleadoFichaDetalle>();
    if (nominaPeriodoId && idsPersona.length > 0) {
      try {
        const fichas = await this.empleados.congelarFichasNomina(nominaPeriodoId);
        congeladas = new Map(fichas.map((ficha) => [ficha.id, ficha]));
      } catch {
        congeladas = new Map();
      }
    }
    return Promise.all(
      idsPersona.map((id) => congeladas.get(id) ?? this.empleados.obtenerPorId(id)),
    );
  }

  /**
   * Datos de mutual de la empresa activa (antes: la primera empresa visible por RLS).
   * No bloquea: la tasa adicional es un ajuste empleador no crítico para el flujo preliminar.
   */
  private async cargarEmpresaLey16744(): Promise<EmpresaLey16744Datos | null> {
    try {
      const empresa = await this.empresaActiva.asegurarCargada();
      return empresa ? await this.empresas.obtenerDatosLey16744(empresa.idEmpresa) : null;
    } catch {
      return null;
    }
  }

  private async resolverUsuarioActual() {
    try {
      const result = await this.supabase.auth.getUser();
      return resolverUsuarioResponsableActual(result?.data?.user);
    } catch {
      return resolverUsuarioResponsableActual(null);
    }
  }
}

function buildCierreOperativoMetadata(snapshot: NominaCalculoPeriodoSnapshot): Record<string, unknown> {
  const aprobacion = snapshot.aprobacionOperativa;
  return {
    periodo: snapshot.periodo,
    idCalculoPeriodo: snapshot.idCalculoPeriodo ?? null,
    versionCalculo: snapshot.versionMotor,
    identificadorTecnico: snapshot.hashSnapshot,
    totalTrabajadores: snapshot.totalTrabajadores,
    totalHaberes: snapshot.totalHaberes,
    totalDescuentos: snapshot.totalDescuentos,
    totalLiquido: snapshot.totalLiquido,
    advertenciasVisibles: aprobacion?.advertencias ?? [],
    notaAlcance: 'Cierre operativo. No emite liquidaciones ni genera archivos legales.',
  };
}

