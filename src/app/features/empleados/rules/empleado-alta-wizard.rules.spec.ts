import { describe, expect, it } from 'vitest';

import {
  calcularPorcentajeProgresoAsistenteAlta,
  esPrimerPasoAsistenteAlta,
  esUltimoPasoAsistenteAlta,
  estaPasoAsistenteAltaEnRango,
  resolverPasoSiguienteAsistenteAlta,
  resolverPasoAnteriorAsistenteAlta,
} from './empleado-alta-wizard.rules';

describe('empleado-alta-wizard.rules', () => {
  const sequence = [0, 1, 2, 3, 7, 9] as const;

  it('resuelve paso anterior en secuencia lineal', () => {
    expect(resolverPasoAnteriorAsistenteAlta(sequence, 7)).toBe(3);
    expect(resolverPasoAnteriorAsistenteAlta(sequence, 0)).toBeNull();
  });

  it('resuelve paso anterior cuando el paso activo fue omitido', () => {
    expect(resolverPasoAnteriorAsistenteAlta(sequence, 6)).toBe(3);
  });

  it('resuelve paso siguiente en secuencia lineal', () => {
    expect(resolverPasoSiguienteAsistenteAlta(sequence, 3)).toBe(7);
    expect(resolverPasoSiguienteAsistenteAlta(sequence, 9)).toBeNull();
  });

  it('resuelve paso siguiente cuando el paso activo fue omitido', () => {
    expect(resolverPasoSiguienteAsistenteAlta(sequence, 6)).toBe(7);
  });

  it('calcula bordes y progreso', () => {
    expect(esPrimerPasoAsistenteAlta(sequence, 0)).toBe(true);
    expect(esUltimoPasoAsistenteAlta(sequence, 9)).toBe(true);
    expect(calcularPorcentajeProgresoAsistenteAlta(4, 10)).toBe(50);
    expect(estaPasoAsistenteAltaEnRango(9, 10)).toBe(true);
    expect(estaPasoAsistenteAltaEnRango(10, 10)).toBe(false);
  });
});
