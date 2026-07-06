import { describe, expect, it } from 'vitest';

import {
  buildLiquidacionAccionUiView,
  estadoInicialLiquidacionUi,
  inicializarEstadosLiquidacionUi,
  resumirEstadosLiquidacionUi,
  siguienteEstadoLiquidacionUi,
} from './liquidaciones-acciones-ui.rules';
import type { LiquidacionTrabajador } from '../models/liquidacion-oficial.model';

describe('liquidaciones-acciones-ui.rules', () => {
  it('deriva toda liquidación generada como pendiente de autorizar', () => {
    expect(estadoInicialLiquidacionUi({ estado: 'generada' })).toBe('pendiente_autorizar');
  });

  it('avanza el estado por trabajador en orden', () => {
    const autorizada = siguienteEstadoLiquidacionUi('pendiente_autorizar', 'autorizar');
    const pagada = siguienteEstadoLiquidacionUi(autorizada, 'registrar_pago');
    const enviada = siguienteEstadoLiquidacionUi(pagada, 'enviar_documento');

    expect(autorizada).toBe('autorizada');
    expect(pagada).toBe('pago_registrado');
    expect(enviada).toBe('documento_enviado');
  });

  it('marca rectificación solicitada desde cualquier estado avanzado', () => {
    expect(siguienteEstadoLiquidacionUi('autorizada', 'solicitar_rectificacion')).toBe('rectificacion_solicitada');
    expect(siguienteEstadoLiquidacionUi('documento_enviado', 'solicitar_rectificacion')).toBe(
      'rectificacion_solicitada',
    );
  });

  it('ignora acciones fuera de secuencia', () => {
    expect(siguienteEstadoLiquidacionUi('pendiente_autorizar', 'registrar_pago')).toBe('pendiente_autorizar');
    expect(siguienteEstadoLiquidacionUi('documento_enviado', 'enviar_documento')).toBe('documento_enviado');
  });

  it('expone acciones y PDF habilitado para la grilla', () => {
    const pendiente = buildLiquidacionAccionUiView('pendiente_autorizar');
    const enviada = buildLiquidacionAccionUiView('documento_enviado');

    expect(pendiente.primaryAction?.tipo).toBe('autorizar');
    expect(pendiente.pdfDisabled).toBe(false);
    expect(pendiente.pdfLabel).toBe('Ver e imprimir');
    expect(enviada.primaryAction).toBeNull();
    expect(enviada.secondaryActions.map((a) => a.tipo)).toEqual(['solicitar_rectificacion']);
  });

  it('oculta transiciones en solo lectura', () => {
    const view = buildLiquidacionAccionUiView('pendiente_autorizar', { soloLectura: true });
    expect(view.primaryAction).toBeNull();
    expect(view.secondaryActions).toEqual([]);
    expect(view.pdfLabel).toBe('Ver e imprimir');
  });

  it('respeta estadoRevision persistido en metadata o en el trabajador', () => {
    expect(
      estadoInicialLiquidacionUi({
        estado: 'generada',
        estadoRevision: 'pago_registrado',
        metadata: {},
      }),
    ).toBe('pago_registrado');
    expect(
      estadoInicialLiquidacionUi({
        estado: 'generada',
        metadata: { estadoRevision: 'autorizada' },
      }),
    ).toBe('autorizada');
  });

  it('inicializa y resume estados por trabajador', () => {
    const trabajadores = [
      trabajador(1),
      trabajador(2),
    ];
    const estados = inicializarEstadosLiquidacionUi(trabajadores);
    const resumen = resumirEstadosLiquidacionUi({
      ...estados,
      2: 'documento_enviado',
      3: 'rectificacion_solicitada',
    });

    expect(estados).toEqual({ 1: 'pendiente_autorizar', 2: 'pendiente_autorizar' });
    expect(resumen).toMatchObject({
      pendientesAutorizar: 1,
      documentosEnviados: 1,
      rectificacionesSolicitadas: 1,
    });
  });
});

function trabajador(id: number): LiquidacionTrabajador {
  return {
    idLiquidacionTrabajador: id,
    idPersona: id,
    idContrato: null,
    rut: null,
    nombreTrabajador: `Trabajador ${id}`,
    cargo: null,
    centroCosto: null,
    fechaIngreso: null,
    diasTrabajados: null,
    baseImponible: 0,
    baseTributable: 0,
    totalHaberes: 0,
    totalDescuentos: 0,
    totalAportesEmpleadorReferencia: 0,
    liquidoPagar: 0,
    estado: 'generada',
    observaciones: [],
    metadata: {},
  };
}
