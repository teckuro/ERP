import { describe, expect, it } from 'vitest';

import {
  appendNominaFlowQuery,
  detalleTabUsaModal,
  periodoYmDesdeFlowQuery,
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
});
