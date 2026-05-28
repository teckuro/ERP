import { describe, expect, it } from 'vitest';

import type { ProcesoMensualGrupoParametro } from '../models/proceso-mensual.model';
import {
  buildActaPreparacionCentral,
  buildPendientesActaPreparacion,
  ctaLabelPreparacionNominaEnCurso,
  informacionDebeAbrirModalEnPreparacion,
  LABEL_ABRIR_PARAMETROS,
  mergeResumenVerificacionActa,
  mensajePreparacionNominaEnCurso,
  NOTA_DOS_FUENTES_PARAMETROS,
  puedeEncadenarGeneracionTrasVerificacion,
  previewTrabajadoresPreparacion,
  actaPendienteMuestraAccionInline,
  shellDebeOcultarCtaParametros,
} from './proceso-mensual-acta-preparacion.rules';
import { LABEL_CONFIGURACION_PERIODO } from './proceso-mensual-parametros-refresh.rules';
import type { InformacionPeriodoView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

describe('proceso-mensual-acta-preparacion.rules', () => {
  it('previewTrabajadoresPreparacion prioriza aptos', () => {
    expect(previewTrabajadoresPreparacion({ trabajadoresAptos: 1, trabajadoresPorRevisar: 2 }))
      .toBe('1 trabajador listo para nómina.');
    expect(previewTrabajadoresPreparacion({ trabajadoresAptos: 0, trabajadoresPorRevisar: 2 }))
      .toBe('2 trabajadores por revisar antes de generar.');
  });

  it('buildActaPreparacionCentral usa etapa activa y CTA unificado sin prevalidación', () => {
    const vm = buildActaPreparacionCentral({
      etapasRail: [{
        clave: 'base',
        etiqueta: 'Generar nómina',
        estadoCorto: 'En curso',
        marca: 'actual',
        activa: true,
      }],
      accionPrincipal: {
        label: 'Verificar y generar nómina',
        descripcion: 'Arma borrador',
        tipo: 'local',
        accionLocal: 'validarPeriodo',
      },
      tienePrevalidacion: false,
      trabajadoresAptos: 1,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 0,
      advertenciasCount: 0,
      validacionCriticos: 0,
      validacionAdvertencias: 0,
      accionPeriodoEnCurso: false,
      validando: false,
      generandoPreNomina: false,
      preparacionNominaUnificada: false,
      frameTexto: 'Texto frame',
      periodoEtiqueta: 'Mayo 2026',
      informacionPeriodo: null,
    });

    expect(vm.etapa).toBe('Generar nómina');
    expect(vm.ctaLabel).toBe('Verificar y generar nómina');
    expect(vm.resumenVerificacion).toBeNull();
    expect(vm.pendientes).toEqual([]);
  });

  it('buildPendientesActaPreparacion expone criticos con accion de parametros', () => {
    const pendientes = buildPendientesActaPreparacion({
      tone: 'warning',
      titulo: 'Revisión del período antes de generar',
      secciones: [{
        titulo: 'Críticos',
        items: ['Parámetros del período pendientes: Falta UF'],
        detalles: [{
          titulo: 'Parámetros del período pendientes',
          descripcion: 'Revise UF, UTM y sueldos mínimos del período.',
          accionLabel: 'Revisar parámetros',
          ruta: '/parametros',
        }],
      }],
    });

    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].severidad).toBe('bloqueo');
    expect(pendientes[0].titulo).toBe('Datos oficiales del período');
    expect(pendientes[0].accionLabel).toBe('Revisar parámetros');
    expect(pendientes[0].destino).toBe('parametros_app');
  });

  it('buildPendientesActaPreparacion humaniza Falta dato oficial sanna', () => {
    const pendientes = buildPendientesActaPreparacion(
      {
        tone: 'warning',
        titulo: 'Revisión del período antes de generar',
        secciones: [{
          titulo: 'Advertencias',
          items: [],
          detalles: [{
            titulo: 'Parámetros del período por revisar',
            descripcion: 'Parámetros del período pendientes: Falta dato oficial: sanna.',
            accionLabel: 'Revisar parámetros',
            ruta: '/parametros',
          }],
        }],
      },
      { textosDetalleParametros: ['Falta dato oficial: sanna.'] },
    );

    const sanna = pendientes.find((p) => p.titulo.includes('SANNA'));
    expect(sanna?.descripcion).toContain('SANNA');
    expect(sanna?.descripcion).not.toMatch(/\bsanna\b/);
    expect(sanna?.descripcion).not.toMatch(/pendientes:/i);
  });

  it('buildPendientesActaPreparacion incluye configuracion del periodo si no operativos', () => {
    const pendientes = buildPendientesActaPreparacion(null, {
      parametrosOperativos: false,
      estadoConfiguracionPeriodo: 'Faltan datos',
      parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'OK' }],
    });
    expect(pendientes.some((p) => p.titulo === LABEL_CONFIGURACION_PERIODO)).toBe(true);
  });

  it('actaPendienteMuestraAccionInline nunca muestra boton inline hacia parametros', () => {
    const acta = { ctaLabel: LABEL_ABRIR_PARAMETROS };
    expect(actaPendienteMuestraAccionInline({
      severidad: 'bloqueo',
      titulo: 'UF mensual',
      descripcion: 'En cero',
      accionLabel: 'Revisar parámetros',
      destino: 'parametros_app',
    }, acta)).toBe(false);
    expect(actaPendienteMuestraAccionInline({
      severidad: 'bloqueo',
      titulo: LABEL_CONFIGURACION_PERIODO,
      descripcion: 'Faltan datos',
      accionLabel: null,
      destino: 'parametros_app',
    }, acta)).toBe(false);
  });

  it('actaPendienteMuestraAccionInline muestra boton para ficha de trabajador', () => {
    expect(actaPendienteMuestraAccionInline({
      severidad: 'advertencia',
      titulo: 'Juan Pérez',
      descripcion: 'Ficha incompleta',
      accionLabel: 'Revisar ficha',
      destino: 'trabajadores_fichas',
      idPersona: 1,
    }, { ctaLabel: LABEL_ABRIR_PARAMETROS })).toBe(true);
  });

  it('actaPendienteMuestraAccionInline oculta boton duplicado hacia parametros en acta completa', () => {
    const acta = buildActaPreparacionCentral({
      etapasRail: [{ clave: 'validar', etiqueta: 'Verificar', estadoCorto: 'En curso', marca: 'actual', activa: true }],
      accionPrincipal: { label: 'X', descripcion: '', tipo: 'local', accionLocal: 'validarPeriodo' },
      tienePrevalidacion: true,
      trabajadoresAptos: 0,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 1,
      advertenciasCount: 0,
      validacionCriticos: 1,
      validacionAdvertencias: 0,
      accionPeriodoEnCurso: false,
      validando: false,
      generandoPreNomina: false,
      preparacionNominaUnificada: false,
      frameTexto: '',
      periodoEtiqueta: 'Mayo 2026',
      informacionPeriodo: {
        tone: 'danger',
        titulo: 'Revisión',
        accionPrincipal: { label: 'Abrir parámetros', destino: 'parametros_app' },
      },
      parametrosOperativos: false,
      estadoConfiguracionPeriodo: 'Faltan datos',
      parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE' }],
    });
    const pendienteParam = acta.pendientes.find((p) => p.destino === 'parametros_app');
    expect(pendienteParam).toBeTruthy();
    expect(actaPendienteMuestraAccionInline(pendienteParam!, acta)).toBe(false);
    expect(acta.ctaLabel).toBe(LABEL_ABRIR_PARAMETROS);
  });

  it('buildActaPreparacionCentral oculta mensaje generico si hay pendientes detallados', () => {
    const vm = buildActaPreparacionCentral({
      etapasRail: [{
        clave: 'validar',
        etiqueta: 'Verificar y generar nómina',
        estadoCorto: 'En curso',
        marca: 'actual',
        activa: true,
      }],
      accionPrincipal: {
        label: 'Revisar parámetros',
        descripcion: 'Corrige parámetros',
        tipo: 'ruta',
        ruta: '/parametros',
      },
      tienePrevalidacion: true,
      trabajadoresAptos: 1,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 1,
      advertenciasCount: 0,
      validacionCriticos: 1,
      validacionAdvertencias: 0,
      accionPeriodoEnCurso: false,
      validando: false,
      generandoPreNomina: false,
      preparacionNominaUnificada: false,
      frameTexto: 'Texto frame',
      periodoEtiqueta: 'Mayo 2026',
      informacionPeriodo: {
        tone: 'warning',
        titulo: 'Revisión del período antes de generar',
        bajada: 'Corrige los puntos críticos antes de generar la nómina mensual.',
        secciones: [{
          titulo: 'Críticos',
          items: ['Parámetros del período pendientes: Falta UF'],
          detalles: [{
            titulo: 'Parámetros del período pendientes',
            descripcion: 'Revise UF, UTM y sueldos mínimos del período.',
            accionLabel: 'Revisar parámetros',
            ruta: '/parametros',
          }],
        }],
        accionPrincipal: { label: 'Corregir pendientes', destino: 'parametros' },
      },
    });

    expect(vm.pendientes).toHaveLength(1);
    expect(vm.mensajeEstado).toBeNull();
    expect(vm.alertasEtiqueta).toBeNull();
    expect(vm.ctaLabel).toBe(LABEL_ABRIR_PARAMETROS);
    expect(shellDebeOcultarCtaParametros(vm)).toBe(true);
  });

  it('buildPendientesActaPreparacion expande grupos y varios Falta dato oficial', () => {
    const grupos: ProcesoMensualGrupoParametro[] = [
      { id: 'oficial_mensual', clasificacion: 'FALTANTE', detalle: 'Por corregir en Datos oficiales del período.' },
      { id: 'sis_fila_mensual', clasificacion: 'PARCIAL', detalle: 'Parcial en SIS del período.' },
    ];
    const pendientes = buildPendientesActaPreparacion(
      {
        tone: 'warning',
        titulo: 'Revisión del período antes de generar',
        secciones: [{
          titulo: 'Críticos',
          items: ['Parámetros del período pendientes: Falta dato oficial: sanna.'],
        }],
      },
      {
        parametrosGrupos: grupos,
        textosDetalleParametros: [
          'Parámetros del período pendientes: Falta dato oficial: sanna.',
          'Falta dato oficial: uf.',
          'Falta dato oficial: utm.',
        ],
      },
    );

    expect(pendientes.length).toBeGreaterThanOrEqual(3);
    expect(pendientes.some((p) => p.titulo.includes('SANNA'))).toBe(true);
    expect(pendientes.some((p) => p.titulo.includes('UF mensual'))).toBe(true);
    expect(pendientes.some((p) => p.titulo.includes('SIS'))).toBe(true);
  });

  it('buildActaPreparacionCentral expone nota dos fuentes y resumen alineado', () => {
    const vm = buildActaPreparacionCentral({
      etapasRail: [{
        clave: 'validar',
        etiqueta: 'Verificar y generar nómina',
        estadoCorto: 'En curso',
        marca: 'actual',
        activa: true,
      }],
      accionPrincipal: {
        label: 'Verificar y generar nómina',
        descripcion: 'Verificar',
        tipo: 'local',
        accionLocal: 'validarPeriodo',
      },
      tienePrevalidacion: true,
      trabajadoresAptos: 1,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 1,
      advertenciasCount: 0,
      validacionCriticos: 1,
      validacionAdvertencias: 0,
      accionPeriodoEnCurso: false,
      validando: false,
      generandoPreNomina: false,
      preparacionNominaUnificada: false,
      frameTexto: 'Texto',
      periodoEtiqueta: 'Mayo 2026',
      parametrosOperativos: false,
      parametrosGrupos: [
        { id: 'oficial_mensual', clasificacion: 'FALTANTE' },
        { id: 'afc_catalogo', clasificacion: 'FALTANTE' },
      ],
      textosDetalleParametros: ['Falta dato oficial: uf.', 'Falta dato oficial: utm.'],
      informacionPeriodo: {
        tone: 'warning',
        titulo: 'Revisión del período antes de generar',
        resumenVerificacion: { criticos: 1, advertencias: 0, trabajadoresPendientes: 0 },
        accionPrincipal: { label: 'Corregir pendientes', destino: 'parametros_app' },
      },
    });

    expect(vm.notaFuentesParametros).toBe(NOTA_DOS_FUENTES_PARAMETROS);
    expect(vm.resumenVerificacion?.criticos).toBeGreaterThanOrEqual(2);
    expect(vm.ctaLabel).toBe(LABEL_ABRIR_PARAMETROS);
  });

  it('mergeResumenVerificacionActa toma el máximo entre base y pendientes', () => {
    expect(
      mergeResumenVerificacionActa(
        { criticos: 1, advertencias: 0, trabajadoresPendientes: 0 },
        [
          { severidad: 'bloqueo', titulo: 'A', descripcion: '', accionLabel: null, destino: 'parametros_app' },
          { severidad: 'bloqueo', titulo: 'B', descripcion: '', accionLabel: null, destino: 'parametros_app' },
          { severidad: 'advertencia', titulo: 'C', descripcion: '', accionLabel: null, destino: null },
        ],
      ),
    ).toEqual({ criticos: 2, advertencias: 1, trabajadoresPendientes: 0 });
  });

  it('buildActaPreparacionCentral con prevalidación expone resumen sin bloque contexto', () => {
    const vm = buildActaPreparacionCentral({
      etapasRail: [{
        clave: 'base',
        etiqueta: 'Generar nómina',
        estadoCorto: 'En curso',
        marca: 'actual',
        activa: true,
      }],
      accionPrincipal: {
        label: 'Generar nómina',
        descripcion: 'Arma borrador',
        tipo: 'local',
        accionLocal: 'generarBase',
      },
      tienePrevalidacion: true,
      trabajadoresAptos: 1,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 0,
      advertenciasCount: 1,
      validacionCriticos: 0,
      validacionAdvertencias: 1,
      accionPeriodoEnCurso: false,
      validando: false,
      generandoPreNomina: false,
      preparacionNominaUnificada: false,
      frameTexto: 'Texto frame',
      periodoEtiqueta: 'Mayo 2026',
      informacionPeriodo: {
        tone: 'success',
        titulo: 'Período listo para generar',
        resumenVerificacion: { criticos: 0, advertencias: 1, trabajadoresPendientes: 0 },
      },
    });

    expect(vm.previewLinea).toContain('1 trabajador listo');
    expect(vm.resumenVerificacion?.advertencias).toBe(1);
    expect(vm.titulo).toBe('Generar nómina');
    expect(vm.estadoResultado).toBe('advertencias');
  });

  it('buildActaPreparacionCentral con pendientes usa descripcion corta', () => {
    const vm = buildActaPreparacionCentral({
      etapasRail: [{
        clave: 'base',
        etiqueta: 'Verificar y generar nómina',
        estadoCorto: 'En curso',
        marca: 'actual',
        activa: true,
      }],
      accionPrincipal: {
        label: 'Generar nómina',
        descripcion: 'Arma borrador',
        tipo: 'local',
        accionLocal: 'generarBase',
      },
      tienePrevalidacion: true,
      trabajadoresAptos: 1,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 1,
      advertenciasCount: 0,
      validacionCriticos: 1,
      validacionAdvertencias: 0,
      accionPeriodoEnCurso: false,
      validando: false,
      generandoPreNomina: false,
      preparacionNominaUnificada: false,
      frameTexto: 'Texto frame',
      periodoEtiqueta: 'Mayo 2026',
      informacionPeriodo: {
        tone: 'danger',
        titulo: 'Revisión del período antes de generar',
        bajada: 'Texto largo duplicado que no debería repetirse.',
        resumenVerificacion: { criticos: 1, advertencias: 0, trabajadoresPendientes: 0 },
      },
      parametrosGrupos: [{ id: 'mensuales_uf_utm_sueldo', clasificacion: 'FALTANTE' }],
    });
    expect(vm.descripcion).toContain('puntos indicados');
    expect(vm.pendientes.length).toBeGreaterThan(0);
  });

  it('informacionDebeAbrirModalEnPreparacion no abre modal en camino feliz', () => {
    const view: InformacionPeriodoView = {
      tone: 'success',
      titulo: 'Período listo para generar',
      resumenVerificacion: { criticos: 0, advertencias: 0, trabajadoresPendientes: 0 },
    };
    expect(informacionDebeAbrirModalEnPreparacion(view, true)).toBe(false);
    expect(informacionDebeAbrirModalEnPreparacion(view, false)).toBe(true);

    const revision: InformacionPeriodoView = {
      tone: 'warning',
      titulo: 'Revisión requerida antes de continuar',
      bajada: 'Hay puntos del período que debes revisar antes de confirmar o guardar.',
    };
    expect(informacionDebeAbrirModalEnPreparacion(revision, true)).toBe(false);
  });

  it('preparacion unificada usa un solo mensaje de carga', () => {
    expect(mensajePreparacionNominaEnCurso()).toBe('Verificando y generando nómina');
    const vm = buildActaPreparacionCentral({
      etapasRail: [{
        clave: 'validar',
        etiqueta: 'Verificar y generar nómina',
        estadoCorto: 'En curso',
        marca: 'actual',
        activa: true,
      }],
      accionPrincipal: {
        label: 'Verificar y generar nómina',
        descripcion: 'Arma borrador',
        tipo: 'local',
        accionLocal: 'validarPeriodo',
      },
      tienePrevalidacion: false,
      trabajadoresAptos: 0,
      trabajadoresPorRevisar: 0,
      trabajadoresPendientesRevisionCount: 0,
      bloqueosCount: 0,
      advertenciasCount: 0,
      validacionCriticos: 0,
      validacionAdvertencias: 0,
      accionPeriodoEnCurso: true,
      validando: true,
      generandoPreNomina: false,
      preparacionNominaUnificada: true,
      frameTexto: 'Texto frame',
      periodoEtiqueta: 'Mayo 2026',
      informacionPeriodo: null,
    });
    expect(vm.ctaLabel).toBe(ctaLabelPreparacionNominaEnCurso());
    expect(vm.ctaLoading).toBe(true);
  });

  it('puedeEncadenarGeneracionTrasVerificacion requiere camino sin bloqueos ni fichas', () => {
    expect(puedeEncadenarGeneracionTrasVerificacion({
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      prevalidacionEstado: 'LISTO_PARA_CALCULO',
      validacionCalculo: {
        bloqueos: [],
        advertencias: [],
        informaciones: [],
        estado: 'listo',
        estadoLabel: 'Listo',
        puedeCalcular: false,
        siguienteAccion: { label: '', descripcion: '' },
      },
      trabajadoresPendientesCount: 0,
    })).toBe(true);

    expect(puedeEncadenarGeneracionTrasVerificacion({
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      prevalidacionEstado: 'LISTO_PARA_CALCULO',
      validacionCalculo: {
        bloqueos: [{ codigo: 'X', titulo: 't', descripcion: 'd', severidad: 'bloqueo' }],
        advertencias: [],
        informaciones: [],
        estado: 'bloqueado',
        estadoLabel: 'Bloqueado',
        puedeCalcular: false,
        siguienteAccion: { label: '', descripcion: '' },
      },
      trabajadoresPendientesCount: 0,
    })).toBe(false);

    expect(puedeEncadenarGeneracionTrasVerificacion({
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      prevalidacionEstado: 'LISTO_PARA_CALCULO',
      validacionCalculo: {
        bloqueos: [],
        advertencias: [],
        informaciones: [],
        estado: 'listo',
        estadoLabel: 'Listo',
        puedeCalcular: false,
        siguienteAccion: { label: '', descripcion: '' },
      },
      trabajadoresPendientesCount: 1,
    })).toBe(false);
  });
});
