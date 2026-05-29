import { describe, expect, it } from 'vitest';

import { DETALLE_OPERATIVO_TABS } from '../containers/proceso-mensual-container/models/proceso-mensual-grid.config';

import { contieneNomenclaturaTecnica } from './proceso-mensual-copy-limpio.rules';
import {
  DETALLE_REVISION_MODAL_TITULO,
  buildDetalleRevisionObservacionesLista,
  buildDetalleRevisionFooterAccion,
  buildDetalleRevisionModalLead,
  buildDetalleRevisionTabPanel,
  buildSeccionesResumenAmpliado,
  buildDetalleRevisionTabsMeta,
  buildExpedienteRevisionCta,
  buildExpedienteRevisionCtaForTab,
  debeUsarDataGridRevision,
  humanizarDetalleRevisionTexto,
  mapParametroItemsParaRevision,
  normalizeDetalleOperativoTab,
  REVISION_LISTA_MAX_FILAS,
} from './proceso-mensual-detalle-modal.rules';
import {
  buildIncidenciasPeriodo,
  type BuildIncidenciasPeriodoInput,
} from './proceso-mensual-incidencias-periodo.rules';

function incidenciasMock(override: Partial<BuildIncidenciasPeriodoInput> = {}) {
  return buildIncidenciasPeriodo({
    bloqueosOperativos: [],
    advertenciasOperativas: [],
    resultadoBloqueos: [],
    resultadoAdvertencias: [],
    ...override,
  });
}

const SIN_INCIDENCIAS = incidenciasMock();

describe('proceso-mensual-detalle-modal.rules', () => {
  it('titulo fijo de revision', () => {
    expect(DETALLE_REVISION_MODAL_TITULO).toBe('Revisión de nómina mensual');
  });

  it('lead combina periodo y estado', () => {
    expect(
      buildDetalleRevisionModalLead({ periodoEtiqueta: 'Mayo 2026', estadoTitulo: 'Sin generar' }),
    ).toContain('Mayo 2026');
    expect(
      buildDetalleRevisionModalLead({ periodoEtiqueta: 'Mayo 2026', estadoTitulo: 'Sin generar' }),
    ).toContain('Sin generar');
  });

  it('humaniza claves tecnicas visibles del detalle', () => {
    const texto = humanizarDetalleRevisionTexto(
      'parametros_generales periodo_remuneracion sis_fila_mensual sis_null FALTANTE',
    );

    expect(texto).toContain('Parámetros generales del período');
    expect(texto).toContain('Calendario del período');
    expect(texto).toContain('Dato SIS mensual');
    expect(texto).toContain('SIS');
    expect(texto).not.toContain('sis_null');
    expect(texto).toContain('pendiente');
    expect(humanizarDetalleRevisionTexto(null)).toBe('');
    expect(humanizarDetalleRevisionTexto(undefined)).toBe('');
  });

  it('footer contextual por tab sin CTA global', () => {
    expect(buildDetalleRevisionFooterAccion('resumen')).toEqual({
      kind: 'tab',
      label: 'Ver trabajadores',
      tab: 'trabajadores',
    });
    expect(buildDetalleRevisionFooterAccion('trabajadores')).toEqual({
      kind: 'tab',
      label: 'Ir al detalle del período',
      tab: 'trabajadores',
    });
    expect(buildDetalleRevisionFooterAccion('parametros').kind).toBe('ruta');
  });

  it('marca tab parametros con bloqueo cuando hay pendiente PARAM', () => {
    const tabs = buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias: incidenciasMock({
        bloqueosOperativos: [{
          codigo: 'BLOQ-PARAM',
          titulo: 'Parámetros incompletos',
          descripcion: 'Faltan catálogos',
          severidad: 'danger',
          ruta: '/parametros',
          accionLabel: 'Revisar',
        }],
      }),
      cantidadFilasTrabajadores: 0,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 0,
      parametrosListos: false,
      tieneActividadPeriodo: true,
    });
    const parametros = tabs.find((tab) => tab.id === 'parametros');
    expect(parametros?.severidad).toBe('bloqueo');
    expect(parametros?.indicador).toContain('bloqueo');
  });

  it('confirmar_nomina respeta bloqueo cuando no puede cerrar', () => {
    const cta = buildExpedienteRevisionCta({
      accion: 'confirmar_nomina',
      label: 'Aprobar nómina',
      puedeConfirmarNomina: false,
      motivoNoPuedeConfirmar: 'Falta aprobación operativa',
      liquidacionesDisponibles: false,
      nominaConfirmada: false,
    });
    expect(cta).toMatchObject({
      kind: 'confirmar_nomina',
      disabled: true,
      disabledReason: 'Falta aprobación operativa',
    });
  });

  it('generar_liquidaciones exige nomina confirmada', () => {
    const cta = buildExpedienteRevisionCta({
      accion: 'generar_liquidaciones',
      label: 'Generar liquidaciones',
      puedeConfirmarNomina: true,
      motivoNoPuedeConfirmar: undefined,
      liquidacionesDisponibles: false,
      nominaConfirmada: false,
    });
    expect(cta.kind).toBe('navegar');
    if (cta.kind === 'navegar') {
      expect(cta.disabled).toBe(true);
    }
  });

  it('oculta CTA de expediente fuera del resumen', () => {
    expect(
      buildExpedienteRevisionCtaForTab('trabajadores', {
        accion: 'generar_liquidaciones',
        label: 'Generar liquidaciones',
        puedeConfirmarNomina: true,
        motivoNoPuedeConfirmar: undefined,
        liquidacionesDisponibles: false,
        nominaConfirmada: true,
      }),
    ).toEqual({ kind: 'none' });
  });

  it('deduplica observaciones del expediente y operativas', () => {
    const lista = buildDetalleRevisionObservacionesLista({
      incidencias: incidenciasMock({
        bloqueosOperativos: [{
          codigo: 'PARAM_UF',
          titulo: 'Parametros',
          descripcion: 'Falta UF del periodo',
          severidad: 'danger',
        }],
        expedienteProblemas: [{
          severidad: 'bloqueo',
          titulo: 'PARAM_UF',
          detalle: 'Falta UF del periodo',
        }],
      }),
    });

    expect(lista).toHaveLength(1);
    expect(lista[0].titulo).toBe('Parametros');
  });

  it('humaniza observaciones antes de exponerlas al modal', () => {
    const lista = buildDetalleRevisionObservacionesLista({
      incidencias: incidenciasMock({
        expedienteProblemas: [{
          severidad: 'bloqueo',
          titulo: 'parametros_generales',
          detalle: 'FALTANTE periodo_remuneracion sis_null',
        }],
      }),
    });

    const visible = `${lista[0].titulo} ${lista[0].descripcion}`;
    expect(visible).not.toContain('parametros_generales');
    expect(visible).not.toContain('periodo_remuneracion');
    expect(visible).not.toContain('sis_null');
    expect(visible).not.toContain('FALTANTE');
    expect(visible).toContain('Parámetros generales del período');
  });

  it('elimina separadores punto y coma en observaciones del resumen', () => {
    const lista = buildDetalleRevisionObservacionesLista({
      incidencias: incidenciasMock({
        expedienteProblemas: [{
          severidad: 'bloqueo',
          titulo: 'parametros_generales',
          detalle: 'parametros_generales; sis_null;',
        }],
      }),
    });

    const visible = `${lista[0].titulo} ${lista[0].descripcion}`;
    expect(visible).not.toContain(';');
    expect(visible).not.toContain('sis_null');
    expect(contieneNomenclaturaTecnica(visible)).toBe(false);
  });

  it('corrige parametros bloqueados que venian como revisados', () => {
    const lista = mapParametroItemsParaRevision([
      {
        titulo: 'Parametros base',
        descripcion: 'Parametros revisados',
        estado: 'Listo',
        estadoClase: 'payroll-state-chip payroll-state-chip--success',
        accion: 'Revisar parametros',
      },
    ], 'bloqueo');

    expect(lista[0].estado).toBe('Requiere revisión');
    expect(lista[0].estadoClase).toContain('danger');
    expect(lista[0].estado.toLowerCase()).not.toContain('revisad');
  });

  it('humaniza parametros y agrupa accion repetida', () => {
    const panel = buildDetalleRevisionTabPanel({
      tab: 'parametros',
      tabSeveridad: 'bloqueo',
      periodoEtiqueta: 'Mayo 2026',
      estadoTitulo: 'Con pendientes',
      incidencias: SIN_INCIDENCIAS,
      cantidadFilasTrabajadores: 0,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 0,
      itemsParametros: [
        {
          titulo: 'parametros_generales',
          descripcion: 'FALTANTE sis_fila_mensual sis_null',
          estado: 'Listo',
          estadoClase: 'payroll-state-chip payroll-state-chip--success',
          accion: 'Revisar parámetros',
          ruta: '/parametros',
        },
        {
          titulo: 'periodo_remuneracion',
          descripcion: 'FALTANTE calendario',
          estado: 'Revisados',
          estadoClase: 'payroll-state-chip payroll-state-chip--success',
          accion: 'Revisar parámetros',
          ruta: '/parametros',
        },
      ],
      itemsSeguimientoResultado: [],
      filasMovimientos: [],
      filasRecurrentes: [],
    });

    const visible = panel.listaParametros.map((item) => `${item.titulo} ${item.descripcion}`).join(' ');
    expect(visible).not.toContain('parametros_generales');
    expect(visible).not.toContain('sis_fila_mensual');
    expect(visible).not.toContain('sis_null');
    expect(visible).not.toContain('FALTANTE');
    expect(panel.accionParametros).toEqual({ label: 'Revisar parámetros', ruta: '/parametros', accionTab: undefined });
    expect(panel.listaParametros.every((item) => item.accion == null && item.ruta == null)).toBe(true);
  });

  it('resumen refleja bloqueos globales y no queda listo', () => {
    const tabs = buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias: incidenciasMock({
        bloqueosOperativos: [{
          codigo: 'PARAM_BLOQUEO',
          titulo: 'Faltan parámetros',
          descripcion: 'Falta sis_fila_mensual',
          severidad: 'danger',
          ruta: '/parametros',
        }],
      }),
      cantidadFilasTrabajadores: 0,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 0,
      parametrosListos: false,
      tieneActividadPeriodo: true,
    });

    const resumen = tabs.find((tab) => tab.id === 'resumen');
    expect(resumen?.severidad).toBe('bloqueo');
    expect(resumen?.indicador).toBe('Requiere revisión');
  });

  it('resumen refleja advertencias globales como observaciones', () => {
    const tabs = buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias: incidenciasMock({
        advertenciasOperativas: [{
          codigo: 'PARAM_WARN',
          titulo: 'Revisar parámetros',
          descripcion: 'Advertencia',
          severidad: 'warning',
          ruta: '/parametros',
        }],
      }),
      cantidadFilasTrabajadores: 0,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 0,
      parametrosListos: false,
      tieneActividadPeriodo: true,
    });

    const resumen = tabs.find((tab) => tab.id === 'resumen');
    expect(resumen?.severidad).toBe('atencion');
    expect(resumen?.indicador).toBe('Con observaciones');
  });

  it('indicadores de tabs coinciden con porDetalleTab', () => {
    const incidencias = incidenciasMock({
      bloqueosOperativos: [
        {
          codigo: 'PARAM_A',
          titulo: 'Parámetro A',
          descripcion: 'Falta A',
          severidad: 'danger',
          ruta: '/parametros',
        },
        {
          codigo: 'PARAM_B',
          titulo: 'Parámetro B',
          descripcion: 'Falta B',
          severidad: 'danger',
          ruta: '/parametros',
        },
      ],
      advertenciasOperativas: [{
        codigo: 'TRAB_X',
        titulo: 'Trabajador con observación',
        descripcion: 'Revisar ficha',
        severidad: 'warning',
      }],
      resultadoAdvertencias: [{
        codigo: 'RESULT_WARN',
        titulo: 'Advertencia en resultado',
        descripcion: 'Revisar montos',
      }],
    });

    const tabs = buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias,
      cantidadFilasTrabajadores: 1,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 1,
      parametrosListos: false,
      tieneActividadPeriodo: true,
    });

    const parseConteo = (indicador: string | null): number | null => {
      if (!indicador) return null;
      const match = indicador.match(/^(\d+)\s/);
      return match ? Number(match[1]) : null;
    };

    for (const tabId of ['parametros', 'trabajadores', 'resultado'] as const) {
      const tab = tabs.find((item) => item.id === tabId);
      const esperado = incidencias.porDetalleTab[tabId].length;
      expect(parseConteo(tab?.indicador ?? null)).toBe(esperado);
    }
  });

  it('tab parametros enlaza al resumen sin repetir filas', () => {
    const incidencias = incidenciasMock({
      bloqueosOperativos: [{
        codigo: 'PARAM_X',
        titulo: 'Falta UF del período',
        descripcion: 'Revisar valor UF',
        severidad: 'danger',
        ruta: '/parametros',
      }],
    });
    const titulosResumen = incidencias.todas.map((inc) => inc.titulo);

    const panel = buildDetalleRevisionTabPanel({
      tab: 'parametros',
      tabSeveridad: 'bloqueo',
      periodoEtiqueta: 'Mayo 2026',
      estadoTitulo: 'Con pendientes',
      incidencias,
      cantidadFilasTrabajadores: 0,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 0,
      itemsParametros: [
        {
          titulo: 'Falta UF del período',
          descripcion: 'Duplicado que no debe listarse',
          estado: 'Revisar',
          estadoClase: 'payroll-state-chip payroll-state-chip--danger',
          accion: 'Revisar parámetros',
          ruta: '/parametros',
        },
        {
          titulo: 'Catálogo base',
          descripcion: 'Contexto de catálogo sin pendiente duplicado',
          estado: 'Revisados',
          estadoClase: 'payroll-state-chip payroll-state-chip--success',
          accion: 'Abrir parámetros',
          ruta: '/parametros',
        },
      ],
      itemsSeguimientoResultado: [],
      filasMovimientos: [],
      filasRecurrentes: [],
      nominaGenerada: true,
    });

    expect(panel.enlaceResumenIncidencias?.count).toBe(incidencias.porAmbito.parametros.length);
    expect(panel.listaParametros.every((item) => !titulosResumen.includes(item.titulo))).toBe(true);
    expect(panel.listaParametros.some((item) => item.titulo === 'Catálogo base')).toBe(true);
  });

  it('expone enlace al resumen en tab de area con incidencias solo si nomina generada', () => {
    const incidencias = incidenciasMock({
      bloqueosOperativos: [{
        codigo: 'PARAM_X',
        titulo: 'Falta UF',
        descripcion: 'Revisar',
        severidad: 'danger',
        ruta: '/parametros',
      }],
    });
    const baseInput = {
      tab: 'parametros' as const,
      tabSeveridad: 'bloqueo' as const,
      periodoEtiqueta: 'Mayo 2026',
      estadoTitulo: 'Con pendientes',
      incidencias,
      cantidadFilasTrabajadores: 0,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 0,
      itemsParametros: [],
      itemsSeguimientoResultado: [],
      filasMovimientos: [],
      filasRecurrentes: [],
    };

    expect(buildDetalleRevisionTabPanel({ ...baseInput, nominaGenerada: false }).enlaceResumenIncidencias).toBeUndefined();
    expect(buildDetalleRevisionTabPanel({ ...baseInput, nominaGenerada: true }).enlaceResumenIncidencias?.label).toBe('Ver en resumen (1)');
  });

  it('buildSeccionesResumenAmpliado incluye codigos de borrador y trabajadores', () => {
    const baseTrazabilidad = {
      trabajadores: [{
        idPersona: 1,
        trabajadorLabel: 'Ana Perez',
        rutLabel: '11.111.111-1',
        contratoLabel: 'Contrato',
        estado: 'listo' as const,
        asignacionesRecurrentes: 0,
        movimientosDelMes: 0,
        observacion: 'Sin observaciones',
      }],
      trabajadoresConsiderados: 1,
      listosParaCalculo: 1,
      conObservaciones: 0,
      bloqueados: 0,
      excluidos: 0,
      asignacionesRecurrentesIncluidas: 0,
      movimientosDelMesIncluidos: 0,
      parametrosEstado: 'listos' as const,
      observacionParametros: 'OK',
    };
    const secciones = buildSeccionesResumenAmpliado({
      preNomina: {
        periodo: '2026-05',
        estado: 'GENERADA',
        generadoEn: '2026-05-05',
        trabajadoresIncluidos: 1,
        recurrentesIncluidos: 0,
        movimientosVariablesValidados: 0,
        movimientosVariablesBorrador: 0,
        parametrosOperativos: true,
        codigosBloqueo: ['PARAM_X'],
        codigosAdvertencia: ['MV_BORRADOR'],
        origenPrevalidacion: 'LISTO_PARA_CALCULO',
        trazabilidad: baseTrazabilidad,
      },
      baseTrazabilidad,
    });
    expect(secciones.some((s) => s.titulo === 'Bloqueos del borrador')).toBe(true);
    expect(secciones.some((s) => s.titulo === 'Trabajadores en la base generada')).toBe(true);
  });

  it('DETALLE_OPERATIVO_TABS no incluye movimientos recurrentes', () => {
    expect(DETALLE_OPERATIVO_TABS.map((t) => t.id)).toEqual([
      'resumen',
      'parametros',
      'trabajadores',
      'resultado',
    ]);
  });

  it('normalizeDetalleOperativoTab redirige movimientos a trabajadores', () => {
    expect(normalizeDetalleOperativoTab('movimientos_recurrentes')).toBe('trabajadores');
    expect(normalizeDetalleOperativoTab('parametros')).toBe('parametros');
  });

  it('tabs en estado listo no muestran pill Listo', () => {
    const tabs = buildDetalleRevisionTabsMeta({
      tabs: DETALLE_OPERATIVO_TABS,
      incidencias: SIN_INCIDENCIAS,
      cantidadFilasTrabajadores: 2,
      cantidadFilasMovimientos: 0,
      cantidadFilasRecurrentes: 0,
      cantidadFilasResultado: 2,
      parametrosListos: true,
      tieneActividadPeriodo: true,
    });

    for (const tab of tabs) {
      if (tab.severidad === 'listo') {
        expect(tab.indicador).toBeNull();
      }
    }
  });

  it('debeUsarDataGridRevision respeta umbral editorial', () => {
    expect(REVISION_LISTA_MAX_FILAS).toBe(8);
    expect(debeUsarDataGridRevision(8)).toBe(false);
    expect(debeUsarDataGridRevision(9)).toBe(true);
  });
});
