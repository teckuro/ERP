import { describe, expect, it } from 'vitest';

import {
  ayudaAvanceParametrosConBase,
  evaluarIntentoRecargaBase,
  resolverAccionPrincipalShellParametros,
  resolverPermisosRecargaBase,
} from './nomina-parametros-base-acceso.rules';

describe('nomina-parametros-base-acceso.rules', () => {
  it('permite recarga solo a admin', () => {
    expect(resolverPermisosRecargaBase(true).puedeRecargarBase).toBe(true);
    expect(resolverPermisosRecargaBase(false).puedeActualizarBaseEnDiferencias).toBe(false);
  });

  it('usa Preparar nómina sin base y Continuar a alcance con base', () => {
    expect(
      resolverAccionPrincipalShellParametros({
        hayBaseGuardada: false,
        validando: false,
        loading: false,
      }).label,
    ).toBe('Preparar nómina');
    expect(
      resolverAccionPrincipalShellParametros({
        hayBaseGuardada: true,
        validando: false,
        loading: false,
      }).label,
    ).toBe('Continuar a alcance');
  });

  it('evalúa bloqueo de recarga para no admin con base', () => {
    const result = evaluarIntentoRecargaBase({
      hayBaseGuardada: true,
      esAdmin: false,
      periodoEtiqueta: 'Mayo 2026',
    });
    expect(result).toEqual({ accion: 'bloquear', modal: { tipo: 'sinPermiso' } });
  });

  it('evalúa confirmación de recarga para admin con base', () => {
    const result = evaluarIntentoRecargaBase({
      hayBaseGuardada: true,
      esAdmin: true,
      periodoEtiqueta: 'Mayo 2026',
    });
    expect(result).toEqual({
      accion: 'confirmar',
      modal: { tipo: 'confirmarRecargaBase', periodoEtiqueta: 'Mayo 2026' },
    });
  });

  it('permite recarga sin base guardada', () => {
    expect(
      evaluarIntentoRecargaBase({
        hayBaseGuardada: false,
        esAdmin: false,
        periodoEtiqueta: 'Mayo 2026',
      }).accion,
    ).toBe('permitir');
  });

  it('ayuda con base preparada orienta a continuar', () => {
    expect(ayudaAvanceParametrosConBase({ esAdmin: false, hayDiferencias: false })).toContain(
      'Continuar a alcance',
    );
  });
});
