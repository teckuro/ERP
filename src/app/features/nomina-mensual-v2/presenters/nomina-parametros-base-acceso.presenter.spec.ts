import { describe, expect, it } from 'vitest';

import { construirVistaModalAccesoBase } from './nomina-parametros-base-acceso.presenter';

describe('nomina-parametros-base-acceso.presenter', () => {
  it('arma vista blocked para sin permiso', () => {
    const vista = construirVistaModalAccesoBase({ tipo: 'sinPermiso' });
    expect(vista.variant).toBe('blocked');
    expect(vista.primaryLabel).toBe('Entendido');
    expect(vista.secondaryLabel).toBeUndefined();
  });

  it('arma vista decision para confirmar recarga', () => {
    const vista = construirVistaModalAccesoBase({
      tipo: 'confirmarRecargaBase',
      periodoEtiqueta: 'Mayo 2026',
    });
    expect(vista.variant).toBe('decision');
    expect(vista.title).toContain('Mayo 2026');
    expect(vista.secondaryLabel).toBe('Cancelar');
  });
});
