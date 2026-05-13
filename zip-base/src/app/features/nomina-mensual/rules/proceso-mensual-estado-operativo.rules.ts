export type ProcesoMensualEstadoClave =
  | 'pendiente_validacion'
  | 'periodo_con_pendientes'
  | 'listo_para_generar_base'
  | 'base_lista'
  | 'resultado_con_bloqueos'
  | 'resultado_preliminar_revisable'
  | 'resultado_listo_para_guardar'
  | 'resultado_guardado'
  | 'aprobado_operativamente'
  | 'nomina_cerrada'
  | 'liquidaciones_disponibles';

export type ProcesoMensualEtapaClave = 'validar' | 'base' | 'calculo' | 'guardar' | 'aprobar_cerrar' | 'liquidaciones';
export type ProcesoMensualDisclosureClave = 'base' | 'calculo' | 'guardado' | 'aprobacion' | 'cierre' | 'liquidaciones';
export type ProcesoMensualEstadoSeveridad = 'neutral' | 'info' | 'warning' | 'danger' | 'success';
export type ProcesoMensualTimelineEstado = 'Actual' | 'Completo' | 'Pendiente' | 'Bloqueada';

export type ProcesoMensualAccionLocal =
  | 'validarPeriodo'
  | 'generarBase'
  | 'actualizarBase'
  | 'calcularPreliminar'
  | 'guardarResultado'
  | 'aprobarResultado'
  | 'cerrarNomina'
  | 'revisarBloqueos';

export interface ProcesoMensualPendienteVm {
  codigo: string;
  titulo: string;
  descripcion: string;
  severidad: ProcesoMensualEstadoSeveridad;
  ruta?: string;
  accionLocal?: ProcesoMensualAccionLocal;
  accionLabel?: string;
}

export interface ProcesoMensualAccionPrincipalVm {
  label: string;
  descripcion: string;
  tipo: 'local' | 'ruta' | 'ninguna';
  ruta?: string;
  accionLocal?: ProcesoMensualAccionLocal;
  disabled?: boolean;
  disabledReason?: string;
}

export interface ProcesoMensualTimelineItemVm {
  numero: string;
  titulo: string;
  estado: ProcesoMensualTimelineEstado;
  descripcion: string;
}

export interface ProcesoMensualEstadoOperativoVm {
  estadoClave: ProcesoMensualEstadoClave;
  titulo: string;
  descripcion: string;
  severidad: ProcesoMensualEstadoSeveridad;
  accionPrincipal: ProcesoMensualAccionPrincipalVm;
  etapaActiva: ProcesoMensualEtapaClave;
  disclosureActivo: ProcesoMensualDisclosureClave;
  timeline: ProcesoMensualTimelineItemVm[];
  queFaltaAhora: ProcesoMensualPendienteVm[];
  accionesRapidas: ProcesoMensualPendienteVm[];
  bloqueos: ProcesoMensualPendienteVm[];
  advertencias: ProcesoMensualPendienteVm[];
  informaciones: ProcesoMensualPendienteVm[];
}

export interface ProcesoMensualEstadoOperativoInput {
  periodoValido: boolean;
  tienePrevalidacion: boolean;
  bloqueosPrevalidacion: ProcesoMensualPendienteVm[];
  advertenciasPrevalidacion: ProcesoMensualPendienteVm[];
  informacionesPrevalidacion: ProcesoMensualPendienteVm[];
  baseGenerada: boolean;
  calculoGenerado: boolean;
  calculoConBloqueos: boolean;
  calculoConAdvertencias: boolean;
  bloqueosCalculo: ProcesoMensualPendienteVm[];
  advertenciasCalculo: ProcesoMensualPendienteVm[];
  resultadoGuardado: boolean;
  aprobadoOperativamente: boolean;
  cerradoOperativamente: boolean;
  liquidacionesDisponibles: boolean;
  puedeGenerarBase: boolean;
  puedeCalcular: boolean;
  puedeGuardarResultado: boolean;
  puedeAprobar: boolean;
  puedeCerrar: boolean;
  razonNoPuedeGuardar?: string;
  razonNoPuedeAprobar?: string;
  razonNoPuedeCerrar?: string;
}

const ACCESOS_RAPIDOS: ProcesoMensualPendienteVm[] = [
  {
    codigo: 'MOVIMIENTOS_MES',
    titulo: 'Movimientos del mes',
    descripcion: 'Revisar bonos, descuentos, anticipos o ajustes del periodo.',
    severidad: 'neutral',
    ruta: '/remuneraciones/novedades-mensuales',
    accionLabel: 'Revisar movimientos del mes',
  },
  {
    codigo: 'ASIGNACIONES_RECURRENTES',
    titulo: 'Asignaciones recurrentes',
    descripcion: 'Revisar asignaciones vigentes que entran a la base.',
    severidad: 'neutral',
    ruta: '/remuneraciones/haberes-descuentos',
    accionLabel: 'Revisar asignaciones recurrentes',
  },
  {
    codigo: 'PARAMETROS',
    titulo: 'Parametros',
    descripcion: 'Revisar parametros operativos del periodo.',
    severidad: 'neutral',
    ruta: '/parametros',
    accionLabel: 'Revisar parametros',
  },
];

export function resolverEstadoOperativoProcesoMensual(
  input: ProcesoMensualEstadoOperativoInput,
): ProcesoMensualEstadoOperativoVm {
  const bloqueosCriticosPrevalidacion = input.bloqueosPrevalidacion.filter((b) => b.codigo !== 'BLOQ-005');
  const bloqueoParametros = bloqueosCriticosPrevalidacion.find((b) => b.ruta === '/parametros' || b.codigo === 'BLOQ-004');

  if (input.liquidacionesDisponibles) {
    return buildEstado(input, {
      estadoClave: 'liquidaciones_disponibles',
      titulo: 'Liquidaciones disponibles',
      descripcion: 'Las liquidaciones oficiales internas ya estan disponibles para consulta.',
      severidad: 'success',
      accionPrincipal: ruta('Ver liquidaciones oficiales', 'Consulta las liquidaciones oficiales internas generadas.', '/remuneraciones/liquidaciones'),
      etapaActiva: 'liquidaciones',
      disclosureActivo: 'liquidaciones',
      queFaltaAhora: [info('LIQ_LISTAS', 'Liquidaciones disponibles', 'Consulta el detalle interno. PDF, firma, envio, Previred, LRE, banco y contabilidad siguen fuera de alcance.')],
    });
  }

  if (input.cerradoOperativamente) {
    return buildEstado(input, {
      estadoClave: 'nomina_cerrada',
      titulo: 'Nomina cerrada',
      descripcion: 'La nomina del periodo esta cerrada operativamente. No recalcules ni reemplaces el resultado.',
      severidad: 'success',
      accionPrincipal: ruta('Ir a liquidaciones oficiales', 'Continua con liquidaciones oficiales internas desde la nomina cerrada.', '/remuneraciones/liquidaciones'),
      etapaActiva: 'liquidaciones',
      disclosureActivo: 'liquidaciones',
      queFaltaAhora: [info('NOMINA_CERRADA', 'Nomina cerrada', 'El resultado quedo congelado para continuar con liquidaciones oficiales internas.')],
    });
  }

  if (input.aprobadoOperativamente) {
    return buildEstado(input, {
      estadoClave: 'aprobado_operativamente',
      titulo: 'Aprobado operativamente',
      descripcion: 'El resultado guardado ya fue aprobado. Falta cerrar la nomina del periodo.',
      severidad: 'success',
      accionPrincipal: local('Cerrar nomina del periodo', 'El cierre congela el resultado y habilita liquidaciones oficiales internas.', 'cerrarNomina', !input.puedeCerrar, input.razonNoPuedeCerrar),
      etapaActiva: 'aprobar_cerrar',
      disclosureActivo: 'cierre',
      queFaltaAhora: [info('FALTA_CIERRE', 'Cerrar nomina del periodo', 'El cierre bloquea reemplazos y deja el periodo listo para liquidaciones oficiales internas.')],
    });
  }

  if (input.resultadoGuardado) {
    return buildEstado(input, {
      estadoClave: 'resultado_guardado',
      titulo: 'Resultado guardado',
      descripcion: 'Existe un resultado preliminar vigente. Falta aprobacion operativa antes de cerrar.',
      severidad: 'info',
      accionPrincipal: local('Aprobar resultado preliminar', 'Aprueba internamente el resultado guardado vigente.', 'aprobarResultado', !input.puedeAprobar, input.razonNoPuedeAprobar),
      etapaActiva: 'aprobar_cerrar',
      disclosureActivo: 'aprobacion',
      queFaltaAhora: [info('FALTA_APROBACION', 'Aprobar resultado preliminar', 'La aprobacion operativa es necesaria antes del cierre.')],
    });
  }

  if (input.calculoGenerado) {
    if (input.calculoConBloqueos || input.bloqueosCalculo.length > 0) {
      return buildEstado(input, {
        estadoClave: 'resultado_con_bloqueos',
        titulo: 'Resultado con bloqueos',
        descripcion: 'El calculo preliminar tiene bloqueos. No guardes el resultado hasta resolverlos.',
        severidad: 'danger',
        accionPrincipal: local('Revisar bloqueos', 'Corrige los bloqueos antes de guardar el resultado preliminar.', 'revisarBloqueos', false),
        etapaActiva: 'calculo',
        disclosureActivo: 'calculo',
        queFaltaAhora: [...input.bloqueosCalculo, ...input.advertenciasCalculo],
      });
    }

    const conAdvertencias = input.calculoConAdvertencias || input.advertenciasCalculo.length > 0;
    return buildEstado(input, {
      estadoClave: conAdvertencias ? 'resultado_preliminar_revisable' : 'resultado_listo_para_guardar',
      titulo: conAdvertencias ? 'Resultado preliminar revisable' : 'Resultado listo para guardar',
      descripcion: conAdvertencias
        ? 'El resultado tiene advertencias revisables, pero no bloqueos para guardar.'
        : 'El resultado preliminar puede guardarse como version vigente del periodo.',
      severidad: conAdvertencias ? 'warning' : 'success',
      accionPrincipal: local('Guardar resultado preliminar', 'Guarda una version vigente para revision y aprobacion.', 'guardarResultado', !input.puedeGuardarResultado, input.razonNoPuedeGuardar),
      etapaActiva: 'guardar',
      disclosureActivo: 'calculo',
      queFaltaAhora: conAdvertencias
        ? [...input.advertenciasCalculo, info('GUARDADO_PERMITIDO', 'Advertencias revisables', 'Las advertencias no bloquean el guardado salvo que una regla existente lo indique.')]
        : [info('LISTO_GUARDAR', 'Guardar resultado', 'El resultado puede guardarse como version vigente del periodo.')],
    });
  }

  if (input.baseGenerada) {
    return buildEstado(input, {
      estadoClave: 'base_lista',
      titulo: 'Base lista',
      descripcion: 'La base de nomina ya fue preparada. Falta ejecutar el calculo preliminar.',
      severidad: 'info',
      accionPrincipal: local('Calcular preliminar', 'Ejecuta el calculo sobre la base preparada.', 'calcularPreliminar', !input.puedeCalcular),
      etapaActiva: 'calculo',
      disclosureActivo: 'calculo',
      queFaltaAhora: [info('FALTA_CALCULO', 'Calcular preliminar', 'La base esta lista; ejecuta el calculo para revisar el resultado.')],
    });
  }

  if (!input.periodoValido || !input.tienePrevalidacion) {
    return buildEstado(input, {
      estadoClave: 'pendiente_validacion',
      titulo: 'Pendiente de validacion',
      descripcion: 'Selecciona y valida un periodo antes de preparar la nomina.',
      severidad: 'neutral',
      accionPrincipal: local('Validar periodo', 'Revisa trabajadores, parametros, asignaciones recurrentes y movimientos del mes.', 'validarPeriodo', !input.periodoValido),
      etapaActiva: 'validar',
      disclosureActivo: 'base',
      queFaltaAhora: [info('VALIDAR_PERIODO', 'Validar periodo', 'Selecciona un periodo valido y valida para detectar bloqueos, advertencias y tareas pendientes.')],
    });
  }

  if (bloqueosCriticosPrevalidacion.length > 0) {
    const accion = bloqueoParametros
      ? ruta('Revisar parametros', 'Corrige los parametros bloqueantes antes de avanzar.', '/parametros')
      : local('Revisar bloqueos', 'Resuelve los bloqueos antes de generar la base.', 'revisarBloqueos');
    return buildEstado(input, {
      estadoClave: 'periodo_con_pendientes',
      titulo: 'Periodo con pendientes',
      descripcion: 'Hay bloqueos o pendientes que deben resolverse antes de avanzar.',
      severidad: 'danger',
      accionPrincipal: accion,
      etapaActiva: 'validar',
      disclosureActivo: 'base',
      queFaltaAhora: [...bloqueosCriticosPrevalidacion, ...input.advertenciasPrevalidacion],
    });
  }

  return buildEstado(input, {
    estadoClave: 'listo_para_generar_base',
    titulo: 'Listo para generar base',
    descripcion: 'El periodo esta validado. Falta generar la base de nomina.',
    severidad: input.advertenciasPrevalidacion.length ? 'warning' : 'success',
    accionPrincipal: local('Generar base de nomina', 'La base toma trabajadores, movimientos y asignaciones del periodo.', 'generarBase', !input.puedeGenerarBase),
    etapaActiva: 'base',
    disclosureActivo: 'base',
    queFaltaAhora: [
      info('FALTA_BASE', 'Generar base de nomina', 'La base consolida trabajadores aptos, movimientos del mes y asignaciones recurrentes.'),
      ...input.advertenciasPrevalidacion,
    ],
  });
}

function buildEstado(
  input: ProcesoMensualEstadoOperativoInput,
  estado: Omit<ProcesoMensualEstadoOperativoVm, 'timeline' | 'accionesRapidas' | 'bloqueos' | 'advertencias' | 'informaciones'>,
): ProcesoMensualEstadoOperativoVm {
  const bloqueos = [...input.bloqueosPrevalidacion, ...input.bloqueosCalculo].filter((b) => b.codigo !== 'BLOQ-005');
  const advertencias = [...input.advertenciasPrevalidacion, ...input.advertenciasCalculo];
  return {
    ...estado,
    timeline: construirTimeline(input, estado.etapaActiva),
    accionesRapidas: ACCESOS_RAPIDOS,
    bloqueos,
    advertencias,
    informaciones: input.informacionesPrevalidacion,
  };
}

function construirTimeline(
  input: ProcesoMensualEstadoOperativoInput,
  etapaActiva: ProcesoMensualEtapaClave,
): ProcesoMensualTimelineItemVm[] {
  const preparacionCompleta = input.tienePrevalidacion && input.baseGenerada;
  const preparacionActual = etapaActiva === 'validar' || etapaActiva === 'base';
  const revisionCompleta = input.resultadoGuardado;
  const revisionActual = etapaActiva === 'calculo' || etapaActiva === 'guardar';
  const aprobacionCompleta = input.aprobadoOperativamente || input.cerradoOperativamente;
  const aprobacionActual = etapaActiva === 'aprobar_cerrar';

  return [
    {
      numero: '1',
      titulo: 'Preparacion',
      estado: preparacionCompleta ? 'Completo' : preparacionActual ? 'Actual' : 'Pendiente',
      descripcion: preparacionCompleta
        ? 'Datos base listos'
        : input.tienePrevalidacion && !input.baseGenerada
          ? 'Falta generar base'
          : 'Periodo por validar',
    },
    {
      numero: '2',
      titulo: 'Revision',
      estado: input.calculoConBloqueos
        ? 'Bloqueada'
        : revisionCompleta
          ? 'Completo'
          : revisionActual
            ? 'Actual'
            : 'Pendiente',
      descripcion: revisionCompleta
        ? 'Resultado guardado'
        : input.calculoGenerado
          ? 'Resultado por guardar'
          : revisionActual
            ? 'Calculo por revisar'
            : 'Pendiente',
    },
    {
      numero: '3',
      titulo: 'Aprobacion y cierre',
      estado: aprobacionCompleta ? 'Completo' : aprobacionActual ? 'Actual' : 'Pendiente',
      descripcion: input.cerradoOperativamente
        ? 'Periodo cerrado'
        : input.aprobadoOperativamente
          ? 'Aprobado'
          : aprobacionActual
            ? 'Falta aprobar o cerrar'
            : 'Pendiente',
    },
    {
      numero: '4',
      titulo: 'Liquidaciones',
      estado: etapaActiva === 'liquidaciones' ? 'Actual' : 'Pendiente',
      descripcion: input.liquidacionesDisponibles ? 'Disponibles' : input.cerradoOperativamente ? 'Listas para generar' : 'Pendiente',
    },
  ];
}

function local(
  label: string,
  descripcion: string,
  accionLocal: ProcesoMensualAccionLocal,
  disabled = false,
  disabledReason?: string,
): ProcesoMensualAccionPrincipalVm {
  return { label, descripcion, tipo: 'local', accionLocal, disabled, disabledReason };
}

function ruta(label: string, descripcion: string, ruta: string): ProcesoMensualAccionPrincipalVm {
  return { label, descripcion, tipo: 'ruta', ruta };
}

function info(codigo: string, titulo: string, descripcion: string): ProcesoMensualPendienteVm {
  return { codigo, titulo, descripcion, severidad: 'info' };
}
