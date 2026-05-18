import { describe, expect, it } from 'vitest';

import {
  DETALLE_REVISION_MODAL_TITULO,
  buildDetalleRevisionFooterAccion,
  buildDetalleRevisionModalLead,
} from './proceso-mensual-detalle-modal.rules';

describe('proceso-mensual-detalle-modal.rules', () => {
  it('titulo fijo de revision', () => {
    expect(DETALLE_REVISION_MODAL_TITULO).toBe('Revisión de nómina mensual');
  });

  it('lead combina periodo y estado', () => {
    expect(
      buildDetalleRevisionModalLead({ periodoEtiqueta: 'Mayo 2026', estadoTitulo: 'Sin generar' }),
    ).toContain('Mayo 2026');
    expect(
      buildDetalleRevisionModalLead({ periodoEtiqueta: 'Mayo 2026', estadoTitulo: 'Sin generar' }),
    ).toContain('Sin generar');
  });

  it('footer contextual por tab sin CTA global', () => {
    expect(buildDetalleRevisionFooterAccion('resumen')).toEqual({
      kind: 'tab',
      label: 'Ver trabajadores',
      tab: 'trabajadores',
    });
    expect(buildDetalleRevisionFooterAccion('trabajadores')).toEqual({
      kind: 'cerrar',
      label: 'Volver a la consola',
    });
    expect(buildDetalleRevisionFooterAccion('parametros').kind).toBe('ruta');
  });
});
