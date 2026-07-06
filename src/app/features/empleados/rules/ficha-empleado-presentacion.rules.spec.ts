import { describe, expect, it } from 'vitest';

import type { EvaluacionCompletitudEmpleado } from '../utils/empleado-completitud.rules';
import {
  buildExpedienteNavItems,
  buildFaltantesCriticosDedup,
  buildFichaEstadoPanelVm,
  buildFichaOperativeProgress,
  buildMotivoPrincipal,
  buildVisorEstadoFicha,
  TOTAL_BLOQUES_OPERATIVOS_FICHA,
  mapearEstadoTabAEstadoNavegacion,
  resolveAccionPrincipalTab,
  tabDesdeSeccion,
  type EstadoTabFichaEmpleado,
  type ClaveTabFichaEmpleado,
} from './ficha-empleado-presentacion.rules';

function evaluacionMock(
  override: Partial<EvaluacionCompletitudEmpleado> = {},
): EvaluacionCompletitudEmpleado {
  return {
    estadoFicha: 'INCOMPLETO',
    aptoParaRemuneraciones: false,
    bloqueos: [],
    advertencias: [],
    defaultsTecnicosDetectados: [],
    seccionesPendientes: [],
    ...override,
  };
}

describe('ficha-empleado-presentacion.rules', () => {
  it('mapea tab activo a en-curso en el rail', () => {
    expect(mapearEstadoTabAEstadoNavegacion('warning', true)).toBe('en-curso');
    expect(mapearEstadoTabAEstadoNavegacion('complete', false)).toBe('listo');
    expect(mapearEstadoTabAEstadoNavegacion('blocking', false)).toBe('critico');
  });

  it('deduplica faltantes por bloque y mensaje', () => {
    const evaluacion = evaluacionMock({
      bloqueos: [
        'Reemplaza la cuenta bancaria temporal.',
        'Reemplaza la cuenta bancaria temporal.',
        'Ingresa sueldo base válido.',
      ],
      seccionesPendientes: ['pago', 'remuneracion', 'pago'],
    });

    const faltantes = buildFaltantesCriticosDedup({
      evaluacion,
      humanizeBloqueo: (b) => b,
    });

    expect(faltantes.length).toBe(2);
    expect(faltantes.some((i) => i.claveBloque === 'pago')).toBe(true);
  });

  it('prioriza motivo de pago cuando hay bloqueo bancario', () => {
    const faltantes = buildFaltantesCriticosDedup({
      evaluacion: evaluacionMock({
        bloqueos: ['Reemplaza la cuenta bancaria temporal.'],
        seccionesPendientes: ['pago'],
      }),
      humanizeBloqueo: (b) => b,
    });

    expect(
      buildMotivoPrincipal({
        evaluacion: evaluacionMock(),
        faltantes,
        aptoParaRemuneraciones: false,
        estadoFichaValido: false,
      }),
    ).toContain('Pago impide');
  });

  it('resuelve accion principal hacia pago', () => {
    const evaluacion = evaluacionMock({
      seccionesPendientes: ['pago'],
      bloqueos: ['Cuenta bancaria real.'],
    });
    const faltantes = buildFaltantesCriticosDedup({
      evaluacion,
      humanizeBloqueo: (b) => b,
    });

    expect(resolveAccionPrincipalTab(faltantes, evaluacion)).toBe('pago');
    expect(tabDesdeSeccion('remuneracion')).toBe('remuneracion');
  });

  it('construye items de navegacion del expediente', () => {
    const items = buildExpedienteNavItems({
      tabs: [
        { id: 'general', label: 'General' },
        { id: 'pago', label: 'Pago' },
      ],
      tabActivo: 'general',
      estadoTab: (id) => (id === 'general' ? 'warning' : 'blocking'),
    });

    expect(items[0].estado).toBe('en-curso');
    expect(items[1].estado).toBe('critico');
  });

  it('alinea porcentaje y bloques operativos con 3 de 5 completos', () => {
    const estadoTab = (id: ClaveTabFichaEmpleado): EstadoTabFichaEmpleado => {
      if (id === 'pago' || id === 'remuneracion') {
        return 'blocking';
      }
      if (id === 'documentos' || id === 'historial') {
        return 'pending';
      }
      return 'complete';
    };

    const progress = buildFichaOperativeProgress({
      evaluacion: evaluacionMock({
        seccionesPendientes: ['pago', 'remuneracion'],
        bloqueos: ['Cuenta pendiente', 'Sueldo pendiente'],
      }),
      pasoAltaAvanzada: null,
      estadoFicha: 'INCOMPLETO',
      estadoTab,
    });

    expect(progress.bloquesOperativosCompletos).toBe(3);
    expect(progress.totalBloquesOperativos).toBe(TOTAL_BLOQUES_OPERATIVOS_FICHA);
    expect(progress.porcentajeAvance).toBe(60);
  });

  it('borrador mantiene piso de avance coherente con bloques', () => {
    const estadoTab = (): EstadoTabFichaEmpleado => 'warning';

    const progress = buildFichaOperativeProgress({
      evaluacion: evaluacionMock(),
      pasoAltaAvanzada: 2,
      estadoFicha: 'BORRADOR',
      estadoTab,
    });

    expect(progress.bloquesOperativosCompletos).toBe(0);
    expect(progress.porcentajeAvance).toBe(20);
  });

  it('ficha apta reporta 100% y 5 de 5', () => {
    const vm = buildFichaEstadoPanelVm({
      evaluacion: evaluacionMock({ aptoParaRemuneraciones: true, estadoFicha: 'VALIDO' }),
      pasoAltaAvanzada: null,
      estadoFicha: 'VALIDO',
      estadoLaboral: 'activo',
      aptoParaRemuneracionesRegistro: true,
      estadoTab: () => 'complete',
      humanizeBloqueo: (b) => b,
    });

    expect(vm.porcentajeAvance).toBe(100);
    expect(vm.bloquesOperativosCompletos).toBe(5);
    expect(vm.totalBloquesOperativos).toBe(5);
    expect(vm.visorLabel).toBe('Listo');
    expect(vm.shellTone).toBe('success');
    expect(vm.remuneracionesLabel).toBe('Apta para remuneraciones');
  });

  it('visor en proceso para trabajador en_proceso', () => {
    expect(
      buildVisorEstadoFicha({
        evaluacion: evaluacionMock({ bloqueos: ['Falta contrato'] }),
        pasoAltaAvanzada: null,
        estadoFicha: 'INCOMPLETO',
        estadoLaboral: 'en_proceso',
        aptoParaRemuneracionesRegistro: false,
      }),
    ).toEqual({ label: 'En curso', tone: 'warning' });
  });

  it('arma hint de accion para completar pago', () => {
    const vm = buildFichaEstadoPanelVm({
      evaluacion: evaluacionMock({
        bloqueos: ['Reemplaza la cuenta bancaria temporal.'],
        seccionesPendientes: ['pago'],
      }),
      pasoAltaAvanzada: null,
      estadoFicha: 'INCOMPLETO',
      estadoLaboral: 'activo',
      aptoParaRemuneracionesRegistro: false,
      estadoTab: (id) => (id === 'pago' ? 'blocking' : 'complete'),
      humanizeBloqueo: (b) => b,
    });

    expect(vm.etiquetaAccion).toBe('Completar datos de pago');
    expect(vm.ayudaAccion).toContain('datos de pago');
  });
});
