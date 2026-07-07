import { describe, expect, it } from 'vitest';

import { presentarEstadoPeriodoNovedades } from './novedades-periodo-estado.presenter';

describe('presentarEstadoPeriodoNovedades', () => {
  it('prioriza revisar pendientes cuando hay trabajadores por revisar', () => {
    const presentacion = presentarEstadoPeriodoNovedades({
      periodoEtiqueta: '05/2026',
      totalTrabajadores: 4,
      conMovimientos: 2,
      conRecurrentes: 1,
      porRevisar: 2,
      listosNomina: 1,
      desdeFlowNomina: false,
    });

    expect(presentacion.accionRecomendada.tipo).toBe('revisar_pendientes');
    expect(presentacion.accionRecomendada.etiqueta).toBe('Revisar pendientes');
    expect(presentacion.linea).toContain('2 revisiones pendientes');
  });

  it('describe periodo vacio sin pedir actualizar manualmente', () => {
    const presentacion = presentarEstadoPeriodoNovedades({
      periodoEtiqueta: '05/2026',
      totalTrabajadores: 3,
      conMovimientos: 0,
      conRecurrentes: 0,
      porRevisar: 0,
      listosNomina: 0,
      desdeFlowNomina: false,
    });

    expect(presentacion.accionRecomendada.tipo).toBeNull();
    expect(presentacion.linea).toContain('Sin movimientos registrados');
  });

  it('muestra banner cuando entra desde flow de nomina', () => {
    const presentacion = presentarEstadoPeriodoNovedades({
      periodoEtiqueta: '05/2026',
      totalTrabajadores: 1,
      conMovimientos: 1,
      conRecurrentes: 0,
      porRevisar: 0,
      listosNomina: 1,
      desdeFlowNomina: true,
    });

    expect(presentacion.bannerFlowNomina).toContain('antes de continuar la nómina');
  });
});
