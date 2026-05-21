import { describe, expect, it } from 'vitest';

import type { EvaluacionCompletitudEmpleado } from '../utils/empleado-completitud.rules';
import {
  buildExpedienteNavItems,
  buildFaltantesCriticosDedup,
  buildFichaEstadoPanelVm,
  buildFichaOperativeProgress,
  buildMotivoPrincipal,
  buildVisorEstadoFicha,
  FICHA_TOTAL_OPERATIVE_BLOCKS,
  mapTabStatusToNavStatus,
  resolveAccionPrincipalTab,
  tabFromSectionKey,
  type EmployeeFileTabStatus,
  type EmployeeFichaTabKey,
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
    expect(mapTabStatusToNavStatus('warning', true)).toBe('en-curso');
    expect(mapTabStatusToNavStatus('complete', false)).toBe('listo');
    expect(mapTabStatusToNavStatus('blocking', false)).toBe('critico');
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

    const issues = buildFaltantesCriticosDedup({
      evaluacion,
      humanizeBloqueo: (b) => b,
    });

    expect(issues.length).toBe(2);
    expect(issues.some((i) => i.blockKey === 'pago')).toBe(true);
  });

  it('prioriza motivo de pago cuando hay bloqueo bancario', () => {
    const issues = buildFaltantesCriticosDedup({
      evaluacion: evaluacionMock({
        bloqueos: ['Reemplaza la cuenta bancaria temporal.'],
        seccionesPendientes: ['pago'],
      }),
      humanizeBloqueo: (b) => b,
    });

    expect(
      buildMotivoPrincipal({
        evaluacion: evaluacionMock(),
        issues,
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
    const issues = buildFaltantesCriticosDedup({
      evaluacion,
      humanizeBloqueo: (b) => b,
    });

    expect(resolveAccionPrincipalTab(issues, evaluacion)).toBe('pago');
    expect(tabFromSectionKey('remuneracion')).toBe('remuneracion');
  });

  it('construye items de navegacion del expediente', () => {
    const items = buildExpedienteNavItems({
      tabs: [
        { id: 'general', label: 'General' },
        { id: 'pago', label: 'Pago' },
      ],
      activeTab: 'general',
      tabStatus: (id) => (id === 'general' ? 'warning' : 'blocking'),
    });

    expect(items[0].status).toBe('en-curso');
    expect(items[1].status).toBe('critico');
  });

  it('alinea porcentaje y bloques operativos con 3 de 5 completos', () => {
    const tabStatus = (id: EmployeeFichaTabKey): EmployeeFileTabStatus => {
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
      tabStatus,
    });

    expect(progress.completedOperativeBlocks).toBe(3);
    expect(progress.totalOperativeBlocks).toBe(FICHA_TOTAL_OPERATIVE_BLOCKS);
    expect(progress.progressPercent).toBe(60);
  });

  it('borrador mantiene piso de avance coherente con bloques', () => {
    const tabStatus = (): EmployeeFileTabStatus => 'warning';

    const progress = buildFichaOperativeProgress({
      evaluacion: evaluacionMock(),
      pasoAltaAvanzada: 2,
      estadoFicha: 'BORRADOR',
      tabStatus,
    });

    expect(progress.completedOperativeBlocks).toBe(0);
    expect(progress.progressPercent).toBe(20);
  });

  it('ficha apta reporta 100% y 5 de 5', () => {
    const vm = buildFichaEstadoPanelVm({
      evaluacion: evaluacionMock({ aptoParaRemuneraciones: true, estadoFicha: 'VALIDO' }),
      pasoAltaAvanzada: null,
      estadoFicha: 'VALIDO',
      estadoLaboral: 'activo',
      aptoParaRemuneracionesRegistro: true,
      tabStatus: () => 'complete',
      humanizeBloqueo: (b) => b,
    });

    expect(vm.progressPercent).toBe(100);
    expect(vm.completedOperativeBlocks).toBe(5);
    expect(vm.totalOperativeBlocks).toBe(5);
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
      tabStatus: (id) => (id === 'pago' ? 'blocking' : 'complete'),
      humanizeBloqueo: (b) => b,
    });

    expect(vm.actionLabel).toBe('Completar datos de pago');
    expect(vm.actionHint).toContain('datos de pago');
  });
});
