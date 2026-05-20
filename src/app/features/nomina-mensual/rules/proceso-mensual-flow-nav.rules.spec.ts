import { describe, expect, it } from 'vitest';

import {
  appendNominaFlowQuery,
  buildRevisionRailCta,
  debeRehidratarDesdeFlowQuery,
  detalleTabUsaModal,
  filtrarPendientesRailSecundarios,
  NOMINA_FLOW_RETURN_PATH,
  periodoYmDesdeFlowQuery,
  resolveFlowDestinoPorFrame,
  resolveNominaEstadoRrhh,
  resolveWorkspaceTargetFromAccionLocal,
  resolveWorkspaceTargetFromDetalleTab,
} from './proceso-mensual-flow-nav.rules';

describe('proceso-mensual-flow-nav.rules', () => {
  it('resolveWorkspaceTargetFromDetalleTab envía trabajadores al panel', () => {
    expect(resolveWorkspaceTargetFromDetalleTab('trabajadores')).toEqual({
      tabVisible: 'detalle_mensual',
      detalleVista: 'trabajadores',
      legacyTab: 'trabajadores',
    });
  });

  it('resolveWorkspaceTargetFromDetalleTab deja resultado en modal', () => {
    expect(resolveWorkspaceTargetFromDetalleTab('resultado')).toBeNull();
    expect(detalleTabUsaModal('resultado')).toBe(true);
  });

  it('revisarBloqueos abre detalle trabajadores', () => {
    expect(resolveWorkspaceTargetFromAccionLocal('revisarBloqueos')?.detalleVista).toBe('trabajadores');
  });

  it('appendNominaFlowQuery agrega periodo y retorno', () => {
    const url = appendNominaFlowQuery('/remuneraciones/novedades-mensuales', '2026-05');
    expect(url).toContain('periodo=2026-05');
    expect(url).toContain('returnTo=%2Fremuneraciones%2Fproceso-mensual');
  });

  it('resolveNominaEstadoRrhh mapea frames visibles', () => {
    expect(resolveNominaEstadoRrhh('lista_para_confirmar').etiqueta).toBe('Lista para confirmar');
    expect(resolveNominaEstadoRrhh('sin_generar').etiqueta).toBe('Sin generar');
  });

  it('periodoYmDesdeFlowQuery valida formato', () => {
    expect(periodoYmDesdeFlowQuery({ periodo: '2026-05' })).toBe('2026-05');
    expect(periodoYmDesdeFlowQuery({ periodo: 'invalid' })).toBeNull();
  });

  it('resolveFlowDestinoPorFrame alinea en_revision a trabajadores', () => {
    expect(resolveFlowDestinoPorFrame('en_revision').detalleVista).toBe('trabajadores');
  });

  it('debeRehidratarDesdeFlowQuery exige returnTo de nomina mensual', () => {
    expect(debeRehidratarDesdeFlowQuery({ periodo: '2026-05', returnTo: NOMINA_FLOW_RETURN_PATH })).toBe(true);
    expect(debeRehidratarDesdeFlowQuery({ periodo: '2026-05' })).toBe(false);
  });

  it('buildRevisionRailCta prioriza panel para trabajadores', () => {
    const destino = resolveWorkspaceTargetFromDetalleTab('trabajadores');
    const cta = buildRevisionRailCta('trabajadores', destino);
    expect(cta.usarPanel).toBe(true);
    expect(cta.label).toBe('Revisar trabajadores');
  });

  it('filtrarPendientesRailSecundarios omite duplicados de revisar trabajadores', () => {
    const filtrados = filtrarPendientesRailSecundarios(
      [
        {
          codigo: 'A',
          titulo: 'Advertencia A',
          descripcion: 'Detalle',
          severidad: 'warning',
          accionLabel: 'Revisar trabajadores',
        },
        {
          codigo: 'B',
          titulo: 'Parámetros',
          descripcion: 'Falta UF',
          severidad: 'danger',
          accionLabel: 'Revisar parámetros',
        },
      ],
      'Revisar trabajadores',
    );
    expect(filtrados).toHaveLength(1);
    expect(filtrados[0]?.accionLabel).toBe('Revisar parámetros');
  });
});
