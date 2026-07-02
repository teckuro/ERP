import { describe, expect, it } from 'vitest';

import {
  opcionesTipoNominaCreacion,
  tipoNominaPermitido,
  tipoNominaRequiereCorte,
} from './nomina-tipos-creacion.rules';

describe('nomina-tipos-creacion.rules', () => {
  it('solo mensual cuando los gates están apagados', () => {
    const opciones = opcionesTipoNominaCreacion({ anticipos: false, extraordinaria: false });
    expect(opciones.map((o) => o.id)).toEqual(['mensual']);
  });

  it('expone anticipos y extraordinaria según gates', () => {
    const opciones = opcionesTipoNominaCreacion({ anticipos: true, extraordinaria: true });
    expect(opciones.map((o) => o.id)).toEqual(['mensual', 'quincenal', 'semanal', 'extraordinaria']);
  });

  it('tipoNominaRequiereCorte solo para quincenal y semanal', () => {
    expect(tipoNominaRequiereCorte('quincenal')).toBe(true);
    expect(tipoNominaRequiereCorte('semanal')).toBe(true);
    expect(tipoNominaRequiereCorte('mensual')).toBe(false);
  });

  it('tipoNominaPermitido valida contra gates', () => {
    const gates = { anticipos: true, extraordinaria: false };
    expect(tipoNominaPermitido('quincenal', gates)).toBe(true);
    expect(tipoNominaPermitido('extraordinaria', gates)).toBe(false);
  });
});
