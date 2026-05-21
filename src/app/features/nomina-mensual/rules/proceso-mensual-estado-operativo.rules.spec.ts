import { describe, expect, it } from 'vitest';

import {
  resolverEstadoOperativoProcesoMensual,
  type ProcesoMensualEstadoOperativoInput,
  type ProcesoMensualPendienteVm,
} from './proceso-mensual-estado-operativo.rules';

const bloqueoParametros: ProcesoMensualPendienteVm = {
  codigo: 'BLOQ-004',
  titulo: 'Faltan parametros minimos',
  descripcion: 'Revisa parametros obligatorios.',
  severidad: 'danger',
  ruta: '/parametros',
  accionLabel: 'Revisar parametros',
};

function inputBase(overrides: Partial<ProcesoMensualEstadoOperativoInput> = {}): ProcesoMensualEstadoOperativoInput {
  return {
    periodoValido: true,
    tienePrevalidacion: false,
    parametrosOperativos: false,
    bloqueosPrevalidacion: [],
    advertenciasPrevalidacion: [],
    informacionesPrevalidacion: [],
    baseGenerada: false,
    calculoGenerado: false,
    calculoConBloqueos: false,
    calculoConAdvertencias: false,
    bloqueosCalculo: [],
    advertenciasCalculo: [],
    resultadoGuardado: false,
    aprobadoOperativamente: false,
    cerradoOperativamente: false,
    liquidacionesDisponibles: false,
    puedeGenerarBase: false,
    puedeCalcular: false,
    puedeGuardarResultado: false,
    puedeAprobar: false,
    puedeCerrar: false,
    ...overrides,
  };
}

describe('proceso-mensual-estado-operativo.rules', () => {
  it('sin prevalidacion pide verificar periodo', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase());

    expect(vm.estadoClave).toBe('pendiente_validacion');
    expect(vm.accionPrincipal.label).toBe('Verificar período');
    expect(vm.etapaActiva).toBe('validar');
    expect(vm.disclosureActivo).toBe('base');
  });

  it('con parametros bloqueantes dirige a parametros', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      parametrosOperativos: false,
      bloqueosPrevalidacion: [bloqueoParametros],
    }));

    expect(vm.estadoClave).toBe('periodo_con_pendientes');
    expect(vm.accionPrincipal.label).toBe('Revisar parámetros');
    expect(vm.accionPrincipal.ruta).toBe('/parametros');
    expect(vm.timeline[0].titulo).toBe('Generar nómina');
    expect(vm.timeline[0].estado).toBe('Actual');
  });

  it('con BLOQ-004 cumplido en resumen no bloquea generacion de nomina', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      parametrosOperativos: true,
      bloqueosPrevalidacion: [bloqueoParametros],
      puedeGenerarBase: true,
    }));

    expect(vm.estadoClave).toBe('listo_para_generar_base');
    expect(vm.accionPrincipal.label).toBe('Generar nómina');
    expect(vm.accionPrincipal.accionLocal).toBe('generarBase');
  });

  it('con BLOQ-006 y parametros pendientes prioriza parametros antes de generar', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      parametrosOperativos: false,
      bloqueosPrevalidacion: [
        bloqueoParametros,
        {
          codigo: 'BLOQ-006',
          titulo: 'Hay trabajadores bloqueados',
          descripcion: 'Revisa trabajadores.',
          severidad: 'danger',
        },
      ],
    }));

    expect(vm.estadoClave).toBe('periodo_con_pendientes');
    expect(vm.accionPrincipal.label).toBe('Revisar parámetros');
    expect(vm.accionPrincipal.ruta).toBe('/parametros');
  });

  it('validado sin bloqueos queda listo para generar base aunque exista bloqueo sintetico de base pendiente', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      puedeGenerarBase: true,
      bloqueosPrevalidacion: [{
        codigo: 'BLOQ-005',
        titulo: 'Base no generada',
        descripcion: 'Genera la base.',
        severidad: 'danger',
        accionLocal: 'generarBase',
      }],
    }));

    expect(vm.estadoClave).toBe('listo_para_generar_base');
    expect(vm.titulo).toBe('Período verificado');
    expect(vm.accionPrincipal.label).toBe('Generar nómina');
    expect(vm.etapaActiva).toBe('base');
    expect(vm.timeline.map((paso) => paso.titulo)).toEqual([
      'Generar nómina',
      'Revisar trabajadores',
      'Confirmar nómina',
      'Generar liquidaciones',
    ]);
  });

  it('borrador generado pide revisar trabajadores si hay pendientes en panel', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      puedeCalcular: true,
      revisionTrabajadoresCompleta: false,
    }));

    expect(vm.estadoClave).toBe('base_lista');
    expect(vm.accionPrincipal.label).toBe('Revisar trabajadores');
    expect(vm.disclosureActivo).toBe('calculo');
  });

  it('borrador generado sin pendientes de trabajador avanza a confirmacion', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      puedeCalcular: true,
      revisionTrabajadoresCompleta: true,
    }));

    expect(vm.estadoClave).toBe('base_lista');
    expect(vm.accionPrincipal.label).toBe('Confirmar revisión');
    expect(vm.accionPrincipal.accionLocal).toBe('calcularPreliminar');
  });

  it('calculo con bloqueos no invita a guardar', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      calculoConBloqueos: true,
      bloqueosCalculo: [{
        codigo: 'CALC-BLOQ',
        titulo: 'Trabajador bloqueado',
        descripcion: 'Revisa trabajador.',
        severidad: 'danger',
      }],
    }));

    expect(vm.estadoClave).toBe('resultado_con_bloqueos');
    expect(vm.accionPrincipal.label).toBe('Revisar trabajadores');
    expect(vm.accionPrincipal.label).not.toBe('Guardar resultado preliminar');
  });

  it('calculo sin bloqueos prepara confirmacion sin copy tecnico visible', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      puedeGuardarResultado: true,
    }));

    expect(vm.estadoClave).toBe('resultado_listo_para_guardar');
    expect(vm.accionPrincipal.label).toBe('Confirmar revisión');
    expect(vm.accionPrincipal.descripcion).not.toContain('resultado preliminar');
    expect(vm.queFaltaAhora.map((item) => item.titulo).join(' ')).not.toContain('Guardar');
  });

  it('resultado guardado pide confirmar nomina', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      resultadoGuardado: true,
      puedeAprobar: true,
    }));

    expect(vm.estadoClave).toBe('resultado_guardado');
    expect(vm.accionPrincipal.label).toBe('Confirmar nómina');
    expect(vm.etapaActiva).toBe('aprobar_cerrar');
  });

  it('nomina cerrada dirige a liquidaciones oficiales', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      cerradoOperativamente: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
    }));

    expect(vm.estadoClave).toBe('nomina_cerrada');
    expect(vm.accionPrincipal.label).toBe('Generar liquidaciones');
    expect(vm.etapaActiva).toBe('liquidaciones');
  });
});
