import type {
  GuardarSnapshotPreliminarResult,
  LineaLiquidacionCalculada,
  MotorCalculoIssue,
  MotorCalculoPeriodoResultado,
  NominaCalculoConceptoSnapshot,
  NominaCalculoIssueSnapshot,
  NominaCalculoPeriodoSnapshot,
  NominaCalculoSnapshotOrigen,
  NominaCalculoTrabajadorSnapshot,
  NominaCalculoTrazabilidadSnapshot,
} from '../models/proceso-mensual.model';

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
      mensaje: 'El calculo preliminar tiene bloqueos; no se guarda snapshot.',
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
}): NominaCalculoPeriodoSnapshot {
  const { resultado, fechaGeneracion } = args;
  const trabajadores = resultado.liquidaciones.map(mapTrabajador);
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
    origen: args.origen ?? 'preliminar',
    activo: true,
    reemplazadoPor: null,
    aprobacionOperativa: null,
    cierreOperativo: null,
    trabajadores,
    issues: resultado.issues.map(mapIssue),
    trazabilidad: resultado.liquidaciones.flatMap((l) => l.trazabilidad.map(mapTrazabilidad)),
  };

  return {
    ...snapshotSinHash,
    hashSnapshot: calcularSnapshotHash(buildSnapshotHashInput(snapshotSinHash)),
  };
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
    codigoLreSnapshot: null,
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
