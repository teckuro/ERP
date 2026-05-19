import {
  inferirContextoOperativoPeriodo,
} from './proceso-mensual-rehidratacion.rules';
import { describe, expect, it } from 'vitest';
import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualEstadoOperativoInput,
} from './proceso-mensual-estado-operativo.rules';

function inputEstado(overrides: Partial<ProcesoMensualEstadoOperativoInput> = {}): ProcesoMensualEstadoOperativoInput {
  return {
    periodoValido: true,
    tienePrevalidacion: false,
    parametrosOperativos: false,
    bloqueosPrevalidacion: [],
    advertenciasPrevalidacion: [],
    informacionesPrevalidacion: [],
    baseGenerada: false,
    calculoGenerado: false,
    calculoConBloqueos: false,
    calculoConAdvertencias: false,
    bloqueosCalculo: [],
    advertenciasCalculo: [],
    resultadoGuardado: false,
    aprobadoOperativamente: false,
    cerradoOperativamente: false,
    liquidacionesDisponibles: false,
    puedeGenerarBase: false,
    puedeCalcular: false,
    puedeGuardarResultado: false,
    puedeAprobar: false,
    puedeCerrar: false,
    ...overrides,
  };
}

const snapshotMinimo = {
  idCalculoPeriodo: 1,
  periodo: '2026-05',
  idEmpresa: null,
  estado: 'preliminar' as const,
  fechaGeneracion: '2026-05-05T10:00:00.000Z',
  usuarioGenerador: null,
  totalTrabajadores: 3,
  totalHaberes: 0,
  totalDescuentos: 0,
  totalLiquido: 0,
  totalBloqueados: 0,
  totalAdvertencias: 0,
  versionMotor: 'MOTOR',
  hashSnapshot: 'hash',
  origen: 'preliminar' as const,
  activo: true,
  reemplazadoPor: null,
  aprobacionOperativa: null,
  cierreOperativo: null,
  trabajadores: [],
  issues: [],
  trazabilidad: [],
};

describe('proceso-mensual-rehidratacion.rules', () => {
  it('inferirContextoOperativoPeriodo con solo snapshot activa flags operativas', () => {
    const ctx = inferirContextoOperativoPeriodo({
      resultado: null,
      preNomina: null,
      calculo: null,
      snapshot: snapshotMinimo,
    });

    expect(ctx.tienePrevalidacion).toBe(true);
    expect(ctx.baseGenerada).toBe(true);
    expect(ctx.calculoGenerado).toBe(true);
    expect(ctx.resultadoGuardado).toBe(true);
    expect(ctx.trabajadoresAptos).toBe(3);
  });

  it('solo snapshot guardado no queda en pendiente_validacion', () => {
    const ctx = inferirContextoOperativoPeriodo({
      resultado: null,
      preNomina: null,
      calculo: null,
      snapshot: snapshotMinimo,
    });
    const vm = resolverEstadoOperativoProcesoMensual(
      inputEstado({
        tienePrevalidacion: ctx.tienePrevalidacion,
        baseGenerada: ctx.baseGenerada,
        calculoGenerado: ctx.calculoGenerado,
        resultadoGuardado: ctx.resultadoGuardado,
      }),
    );

    expect(vm.estadoClave).toBe('resultado_guardado');
    expect(vm.estadoClave).not.toBe('pendiente_validacion');
  });

  it('snapshot cerrado_operativamente resuelve nomina_cerrada', () => {
    const ctx = inferirContextoOperativoPeriodo({
      resultado: null,
      preNomina: null,
      calculo: null,
      snapshot: {
        ...snapshotMinimo,
        cierreOperativo: {
          estado: 'cerrado_operativamente',
          fecha: '2026-05-06T10:00:00.000Z',
          usuarioId: null,
          usuarioLabel: 'RRHH',
          observacion: null,
          metadata: {},
        },
      },
    });
    const vm = resolverEstadoOperativoProcesoMensual(
      inputEstado({
        tienePrevalidacion: ctx.tienePrevalidacion,
        baseGenerada: ctx.baseGenerada,
        calculoGenerado: ctx.calculoGenerado,
        resultadoGuardado: ctx.resultadoGuardado,
        cerradoOperativamente: true,
      }),
    );

    expect(vm.estadoClave).toBe('nomina_cerrada');
  });

  it('snapshot borrador rehidrata base generada sin resultado guardado', () => {
    const ctx = inferirContextoOperativoPeriodo({
      resultado: null,
      preNomina: null,
      calculo: null,
      snapshot: {
        ...snapshotMinimo,
        estado: 'borrador',
      },
    });

    expect(ctx.tienePrevalidacion).toBe(true);
    expect(ctx.baseGenerada).toBe(true);
    expect(ctx.calculoGenerado).toBe(false);
    expect(ctx.resultadoGuardado).toBe(false);
  });

  it('snapshot borrador resuelve base_lista al reingresar', () => {
    const ctx = inferirContextoOperativoPeriodo({
      resultado: null,
      preNomina: null,
      calculo: null,
      snapshot: {
        ...snapshotMinimo,
        estado: 'borrador',
      },
    });
    const vm = resolverEstadoOperativoProcesoMensual(
      inputEstado({
        tienePrevalidacion: ctx.tienePrevalidacion,
        baseGenerada: ctx.baseGenerada,
        calculoGenerado: ctx.calculoGenerado,
        resultadoGuardado: ctx.resultadoGuardado,
        puedeCalcular: true,
      }),
    );

    expect(vm.estadoClave).toBe('base_lista');
    expect(vm.accionPrincipal.label).toBe('Revisar trabajadores');
  });

  it('sin snapshot mantiene pendiente_validacion', () => {
    const ctx = inferirContextoOperativoPeriodo({
      resultado: null,
      preNomina: null,
      calculo: null,
      snapshot: null,
    });
    const vm = resolverEstadoOperativoProcesoMensual(
      inputEstado({
        tienePrevalidacion: ctx.tienePrevalidacion,
        baseGenerada: ctx.baseGenerada,
        calculoGenerado: ctx.calculoGenerado,
        resultadoGuardado: ctx.resultadoGuardado,
      }),
    );

    expect(vm.estadoClave).toBe('pendiente_validacion');
  });
});
