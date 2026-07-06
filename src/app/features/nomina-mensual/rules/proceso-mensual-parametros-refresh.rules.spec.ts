import { describe, expect, it } from 'vitest';

import type { ProcesoMensualPrevalidacion } from '../models/proceso-mensual.model';
import {
  aislarConsultaSoloParametros,
  AVISO_DRIFT_PARAMETROS_CON_BASE,
  detectarDriftConsultaParametros,
  detectarDriftParametros,
  esDiagnosticoSoloParametros,
  extraerConsultaParametrosPeriodo,
  etiquetaClasificacionGrupoParametro,
  etiquetaGrupoParametroUi,
  tonoGrupoParametro,
  etiquetaEstadoPeriodoRemuneracion,
  mergeParametrosEnPrevalidacion,
  resolverEstadoPeriodoRemuneracionDesdePrevalidacion,
  nominaFrameCongeladoObsoleto,
  resolverAccionesFooterModalParametros,
  resolveParametrosListosPeriodo,
  resolveParametrosOperativosPeriodo,
  mapParametrosGruposParaModal,
  GRUPO_CONFIGURACION_PERIODO_ID,
  LABEL_CONFIGURACION_PERIODO,
  etiquetaEstadoConfiguracionPeriodoModal,
  buildParametrosOverlayContexto,
} from './proceso-mensual-parametros-refresh.rules';

function prevalidacionBase(overrides: Partial<ProcesoMensualPrevalidacion> = {}): ProcesoMensualPrevalidacion {
  return {
    periodo: '2026-05',
    estado: 'LISTO_PARA_CALCULO',
    resumen: {
      periodo: '2026-05',
      hayBloqueos: false,
      hayAdvertencias: false,
      conteoMovimientosPorEstado: {},
      trabajadoresActivosAptos: 3,
      trabajadoresActivosNoAptos: 0,
      parametrosOperativos: true,
      parametrosGrupos: [{ id: 'topes_base', clasificacion: 'OK' }],
      recurrentesAplicablesAlPeriodo: 1,
      recurrentesInvalidas: 0,
      recurrentesCerradas: 0,
      recurrentesFueraDelMes: 0,
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    items: [
      { area: 'PARAMETROS', etiqueta: 'Parámetros', estado: 'LISTO' },
      { area: 'TRABAJADORES', etiqueta: 'Trabajadores', estado: 'LISTO' },
    ],
    trabajadoresPendientesRevision: [],
    ...overrides,
  };
}

describe('proceso-mensual-parametros-refresh.rules', () => {
  it('aislarConsultaSoloParametros no incluye bloqueos de trabajadores', () => {
    const consulta = prevalidacionBase({
      bloqueos: [
        {
          codigo: 'EMPLEADOS_SIN_ACTIVOS_APTOS',
          area: 'TRABAJADORES',
          severidad: 'BLOQUEO',
          texto: 'Sin aptos',
        },
        {
          codigo: 'PARAMETROS_SIN_FILA',
          area: 'PARAMETROS',
          severidad: 'BLOQUEO',
          texto: 'Falta fila',
        },
      ],
    });
    const aislada = aislarConsultaSoloParametros(consulta);
    expect(aislada.bloqueos).toHaveLength(0);
    expect(aislada.advertencias.some((m) => m.area === 'TRABAJADORES')).toBe(false);
    expect(aislada.advertencias.some((m) => m.codigo === 'PARAMETROS_SIN_FILA')).toBe(true);
  });

  it('merge sin prevalidacion previa usa consulta aislada sin trabajadores', () => {
    const consulta = prevalidacionBase({
      bloqueos: [
        {
          codigo: 'EMPLEADOS_SIN_ACTIVOS_APTOS',
          area: 'TRABAJADORES',
          severidad: 'BLOQUEO',
          texto: 'Sin aptos',
        },
      ],
    });
    const merged = mergeParametrosEnPrevalidacion(null, consulta);
    expect(merged.bloqueos.some((m) => m.area === 'TRABAJADORES')).toBe(false);
  });

  it('mergeParametrosEnPrevalidacion conserva trabajadores y actualiza parámetros', () => {
    const actual = prevalidacionBase({
      bloqueos: [
        {
          codigo: 'EMPLEADOS_SIN_ACTIVOS_APTOS',
          area: 'TRABAJADORES',
          severidad: 'BLOQUEO',
          texto: 'Sin aptos',
        },
      ],
    });
    const consulta = prevalidacionBase({
      resumen: {
        ...actual.resumen,
        parametrosOperativos: false,
        parametrosGrupos: [{ id: 'topes_base', clasificacion: 'FALTANTE' }],
      },
      bloqueos: [
        {
          codigo: 'PARAMETROS_SIN_FILA',
          area: 'PARAMETROS',
          severidad: 'BLOQUEO',
          texto: 'Falta fila',
        },
      ],
      items: [{ area: 'PARAMETROS', etiqueta: 'Parámetros', estado: 'CON_PROBLEMAS' }],
    });

    const merged = mergeParametrosEnPrevalidacion(actual, consulta);

    expect(merged.bloqueos.some((m) => m.area === 'TRABAJADORES')).toBe(true);
    expect(merged.bloqueos.some((m) => m.area === 'PARAMETROS')).toBe(true);
    expect(merged.resumen.trabajadoresActivosAptos).toBe(3);
    expect(merged.resumen.parametrosOperativos).toBe(false);
  });

  it('aislarGeneracionNomina conserva estado y mueve parámetros a advertencias', () => {
    const actual = prevalidacionBase({ estado: 'LISTO_PARA_CALCULO' });
    const consulta = prevalidacionBase({
      resumen: {
        ...actual.resumen,
        parametrosOperativos: false,
        parametrosGrupos: [{ id: 'topes_base', clasificacion: 'FALTANTE' }],
      },
      bloqueos: [
        {
          codigo: 'PARAMETROS_SIN_FILA',
          area: 'PARAMETROS',
          severidad: 'BLOQUEO',
          texto: 'Falta fila',
        },
      ],
      estado: 'BLOQUEADO',
    });

    const merged = mergeParametrosEnPrevalidacion(actual, consulta, { aislarGeneracionNomina: true });

    expect(merged.estado).toBe('LISTO_PARA_CALCULO');
    expect(merged.bloqueos.some((m) => m.area === 'PARAMETROS')).toBe(false);
    expect(merged.advertencias.some((m) => m.area === 'PARAMETROS' && m.codigo === 'PARAMETROS_SIN_FILA')).toBe(true);
    expect(merged.resumen.parametrosOperativos).toBe(false);
  });

  it('detectarDriftParametros marca regresion cuando deja de estar operativo', () => {
    const antes = prevalidacionBase();
    const despues = prevalidacionBase({
      resumen: { ...antes.resumen, parametrosOperativos: false },
    });

    expect(detectarDriftParametros(antes, despues)).toEqual({ huboCambio: true, regresion: true });
    expect(AVISO_DRIFT_PARAMETROS_CON_BASE).toContain('aprobar');
    expect(AVISO_DRIFT_PARAMETROS_CON_BASE).toContain('emitir liquidaciones');
  });

  it('detectarDriftParametros sin cambios devuelve huboCambio false', () => {
    const actual = prevalidacionBase();
    expect(detectarDriftParametros(actual, actual)).toEqual({ huboCambio: false, regresion: false });
  });

  it('etiquetaClasificacionGrupoParametro usa copy RRHH', () => {
    expect(etiquetaClasificacionGrupoParametro('OK')).toBe('Correcto');
    expect(etiquetaClasificacionGrupoParametro('FALTANTE')).toBe('Por corregir');
  });

  it('etiquetaGrupoParametroUi usa nombres RRHH y no snake_case', () => {
    expect(etiquetaGrupoParametroUi('afc_catalogo')).toBe('Seguro de cesantía (AFC)');
    expect(etiquetaGrupoParametroUi('sis_fila_mensual')).toBe('SIS del período');
    expect(etiquetaGrupoParametroUi('salud_catalogo')).toBe('Catálogo de salud');
    expect(etiquetaGrupoParametroUi('mutualidad_ley16744_ccaf')).toBe('Mutual y CCAF');
    expect(etiquetaGrupoParametroUi('reforma_previsional')).toBe('Reforma previsional');
    expect(etiquetaGrupoParametroUi('afc_catalogo')).not.toContain('_');
  });

  it('tonoGrupoParametro distingue ok y revision', () => {
    expect(tonoGrupoParametro('OK')).toBe('ok');
    expect(tonoGrupoParametro('FALTANTE')).toBe('revision');
  });

  it('esDiagnosticoSoloParametros distingue consulta PG de verificacion completa', () => {
    const soloParam = prevalidacionBase({
      items: [{ area: 'PARAMETROS', detalle: 'Estado período: cargado', estado: 'LISTO' } as never],
    });
    const completa = prevalidacionBase({
      items: [
        { area: 'PARAMETROS', detalle: 'ok', estado: 'LISTO' } as never,
        { area: 'TRABAJADORES', detalle: 'ok', estado: 'LISTO' } as never,
        { area: 'ENTRADAS_MENSUALES', detalle: 'ok', estado: 'LISTO' } as never,
      ],
    });
    expect(esDiagnosticoSoloParametros(soloParam)).toBe(true);
    expect(esDiagnosticoSoloParametros(completa)).toBe(false);
  });

  it('extraerConsultaParametrosPeriodo no incluye bloqueos de trabajadores', () => {
    const consulta = prevalidacionBase({
      bloqueos: [{ codigo: 'EMPLEADOS_SIN_ACTIVOS_APTOS', area: 'TRABAJADORES', severidad: 'BLOQUEO', texto: 'x' }],
      resumen: {
        ...prevalidacionBase().resumen,
        parametrosOperativos: true,
      },
    });
    const slice = extraerConsultaParametrosPeriodo(consulta);
    expect(slice.parametrosOperativos).toBe(true);
    expect(detectarDriftConsultaParametros(null, slice).huboCambio).toBe(true);
  });

  it('resolverEstadoPeriodoRemuneracionDesdePrevalidacion lee detalle del ítem parámetros', () => {
    const pv = prevalidacionBase({
      items: [
        { area: 'PARAMETROS', etiqueta: 'Parámetros', estado: 'CON_PROBLEMAS', detalle: 'Estado período: pendiente' },
      ],
    });
    expect(resolverEstadoPeriodoRemuneracionDesdePrevalidacion(pv)).toBe('Pendiente');
    expect(etiquetaEstadoPeriodoRemuneracion('cargado')).toBe('Cargado');
  });

  it('resolveParametrosListosPeriodo prioriza consulta PG sobre prevalidacion', () => {
    expect(resolveParametrosListosPeriodo({
      consultaParametrosOperativos: false,
      prevalidacionParametrosOperativos: true,
      persistidoParametrosOperativos: true,
    })).toBe(false);
    expect(resolveParametrosListosPeriodo({
      consultaParametrosOperativos: true,
      prevalidacionParametrosOperativos: false,
    })).toBe(true);
    expect(resolveParametrosListosPeriodo({
      consultaParametrosOperativos: null,
      prevalidacionParametrosOperativos: false,
    })).toBe(false);
    expect(resolveParametrosListosPeriodo({})).toBeNull();
  });

  it('resolveParametrosOperativosPeriodo es true solo con listos explicitos', () => {
    expect(resolveParametrosOperativosPeriodo({
      consultaParametrosOperativos: true,
    })).toBe(true);
    expect(resolveParametrosOperativosPeriodo({
      consultaParametrosOperativos: false,
      prevalidacionParametrosOperativos: true,
    })).toBe(false);
  });

  it('etiquetaEstadoConfiguracionPeriodoModal usa copy RRHH', () => {
    expect(etiquetaEstadoConfiguracionPeriodoModal('Por revisar')).toBe('Faltan datos');
    expect(etiquetaEstadoConfiguracionPeriodoModal('Listo para liquidar')).toBe('Listo');
  });

  it('mapParametrosGruposParaModal agrega configuracion del periodo si no esta lista', () => {
    const filas = mapParametrosGruposParaModal({
      grupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' }],
      parametrosOperativos: false,
      estadoCalendario: 'Por revisar',
    });
    expect(filas[0]?.id).toBe(GRUPO_CONFIGURACION_PERIODO_ID);
    expect(filas[0]?.label).toBe(LABEL_CONFIGURACION_PERIODO);
    expect(filas[0]?.estado).toBe('Faltan datos');
    expect(filas[0]?.tono).toBe('revision');
    expect(filas.some((f) => f.id === 'mensuales_uf_utm_sueldo' && f.tono === 'ok')).toBe(true);
  });

  it('buildParametrosOverlayContexto menciona configuracion si grupos ok pero no operativos', () => {
    const ctx = buildParametrosOverlayContexto({
      parametrosOperativos: false,
      parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' }],
      prevalidacion: null,
    });
    expect(ctx.puntos.some((p) => p.includes('configuración del período'))).toBe(true);
  });

  it('resolverAccionesFooterModalParametros con parametros no operativos solo abre parametros', () => {
    const acciones = resolverAccionesFooterModalParametros({
      tienePrevalidacion: false,
      baseGenerada: false,
      calculoGenerado: false,
      resultadoGuardado: false,
      parametrosOperativos: false,
    });
    expect(acciones.accionPrincipal?.destino).toBe('parametros_app');
    expect(acciones.accionSecundaria).toBeUndefined();
  });

  it('resolverAccionesFooterModalParametros sin evaluar ofrece verificar periodo', () => {
    const acciones = resolverAccionesFooterModalParametros({
      tienePrevalidacion: false,
      baseGenerada: false,
      calculoGenerado: false,
      resultadoGuardado: false,
    });
    expect(acciones.accionPrincipal?.destino).toBe('validar_periodo');
    expect(acciones.accionSecundaria?.destino).toBe('parametros_app');
  });

  it('resolverAccionesFooterModalParametros con parametros operativos solo abre parametros', () => {
    const acciones = resolverAccionesFooterModalParametros({
      tienePrevalidacion: false,
      baseGenerada: false,
      calculoGenerado: false,
      resultadoGuardado: false,
      parametrosOperativos: true,
    });
    expect(acciones.accionPrincipal?.destino).toBe('parametros_app');
    expect(acciones.accionSecundaria).toBeUndefined();
  });

  it('resolverAccionesFooterModalParametros en preparacion unificada no ofrece verificar periodo', () => {
    const acciones = resolverAccionesFooterModalParametros({
      tienePrevalidacion: false,
      baseGenerada: false,
      calculoGenerado: false,
      resultadoGuardado: false,
      preparacionNominaEnCurso: true,
    });
    expect(acciones.accionPrincipal?.destino).toBe('parametros_app');
    expect(acciones.accionSecundaria).toBeUndefined();
  });

  it('resolverAccionesFooterModalParametros con prevalidacion solo abre parametros', () => {
    const acciones = resolverAccionesFooterModalParametros({
      tienePrevalidacion: true,
      baseGenerada: false,
      calculoGenerado: false,
      resultadoGuardado: false,
    });
    expect(acciones.accionPrincipal?.destino).toBe('parametros_app');
    expect(acciones.accionSecundaria).toBeUndefined();
  });

  it('resolverAccionesFooterModalParametros con borrador solo abre parametros', () => {
    const acciones = resolverAccionesFooterModalParametros({
      tienePrevalidacion: false,
      baseGenerada: true,
      calculoGenerado: false,
      resultadoGuardado: false,
    });
    expect(acciones.accionPrincipal?.label).toBe('Abrir parámetros');
    expect(acciones.accionPrincipal?.destino).toBe('parametros_app');
  });

  it('buildParametrosOverlayContexto menciona reconciliación si hay pendiente de integración', () => {
    const ctx = buildParametrosOverlayContexto({
      parametrosOperativos: false,
      parametrosGrupos: [{ id: 'oficialesMensuales', clasificacion: 'PENDIENTE_INTEGRACION' }],
      prevalidacion: null,
    });
    expect(ctx.puntos.some((p) => p.includes('reconciliación'))).toBe(true);
  });

  it('nominaFrameCongeladoObsoleto detecta avance tras verificación congelada', () => {
    expect(
      nominaFrameCongeladoObsoleto(
        { ctaAccion: 'validarPeriodo', frame: 'sin_generar' },
        { ctaAccion: 'calcularPreliminar', frame: 'en_revision' },
      ),
    ).toBe(true);
    expect(
      nominaFrameCongeladoObsoleto(
        { ctaAccion: 'validarPeriodo', frame: 'sin_generar' },
        { ctaAccion: 'validarPeriodo', frame: 'sin_generar' },
      ),
    ).toBe(false);
  });
});
