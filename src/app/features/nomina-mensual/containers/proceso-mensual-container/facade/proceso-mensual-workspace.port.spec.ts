import { describe, expect, it } from 'vitest';

import { ProcesoMensualWorkspacePort } from './proceso-mensual-workspace.port';

describe('ProcesoMensualWorkspacePort', () => {
  it('mapea pestaña legacy movimientos a detalle trabajadores con filtro requerido', () => {
    const port = new ProcesoMensualWorkspacePort();

    const filtro = port.seleccionarLegacyTab('movimientos');

    expect(filtro).toBe('con_movimientos');
    expect(port.nominaWorkspaceTab()).toBe('movimientos');
    expect(port.nominaWorkspaceTabVisible()).toBe('detalle_mensual');
    expect(port.nominaDetalleMensualVista()).toBe('trabajadores');
  });

  it('mapea vista liquidaciones al legacy correspondiente', () => {
    const port = new ProcesoMensualWorkspacePort();

    expect(port.seleccionarDetalleMensualVista('liquidaciones')).toBeNull();

    expect(port.nominaWorkspaceTab()).toBe('liquidaciones');
    expect(port.nominaWorkspaceTabVisible()).toBe('detalle_mensual');
    expect(port.nominaDetalleMensualVista()).toBe('trabajadores');
  });

  it('normaliza situacion y pendientes a vista trabajadores', () => {
    const port = new ProcesoMensualWorkspacePort();

    port.seleccionarDetalleMensualVista('todos');
    expect(port.nominaDetalleMensualVista()).toBe('trabajadores');

    port.seleccionarDetalleMensualVista('pendientes');
    expect(port.nominaDetalleMensualVista()).toBe('trabajadores');
  });
});
