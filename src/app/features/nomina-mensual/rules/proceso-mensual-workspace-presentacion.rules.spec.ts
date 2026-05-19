import { describe, expect, it } from 'vitest';

import { DETALLE_OPERATIVO_TABS } from '../containers/proceso-mensual-container/models/proceso-mensual-grid.config';
import { buildNominaWorkspaceTabs } from '../containers/proceso-mensual-container/models/proceso-mensual-area-orden.config';
import { NOMINA_WORKSPACE_TABS } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import { buildDetalleRevisionTabsMeta } from './proceso-mensual-detalle-modal.rules';
import { buildIncidenciasPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import { buildAlertasPeriodoResumen } from './proceso-mensual-workspace.rules';
import {
  buildNominaExceptionStrip,
  buildNominaWorkspaceDetailItems,
  buildNominaWorkspaceTabSummaries,
  buildNominaWorkspaceTabsMeta,
  claseNominaWorkspaceTab,
  resolveExceptionStripVisible,
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

  it('NOMINA_WORKSPACE_TABS ordena areas Param Trab Mov Rec sin resumen visible', () => {
    const ids = buildNominaWorkspaceTabs().map((t) => t.id);
    expect(ids).toEqual([
      'parametros',
      'trabajadores',
      'movimientos',
      'recurrentes',
      'liquidaciones',
      'historial',
    ]);
    expect(NOMINA_WORKSPACE_TABS.map((t) => t.id)).toEqual(ids);
  });

  it('buildNominaExceptionStrip oculta en tab resumen', () => {
    const alertas = buildAlertasPeriodoResumen({
      validando: false,
      tieneResultado: true,
      bloqueosCount: 2,
      advertenciasCount: 1,
    });
    expect(buildNominaExceptionStrip(alertas, 'trabajadores')).toEqual({
      visible: true,
      criticas: 2,
      advertencias: 1,
    });
    expect(buildNominaExceptionStrip(alertas, 'resumen').visible).toBe(false);
    expect(resolveExceptionStripVisible(alertas, 'resumen')).toBe(false);
    expect(
      buildNominaExceptionStrip(
        buildAlertasPeriodoResumen({
          validando: false,
          tieneResultado: false,
          bloqueosCount: 0,
          advertenciasCount: 0,
        }),
        'trabajadores',
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

  it('buildNominaWorkspaceTabSummaries resume areas y acciones de detalle', () => {
    const meta = [
      { id: 'parametros', label: 'Parametros', severidad: 'listo', indicador: null },
      { id: 'trabajadores', label: 'Trabajadores', severidad: 'atencion', indicador: '1 pendiente' },
      { id: 'movimientos', label: 'Movimientos', severidad: 'bloqueo', indicador: '1 bloqueo' },
      { id: 'recurrentes', label: 'Recurrentes', severidad: 'neutral', indicador: null },
      { id: 'liquidaciones', label: 'Liquidaciones', severidad: 'atencion', indicador: 'Pendiente' },
      { id: 'historial', label: 'Historial', severidad: 'listo', indicador: null },
    ] as const;

    const summaries = buildNominaWorkspaceTabSummaries({
      tabsMeta: [...meta],
      resumenSuperior: {
        trabajadores: '2 incluidos',
        parametros: 'Revisados',
        movimientos: '3 aprobados · 1 pendientes',
        recurrentes: '4 vigentes',
        cambios: 1,
        bloqueos: 0,
      },
      trabajadoresAptos: 2,
      trabajadoresPorRevisar: 1,
      movimientosAprobados: 3,
      movimientosPendientes: 1,
      asignacionesAplicables: 4,
      asignacionesPorRevisar: 0,
      liquidacionesGeneradas: 0,
      nominaCerrada: true,
      resultadoPreliminar: 'Guardado para revision',
      totalLiquidoLabel: '$1.000',
    });

    expect(summaries.find((s) => s.id === 'trabajadores')?.metricas[0]).toEqual({ label: 'Incluidos', value: 2 });
    expect(summaries.find((s) => s.id === 'parametros')?.detalleTab).toBe('parametros');
    expect(summaries.find((s) => s.id === 'movimientos')?.detalleTab).toBe('movimientos_recurrentes');
    expect(summaries.find((s) => s.id === 'liquidaciones')?.descripcion).toContain('pendiente generar');
    expect(summaries.find((s) => s.id === 'historial')?.metricas[1]).toEqual({ label: 'Liquido', value: '$1.000' });
  });

  it('buildNominaWorkspaceDetailItems ordena severidades y asigna iconos por dominio', () => {
    const items = buildNominaWorkspaceDetailItems({
      tab: 'trabajadores',
      items: [
        {
          titulo: 'Ana Lista',
          descripcion: 'Sin observaciones',
          estado: 'Listo',
          estadoClase: 'payroll-state-chip payroll-state-chip--success',
          accion: 'Revisar',
          detalleTab: 'trabajadores',
        },
        {
          titulo: 'Luis Bloqueado',
          descripcion: 'Ficha incompleta',
          estado: 'Bloqueado',
          estadoClase: 'payroll-state-chip payroll-state-chip--danger',
          accion: 'Resolver',
          ruta: '/empleados',
        },
      ],
    });

    expect(items.map((item) => item.titulo)).toEqual(['Luis Bloqueado', 'Ana Lista']);
    expect(items[0]).toMatchObject({ icon: 'user-x', severity: 'bloqueo', ruta: '/empleados' });
    expect(items[1]).toMatchObject({ icon: 'user-check', severity: 'listo', detalleTab: 'trabajadores' });
  });

  it('buildNominaWorkspaceDetailItems conserva acciones e iconos para tabs no trabajadores', () => {
    expect(
      buildNominaWorkspaceDetailItems({
        tab: 'parametros',
        items: [{ titulo: 'UF del periodo', descripcion: 'Valor disponible', estado: 'Listo' }],
      })[0].icon,
    ).toBe('shield-check');
    expect(
      buildNominaWorkspaceDetailItems({
        tab: 'movimientos',
        items: [{ titulo: 'Bono', descripcion: 'Trabajador · haber · $10.000', estado: 'Pendiente' }],
      })[0].icon,
    ).toBe('circle-alert');
    expect(
      buildNominaWorkspaceDetailItems({
        tab: 'liquidaciones',
        items: [{ titulo: 'Liquidaciones generadas', descripcion: 'Emitidas', estado: 'Generadas' }],
      })[0].icon,
    ).toBe('file-check');
  });

  it('claseNominaWorkspaceTab marca activo', () => {
    expect(claseNominaWorkspaceTab('bloqueo', true)).toContain('payroll-operational-tab--active');
    expect(claseNominaWorkspaceTab('bloqueo', true)).toContain('payroll-operational-tab--bloqueo');
  });
});
