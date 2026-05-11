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
  it('sin prevalidacion pide validar periodo', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase());

    expect(vm.estadoClave).toBe('pendiente_validacion');
    expect(vm.accionPrincipal.label).toBe('Validar periodo');
    expect(vm.etapaActiva).toBe('validar');
    expect(vm.disclosureActivo).toBe('base');
  });

  it('con parametros bloqueantes dirige a parametros', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      bloqueosPrevalidacion: [bloqueoParametros],
    }));

    expect(vm.estadoClave).toBe('periodo_con_pendientes');
    expect(vm.accionPrincipal.label).toBe('Revisar parametros');
    expect(vm.accionPrincipal.ruta).toBe('/parametros');
    expect(vm.timeline[0].titulo).toBe('Preparacion');
    expect(vm.timeline[0].estado).toBe('Actual');
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
    expect(vm.accionPrincipal.label).toBe('Generar base de nomina');
    expect(vm.etapaActiva).toBe('base');
    expect(vm.timeline.map((paso) => paso.titulo)).toEqual([
      'Preparacion',
      'Revision',
      'Aprobacion y cierre',
      'Liquidaciones',
    ]);
  });

  it('base generada pide calcular preliminar', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      puedeCalcular: true,
    }));

    expect(vm.estadoClave).toBe('base_lista');
    expect(vm.accionPrincipal.label).toBe('Calcular preliminar');
    expect(vm.disclosureActivo).toBe('calculo');
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
    expect(vm.accionPrincipal.label).toBe('Revisar bloqueos');
    expect(vm.accionPrincipal.label).not.toBe('Guardar resultado preliminar');
  });

  it('resultado guardado pide aprobacion operativa', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      tienePrevalidacion: true,
      baseGenerada: true,
      calculoGenerado: true,
      resultadoGuardado: true,
      puedeAprobar: true,
    }));

    expect(vm.estadoClave).toBe('resultado_guardado');
    expect(vm.accionPrincipal.label).toBe('Aprobar resultado preliminar');
    expect(vm.etapaActiva).toBe('aprobar_cerrar');
  });

  it('nomina cerrada dirige a liquidaciones oficiales', () => {
    const vm = resolverEstadoOperativoProcesoMensual(inputBase({
      cerradoOperativamente: true,
      resultadoGuardado: true,
      aprobadoOperativamente: true,
    }));

    expect(vm.estadoClave).toBe('nomina_cerrada');
    expect(vm.accionPrincipal.label).toBe('Ir a liquidaciones oficiales');
    expect(vm.etapaActiva).toBe('liquidaciones');
  });
});
