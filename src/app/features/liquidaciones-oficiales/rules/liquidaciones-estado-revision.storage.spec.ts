import { afterEach, describe, expect, it } from 'vitest';

import {
  fusionarEstadosRevisionLiquidacion,
  guardarEstadoRevisionLiquidacion,
  leerEstadosRevisionLiquidacion,
  limpiarEstadosRevisionLiquidacion,
} from './liquidaciones-estado-revision.storage';

const STORAGE_KEY = 'liq-estado-revision-v1';

describe('liquidaciones-estado-revision.storage', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('guarda y lee estados por versión de liquidación', () => {
    guardarEstadoRevisionLiquidacion(10, 5, 'autorizada');
    guardarEstadoRevisionLiquidacion(10, 6, 'pago_registrado');

    expect(leerEstadosRevisionLiquidacion(10)).toEqual({
      5: 'autorizada',
      6: 'pago_registrado',
    });
    expect(leerEstadosRevisionLiquidacion(99)).toEqual({});
  });

  it('fusiona estados locales solo si el inicial sigue pendiente', () => {
    guardarEstadoRevisionLiquidacion(1, 1, 'documento_enviado');

    const fusionados = fusionarEstadosRevisionLiquidacion(1, {
      1: 'pendiente_autorizar',
      2: 'autorizada',
    });

    expect(fusionados).toEqual({
      1: 'documento_enviado',
      2: 'autorizada',
    });
  });

  it('limpia estados de una versión', () => {
    guardarEstadoRevisionLiquidacion(3, 1, 'autorizada');
    limpiarEstadosRevisionLiquidacion(3);
    expect(leerEstadosRevisionLiquidacion(3)).toEqual({});
  });
});
