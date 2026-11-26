import type { ReglaAnticipo } from '../models/nomina-plantilla-ciclo.models';
import type {
  LiquidacionCalculada,
  MotorCalculoIssue,
  MotorCalculoPeriodoResultado,
  TrabajadorMotorCalculoSnapshot,
} from '../models/proceso-mensual.model';

function redondear(monto: number): number {
  return Math.round(monto);
}

function calcularMontoAnticipo(sueldoBase: number, regla: ReglaAnticipo): number {
  if (regla.modo === 'porcentaje') {
    return redondear((sueldoBase * regla.valor) / 100);
  }
  return redondear(regla.valor);
}

function calcularTrabajadorAnticipo(args: {
  periodo: string;
  trabajador: TrabajadorMotorCalculoSnapshot;
  reglaAnticipo: ReglaAnticipo;
}): LiquidacionCalculada {
  const { periodo, trabajador, reglaAnticipo } = args;
  const issues: MotorCalculoIssue[] = [];
  const sueldoBase = trabajador.sueldoBase ?? 0;

  if (!trabajador.aptoParaRemuneraciones || trabajador.estado !== 'activo') {
    issues.push({
      codigo: 'TRABAJADOR_NO_CALCULABLE',
      severidad: 'BLOQUEO',
      mensaje: 'Trabajador no calculable según pre-nómina.',
      origen: 'pre_nomina',
      entidadId: trabajador.idPersona,
      campo: 'estado',
    });
  }
  if (sueldoBase <= 0) {
    issues.push({
      codigo: 'FALTA_SUELDO_BASE',
      severidad: 'BLOQUEO',
      mensaje: 'Falta sueldo base para calcular el anticipo.',
      origen: 'empleados',
      entidadId: trabajador.idPersona,
      campo: 'sueldoBase',
    });
  }
  if (reglaAnticipo.valor <= 0) {
    issues.push({
      codigo: 'REGLA_ANTICIPO_INVALIDA',
      severidad: 'BLOQUEO',
      mensaje: 'La regla de anticipo no tiene un valor válido.',
      origen: 'plantilla',
      entidadId: trabajador.idPersona,
      campo: 'reglaAnticipo',
    });
  }

  const bloqueado = issues.some((i) => i.severidad === 'BLOQUEO');
  const montoAnticipo = bloqueado ? 0 : calcularMontoAnticipo(sueldoBase, reglaAnticipo);

  return {
    periodo,
    idPersona: trabajador.idPersona,
    rut: trabajador.rut,
    nombreCompleto: trabajador.nombreCompleto,
    haberesImponibles: bloqueado
      ? []
      : [{
          codigo: 'ANTICIPO',
          descripcion: 'Anticipo de remuneraciones',
          monto: montoAnticipo,
          origen: 'regla_anticipo',
          imponible: false,
          tributable: false,
        }],
    haberesNoImponibles: [],
    descuentosLegales: [],
    descuentosVoluntarios: [],
    baseImponiblePrevisional: 0,
    baseTributable: 0,
    gratificacionLegal: 0,
    asignacionFamiliar: 0,
    cotizacionAfp: 0,
    cotizacionSalud: 0,
    cotizacionAfc: 0,
    cotizacionAfcEmpleador: 0,
    cotizacionSis: 0,
    cotizacionSanna: 0,
    cotizacionLey16744: 0,
    impuestoUnico: 0,
    totalHaberes: montoAnticipo,
    totalDescuentos: 0,
    liquidoAPago: montoAnticipo,
    issues,
    trazabilidad: [{
      codigo: 'ANTICIPO_REGLA',
      origen: 'regla_anticipo',
      tabla: 'nomina_plantilla_ciclo',
      campo: 'regla_anticipo',
      valorEntrada: sueldoBase,
      formula: `${reglaAnticipo.modo}=${reglaAnticipo.valor}`,
      valorResultado: montoAnticipo,
    }],
    estado: bloqueado ? 'con_bloqueos' : 'calculado_preliminar',
  };
}

export function generarCalculoAnticipoPeriodo(input: {
  periodo: string;
  reglaAnticipo: ReglaAnticipo;
  trabajadores: readonly TrabajadorMotorCalculoSnapshot[];
  generadoEn: string;
}): MotorCalculoPeriodoResultado {
  const liquidaciones = input.trabajadores.map((trabajador) =>
    calcularTrabajadorAnticipo({
      periodo: input.periodo,
      trabajador,
      reglaAnticipo: input.reglaAnticipo,
    }),
  );
  const issues = liquidaciones.flatMap((l) => l.issues);
  const totalBloqueados = liquidaciones.filter((l) => l.estado === 'con_bloqueos').length;
  const totalConAdvertencias = liquidaciones.filter((l) => l.estado === 'con_advertencias').length;
  const totalTrabajadoresCalculados = liquidaciones.filter((l) => l.estado !== 'con_bloqueos').length;

  return {
    periodo: input.periodo,
    estado: totalBloqueados > 0 ? 'con_bloqueos' : 'calculado_preliminar',
    generadoEn: input.generadoEn,
    resumen: {
      totalTrabajadoresCalculados,
      totalBloqueados,
      totalConAdvertencias,
      totalHaberes: liquidaciones.reduce((acc, l) => acc + l.totalHaberes, 0),
      totalDescuentos: 0,
      totalLiquidoPreliminar: liquidaciones.reduce((acc, l) => acc + l.liquidoAPago, 0),
    },
    liquidaciones,
    issues,
  };
}
