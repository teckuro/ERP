import { describe, expect, it, vi } from 'vitest';

import type { AccionCorreccionVm } from '../../../rules/proceso-mensual-correccion.rules';
import {
  aplicarFlowQueryNominaMensual,
  ejecutarAccionCorreccionDesdeModalEnPort,
  ejecutarAccionCorreccionEnPort,
  mapDetalleVistaALegacyTab,
  type ProcesoMensualCorreccionNavegacionPort,
} from './proceso-mensual-navegacion';

function portMock(over: Partial<ProcesoMensualCorreccionNavegacionPort> = {}): ProcesoMensualCorreccionNavegacionPort {
  return {
    periodoYmActivo: () => '2026-05',
    periodoSeleccionadoYm: () => '2026-05',
    setPeriodoYm: vi.fn(),
    rehidratarPeriodoActivo: vi.fn(),
    limpiarFlowQueryEnRuta: vi.fn(),
    cerrarDetalleOperativo: vi.fn(),
    abrirTrabajadorEnDetalle: vi.fn(),
    aplicarDestinoWorkspace: vi.fn(),
    seleccionarTrabajadorNominaMasiva: vi.fn(),
    abrirInformacionParametrosPeriodo: vi.fn(),
    abrirDetalleOperativo: vi.fn(),
    navegarExterna: vi.fn(),
    ...over,
  };
}

describe('proceso-mensual-navegacion', () => {
  it('mapDetalleVistaALegacyTab alinea movimientos', () => {
    expect(mapDetalleVistaALegacyTab('movimientos')).toBe('movimientos');
    expect(mapDetalleVistaALegacyTab('pendientes')).toBe('parametros');
  });

  it('ejecutarAccionCorreccionEnPort ruta cierra modal y navega con periodo', () => {
    const navegarExterna = vi.fn();
    const cerrarDetalleOperativo = vi.fn();
    const port = portMock({ navegarExterna, cerrarDetalleOperativo });
    const accion: AccionCorreccionVm = {
      label: 'Revisar movimiento',
      kind: 'ruta',
      ruta: '/remuneraciones/novedades-mensuales',
      idPersona: 7,
    };

    ejecutarAccionCorreccionEnPort(port, accion);

    expect(cerrarDetalleOperativo).toHaveBeenCalled();
    expect(navegarExterna).toHaveBeenCalledWith(
      expect.stringContaining('periodo=2026-05'),
    );
    expect(navegarExterna).toHaveBeenCalledWith(
      expect.stringContaining('idPersona=7'),
    );
  });

  it('ejecutarAccionCorreccionDesdeModalEnPort tab trabajadores cierra modal y abre panel', () => {
    const cerrarDetalleOperativo = vi.fn();
    const aplicarDestinoWorkspace = vi.fn();
    const port = portMock({ cerrarDetalleOperativo, aplicarDestinoWorkspace });

    ejecutarAccionCorreccionDesdeModalEnPort(port, {
      accionTab: 'trabajadores',
      label: 'Ir al detalle del período',
    });

    expect(cerrarDetalleOperativo).toHaveBeenCalled();
    expect(aplicarDestinoWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ detalleVista: 'trabajadores' }),
    );
  });

  it('ejecutarAccionCorreccionDesdeModalEnPort resumen no cierra modal', () => {
    const cerrarDetalleOperativo = vi.fn();
    const abrirDetalleOperativo = vi.fn();
    const port = portMock({ cerrarDetalleOperativo, abrirDetalleOperativo });

    ejecutarAccionCorreccionDesdeModalEnPort(port, {
      accionTab: 'resumen',
      label: 'Ver resumen',
    });

    expect(cerrarDetalleOperativo).not.toHaveBeenCalled();
    expect(abrirDetalleOperativo).toHaveBeenCalledWith('resumen');
  });

  it('aplicarFlowQueryNominaMensual rehidrata y preselecciona trabajador', () => {
    const rehidratarPeriodoActivo = vi.fn();
    const abrirTrabajadorEnDetalle = vi.fn();
    const limpiarFlowQueryEnRuta = vi.fn();
    const port = portMock({
      rehidratarPeriodoActivo,
      abrirTrabajadorEnDetalle,
      limpiarFlowQueryEnRuta,
    });

    aplicarFlowQueryNominaMensual(
      {
        periodo: '2026-06',
        returnTo: '/remuneraciones/proceso-mensual',
        idPersona: '42',
      },
      port,
    );

    expect(rehidratarPeriodoActivo).toHaveBeenCalledWith('2026-06');
    expect(abrirTrabajadorEnDetalle).toHaveBeenCalledWith(42);
    expect(limpiarFlowQueryEnRuta).toHaveBeenCalled();
  });
});
