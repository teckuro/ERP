import { describe, expect, it } from 'vitest';

import {
  estadoNominaBloqueaEdicion,
  exigirTransicionNomina,
  nominaRequiereAccion,
  puedeTransicionarNomina,
  proximoPasoNomina,
} from './nomina-periodo-state.rules';

describe('nomina-periodo-state.rules', () => {
  it('acepta el ciclo operativo completo', () => {
    const ciclo = [
      ['borrador', 'dotacion_generada'],
      ['dotacion_generada', 'en_revision'],
      ['en_revision', 'calculada'],
      ['calculada', 'validada'],
      ['validada', 'aprobada'],
      ['aprobada', 'cerrada'],
      ['cerrada', 'reabierta'],
    ] as const;
    for (const [origen, destino] of ciclo) {
      expect(puedeTransicionarNomina(origen, destino)).toBe(true);
    }
  });

  it('rechaza saltos que omiten evidencia', () => {
    expect(() => exigirTransicionNomina('borrador', 'cerrada')).toThrow(/no permitida/i);
    expect(puedeTransicionarNomina('anulada', 'borrador')).toBe(false);
  });

  it('bloquea edición en cerrada y anulada', () => {
    expect(estadoNominaBloqueaEdicion('cerrada')).toBe(true);
    expect(estadoNominaBloqueaEdicion('anulada')).toBe(true);
    expect(estadoNominaBloqueaEdicion('en_revision')).toBe(false);
  });

  it('expone siguiente paso y requerimiento de acción', () => {
    expect(proximoPasoNomina('calculada')).toBe('validacion');
    expect(proximoPasoNomina('cerrada')).toBe('liquidaciones');
    expect(nominaRequiereAccion('reabierta')).toBe(true);
    expect(nominaRequiereAccion('cerrada')).toBe(false);
  });
});
