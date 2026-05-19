import { describe, expect, it } from 'vitest';

import { DETALLE_OPERATIVO_TABS } from '../containers/proceso-mensual-container/models/proceso-mensual-grid.config';
import { NOMINA_WORKSPACE_TABS } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import { buildDetalleRevisionTabsMeta } from './proceso-mensual-detalle-modal.rules';
import { buildIncidenciasPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import { buildAlertasPeriodoResumen } from './proceso-mensual-workspace.rules';
import {
  buildNominaExceptionStrip,
  buildNominaWorkspaceTabsMeta,
  claseNominaWorkspaceTab,
  resolveFocusPresentacion,
  resolveFranjaItemTono,
} from './proceso-mensual-workspace-presentacion.rules';

describe('proceso-mensual-workspace-presentacion.rules', () => {
  it('sin_generar usa layout hero con areas', () => {
    expect(resolveFocusPresentacion('sin_generar')).toMatchObject({
      layout: 'hero',
      showAreas: true,
    });
  });

  it('en_revision usa layout compacto e icono de borrador', () => {
    expect(resolveFocusPresentacion('en_revision')).toMatchObject({
      variant: 'info',
      icon: 'file-check-2',
      layout: 'compact',
      showAreas: false,
    });
  });

  it('resolveFranjaItemTono clasifica estados operativos', () => {
    expect(resolveFranjaItemTono('Sin evaluar')).toBe('neutral');
    expect(resolveFranjaItemTono('Por revisar')).toBe('review');
    expect(resolveFranjaItemTono('2 aprobados · 1 pendientes')).toBe('review');
    expect(resolveFranjaItemTono('Revisados')).toBe('ok');
    expect(resolveFranjaItemTono('1 incluido')).toBe('ok');
  });

  it('buildNominaExceptionStrip visible solo con alertas', () => {
    expect(
      buildNominaExceptionStrip(
        buildAlertasPeriodoResumen({
          validando: false,
          tieneResultado: true,
          bloqueosCount: 2,
          advertenciasCount: 1,
        }),
      ),
    ).toEqual({
      visible: true,
      criticas: 2,
      advertencias: 1,
    });

    expect(
      buildNominaExceptionStrip(
        buildAlertasPeriodoResumen({
          validando: false,
          tieneResultado: false,
          bloqueosCount: 0,
          advertenciasCount: 0,
        }),
      ).visible,
    ).toBe(false);
  });

  it('buildNominaWorkspaceTabsMeta separa movimientos y recurrentes por ambito', () => {
    const incidencias = buildIncidenciasPeriodo({
      bloqueosOperativos: [
        {
          severidad: 'danger',
          titulo: 'Movimiento pendiente',
          descripcion: 'Falta aprobar',
          codigo: 'MV_PEND',
        },
      ],
      advertenciasOperativas: [
        {
          severidad: 'warning',
          titulo: 'Recurrente por revisar',
          descripcion: 'Vigencia',
          codigo: 'RECURRENTE_X',
        },
      ],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });

    const detalleTabs = buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias,
      workerRowCount: 1,
      movementRowCount: 1,
      recurrentRowCount: 1,
      resultRowCount: 0,
      parametrosListos: true,
      tieneActividadPeriodo: true,
    });

    const meta = buildNominaWorkspaceTabsMeta({
      tabs: NOMINA_WORKSPACE_TABS,
      detalleTabs,
      incidencias,
      tieneActividadPeriodo: true,
      liquidacionesGeneradas: false,
      nominaCerrada: true,
    });

    expect(meta.find((t) => t.id === 'movimientos')?.indicador).toContain('bloqueo');
    expect(meta.find((t) => t.id === 'recurrentes')?.indicador).toContain('pendiente');
    expect(meta.find((t) => t.id === 'liquidaciones')?.indicador).toBe('Pendiente');
  });

  it('claseNominaWorkspaceTab marca activo', () => {
    expect(claseNominaWorkspaceTab('bloqueo', true)).toContain('payroll-operational-tab--active');
    expect(claseNominaWorkspaceTab('bloqueo', true)).toContain('payroll-operational-tab--bloqueo');
  });
});
