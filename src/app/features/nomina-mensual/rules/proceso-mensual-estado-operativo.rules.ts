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
    codigo: 'MOVIMIENTOS_REMUNERACION',
    titulo: 'Movimientos de remuneración',
    descripcion: 'Revisar bonos, descuentos, anticipos, recurrentes y cuotas que impactan el período.',
    severidad: 'neutral',
    ruta: '/remuneraciones/novedades-mensuales',
    accionLabel: 'Revisar movimientos',
  },
  {
    codigo: 'MOVIMIENTOS_RECURRENTES',
    titulo: 'Vista recurrente',
    descripcion: 'Administrar movimientos vigentes que se repiten mes a mes.',
    severidad: 'neutral',
    ruta: '/remuneraciones/haberes-descuentos',
    accionLabel: 'Revisar recurrentes',
  },
  {
    codigo: 'PARAMETROS',
    titulo: 'Parámetros',
    descripcion: 'Revisar parámetros operativos del período.',
    severidad: 'neutral',
    ruta: '/parametros',
    accionLabel: 'Revisar parámetros',
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
      descripcion: 'Las liquidaciones oficiales internas ya están disponibles para consulta.',
      severidad: 'success',
      accionPrincipal: ruta('Ver liquidaciones', 'Consulta las liquidaciones generadas desde la nómina mensual confirmada.', '/remuneraciones/liquidaciones'),
      etapaActiva: 'liquidaciones',
      disclosureActivo: 'liquidaciones',
      queFaltaAhora: [info('LIQ_LISTAS', 'Liquidaciones disponibles', 'Consulta el detalle interno. PDF, firma, envío, Previred, LRE, banco y contabilidad siguen fuera de alcance.')],
    });
  }

  if (input.cerradoOperativamente) {
    return buildEstado(input, {
      estadoClave: 'nomina_cerrada',
      titulo: 'Nómina confirmada',
      descripcion: 'La nómina mensual quedó confirmada como base oficial del período.',
      severidad: 'success',
      accionPrincipal: ruta('Generar liquidaciones', 'Continúa con liquidaciones desde la nómina mensual confirmada.', '/remuneraciones/liquidaciones'),
      etapaActiva: 'liquidaciones',
      disclosureActivo: 'liquidaciones',
      queFaltaAhora: [info('NOMINA_CERRADA', 'Nómina confirmada', 'La nómina mensual confirmada queda como base oficial para liquidaciones.')],
    });
  }

  if (input.aprobadoOperativamente) {
    return buildEstado(input, {
      estadoClave: 'aprobado_operativamente',
      titulo: 'Lista para confirmar',
      descripcion: 'La nómina mensual ya fue revisada. Falta confirmar la versión oficial del período.',
      severidad: 'success',
      accionPrincipal: local('Confirmar nómina', 'Confirma esta versión como base oficial para generar liquidaciones.', 'cerrarNomina', !input.puedeCerrar, input.razonNoPuedeCerrar),
      etapaActiva: 'aprobar_cerrar',
      disclosureActivo: 'cierre',
      queFaltaAhora: [info('FALTA_CIERRE', 'Confirmar nómina', 'La confirmación bloquea esta versión y la deja lista para liquidaciones.')],
    });
  }

  if (input.resultadoGuardado) {
    return buildEstado(input, {
      estadoClave: 'resultado_guardado',
      titulo: 'Lista para confirmar',
      descripcion: 'Existe una versión guardada para revisión. Falta confirmarla como base oficial del período.',
      severidad: 'info',
      accionPrincipal: local('Confirmar nómina', 'Confirma la nómina revisada antes de pasar a liquidaciones.', 'aprobarResultado', !input.puedeAprobar, input.razonNoPuedeAprobar),
      etapaActiva: 'aprobar_cerrar',
      disclosureActivo: 'aprobacion',
      queFaltaAhora: [info('FALTA_APROBACION', 'Confirmar nómina', 'La confirmación administrativa es necesaria antes de liquidaciones.')],
    });
  }

  if (input.calculoGenerado) {
    if (input.calculoConBloqueos || input.bloqueosCalculo.length > 0) {
      return buildEstado(input, {
        estadoClave: 'resultado_con_bloqueos',
        titulo: 'En revisión',
        descripcion: 'Hay trabajadores o datos del período con bloqueos. Resuélvelos antes de confirmar la nómina.',
        severidad: 'danger',
        accionPrincipal: local('Revisar trabajadores', 'Corrige bloqueos y advertencias antes de confirmar la nómina mensual.', 'revisarBloqueos', false),
        etapaActiva: 'calculo',
        disclosureActivo: 'calculo',
        queFaltaAhora: [...input.bloqueosCalculo, ...input.advertenciasCalculo],
      });
    }

    const conAdvertencias = input.calculoConAdvertencias || input.advertenciasCalculo.length > 0;
    return buildEstado(input, {
      estadoClave: conAdvertencias ? 'resultado_preliminar_revisable' : 'resultado_listo_para_guardar',
      titulo: conAdvertencias ? 'En revisión' : 'Lista para confirmar',
      descripcion: conAdvertencias
        ? 'La nómina tiene advertencias revisables, pero no bloqueos críticos.'
        : 'La nómina mensual puede quedar como versión guardada para revisión antes de confirmarse.',
      severidad: conAdvertencias ? 'warning' : 'success',
      accionPrincipal: local(
        conAdvertencias ? 'Revisar trabajadores' : 'Guardar versión para revisión',
        conAdvertencias
          ? 'Revisa advertencias por trabajador antes de confirmar.'
          : 'Deja esta versión guardada para revisión antes de confirmar la nómina.',
        'guardarResultado',
        !input.puedeGuardarResultado,
        input.razonNoPuedeGuardar,
      ),
      etapaActiva: 'guardar',
      disclosureActivo: 'calculo',
      queFaltaAhora: conAdvertencias
        ? [...input.advertenciasCalculo, info('GUARDADO_PERMITIDO', 'Advertencias revisables', 'Las advertencias no bloquean el guardado salvo que una regla existente lo indique.')]
        : [info('LISTO_GUARDAR', 'Guardar versión para revisión', 'La nómina puede quedar guardada para revisión antes de la confirmación final.')],
    });
  }

  if (input.baseGenerada) {
    return buildEstado(input, {
      estadoClave: 'base_lista',
      titulo: 'Borrador generado',
      descripcion: 'El borrador de nómina mensual está generado. Revisa trabajadores incluidos, movimientos y recurrentes.',
      severidad: 'info',
      accionPrincipal: local('Revisar trabajadores', 'Revisa el borrador y continúa con la revisión por trabajador.', 'calcularPreliminar', !input.puedeCalcular),
      etapaActiva: 'calculo',
      disclosureActivo: 'calculo',
      queFaltaAhora: [info('FALTA_CALCULO', 'Revisar trabajadores', 'Revisa trabajadores incluidos y continúa la revisión del período.')],
    });
  }

  if (!input.periodoValido || !input.tienePrevalidacion) {
    return buildEstado(input, {
      estadoClave: 'pendiente_validacion',
      titulo: 'Sin generar',
      descripcion: 'Todavía no existe una nómina mensual generada para el período activo.',
      severidad: 'neutral',
      accionPrincipal: local('Generar nómina', 'Revisa trabajadores, parámetros, movimientos y recurrentes para generar la nómina mensual.', 'validarPeriodo', !input.periodoValido),
      etapaActiva: 'validar',
      disclosureActivo: 'base',
      queFaltaAhora: [info('GENERAR_NOMINA', 'Generar nómina', 'Genera la nómina mensual del período activo.')],
    });
  }

  if (bloqueosCriticosPrevalidacion.length > 0) {
    const accion = bloqueoParametros
      ? ruta('Revisar parámetros', 'Corrige los parámetros bloqueantes antes de avanzar.', '/parametros')
      : local('Revisar trabajadores', 'Resuelve los bloqueos antes de confirmar la nómina mensual.', 'revisarBloqueos');
    return buildEstado(input, {
      estadoClave: 'periodo_con_pendientes',
      titulo: 'En revisión',
      descripcion: 'Hay trabajadores o datos obligatorios que RRHH debe revisar antes de continuar.',
      severidad: 'danger',
      accionPrincipal: accion,
      etapaActiva: 'validar',
      disclosureActivo: 'base',
      queFaltaAhora: [...bloqueosCriticosPrevalidacion, ...input.advertenciasPrevalidacion],
    });
  }

  return buildEstado(input, {
    estadoClave: 'listo_para_generar_base',
    titulo: 'Sin generar',
    descripcion: 'El período está revisado. Falta generar la nómina mensual.',
    severidad: input.advertenciasPrevalidacion.length ? 'warning' : 'success',
    accionPrincipal: local('Generar nómina', 'Arma la nómina mensual con trabajadores, movimientos y asignaciones del período.', 'generarBase', !input.puedeGenerarBase),
    etapaActiva: 'base',
    disclosureActivo: 'base',
    queFaltaAhora: [
      info('FALTA_NOMINA', 'Generar nómina', 'La nómina mensual consolida trabajadores incluidos y movimientos del período.'),
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
      titulo: 'Generar nomina',
      estado: preparacionCompleta ? 'Completo' : preparacionActual ? 'Actual' : 'Pendiente',
      descripcion: preparacionCompleta
        ? 'Nomina generada'
        : input.tienePrevalidacion && !input.baseGenerada
          ? 'Lista para generar'
          : 'Sin generar',
    },
    {
      numero: '2',
      titulo: 'Revisar trabajadores',
      estado: input.calculoConBloqueos
        ? 'Bloqueada'
        : revisionCompleta
          ? 'Completo'
          : revisionActual
            ? 'Actual'
            : 'Pendiente',
      descripcion: revisionCompleta
        ? 'Trabajadores revisados'
        : input.calculoGenerado
          ? 'Revision pendiente'
          : revisionActual
            ? 'Trabajadores por revisar'
            : 'Pendiente',
    },
    {
      numero: '3',
      titulo: 'Confirmar nomina',
      estado: aprobacionCompleta ? 'Completo' : aprobacionActual ? 'Actual' : 'Pendiente',
      descripcion: input.cerradoOperativamente
        ? 'Nomina confirmada'
        : input.aprobadoOperativamente
          ? 'Lista para confirmar'
          : aprobacionActual
            ? 'Falta confirmar'
            : 'Pendiente',
    },
    {
      numero: '4',
      titulo: 'Generar liquidaciones',
      estado: etapaActiva === 'liquidaciones' ? 'Actual' : 'Pendiente',
      descripcion: input.liquidacionesDisponibles ? 'Generadas' : input.cerradoOperativamente ? 'Listas para generar' : 'Pendiente',
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
