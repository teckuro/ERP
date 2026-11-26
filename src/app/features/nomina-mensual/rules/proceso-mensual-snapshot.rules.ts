import type {
  EntradaMensualMotor,
  GuardarSnapshotPreliminarResult,
  LineaLiquidacionCalculada,
  LiquidacionCalculada,
  MotorCalculoEstadoPeriodo,
  MotorCalculoIssue,
  MotorCalculoPeriodoResultado,
  MotorCalculoTrazabilidad,
  NominaCalculoConceptoSnapshot,
  NominaCalculoIssueSnapshot,
  NominaCalculoParametroSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoSnapshotOrigen,
  NominaCalculoTrabajadorSnapshot,
  NominaCalculoTrazabilidadSnapshot,
  NominaSnapshotCompletoView,
} from '../models/proceso-mensual.model';
import type { ParametroGeneral } from '../../parametros-generales/models/parametro-general.model';
import { resolverCodigoLreLinea } from '../../lre/rules/concepto-lre-resolucion.rules';

const VERSION_MOTOR_SNAPSHOT = 'MOTOR-03B';

export function validarResultadoSnapshotPreliminar(
  resultado: MotorCalculoPeriodoResultado | null,
): MotorCalculoIssue[] {
  if (!resultado) {
    return [{
      codigo: 'SNAPSHOT_SIN_CALCULO',
      severidad: 'BLOQUEO',
      mensaje: 'No existe calculo preliminar en memoria para guardar snapshot.',
      origen: 'motor_calculo',
      campo: 'resultado',
    }];
  }
  const bloqueos = resultado.issues.filter((i) => i.severidad === 'BLOQUEO');
  if (resultado.estado === 'con_bloqueos' || bloqueos.length > 0) {
    return [{
      codigo: 'SNAPSHOT_CALCULO_BLOQUEADO',
      severidad: 'BLOQUEO',
      mensaje: 'El calculo preliminar tiene bloqueos. No se guarda snapshot.',
      origen: 'motor_calculo',
      campo: 'estado',
    }, ...bloqueos];
  }
  return [];
}

export function mapResultadoMotorToSnapshotPayload(args: {
  resultado: MotorCalculoPeriodoResultado;
  fechaGeneracion: string;
  usuarioGenerador?: string | null;
  idEmpresa?: number | null;
  origen?: NominaCalculoSnapshotOrigen;
  parametrosPeriodo?: ParametroGeneral | null;
  entradasMensuales?: readonly EntradaMensualMotor[] | null;
}): NominaCalculoPeriodoSnapshot {
  const { resultado, fechaGeneracion } = args;
  const trabajadores = resultado.liquidaciones.map(mapTrabajador);
  const parametros = construirParametrosCongelados(args.parametrosPeriodo ?? null);
  const hashParametros = calcularHashParametros(parametros);
  const hashEntradas = calcularHashEntradas(args.entradasMensuales ?? []);
  const snapshotSinHash: NominaCalculoPeriodoSnapshot = {
    periodo: resultado.periodo,
    idEmpresa: args.idEmpresa ?? null,
    estado: args.origen === 'recalculo' ? 'recalculado' : 'preliminar',
    fechaGeneracion,
    usuarioGenerador: args.usuarioGenerador ?? null,
    totalTrabajadores: resultado.liquidaciones.length,
    totalHaberes: resultado.resumen.totalHaberes,
    totalDescuentos: resultado.resumen.totalDescuentos,
    totalLiquido: resultado.resumen.totalLiquidoPreliminar,
    totalBloqueados: resultado.resumen.totalBloqueados,
    totalAdvertencias: resultado.resumen.totalConAdvertencias,
    versionMotor: VERSION_MOTOR_SNAPSHOT,
    hashSnapshot: null,
    hashParametros,
    hashEntradas,
    origen: args.origen ?? 'preliminar',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: null,
    cierreOperativo: null,
    trabajadores,
    issues: resultado.issues.map(mapIssue),
    trazabilidad: resultado.liquidaciones.flatMap((l) => l.trazabilidad.map(mapTrazabilidad)),
    parametros,
  };

  return {
    ...snapshotSinHash,
    hashSnapshot: calcularSnapshotHash(buildSnapshotHashInput(snapshotSinHash)),
  };
}

/** Aplana los parametros generales del periodo en filas congeladas auditables. */
export function construirParametrosCongelados(
  parametros: ParametroGeneral | null,
): NominaCalculoParametroSnapshot[] {
  if (!parametros) return [];
  const vigencia = normalizeSnapshotDate(parametros.fechaActualizacion ?? null);
  const filas: NominaCalculoParametroSnapshot[] = [];
  for (const clave of Object.keys(parametros).sort()) {
    if (clave === 'periodo' || clave === 'fechaActualizacion') continue;
    const valor = (parametros as unknown as Record<string, unknown>)[clave];
    if (valor === undefined) continue;
    filas.push({
      grupo: 'parametros_generales',
      clave,
      valor: valor === null ? null : String(valor),
      valorNumerico: typeof valor === 'number' && Number.isFinite(valor) ? valor : null,
      vigencia,
      origen: 'parametros_generales',
    });
  }
  return filas;
}

export function calcularHashParametros(parametros: readonly NominaCalculoParametroSnapshot[]): string {
  return calcularSnapshotHash(
    parametros.map((p) => ({
      grupo: p.grupo,
      clave: p.clave,
      valor: p.valor,
      valorNumerico: p.valorNumerico,
      vigencia: p.vigencia,
      origen: p.origen,
    })),
  );
}

export function calcularHashEntradas(entradas: readonly EntradaMensualMotor[]): string {
  const normalizadas = entradas
    .map((e) => ({
      idEntrada: String(e.idEntrada),
      idPersona: e.idPersona,
      idConcepto: e.idConcepto,
      tipoEntrada: e.tipoEntrada,
      categoria: e.categoria ?? null,
      tipoMovimiento: e.tipoMovimiento ?? null,
      cantidad: e.cantidad ?? null,
      unidad: e.unidad ?? null,
      monto: e.monto ?? null,
      moneda: e.moneda ?? null,
      estado: e.estado,
      afectaBase: e.afectaBase ?? null,
      imponible: e.imponible ?? null,
      tributable: e.tributable ?? null,
    }))
    .sort((a, b) => a.idEntrada.localeCompare(b.idEntrada));
  return calcularSnapshotHash(normalizadas);
}

export function buildSnapshotHashInput(snapshot: NominaCalculoPeriodoSnapshot): unknown {
  return {
    periodo: snapshot.periodo,
    idEmpresa: snapshot.idEmpresa,
    versionMotor: snapshot.versionMotor,
    totalTrabajadores: snapshot.totalTrabajadores,
    totalHaberes: snapshot.totalHaberes,
    totalDescuentos: snapshot.totalDescuentos,
    totalLiquido: snapshot.totalLiquido,
    trabajadores: snapshot.trabajadores.map((t) => ({
      idPersona: t.idPersona,
      estado: t.estado,
      baseImponiblePrevisional: t.baseImponiblePrevisional,
      baseTributable: t.baseTributable,
      impuestoUnico: t.impuestoUnico,
      liquidoPreliminar: t.liquidoPreliminar,
      conceptos: t.conceptos.map((c) => ({
        tipo: c.tipo,
        nombreConceptoSnapshot: c.nombreConceptoSnapshot,
        monto: c.monto,
        imponible: c.imponible,
        tributable: c.tributable,
        afectaLiquido: c.afectaLiquido,
        origen: c.origen,
      })),
      issues: t.issues.map((i) => ({ codigo: i.codigo, severidad: i.severidad, campo: i.campo })),
      trazabilidad: t.trazabilidad.map((tr) => ({
        codigo: tr.codigo,
        tablaFuente: tr.tablaFuente,
        campoFuente: tr.campoFuente,
        valorEntrada: tr.valorEntrada,
        formula: tr.formula,
        valorResultado: tr.valorResultado,
      })),
    })),
    issues: snapshot.issues.map((i) => ({ codigo: i.codigo, severidad: i.severidad, campo: i.campo })),
  };
}

export function calcularSnapshotHash(value: unknown): string {
  const stable = stableStringify(value);
  let hash = 2166136261;
  for (let i = 0; i < stable.length; i += 1) {
    hash ^= stable.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildGuardarSnapshotRechazado(issues: MotorCalculoIssue[]): GuardarSnapshotPreliminarResult {
  return {
    ok: false,
    snapshot: null,
    reemplazoSnapshotAnterior: false,
    hashSnapshot: null,
    issues,
  };
}

function mapTrabajador(liq: MotorCalculoPeriodoResultado['liquidaciones'][number]): NominaCalculoTrabajadorSnapshot {
  const haberes = [...liq.haberesImponibles, ...liq.haberesNoImponibles];
  const descuentos = [...liq.descuentosLegales, ...liq.descuentosVoluntarios];
  return {
    idPersona: liq.idPersona,
    rut: liq.rut,
    nombreCompletoSnapshot: liq.nombreCompleto,
    estado: liq.estado,
    sueldoBase: liq.haberesImponibles.find((h) => h.codigo === 'SUELDO_BASE')?.monto ?? 0,
    baseImponiblePrevisional: liq.baseImponiblePrevisional,
    baseTributable: liq.baseTributable,
    totalHaberesImponibles: sum(liq.haberesImponibles.map((h) => h.monto)),
    totalHaberesNoImponibles: sum(liq.haberesNoImponibles.map((h) => h.monto)),
    totalDescuentosLegales: sum(liq.descuentosLegales.map((d) => d.monto)),
    totalDescuentosVoluntarios: sum(liq.descuentosVoluntarios.map((d) => d.monto)),
    impuestoUnico: liq.impuestoUnico,
    liquidoPreliminar: liq.liquidoAPago,
    cotizacionAfp: liq.cotizacionAfp,
    cotizacionSalud: liq.cotizacionSalud,
    cotizacionAfc: liq.cotizacionAfc,
    cotizacionSis: liq.cotizacionSis,
    cotizacionSanna: liq.cotizacionSanna,
    cotizacionLey16744Empleador: liq.cotizacionLey16744,
    conceptos: [
      ...haberes.map((l) => mapConcepto(l, 'haber', true)),
      ...descuentos.map((l) => mapConcepto(l, l.codigo === 'IMPUESTO_UNICO' ? 'impuesto' : 'descuento', true)),
      mapConcepto({ codigo: 'AFC_EMPLEADOR', descripcion: 'AFC empleador', monto: liq.cotizacionAfcEmpleador ?? 0, origen: 'afc_parametro', imponible: false, tributable: false }, 'cotizacion', false),
      mapConcepto({ codigo: 'SIS', descripcion: 'SIS empleador', monto: liq.cotizacionSis, origen: 'parametros_generales', imponible: false, tributable: false }, 'cotizacion', false),
      mapConcepto({ codigo: 'SANNA', descripcion: 'SANNA empleador', monto: liq.cotizacionSanna, origen: 'parametros_generales', imponible: false, tributable: false }, 'cotizacion', false),
      mapConcepto({ codigo: 'LEY_16744', descripcion: 'Mutual empleador', monto: liq.cotizacionLey16744, origen: 'ley_16744_parametros', imponible: false, tributable: false }, 'cotizacion', false),
    ].filter((c) => c.monto !== 0),
    issues: liq.issues.map(mapIssue),
    trazabilidad: liq.trazabilidad.map(mapTrazabilidad),
  };
}

function mapConcepto(
  linea: LineaLiquidacionCalculada,
  tipo: NominaCalculoConceptoSnapshot['tipo'],
  afectaLiquido: boolean,
): NominaCalculoConceptoSnapshot {
  return {
    idConcepto: null,
    tipo,
    nombreConceptoSnapshot: linea.descripcion,
    codigoLreSnapshot: resolverCodigoLreLinea({
      codigoLre: linea.codigoLre,
      codigo: linea.codigo,
      codigoMotor: linea.codigoMotor,
    }),
    monto: linea.monto,
    imponible: linea.imponible === true,
    tributable: linea.tributable === true,
    afectaLiquido,
    origen: linea.origen || linea.codigo,
    trazabilidadJson: { codigo: linea.codigo },
  };
}

function mapIssue(issue: MotorCalculoIssue): NominaCalculoIssueSnapshot {
  return {
    codigo: issue.codigo,
    severidad: issue.severidad,
    origen: issue.origen,
    mensaje: issue.mensaje,
    campo: issue.campo ?? null,
    entidadId: issue.entidadId ?? null,
  };
}

function mapTrazabilidad(traza: MotorCalculoPeriodoResultado['liquidaciones'][number]['trazabilidad'][number]): NominaCalculoTrazabilidadSnapshot {
  return {
    codigo: traza.codigo,
    origen: traza.origen,
    tablaFuente: traza.tabla,
    campoFuente: traza.campo,
    vigenciaInicio: normalizeSnapshotDate(traza.vigenciaInicio),
    vigenciaFin: normalizeSnapshotDate(traza.vigenciaFin),
    valorEntrada: traza.valorEntrada,
    formula: traza.formula,
    valorResultado: traza.valorResultado,
    observacion: traza.observacion ?? null,
  };
}

function normalizeSnapshotDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${value}-01` : value;
  if (!/^\d{4}-(0[1-9]|1[0-2])-[0-9]{2}$/.test(candidate)) return null;
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate ? null : candidate;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function sum(values: number[]): number {
  return Math.round(values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0) * 100) / 100;
}

/**
 * Reconstruye el resultado del motor V1 desde un snapshot completo persistido
 * en BD. Inverso aproximado de `mapResultadoMotorToSnapshotPayload`: conserva
 * líneas, totales, issues y trazabilidad para rehidratar el paso Cálculo del
 * Generador sin recalcular.
 */
export function mapSnapshotCompletoToMotorCalculoPeriodo(
  completo: NominaSnapshotCompletoView,
): MotorCalculoPeriodoResultado {
  const cabecera = completo.cabecera;
  const liquidaciones = completo.trabajadores.map((trabajador) =>
    mapTrabajadorSnapshotToLiquidacion(trabajador, cabecera.periodo),
  );
  const estadoPeriodo: MotorCalculoEstadoPeriodo =
    cabecera.totalBloqueados > 0 || liquidaciones.some((l) => l.estado === 'con_bloqueos')
      ? 'con_bloqueos'
      : 'calculado_preliminar';

  return {
    periodo: cabecera.periodo,
    estado: estadoPeriodo,
    generadoEn: cabecera.fechaGeneracion,
    resumen: {
      totalTrabajadoresCalculados: cabecera.totalTrabajadores,
      totalBloqueados: cabecera.totalBloqueados,
      totalConAdvertencias: cabecera.totalAdvertencias,
      totalHaberes: cabecera.totalHaberes,
      totalDescuentos: cabecera.totalDescuentos,
      totalLiquidoPreliminar: cabecera.totalLiquido,
    },
    liquidaciones,
    issues: cabecera.issues.map(mapIssueSnapshotToMotor),
  };
}

export function mapTrabajadorSnapshotToLiquidacion(
  trabajador: NominaCalculoTrabajadorSnapshot,
  periodo: string,
): LiquidacionCalculada {
  const haberesImponibles: LineaLiquidacionCalculada[] = [];
  const haberesNoImponibles: LineaLiquidacionCalculada[] = [];
  const descuentosLegales: LineaLiquidacionCalculada[] = [];
  const descuentosVoluntarios: LineaLiquidacionCalculada[] = [];

  let legalAcumulado = 0;
  const legalObjetivo = trabajador.totalDescuentosLegales;

  for (const concepto of trabajador.conceptos) {
    if (concepto.tipo === 'cotizacion') continue;
    const linea = mapConceptoSnapshotToLinea(concepto);
    if (concepto.tipo === 'haber') {
      if (concepto.imponible) haberesImponibles.push(linea);
      else haberesNoImponibles.push(linea);
      continue;
    }
    if (concepto.tipo === 'impuesto') {
      descuentosLegales.push(linea);
      legalAcumulado += concepto.monto;
      continue;
    }
    if (concepto.tipo === 'descuento') {
      if (legalAcumulado + concepto.monto <= legalObjetivo + 0.01) {
        descuentosLegales.push(linea);
        legalAcumulado += concepto.monto;
      } else {
        descuentosVoluntarios.push(linea);
      }
    }
  }

  return {
    periodo,
    idPersona: trabajador.idPersona,
    rut: trabajador.rut,
    nombreCompleto: trabajador.nombreCompletoSnapshot,
    haberesImponibles,
    haberesNoImponibles,
    descuentosLegales,
    descuentosVoluntarios,
    baseImponiblePrevisional: trabajador.baseImponiblePrevisional,
    baseTributable: trabajador.baseTributable,
    gratificacionLegal: sumarMontosPorCodigo(haberesImponibles, 'GRATIFICACION_ART_50', 'GRATIFICACION_RECURRENTE'),
    asignacionFamiliar: sumarMontosPorCodigo(haberesNoImponibles, 'ASIGNACION_FAMILIAR'),
    cotizacionAfp: trabajador.cotizacionAfp,
    cotizacionSalud: trabajador.cotizacionSalud,
    cotizacionAfc: trabajador.cotizacionAfc,
    // Sin columna propia: se guarda como línea de cotización (código LRE 4151).
    cotizacionAfcEmpleador: trabajador.conceptos
      .filter((c) => c.tipo === 'cotizacion' && c.codigoLreSnapshot === '4151')
      .reduce((total, c) => total + c.monto, 0),
    cotizacionSis: trabajador.cotizacionSis,
    cotizacionSanna: trabajador.cotizacionSanna,
    cotizacionLey16744: trabajador.cotizacionLey16744Empleador,
    impuestoUnico: trabajador.impuestoUnico,
    totalHaberes: trabajador.totalHaberesImponibles + trabajador.totalHaberesNoImponibles,
    totalDescuentos:
      trabajador.totalDescuentosLegales + trabajador.totalDescuentosVoluntarios,
    liquidoAPago: trabajador.liquidoPreliminar,
    issues: trabajador.issues.map(mapIssueSnapshotToMotor),
    trazabilidad: trabajador.trazabilidad.map(mapTrazabilidadSnapshotToMotor),
    estado: trabajador.estado,
  };
}

function mapConceptoSnapshotToLinea(concepto: NominaCalculoConceptoSnapshot): LineaLiquidacionCalculada {
  return {
    codigo: codigoConceptoSnapshot(concepto),
    descripcion: concepto.nombreConceptoSnapshot,
    monto: concepto.monto,
    origen: concepto.origen,
    imponible: concepto.imponible,
    tributable: concepto.tributable,
  };
}

function codigoConceptoSnapshot(concepto: NominaCalculoConceptoSnapshot): string {
  const raw = concepto.trazabilidadJson?.['codigo'];
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (concepto.tipo === 'impuesto') return 'IMPUESTO_UNICO';
  return concepto.nombreConceptoSnapshot.trim().replace(/\s+/g, '_').toUpperCase();
}

function mapIssueSnapshotToMotor(issue: NominaCalculoIssueSnapshot): MotorCalculoIssue {
  return {
    codigo: issue.codigo,
    severidad: issue.severidad,
    mensaje: issue.mensaje,
    origen: issue.origen,
    entidadId: issue.entidadId ?? null,
    campo: issue.campo ?? null,
  };
}

function mapTrazabilidadSnapshotToMotor(
  traza: NominaCalculoTrazabilidadSnapshot,
): MotorCalculoTrazabilidad {
  return {
    codigo: traza.codigo,
    origen: traza.origen,
    tabla: traza.tablaFuente,
    campo: traza.campoFuente,
    valorEntrada: normalizeTrazaValor(traza.valorEntrada),
    formula: traza.formula,
    valorResultado: normalizeTrazaValor(traza.valorResultado),
    vigenciaInicio: traza.vigenciaInicio,
    vigenciaFin: traza.vigenciaFin,
    observacion: traza.observacion,
  };
}

function normalizeTrazaValor(
  value: NominaCalculoTrazabilidadSnapshot['valorEntrada'],
): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value == null) return null;
  return JSON.stringify(value);
}

function sumarMontosPorCodigo(
  lineas: readonly LineaLiquidacionCalculada[],
  ...codigos: string[]
): number {
  const set = new Set(codigos);
  return sum(lineas.filter((linea) => set.has(linea.codigo)).map((linea) => linea.monto));
}
