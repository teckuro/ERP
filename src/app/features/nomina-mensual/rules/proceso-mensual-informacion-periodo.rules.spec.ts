import { describe, expect, it } from 'vitest';
import { buildInformacionPeriodoView, resolveDetalleTabForRevision } from './proceso-mensual-informacion-periodo.rules';
import type { ValidacionCalculoPreliminarView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';

function validacionBase(overrides: Partial<ValidacionCalculoPreliminarView> = {}): ValidacionCalculoPreliminarView {
  return {
    estado: 'listo',
    estadoLabel: 'Listo',
    puedeCalcular: true,
    siguienteAccion: {
      label: 'Generar nómina',
      descripcion: 'Valida el período.',
      accionLocal: 'validarPeriodo',
    },
    bloqueos: [],
    advertencias: [],
    informaciones: [],
    ...overrides,
  };
}

describe('proceso-mensual-informacion-periodo.rules', () => {
  it('devuelve null sin error ni bloqueos tras actividad', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: null,
      validacionCalculo: validacionBase(),
      paraContinuar: [],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'sin_generar',
      tienePrevalidacion: false,
      puedeGenerarNomina: false,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneResultado: false,
      trabajadoresPendientesRevision: [],
      prevalidacionEstado: null,
    });
    expect(vm).toBeNull();
  });

  it('tras verificar periodo listo muestra modal de exito con generar nomina', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: null,
      validacionCalculo: validacionBase(),
      paraContinuar: [],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'sin_generar',
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneResultado: false,
      trabajadoresPendientesRevision: [],
      prevalidacionEstado: 'LISTO_PARA_CALCULO',
    });

    expect(vm?.tone).toBe('success');
    expect(vm?.titulo).toBe('Período listo para generar');
    expect(vm?.accionPrincipal?.destino).toBe('generar_nomina');
  });

  it('tras verificar con bloqueos criticos muestra seccion criticos', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: null,
      validacionCalculo: validacionBase({
        bloqueos: [
          { codigo: 'BLOQ-004', titulo: 'Parámetros', descripcion: 'Faltan datos', severidad: 'bloqueo', ruta: '/parametros' },
          { codigo: 'BLOQ-005', titulo: 'Sin nómina', descripcion: 'Generar', severidad: 'bloqueo' },
        ],
      }),
      paraContinuar: [],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'sin_generar',
      tienePrevalidacion: true,
      puedeGenerarNomina: false,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneResultado: false,
      trabajadoresPendientesRevision: [],
      prevalidacionEstado: null,
    });

    expect(vm?.titulo).toBe('Revisión del período antes de generar');
    expect(vm?.secciones?.some((s) => s.titulo === 'Críticos')).toBe(true);
    expect(vm?.accionPrincipal?.destino).toBe('parametros');
  });

  it('arma informacion cuando hay error de ejecucion', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: 'rpc_validar_periodo timeout',
      validacionCalculo: validacionBase({
        estado: 'bloqueado',
        siguienteAccion: { label: 'Reintentar validación', descripcion: 'Fallo de red', accionLocal: 'validarPeriodo' },
        bloqueos: [{ codigo: 'BLOQ-002', titulo: 'Error', descripcion: 'x', severidad: 'bloqueo' }],
      }),
      paraContinuar: [{ titulo: 'Período', detalle: 'Revisar validación' }],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'sin_generar',
      tienePrevalidacion: false,
      puedeGenerarNomina: false,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneResultado: false,
      trabajadoresPendientesRevision: [],
      prevalidacionEstado: null,
    });

    expect(vm?.tone).toBe('danger');
    expect(vm?.accionPrincipal?.destino).toBe('reintentar');
    expect(vm?.reintentarAccion).toBe('validarPeriodo');
    expect(vm?.bajada).not.toContain('rpc_');
  });

  it('arma informacion post-generacion con bloqueos', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: null,
      validacionCalculo: validacionBase({
        bloqueos: [{ codigo: 'PARAM_MIN_topes', titulo: 'Parámetros', descripcion: 'Falta tope', severidad: 'bloqueo' }],
      }),
      paraContinuar: [],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'con_pendientes',
      tienePrevalidacion: true,
      puedeGenerarNomina: false,
      tienePreNomina: true,
      tieneCalculo: false,
      tieneResultado: true,
      trabajadoresPendientesRevision: [],
      prevalidacionEstado: null,
    });

    expect(vm?.tone).toBe('warning');
    expect(vm?.accionPrincipal?.destino).toBe('parametros');
  });

  it('con trabajadores no aptos prioriza revisar fichas y lista nominal', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: null,
      validacionCalculo: validacionBase({
        estado: 'advertencias',
        advertencias: [
          {
            codigo: 'TRABAJADORES_BLOQUEADOS_NOMINA',
            titulo: 'Trabajadores por revisar',
            descripcion: 'Existen trabajadores activos no aptos.',
            severidad: 'advertencia',
          },
        ],
      }),
      paraContinuar: [],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'sin_generar',
      tienePrevalidacion: true,
      puedeGenerarNomina: true,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneResultado: false,
      prevalidacionEstado: 'CON_ADVERTENCIAS',
      trabajadoresPendientesRevision: [
        {
          idPersona: 7,
          nombre: 'María López',
          rut: '12.345.678-9',
          motivo: 'Ficha incompleta',
          estadoFicha: 'INCOMPLETO',
          aptoParaRemuneraciones: true,
        },
      ],
    });

    expect(vm?.accionPrincipal).toEqual({ label: 'Revisar trabajadores', destino: 'trabajadores_fichas' });
    expect(vm?.accionSecundaria?.destino).toBe('generar_nomina');
    expect(vm?.bajada).toContain('1 trabajador');
    expect(vm?.resumenVerificacion?.trabajadoresPendientes).toBe(1);
    expect(vm?.trabajadoresPendientes?.[0].nombre).toBe('María López');
    expect(vm?.secciones?.some((s) => s.titulo.startsWith('Trabajadores a corregir'))).toBeFalsy();
  });

  it('con bloqueos críticos y trabajadores pendientes fusiona secciones y lista accionable', () => {
    const vm = buildInformacionPeriodoView({
      errorEjecucion: null,
      validacionCalculo: validacionBase({
        bloqueos: [{ codigo: 'PARAM_MIN_topes', titulo: 'Parámetros', descripcion: 'Falta tope', severidad: 'bloqueo' }],
      }),
      paraContinuar: [],
      bloqueosOperativos: [],
      advertenciasOperativas: [],
      nominaFrame: 'sin_generar',
      tienePrevalidacion: true,
      puedeGenerarNomina: false,
      tienePreNomina: false,
      tieneCalculo: false,
      tieneResultado: false,
      trabajadoresPendientesRevision: [
        {
          idPersona: 3,
          nombre: 'Pedro Díaz',
          rut: '9.876.543-2',
          motivo: 'Ficha incompleta',
          detalleCorreccion: 'Completar previsión y salud.',
          estadoFicha: 'INCOMPLETO',
          aptoParaRemuneraciones: false,
        },
      ],
      prevalidacionEstado: null,
    });

    expect(vm?.tone).toBe('warning');
    expect(vm?.accionPrincipal?.destino).toBe('parametros');
    expect(vm?.accionSecundaria).toEqual({ label: 'Revisar trabajadores', destino: 'trabajadores_fichas' });
    expect(vm?.bajada).toContain('1 trabajador');
    expect(vm?.trabajadoresPendientes).toHaveLength(1);
    expect(vm?.resumenVerificacion?.trabajadoresPendientes).toBe(1);
    expect(vm?.secciones?.some((s) => s.titulo === 'Críticos')).toBe(true);
    expect(vm?.secciones?.some((s) => s.titulo.startsWith('Trabajadores a corregir'))).toBeFalsy();
  });

  it('resuelve tab contextual desde codigo PARAMETROS', () => {
    const tab = resolveDetalleTabForRevision({
      errorEjecucion: null,
      validacionCalculo: validacionBase(),
      bloqueosOperativos: [
        {
          codigo: 'PARAMETROS',
          titulo: 'Parámetros',
          descripcion: 'Grupos incompletos',
          severidad: 'danger',
        },
      ],
      advertenciasOperativas: [],
    });
    expect(tab).toBe('parametros');
  });

  it('con parametros listos omite pendiente PARAM y prioriza otro ambito', () => {
    const tab = resolveDetalleTabForRevision({
      errorEjecucion: null,
      validacionCalculo: validacionBase(),
      bloqueosOperativos: [],
      advertenciasOperativas: [
        {
          codigo: 'PARAM_MIN_X',
          titulo: 'Parámetro opcional',
          descripcion: 'Opcional',
          severidad: 'warning',
        },
        {
          codigo: 'ADV-003',
          titulo: 'Ficha pendiente',
          descripcion: 'Revise ficha',
          severidad: 'warning',
        },
      ],
      parametrosListos: true,
    });
    expect(tab).toBe('trabajadores');
  });
});
