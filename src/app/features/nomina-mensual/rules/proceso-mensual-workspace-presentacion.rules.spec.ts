import { describe, expect, it } from 'vitest';

import {
  buildNominaWorkspaceTabs,
  buildNominaWorkspaceTabsVisible,
} from '../containers/proceso-mensual-container/models/proceso-mensual-area-orden.config';
import {
  NOMINA_WORKSPACE_TABS,
  NOMINA_WORKSPACE_TABS_VISIBLE,
} from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import { buildDetalleRevisionTabsMeta } from './proceso-mensual-detalle-modal.rules';
import { buildIncidenciasPeriodo } from './proceso-mensual-incidencias-periodo.rules';
import {
  buildNominaConfiguracionPeriodoItems,
  buildNominaWorkspaceTabVisibleSummaries,
  buildNominaWorkspaceTabsVisibleMeta,
  claseNominaWorkspaceTab,
  resolveBitacoraRailIcon,
  resolveFocusPresentacion,
  resolveFranjaItemTono,
  type NominaConfiguracionPeriodoInput,
} from './proceso-mensual-workspace-presentacion.rules';

function inputChecklist(overrides: Partial<NominaConfiguracionPeriodoInput> = {}): NominaConfiguracionPeriodoInput {
  return {
    parametrosListos: true,
    parametrosConsultando: false,
    trabajadoresAptos: 10,
    trabajadoresPorRevisar: 0,
    bloqueosTrabajadoresCount: 0,
    bloqueosNominaCount: 0,
    advertenciasCount: 0,
    movimientosAprobados: 0,
    movimientosPendientes: 0,
    recurrentesAplicables: null,
    nominaFrame: 'sin_generar',
    nominaGenerada: false,
    tienePrevalidacion: false,
    nominaConfirmada: false,
    nominaAprobada: false,
    liquidacionesGeneradas: 0,
    ...overrides,
  };
}

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

  it('resolveBitacoraRailIcon mapea marcas del rail', () => {
    expect(resolveBitacoraRailIcon('hecho')).toBe('check');
    expect(resolveBitacoraRailIcon('actual')).toBe('circle-dot');
    expect(resolveBitacoraRailIcon('bloqueado')).toBe('minus');
    expect(resolveBitacoraRailIcon('pendiente')).toBe('circle');
  });

  it('resolveFranjaItemTono clasifica estados operativos', () => {
    expect(resolveFranjaItemTono('Sin evaluar')).toBe('neutral');
    expect(resolveFranjaItemTono('Por revisar')).toBe('review');
    expect(resolveFranjaItemTono('2 aprobados · 1 pendientes')).toBe('review');
    expect(resolveFranjaItemTono('Revisados')).toBe('ok');
    expect(resolveFranjaItemTono('1 listo')).toBe('ok');
  });

  it('NOMINA_WORKSPACE_TABS legacy conserva tabs internos', () => {
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

  it('NOMINA_WORKSPACE_TABS_VISIBLE expone Detalle mensual e Historial', () => {
    const ids = buildNominaWorkspaceTabsVisible().map((t) => t.id);
    expect(ids).toEqual(['detalle_mensual', 'historial']);
    expect(NOMINA_WORKSPACE_TABS_VISIBLE.map((t) => t.id)).toEqual(ids);
  });

  it('buildNominaWorkspaceTabsVisibleMeta agrega severidad en detalle mensual', () => {
    const incidencias = buildIncidenciasPeriodo({
      bloqueosOperativos: [
        {
          codigo: 'MV_PEND',
          titulo: 'Movimiento pendiente',
          descripcion: 'Falta aprobar',
          severidad: 'danger',
        },
      ],
      advertenciasOperativas: [],
      resultadoBloqueos: [],
      resultadoAdvertencias: [],
    });
    const meta = buildNominaWorkspaceTabsVisibleMeta({
      tabs: NOMINA_WORKSPACE_TABS_VISIBLE,
      detalleTabs: buildDetalleRevisionTabsMeta({
        tabs: [],
        incidencias,
        cantidadFilasTrabajadores: 0,
        cantidadFilasMovimientos: 0,
        cantidadFilasRecurrentes: 0,
        cantidadFilasResultado: 0,
        parametrosListos: false,
        tieneActividadPeriodo: true,
      }),
      incidencias,
      tieneActividadPeriodo: true,
      liquidacionesGeneradas: false,
      nominaCerrada: false,
      bloqueosCount: 1,
    });
    expect(meta.find((tab) => tab.id === 'detalle_mensual')?.indicador).toContain('bloqueo');
  });

  it('buildNominaWorkspaceTabVisibleSummaries resume detalle e historial', () => {
    const summaries = buildNominaWorkspaceTabVisibleSummaries({
      resumenSuperior: {
        trabajadores: '2 listos',
        parametros: 'Revisados',
        movimientos: '3 aprobados · 1 pendientes',
        recurrentes: '4 vigentes',
        cambios: 1,
        bloqueos: 0,
      },
      bloqueosCount: 1,
      pendientesCount: 2,
      liquidacionesGeneradas: 0,
      nominaCerrada: true,
      eventosHistorialCount: 3,
    });

    expect(summaries.map((s) => s.id)).toEqual(['detalle_mensual', 'historial']);
    expect(summaries[0]?.severidad).toBe('bloqueo');
    expect(summaries[0]?.metricas).toEqual([]);
    expect(summaries[1]?.metricas).toEqual([]);
    expect(summaries[1]?.indicador).toBe('3 eventos');
    expect(summaries[1]?.descripcion).toContain('generación');
  });

  it('buildNominaWorkspaceTabVisibleSummaries historial sin eventos usa copy vacío', () => {
    const historial = buildNominaWorkspaceTabVisibleSummaries({
      resumenSuperior: {
        trabajadores: '0 listos',
        parametros: 'Sin evaluar',
        movimientos: '0 aprobados',
        recurrentes: '0 vigentes',
        cambios: 0,
        bloqueos: 0,
      },
      bloqueosCount: 0,
      pendientesCount: 0,
      liquidacionesGeneradas: 0,
      nominaCerrada: false,
      eventosHistorialCount: 0,
    })[1];

    expect(historial?.indicador).toBeNull();
    expect(historial?.descripcion).toContain('Aún no hay eventos');
  });

  it('claseNominaWorkspaceTab marca activo', () => {
    expect(claseNominaWorkspaceTab('bloqueo', true)).toContain('payroll-operational-tab--active');
    expect(claseNominaWorkspaceTab('bloqueo', true)).toContain('payroll-operational-tab--bloqueo');
  });

  it('buildNominaConfiguracionPeriodoItems prioriza parámetros bloqueados', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      parametrosListos: false,
      trabajadoresAptos: null,
    }));

    expect(items.find((item) => item.id === 'parametros')).toMatchObject({
      icon: 'sliders',
      estado: 'Bloqueado',
      valor: 'Faltan parámetros',
      accionLabel: 'Abrir parámetros',
      tono: 'danger',
      prioridad: true,
    });
  });

  it('buildNominaConfiguracionPeriodoItems sin nomina generada no marca trabajadores listos', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      tienePrevalidacion: true,
      parametrosListos: false,
      trabajadoresAptos: 1,
      trabajadoresPorRevisar: 0,
      nominaGenerada: false,
      nominaFrame: 'sin_generar',
    }));

    expect(items.find((item) => item.id === 'trabajadores')).toMatchObject({
      estado: 'Pendiente',
      tono: 'review',
      valor: '1 apto · sin nómina generada',
    });
  });

  it('buildNominaConfiguracionPeriodoItems muestra trabajadores por revisar', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      trabajadoresPorRevisar: 2,
      advertenciasCount: 1,
      nominaFrame: 'en_revision',
      nominaGenerada: true,
      tienePrevalidacion: true,
    }));

    expect(items.find((item) => item.id === 'trabajadores')).toMatchObject({
      icon: 'users',
      estado: 'Por revisar',
      accionLabel: 'Revisar trabajadores',
      tono: 'review',
      prioridad: true,
    });
  });

  it('buildNominaConfiguracionPeriodoItems sin borrador muestra Sin generar', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      tienePrevalidacion: true,
      nominaFrame: 'sin_generar',
    }));

    expect(items.map((item) => item.id)).toEqual(['parametros', 'nomina_revision', 'trabajadores', 'liquidaciones']);
    expect(items.find((item) => item.id === 'nomina_revision')).toMatchObject({
      estado: 'Sin generar',
      accionLabel: 'Generar nómina',
      tono: 'neutral',
    });
  });

  it('buildNominaConfiguracionPeriodoItems muestra fila nómina con bloqueo BLOQ-002', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      bloqueosNominaCount: 1,
      nominaFrame: 'con_pendientes',
      nominaGenerada: true,
      tienePrevalidacion: true,
    }));

    expect(items.find((item) => item.id === 'nomina_revision')).toMatchObject({
      label: 'Nómina del período',
      estado: 'Cerrada',
      accionLabel: 'Revisar nómina',
      tono: 'danger',
    });
    expect(items.find((item) => item.id === 'trabajadores')).toMatchObject({
      estado: 'Listo',
      tono: 'ok',
    });
  });

  it('buildNominaConfiguracionPeriodoItems bloqueo BLOQ-006 en fila trabajadores', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      bloqueosTrabajadoresCount: 1,
      nominaFrame: 'con_pendientes',
      nominaGenerada: true,
      tienePrevalidacion: true,
    }));

    expect(items.find((item) => item.id === 'nomina_revision')?.estado).toBe('En revisión');
    expect(items.find((item) => item.id === 'trabajadores')).toMatchObject({
      estado: 'Bloqueado',
      valor: '1 bloqueo en trabajadores',
      accionLabel: 'Revisar trabajadores',
      tono: 'danger',
    });
  });

  it('buildNominaConfiguracionPeriodoItems habilita liquidaciones con proceso cerrado', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      nominaFrame: 'confirmada',
      nominaGenerada: true,
      tienePrevalidacion: true,
      nominaConfirmada: true,
      nominaAprobada: true,
    }));

    expect(items.find((item) => item.id === 'nomina_revision')).toMatchObject({
      estado: 'Cerrada',
      valor: 'Proceso cerrado',
    });

    expect(items.find((item) => item.id === 'liquidaciones')).toMatchObject({
      icon: 'lock',
      valor: 'Liquidaciones pendientes',
      accionLabel: 'Generar liquidaciones',
      disabled: false,
      prioridad: true,
    });
  });

  it('buildNominaConfiguracionPeriodoItems cambia a ver liquidaciones cuando existen', () => {
    const items = buildNominaConfiguracionPeriodoItems(inputChecklist({
      nominaFrame: 'liquidaciones_generadas',
      nominaGenerada: true,
      tienePrevalidacion: true,
      nominaConfirmada: true,
      liquidacionesGeneradas: 5,
    }));

    expect(items.find((item) => item.id === 'liquidaciones')).toMatchObject({
      icon: 'receipt',
      estado: 'Listo',
      accionLabel: 'Ver liquidaciones',
      tono: 'ok',
    });
  });
});
