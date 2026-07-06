import { describe, expect, it } from 'vitest';

import {
  construirAccionRecomendadaLiquidaciones,
} from './liquidaciones-accion-recomendada.rules';

describe('liquidaciones-accion-recomendada.rules', () => {
  const resumenVacio = {
    pendientesAutorizar: 0,
    autorizadas: 0,
    pagosRegistrados: 0,
    documentosEnviados: 0,
    rectificacionesSolicitadas: 0,
  };

  it('orienta a elegir nómina cuando no hay selección', () => {
    const vm = construirAccionRecomendadaLiquidaciones({
      tieneNominaSeleccionada: false,
      nominasElegiblesCount: 2,
      origenDesdeCierre: false,
      estadoNomina: null,
      calculoVigente: false,
      hayVersionesMaterializadas: false,
      resumenEstados: resumenVacio,
      puedeExportarPrevired: false,
      trabajadoresSinLiquidacion: 0,
    });
    expect(vm?.tipo).toBe('elegir_nomina');
  });

  it('congela acciones cuando la nómina está cerrada', () => {
    const vm = construirAccionRecomendadaLiquidaciones({
      tieneNominaSeleccionada: true,
      nominasElegiblesCount: 1,
      origenDesdeCierre: false,
      estadoNomina: 'cerrada',
      calculoVigente: true,
      hayVersionesMaterializadas: true,
      resumenEstados: { ...resumenVacio, pendientesAutorizar: 3 },
      puedeExportarPrevired: true,
      trabajadoresSinLiquidacion: 0,
    });
    expect(vm?.tipo).toBe('solo_consulta');
    expect(vm?.ejecutable).toBe(false);
  });

  it('prioriza pendientes de autorizar en nómina editable', () => {
    const vm = construirAccionRecomendadaLiquidaciones({
      tieneNominaSeleccionada: true,
      nominasElegiblesCount: 1,
      origenDesdeCierre: false,
      estadoNomina: 'liquidada',
      calculoVigente: true,
      hayVersionesMaterializadas: true,
      resumenEstados: { ...resumenVacio, pendientesAutorizar: 2 },
      puedeExportarPrevired: false,
      trabajadoresSinLiquidacion: 0,
    });
    expect(vm?.tipo).toBe('revisar_pendientes_autorizar');
    expect(vm?.filtroEstadoRevision).toBe('pendiente_autorizar');
  });
});
