import type { MotorCalculoPeriodoResultado } from '../models/proceso-mensual.model';

import {
  buildSnapshotHashInput,
  calcularSnapshotHash,
  mapResultadoMotorToSnapshotPayload,
  validarResultadoSnapshotPreliminar,
} from './proceso-mensual-snapshot.rules';

function resultado(over: Partial<MotorCalculoPeriodoResultado> = {}): MotorCalculoPeriodoResultado {
  return {
    periodo: '2026-05',
    estado: 'calculado_preliminar',
    generadoEn: '2026-05-05T10:00:00.000Z',
    resumen: {
      totalTrabajadoresCalculados: 1,
      totalBloqueados: 0,
      totalConAdvertencias: 0,
      totalHaberes: 900000,
      totalDescuentos: 180000,
      totalLiquidoPreliminar: 720000,
    },
    liquidaciones: [{
      periodo: '2026-05',
      idPersona: 1,
      rut: '11.111.111-1',
      nombreCompleto: 'Ana Perez',
      haberesImponibles: [
        { codigo: 'SUELDO_BASE', descripcion: 'Sueldo base', monto: 800000, origen: 'contrato', imponible: true, tributable: true },
        { codigo: 'BONO', descripcion: 'Bono imponible', monto: 100000, origen: 'haber_recurrente', imponible: true, tributable: true },
      ],
      haberesNoImponibles: [],
      descuentosLegales: [
        { codigo: 'AFP', descripcion: 'AFP', monto: 100000, origen: 'afp_vigencia' },
        { codigo: 'SALUD', descripcion: 'Salud', monto: 70000, origen: 'salud' },
        { codigo: 'IMPUESTO_UNICO', descripcion: 'Impuesto unico', monto: 10000, origen: 'tabla_impuesto_unico' },
      ],
      descuentosVoluntarios: [],
      baseImponiblePrevisional: 900000,
      baseTributable: 720000,
      gratificacionLegal: 0,
      asignacionFamiliar: 0,
      cotizacionAfp: 100000,
      cotizacionSalud: 70000,
      cotizacionAfc: 0,
      cotizacionSis: 12000,
      cotizacionSanna: 300,
      cotizacionLey16744: 9000,
      impuestoUnico: 10000,
      totalHaberes: 900000,
      totalDescuentos: 180000,
      liquidoAPago: 720000,
      issues: [{
        codigo: 'IMPUESTO_CALCULADO',
        severidad: 'INFO',
        mensaje: 'Impuesto calculado',
        origen: 'tabla_impuesto_unico',
        campo: 'factor',
      }],
      trazabilidad: [{
        codigo: 'LIQUIDO_PRELIMINAR',
        origen: 'motor',
        tabla: 'resultado',
        campo: 'totalHaberes-totalDescuentos',
        valorEntrada: '900000-180000',
        formula: 'totalHaberes - totalDescuentos',
        valorResultado: 720000,
        vigenciaInicio: null,
        vigenciaFin: null,
        observacion: null,
      }],
      estado: 'calculado_preliminar',
    }],
    issues: [],
    ...over,
  };
}

describe('proceso-mensual-snapshot.rules', () => {
  it('no guarda snapshot si no existe calculo en memoria', () => {
    const issues = validarResultadoSnapshotPreliminar(null);
    expect(issues.some((i) => i.codigo === 'SNAPSHOT_SIN_CALCULO')).toBe(true);
  });

  it('no guarda snapshot si calculo tiene bloqueos', () => {
    const issues = validarResultadoSnapshotPreliminar(resultado({
      estado: 'con_bloqueos',
      issues: [{ codigo: 'FALTA_SIS', severidad: 'BLOQUEO', mensaje: 'Falta SIS', origen: 'parametros_generales' }],
    }));
    expect(issues.some((i) => i.codigo === 'SNAPSHOT_CALCULO_BLOQUEADO')).toBe(true);
  });

  it('guarda cabecera preliminar con resumen de periodo', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado: resultado(),
      fechaGeneracion: '2026-05-05T10:00:00.000Z',
    });

    expect(snapshot.estado).toBe('preliminar');
    expect(snapshot.totalTrabajadores).toBe(1);
    expect(snapshot.totalHaberes).toBe(900000);
    expect(snapshot.totalLiquido).toBe(720000);
  });

  it('guarda detalle por trabajador', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' });
    expect(snapshot.trabajadores[0].idPersona).toBe(1);
    expect(snapshot.trabajadores[0].baseImponiblePrevisional).toBe(900000);
    expect(snapshot.trabajadores[0].liquidoPreliminar).toBe(720000);
  });

  it('guarda conceptos asociados de haberes descuentos cotizaciones e impuesto', () => {
    const conceptos = mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' }).trabajadores[0].conceptos;
    expect(conceptos.some((c) => c.tipo === 'haber' && c.nombreConceptoSnapshot === 'Sueldo base')).toBe(true);
    expect(conceptos.some((c) => c.tipo === 'descuento' && c.nombreConceptoSnapshot === 'AFP')).toBe(true);
    expect(conceptos.some((c) => c.tipo === 'impuesto')).toBe(true);
    expect(conceptos.some((c) => c.tipo === 'cotizacion' && c.afectaLiquido === false)).toBe(true);
  });

  it('guarda issues de periodo y trabajador', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' });
    expect(snapshot.trabajadores[0].issues.some((i) => i.codigo === 'IMPUESTO_CALCULADO')).toBe(true);
  });

  it('guarda trazabilidad de formulas', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' });
    expect(snapshot.trabajadores[0].trazabilidad.some((t) => t.codigo === 'LIQUIDO_PRELIMINAR')).toBe(true);
  });

  it('normaliza periodos mensuales como fecha valida para trazabilidad SQL', () => {
    const base = resultado();
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado: {
        ...base,
        liquidaciones: [{
          ...base.liquidaciones[0],
          trazabilidad: [{
            ...base.liquidaciones[0].trazabilidad[0],
            vigenciaInicio: '2026-04',
            vigenciaFin: 'fecha-invalida',
          }],
        }],
      },
      fechaGeneracion: 'now',
    });

    expect(snapshot.trabajadores[0].trazabilidad[0].vigenciaInicio).toBe('2026-04-01');
    expect(snapshot.trabajadores[0].trazabilidad[0].vigenciaFin).toBeNull();
  });

  it('marca origen recalculo al construir reemplazo', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({
      resultado: resultado(),
      fechaGeneracion: 'now',
      origen: 'recalculo',
    });
    expect(snapshot.estado).toBe('recalculado');
    expect(snapshot.origen).toBe('recalculo');
  });

  it('hash_snapshot cambia si cambian montos', () => {
    const a = mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' });
    const b = mapResultadoMotorToSnapshotPayload({
      resultado: resultado({
        resumen: { ...resultado().resumen, totalLiquidoPreliminar: 720001 },
        liquidaciones: [{ ...resultado().liquidaciones[0], liquidoAPago: 720001 }],
      }),
      fechaGeneracion: 'now',
    });
    expect(a.hashSnapshot).not.toBe(b.hashSnapshot);
  });

  it('hash no depende del orden de claves del objeto', () => {
    const a = calcularSnapshotHash({ b: 1, a: 2 });
    const b = calcularSnapshotHash({ a: 2, b: 1 });
    expect(a).toBe(b);
  });

  it('no marca periodo como cerrado', () => {
    const snapshot = mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' });
    expect(snapshot.estado).not.toBe('cerrado');
  });

  it('no genera PDF Previred ni LRE en el payload', () => {
    const hashInput = JSON.stringify(buildSnapshotHashInput(mapResultadoMotorToSnapshotPayload({ resultado: resultado(), fechaGeneracion: 'now' })));
    expect(hashInput).not.toMatch(/pdf|previred|lre|contabil/i);
  });
});
