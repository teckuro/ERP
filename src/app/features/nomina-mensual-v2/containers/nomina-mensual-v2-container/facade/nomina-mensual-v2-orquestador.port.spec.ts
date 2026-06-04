import { describe, expect, it } from 'vitest';

import { NominaMensualV2OrquestadorPort } from './nomina-mensual-v2-orquestador.port';

describe('NominaMensualV2OrquestadorPort', () => {
  it('mantiene la accion actual cuando se limpia una accion anterior', () => {
    const orquestador = new NominaMensualV2OrquestadorPort();
    const llamadas: string[] = [];

    const limpiarAnterior = orquestador.registrarAccionPrincipal(() => llamadas.push('anterior'));
    orquestador.registrarAccionPrincipal(() => llamadas.push('actual'));

    limpiarAnterior();
    orquestador.ejecutarAccionPrincipal();

    expect(llamadas).toEqual(['actual']);
  });

  it('limpia la accion actual con el disposer que corresponde', () => {
    const orquestador = new NominaMensualV2OrquestadorPort();
    const llamadas: string[] = [];

    const limpiarActual = orquestador.registrarAccionPrincipal(() => llamadas.push('actual'));

    limpiarActual();
    orquestador.ejecutarAccionPrincipal();

    expect(llamadas).toEqual([]);
  });

  it('reinicia el estado dependiente del periodo al cambiar mes o anio', () => {
    const orquestador = new NominaMensualV2OrquestadorPort();

    orquestador.modalAvanceParametros.set({ tipo: 'revision', destinoPaso: 'dotacion' });
    orquestador.resultadoAlcance.set({
      tipo: 'empresaCompleta',
      descripcion: 'Empresa completa',
      estado: 'listo',
      centrosCostoSeleccionados: [],
      idsTrabajadoresManuales: [],
      idsTrabajadoresIncluidos: ['1'],
      resumen: {
        totalTrabajadores: 1,
        trabajadoresIncluidos: 1,
        trabajadoresExcluidos: 0,
        trabajadoresBloqueados: 0,
        trabajadoresConAdvertencias: 0,
      },
    });
    orquestador.estadoParametrosBase.set({
      estado: 'guardado',
      idCalculoPeriodoBase: 10,
      fechaBaseGuardada: '2026-05-01T10:00:00.000Z',
      comparacion: null,
    });
    orquestador.registrarEventoTrazabilidad({
      idEvento: 'evt-1',
      periodo: '2026-05',
      paso: 'parameters',
      tipoEvento: 'PARAMETROS_VALIDADOS',
      usuarioId: null,
      usuarioNombre: 'RRHH',
      fechaEvento: '2026-05-01T10:00:00.000Z',
      descripcion: 'Periodo anterior',
      integridad: { estadoIntegridad: 'registrado' },
      origen: 'local',
    });

    orquestador.reiniciarPorCambioPeriodo('2026-06');

    expect(orquestador.modalAvanceParametros()).toBeNull();
    expect(orquestador.resultadoAlcance()).toBeNull();
    expect(orquestador.estadoParametrosBase()).toBeNull();
    expect(orquestador.origenBaseParametrosAlAvanzar()).toBeNull();
    expect(orquestador.eventosTrazabilidad()).toEqual([]);
    expect(orquestador.contextoTrazabilidad()).toEqual({ periodo: '2026-06' });
  });

  it('no vacia trazabilidad al reiniciar el mismo periodo', () => {
    const orquestador = new NominaMensualV2OrquestadorPort();
    orquestador.actualizarContextoTrazabilidad({
      periodo: '2026-06',
      parametrosResumen: {
        seccionesListas: 1,
        seccionesTotal: 2,
        controlesVerificados: 1,
        bloqueos: 0,
        advertencias: 0,
      },
    });
    orquestador.eventosTrazabilidad.set([
      {
        idEvento: 'evt-1',
        periodo: '2026-06',
        paso: 'parameters',
        tipoEvento: 'PARAMETROS_CONGELADOS',
        usuarioId: null,
        usuarioNombre: 'RRHH',
        fechaEvento: '2026-06-01T10:00:00.000Z',
        descripcion: 'Base guardada',
        integridad: { estadoIntegridad: 'registrado' },
        origen: 'servidor',
      },
    ]);

    orquestador.reiniciarPorCambioPeriodo('2026-06');

    expect(orquestador.eventosTrazabilidad()).toHaveLength(1);
    expect(orquestador.contextoTrazabilidad()?.parametrosResumen?.seccionesListas).toBe(1);
  });
});
