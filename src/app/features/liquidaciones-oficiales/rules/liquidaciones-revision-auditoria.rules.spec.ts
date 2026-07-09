import { describe, expect, it } from 'vitest';

import { buildMetadataRevisionDesdeAccion } from './liquidaciones-revision-auditoria.rules';

describe('buildMetadataRevisionDesdeAccion', () => {
  const usuario = { id: 'user-1', nombre: 'María González Rojas' };
  const fecha = '2026-07-09T12:00:00.000Z';

  it('arma bloque de autorización con autorizadoPor', () => {
    const meta = buildMetadataRevisionDesdeAccion('autorizar', usuario, fecha);
    expect(meta['autorizadoPor']).toBe('María González Rojas');
    expect(meta['autorizacion']).toEqual({
      usuarioId: 'user-1',
      usuarioNombre: 'María González Rojas',
      registradoEn: fecha,
    });
  });

  it('arma bloque de pago registrado', () => {
    const meta = buildMetadataRevisionDesdeAccion('registrar_pago', usuario, fecha);
    expect(meta['pago']).toEqual({
      usuarioId: 'user-1',
      usuarioNombre: 'María González Rojas',
      registradoEn: fecha,
    });
  });

  it('arma bloque de entrega de documento', () => {
    const meta = buildMetadataRevisionDesdeAccion('enviar_documento', usuario, fecha);
    expect(meta['documentoEntrega']).toBeTruthy();
  });

  it('arma bloque de rectificación solicitada', () => {
    const meta = buildMetadataRevisionDesdeAccion('solicitar_rectificacion', usuario, fecha);
    expect(meta['rectificacionSolicitada']).toBeTruthy();
  });
});
