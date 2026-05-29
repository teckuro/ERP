import { describe, expect, it } from 'vitest';

import {
  contarBloqueosConfiguracionPeriodo,
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
    expect(vm.accionPrincipal.label).toBe('Verificar y generar nómina');
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
    expect(vm.accionPrincipal.label).toBe('Verificar y generar nómina');
    expect(vm.accionPrincipal.accionLocal).toBe('generarBase');
  });

  it('contarBloqueosConfiguracionPeriodo separa nómina y trabajadores', () => {
    const conteo = contarBloqueosConfiguracionPeriodo([
      bloqueoParametros,
      {
        codigo: 'BLOQ-002',
        titulo: 'Calculo bloqueado',
        descripcion: 'Revisa el periodo.',
        severidad: 'danger',
      },
      {
        codigo: 'BLOQ-006',
        titulo: 'Trabajador bloqueado',
        descripcion: 'Revisa trabajadores.',
        severidad: 'danger',
      },
    ]);
    expect(conteo).toEqual({ trabajadores: 1, nomina: 1 });
  });

  it('con bloqueo de nómina sin trabajadores pide revisar nómina', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      parametrosOperativos: true,
      bloqueosPrevalidacion: [{
        codigo: 'BLOQ-002',
        titulo: 'Periodo con bloqueos',
        descripcion: 'Revisa la nomina del periodo.',
        severidad: 'danger',
      }],
    }));

    expect(vm.estadoClave).toBe('periodo_con_pendientes');
    expect(vm.accionPrincipal.label).toBe('Revisar nómina');
    expect(vm.accionPrincipal.accionLocal).toBe('revisarBloqueos');
  });

  it('con BLOQ-006 y parametros pendientes prioriza trabajadores bloqueados', () => {
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
    expect(vm.accionPrincipal.label).toBe('Revisar trabajadores');
    expect(vm.accionPrincipal.accionLocal).toBe('revisarBloqueos');
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
    expect(vm.accionPrincipal.label).toBe('Verificar y generar nómina');
    expect(vm.etapaActiva).toBe('base');
    expect(vm.timeline.map((paso) => paso.titulo)).toEqual([
      'Generar nómina',
      'Revisar trabajadores',
      'Aprobar nómina',
      'Generar liquidaciones',
      'Cerrar proceso mensual',
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
    expect(vm.accionPrincipal.label).toBe('Calcular nómina preliminar');
    expect(vm.accionPrincipal.accionLocal).toBe('confirmarNomina');
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
    expect(vm.accionPrincipal.label).toBe('Guardar revisión');
    expect(vm.accionPrincipal.descripcion).not.toContain('resultado preliminar');
    expect(vm.queFaltaAhora.map((item) => item.titulo).join(' ')).toContain('Guardar');
    expect(vm.accionPrincipal.accionLocal).toBe('confirmarNomina');
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
    expect(vm.accionPrincipal.label).toBe('Aprobar nómina');
    expect(vm.accionPrincipal.accionLocal).toBe('aprobarResultado');
    expect(vm.etapaActiva).toBe('aprobar_cerrar');
  });

  it('aprobado sin liquidaciones dirige a generar liquidaciones (emitir antes de cerrar)', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
    }));

    expect(vm.estadoClave).toBe('aprobado_operativamente');
    expect(vm.accionPrincipal.label).toBe('Generar liquidaciones');
    expect(vm.accionPrincipal.ruta).toBe('/remuneraciones/liquidaciones');
    expect(vm.etapaActiva).toBe('liquidaciones');
  });

  it('aprobado con liquidaciones emitidas pide cerrar proceso mensual (cierre final)', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
      liquidacionesDisponibles: true,
      puedeCerrar: true,
    }));

    expect(vm.estadoClave).toBe('aprobado_operativamente');
    expect(vm.accionPrincipal.label).toBe('Cerrar proceso mensual');
    expect(vm.accionPrincipal.accionLocal).toBe('cerrarNomina');
  });

  it('trata trabajadores bloqueados y entradas bloqueantes como criticos antes de generar', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      parametrosOperativos: true,
      puedeGenerarBase: true,
      bloqueosPrevalidacion: [
        {
          codigo: 'TRABAJADORES_BLOQUEADOS_NOMINA',
          titulo: 'Trabajadores bloqueados',
          descripcion: 'Revisa trabajadores.',
          severidad: 'danger',
        },
        {
          codigo: 'ENTRADAS_BLOQUEANTES',
          titulo: 'Entradas bloqueantes',
          descripcion: 'Revisa movimientos.',
          severidad: 'danger',
        },
      ],
    }));

    expect(vm.estadoClave).toBe('periodo_con_pendientes');
    expect(vm.accionPrincipal.label).toBe('Revisar trabajadores');
  });

  it('nomina cerrada sin liquidaciones queda en solo lectura', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      cerradoOperativamente: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
    }));

    expect(vm.estadoClave).toBe('nomina_cerrada');
    expect(vm.titulo).toBe('Proceso cerrado');
    expect(vm.accionPrincipal.tipo).toBe('ninguna');
    expect(vm.etapaActiva).toBe('liquidaciones');
  });

  it('liquidaciones de otro ciclo sin nomina confirmada no ocultan confirmacion', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      liquidacionesDisponibles: true,
      cerradoOperativamente: false,
      resultadoGuardado: true,
      aprobadoOperativamente: false,
      puedeCerrar: true,
    }));

    expect(vm.estadoClave).toBe('resultado_guardado');
    expect(vm.accionPrincipal.accionLocal).toBe('aprobarResultado');
  });

  it('nomina cerrada con liquidaciones muestra cierre final diferenciado', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      liquidacionesDisponibles: true,
      cerradoOperativamente: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
    }));

    expect(vm.estadoClave).toBe('nomina_cerrada');
    expect(vm.titulo).toBe('Proceso mensual cerrado');
    expect(vm.accionPrincipal.label).toBe('Ver liquidaciones');
  });
});
