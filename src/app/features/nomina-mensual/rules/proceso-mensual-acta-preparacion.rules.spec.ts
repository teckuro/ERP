import { describe, expect, it } from 'vitest';

import {
  buildActaPreparacionCentral,
  buildPendientesActaPreparacion,
  ctaLabelPreparacionNominaEnCurso,
  informacionDebeAbrirModalEnPreparacion,
  mensajePreparacionNominaEnCurso,
  puedeEncadenarGeneracionTrasVerificacion,
  previewTrabajadoresPreparacion,
} from './proceso-mensual-acta-preparacion.rules';
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
      movimientosAprobados: 2,
      asignacionesAplicables: 1,
      informacionPeriodo: null,
    });

    expect(vm.etapa).toBe('Generar nómina');
    expect(vm.ctaLabel).toBe('Verificar y generar nómina');
    expect(vm.resumenVerificacion).toBeNull();
    expect(vm.contextoPeriodo).toBeNull();
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
    expect(pendientes[0].accionLabel).toBe('Revisar parámetros');
    expect(pendientes[0].destino).toBe('parametros_app');
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
      movimientosAprobados: 2,
      asignacionesAplicables: 1,
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
    expect(vm.ctaLabel).toBe('Corregir pendientes');
  });

  it('buildActaPreparacionCentral con prevalidación expone resumen y contexto', () => {
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
      movimientosAprobados: 2,
      asignacionesAplicables: 1,
      informacionPeriodo: {
        tone: 'success',
        titulo: 'Período listo para generar',
        resumenVerificacion: { criticos: 0, advertencias: 1, trabajadoresPendientes: 0 },
      },
    });

    expect(vm.previewLinea).toContain('1 trabajador listo');
    expect(vm.resumenVerificacion?.advertencias).toBe(1);
    expect(vm.contextoPeriodo?.trabajadoresAptos).toBe(1);
    expect(vm.estadoResultado).toBe('advertencias');
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
      movimientosAprobados: 0,
      asignacionesAplicables: 0,
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
