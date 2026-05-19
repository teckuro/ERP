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
    });

    expect(vm?.tone).toBe('warning');
    expect(vm?.accionPrincipal?.destino).toBe('parametros');
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
});
