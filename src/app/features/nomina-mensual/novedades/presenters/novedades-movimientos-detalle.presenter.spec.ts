import { describe, expect, it } from 'vitest';

import {
  mensajeDetalleMovimiento,
  seccionesDetalleMovimiento,
  tituloDetalleMovimiento,
} from './novedades-movimientos-detalle.presenter';

describe('novedades-movimientos-detalle.presenter', () => {
  const base = {
    trabajador: 'Ana Pérez',
    rut: '11.111.111-1',
    periodoEtiqueta: '05/2026',
    ambito: 'mensual' as const,
    concepto: 'Bono puntual (BONO)',
    tipo: 'Haber puntual',
    monto: '$80.000',
    vigencia: '01/05/2026',
    estadoEtiqueta: 'Borrador',
    detalle: 'Sin fecha',
    origen: 'Manual',
    observacion: 'Anticipo acordado',
  };

  it('arma titulo y mensaje legibles', () => {
    expect(tituloDetalleMovimiento('mensual')).toBe('Detalle del movimiento del mes');
    expect(mensajeDetalleMovimiento(base)).toBe('Ana Pérez · Bono puntual (BONO)');
  });

  it('incluye observacion y origen en secciones', () => {
    const secciones = seccionesDetalleMovimiento(base);
    expect(secciones.some((s) => s.title === 'Observación')).toBe(true);
    expect(secciones.some((s) => s.title === 'Origen')).toBe(true);
  });
});
