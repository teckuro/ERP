import { describe, expect, it } from 'vitest';

import type { NominaCalculoParametroSnapshot } from '../../nomina-mensual/models/proceso-mensual.model';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import type { EstadoBaseParametrosPeriodoView } from '../models/nomina-parametros-base.models';
import {
  compararParametrosCongelados,
  resolverOrigenTrasAccionDiferencias,
  resolverRamaAccionPreparacion,
} from './nomina-parametros-base-comparacion.rules';

function resumenMinimo(overrides: Partial<NominaParametrosResumen> = {}): NominaParametrosResumen {
  return {
    periodo: '2026-05',
    completitud: 100,
    completitudSecciones: 100,
    seccionesTotales: 5,
    seccionesListas: 5,
    controlesTotales: 10,
    controlesVerificados: 10,
    totalParametros: 10,
    parametrosConfigurados: 10,
    bloqueos: 0,
    requiereRevision: 0,
    completos: 10,
    puedeContinuar: true,
    ultimaActualizacion: '2026-05-29T12:00:00.000Z',
    areas: [],
    bloqueosActuales: [],
    accesos: [],
    ...overrides,
  };
}

function parametro(clave: string, valor: string): NominaCalculoParametroSnapshot {
  return {
    grupo: 'parametros_generales',
    clave,
    valor,
    valorNumerico: null,
    vigencia: '2026-05-01',
    origen: 'parametros_generales',
  };
}

describe('nomina-parametros-base-comparacion.rules', () => {
  it('resuelve guardar cuando no existe base', () => {
    const resumen = resumenMinimo();
    const estado: EstadoBaseParametrosPeriodoView = {
      estado: 'pendiente',
      idCalculoPeriodoBase: null,
      fechaBaseGuardada: null,
      comparacion: null,
    };
    expect(resolverRamaAccionPreparacion({ resumen, estadoBase: estado })).toEqual({
      tipo: 'guardar',
      resumen,
    });
  });

  it('resuelve continuar sin re-guardar cuando no hay diferencias', () => {
    const resumen = resumenMinimo();
    const estado: EstadoBaseParametrosPeriodoView = {
      estado: 'guardado',
      idCalculoPeriodoBase: 42,
      fechaBaseGuardada: '2026-05-29T10:00:00.000Z',
      comparacion: { hayDiferencias: false, diferencias: [], hashBase: 'a', hashActual: 'a' },
    };
    expect(resolverRamaAccionPreparacion({ resumen, estadoBase: estado })).toEqual({
      tipo: 'continuar',
      origen: 'existenteSinDiferencias',
      idCalculoPeriodoBase: 42,
    });
  });

  it('resuelve diferencias cuando la base no coincide', () => {
    const resumen = resumenMinimo();
    const diferencias = [
      {
        grupo: 'parametros_generales',
        clave: 'uf',
        etiqueta: 'Uf',
        valorBase: '39000',
        valorActual: '39100',
        severidad: 'critica' as const,
      },
    ];
    const estado: EstadoBaseParametrosPeriodoView = {
      estado: 'conDiferencias',
      idCalculoPeriodoBase: 7,
      fechaBaseGuardada: '2026-05-29T10:00:00.000Z',
      comparacion: { hayDiferencias: true, diferencias, hashBase: 'a', hashActual: 'b' },
    };
    expect(resolverRamaAccionPreparacion({ resumen, estadoBase: estado })).toEqual({
      tipo: 'diferencias',
      resumen,
      idCalculoPeriodoBase: 7,
      diferencias,
    });
  });

  it('no bloquea preparar por validación del resumen (V10.1)', () => {
    const resumen = resumenMinimo({ bloqueos: 2, puedeContinuar: false, requiereRevision: 3 });
    const estado: EstadoBaseParametrosPeriodoView = {
      estado: 'pendiente',
      idCalculoPeriodoBase: null,
      fechaBaseGuardada: null,
      comparacion: null,
    };
    expect(resolverRamaAccionPreparacion({ resumen, estadoBase: estado })).toEqual({
      tipo: 'guardar',
      resumen,
    });
  });

  it('detecta diferencias campo a campo', () => {
    const base = [parametro('uf', '39000'), parametro('utm', '65000')];
    const actual = [parametro('uf', '39100'), parametro('utm', '65000')];
    const result = compararParametrosCongelados(base, actual);
    expect(result.hayDiferencias).toBe(true);
    expect(result.diferencias).toHaveLength(1);
    expect(result.diferencias[0]?.clave).toBe('uf');
  });

  it('mapea origen tras acción de diferencias', () => {
    expect(resolverOrigenTrasAccionDiferencias('mantener')).toBe('existenteMantenidaConDiferencias');
    expect(resolverOrigenTrasAccionDiferencias('actualizar')).toBe('actualizadaExplicitamente');
  });
});
