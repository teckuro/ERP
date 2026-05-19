import { describe, expect, it } from 'vitest';

import type { MotorCalculoPeriodoResultado } from '../models/proceso-mensual.model';
import { buildResultadoPreliminarView } from './proceso-mensual-resultado-preliminar.rules';

function calculoBase(over: Partial<MotorCalculoPeriodoResultado> = {}): MotorCalculoPeriodoResultado {
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
      nombreCompleto: 'Ana Pérez',
      haberesImponibles: [],
      haberesNoImponibles: [],
      descuentosLegales: [],
      descuentosVoluntarios: [],
      baseImponiblePrevisional: 900000,
      baseTributable: 720000,
      gratificacionLegal: 0,
      asignacionFamiliar: 0,
      cotizacionAfp: 0,
      cotizacionSalud: 0,
      cotizacionAfc: 0,
      cotizacionSis: 0,
      cotizacionSanna: 0,
      cotizacionLey16744: 0,
      impuestoUnico: 0,
      totalHaberes: 900000,
      totalDescuentos: 180000,
      liquidoAPago: 720000,
      issues: [],
      trazabilidad: [],
      estado: 'calculado_preliminar',
    }],
    issues: [],
    ...over,
  };
}

const inputBase = {
  calculo: null as MotorCalculoPeriodoResultado | null,
  base: null,
  snapshotActivo: null,
  snapshotCompleto: null,
  errorGuardadoResultado: null,
  identificadorResultadoGuardadoActual: null,
  puedeCalcular: true,
  puedeGuardarPreliminar: false,
  periodoValido: true,
  nominaCerradaOperativamente: false,
  errorEjecucion: null,
  guardandoSnapshot: false,
};

describe('proceso-mensual-resultado-preliminar.rules', () => {
  it('sin cálculo devuelve sin_resultado', () => {
    const vm = buildResultadoPreliminarView(inputBase);

    expect(vm.estado).toBe('sin_resultado');
    expect(vm.trabajadores).toHaveLength(0);
    expect(vm.acciones.puedeGuardarPreliminar).toBe(false);
  });

  it('con cálculo y hash coincidente marca guardado', () => {
    const vm = buildResultadoPreliminarView({
      ...inputBase,
      calculo: calculoBase(),
      snapshotActivo: {
        idCalculoPeriodo: 1,
        periodo: '2026-05',
        idEmpresa: null,
        estado: 'preliminar',
        fechaGeneracion: '2026-05-10T10:00:00.000Z',
        usuarioGenerador: 'RRHH',
        totalTrabajadores: 1,
        totalHaberes: 900000,
        totalDescuentos: 180000,
        totalLiquido: 720000,
        totalBloqueados: 0,
        totalAdvertencias: 0,
        versionMotor: 'v1',
        hashSnapshot: 'hash-abc',
        origen: 'preliminar',
        activo: true,
        reemplazadoPor: null,
        aprobacionOperativa: null,
        cierreOperativo: null,
        trabajadores: [],
        issues: [],
        trazabilidad: [],
      },
      identificadorResultadoGuardadoActual: 'hash-abc',
      puedeGuardarPreliminar: true,
    });

    expect(vm.estado).toBe('guardado');
    expect(vm.trabajadores).toHaveLength(1);
    expect(vm.acciones.puedeGuardarPreliminar).toBe(true);
  });

  it('bloquea guardado cuando hay issue BLOQUEO', () => {
    const vm = buildResultadoPreliminarView({
      ...inputBase,
      calculo: calculoBase({
        issues: [{
          codigo: 'BLOQ-TEST',
          severidad: 'BLOQUEO',
          mensaje: 'No se puede guardar',
          origen: 'validacion',
          campo: null,
        }],
      }),
    });

    expect(vm.estado).toBe('con_bloqueos');
    expect(vm.bloqueos.length).toBeGreaterThan(0);
    expect(vm.acciones.puedeGuardarPreliminar).toBe(false);
  });
});
