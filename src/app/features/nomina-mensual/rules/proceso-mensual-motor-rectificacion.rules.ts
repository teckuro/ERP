import type {
  LineaLiquidacionCalculada,
  LiquidacionCalculada,
  MotorCalculoIssue,
  MotorCalculoPeriodoResultado,
  NominaSnapshotCompletoView,
} from '../models/proceso-mensual.model';
import { mapTrabajadorSnapshotToLiquidacion } from './proceso-mensual-snapshot.rules';

function redondear(monto: number): number {
  return Math.round(monto);
}

function diffLineas(
  orig: readonly LineaLiquidacionCalculada[],
  rect: readonly LineaLiquidacionCalculada[],
): LineaLiquidacionCalculada[] {
  const mapOrig = new Map(orig.map((l) => [l.codigo, l]));
  const mapRect = new Map(rect.map((l) => [l.codigo, l]));
  const codigos = new Set([...mapOrig.keys(), ...mapRect.keys()]);
  const out: LineaLiquidacionCalculada[] = [];

  for (const codigo of codigos) {
    const montoOrig = mapOrig.get(codigo)?.monto ?? 0;
    const montoRect = mapRect.get(codigo)?.monto ?? 0;
    const delta = redondear(montoRect - montoOrig);
    if (delta === 0) continue;
    const base = mapRect.get(codigo) ?? mapOrig.get(codigo)!;
    out.push({ ...base, monto: delta });
  }

  return out;
}

function clasificarLineasDiff(
  orig: LiquidacionCalculada,
  rect: LiquidacionCalculada,
): Pick<
  LiquidacionCalculada,
  'haberesImponibles' | 'haberesNoImponibles' | 'descuentosLegales' | 'descuentosVoluntarios'
> {
  return {
    haberesImponibles: diffLineas(orig.haberesImponibles, rect.haberesImponibles),
    haberesNoImponibles: diffLineas(orig.haberesNoImponibles, rect.haberesNoImponibles),
    descuentosLegales: diffLineas(orig.descuentosLegales, rect.descuentosLegales),
    descuentosVoluntarios: diffLineas(orig.descuentosVoluntarios, rect.descuentosVoluntarios),
  };
}

function sumarLineas(lineas: readonly LineaLiquidacionCalculada[]): number {
  return lineas.reduce((acc, l) => acc + l.monto, 0);
}

/**
 * Hay algo que rectificar si cambia lo del trabajador (haberes, descuentos, líquido)
 * o lo que declara el empleador (SIS, SANNA, mutual, AFC empleador), aunque el
 * líquido no se mueva: esos aportes también van a Previred y al LRE.
 */
function tieneDelta(liquidacion: LiquidacionCalculada): boolean {
  return (
    liquidacion.totalHaberes !== 0
    || liquidacion.totalDescuentos !== 0
    || liquidacion.liquidoAPago !== 0
    || liquidacion.cotizacionSis !== 0
    || liquidacion.cotizacionSanna !== 0
    || liquidacion.cotizacionLey16744 !== 0
    || (liquidacion.cotizacionAfcEmpleador ?? 0) !== 0
  );
}

function calcularTrabajadorRectificacion(args: {
  periodo: string;
  trabajadorRectificado: LiquidacionCalculada;
  trabajadorOrigen: LiquidacionCalculada | null;
  nominaOrigenId: string;
  versionCalculoOrigen: number;
}): LiquidacionCalculada | null {
  const { periodo, trabajadorRectificado, trabajadorOrigen, nominaOrigenId, versionCalculoOrigen } = args;
  const issues: MotorCalculoIssue[] = [...trabajadorRectificado.issues];

  if (!trabajadorOrigen) {
    issues.push({
      codigo: 'TRABAJADOR_NO_EN_ORIGEN',
      severidad: 'BLOQUEO',
      mensaje: 'El trabajador no pertenece a la nómina original cerrada.',
      origen: 'rectificacion',
      entidadId: trabajadorRectificado.idPersona,
      campo: 'idPersona',
    });
    return {
      ...trabajadorRectificado,
      haberesImponibles: [],
      haberesNoImponibles: [],
      descuentosLegales: [],
      descuentosVoluntarios: [],
      totalHaberes: 0,
      totalDescuentos: 0,
      liquidoAPago: 0,
      issues,
      estado: 'con_bloqueos',
    };
  }

  const lineas = clasificarLineasDiff(trabajadorOrigen, trabajadorRectificado);
  const totalHaberes = redondear(
    sumarLineas(lineas.haberesImponibles) + sumarLineas(lineas.haberesNoImponibles),
  );
  const totalDescuentos = redondear(
    sumarLineas(lineas.descuentosLegales) + sumarLineas(lineas.descuentosVoluntarios),
  );
  const liquidoAPago = redondear(trabajadorRectificado.liquidoAPago - trabajadorOrigen.liquidoAPago);

  const diff: LiquidacionCalculada = {
    periodo,
    idPersona: trabajadorRectificado.idPersona,
    rut: trabajadorRectificado.rut,
    nombreCompleto: trabajadorRectificado.nombreCompleto,
    ...lineas,
    baseImponiblePrevisional: redondear(
      trabajadorRectificado.baseImponiblePrevisional - trabajadorOrigen.baseImponiblePrevisional,
    ),
    baseTributable: redondear(trabajadorRectificado.baseTributable - trabajadorOrigen.baseTributable),
    gratificacionLegal: redondear(trabajadorRectificado.gratificacionLegal - trabajadorOrigen.gratificacionLegal),
    asignacionFamiliar: redondear(
      trabajadorRectificado.asignacionFamiliar - trabajadorOrigen.asignacionFamiliar,
    ),
    cotizacionAfp: redondear(trabajadorRectificado.cotizacionAfp - trabajadorOrigen.cotizacionAfp),
    cotizacionSalud: redondear(trabajadorRectificado.cotizacionSalud - trabajadorOrigen.cotizacionSalud),
    cotizacionAfc: redondear(trabajadorRectificado.cotizacionAfc - trabajadorOrigen.cotizacionAfc),
    cotizacionAfcEmpleador: redondear(
      (trabajadorRectificado.cotizacionAfcEmpleador ?? 0) - (trabajadorOrigen.cotizacionAfcEmpleador ?? 0),
    ),
    cotizacionSis: redondear(trabajadorRectificado.cotizacionSis - trabajadorOrigen.cotizacionSis),
    cotizacionSanna: redondear(trabajadorRectificado.cotizacionSanna - trabajadorOrigen.cotizacionSanna),
    cotizacionLey16744: redondear(
      trabajadorRectificado.cotizacionLey16744 - trabajadorOrigen.cotizacionLey16744,
    ),
    impuestoUnico: redondear(trabajadorRectificado.impuestoUnico - trabajadorOrigen.impuestoUnico),
    totalHaberes,
    totalDescuentos,
    liquidoAPago,
    issues,
    trazabilidad: [
      ...trabajadorRectificado.trazabilidad,
      {
        codigo: 'RECTIFICACION_ORIGEN',
        origen: 'rectificacion',
        tabla: 'nomina_periodo',
        campo: 'nomina_origen_id',
        valorEntrada: nominaOrigenId,
        formula: `versionCalculoOrigen=${versionCalculoOrigen}`,
        valorResultado: liquidoAPago,
      },
    ],
    estado: issues.some((i) => i.severidad === 'BLOQUEO') ? 'con_bloqueos' : 'calculado_preliminar',
  };

  return tieneDelta(diff) ? diff : null;
}

export function generarCalculoRectificacionPeriodo(input: {
  periodo: string;
  snapshotOrigen: NominaSnapshotCompletoView;
  resultadoRectificado: MotorCalculoPeriodoResultado;
  nominaOrigenId: string;
  versionCalculoOrigen: number;
  generadoEn: string;
}): MotorCalculoPeriodoResultado {
  const origenPorPersona = new Map<number, LiquidacionCalculada>();
  for (const trab of input.snapshotOrigen.trabajadores) {
    origenPorPersona.set(
      trab.idPersona,
      mapTrabajadorSnapshotToLiquidacion(trab, input.periodo),
    );
  }

  const liquidaciones: LiquidacionCalculada[] = [];
  const issues: MotorCalculoIssue[] = [];

  for (const rect of input.resultadoRectificado.liquidaciones) {
    const diff = calcularTrabajadorRectificacion({
      periodo: input.periodo,
      trabajadorRectificado: rect,
      trabajadorOrigen: origenPorPersona.get(rect.idPersona) ?? null,
      nominaOrigenId: input.nominaOrigenId,
      versionCalculoOrigen: input.versionCalculoOrigen,
    });
    if (diff) {
      liquidaciones.push(diff);
      issues.push(...diff.issues);
    }
  }

  const resumen = liquidaciones.reduce(
    (acc, liq) => ({
      totalTrabajadoresCalculados: acc.totalTrabajadoresCalculados + 1,
      totalBloqueados: acc.totalBloqueados + (liq.estado === 'con_bloqueos' ? 1 : 0),
      totalConAdvertencias: acc.totalConAdvertencias + (liq.issues.some((i) => i.severidad === 'ADVERTENCIA') ? 1 : 0),
      totalHaberes: acc.totalHaberes + liq.totalHaberes,
      totalDescuentos: acc.totalDescuentos + liq.totalDescuentos,
      totalLiquidoPreliminar: acc.totalLiquidoPreliminar + liq.liquidoAPago,
    }),
    {
      totalTrabajadoresCalculados: 0,
      totalBloqueados: 0,
      totalConAdvertencias: 0,
      totalHaberes: 0,
      totalDescuentos: 0,
      totalLiquidoPreliminar: 0,
    },
  );

  const bloqueos = issues.filter((i) => i.severidad === 'BLOQUEO');

  return {
    periodo: input.periodo,
    estado: bloqueos.length > 0 ? 'con_bloqueos' : 'calculado_preliminar',
    generadoEn: input.generadoEn,
    resumen,
    liquidaciones,
    issues,
  };
}

export interface TotalesRectificacionVista {
  original: { haberes: number; descuentos: number; liquido: number };
  diferencia: { haberes: number; descuentos: number; liquido: number };
  acumulado: { haberes: number; descuentos: number; liquido: number };
}

export function calcularTotalesRectificacionVista(args: {
  totalesOrigen: { haberes: number; descuentos: number; liquido: number };
  totalesDiferencia: { haberes: number; descuentos: number; liquido: number };
}): TotalesRectificacionVista {
  const { totalesOrigen, totalesDiferencia } = args;
  return {
    original: totalesOrigen,
    diferencia: totalesDiferencia,
    acumulado: {
      haberes: redondear(totalesOrigen.haberes + totalesDiferencia.haberes),
      descuentos: redondear(totalesOrigen.descuentos + totalesDiferencia.descuentos),
      liquido: redondear(totalesOrigen.liquido + totalesDiferencia.liquido),
    },
  };
}
